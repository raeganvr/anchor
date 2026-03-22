-- Reset-friendly auth ownership migration.
-- Assumes application data in public.settings, public.baseline,
-- public.episodes, and public.biometric_readings has already been wiped.

begin;

-- Ownership columns
alter table public.settings
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.baseline
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.episodes
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.biometric_readings
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Client inserts can omit user_id; Supabase will fill it from the auth context.
alter table public.settings alter column user_id set default auth.uid();
alter table public.baseline alter column user_id set default auth.uid();
alter table public.episodes alter column user_id set default auth.uid();
alter table public.biometric_readings alter column user_id set default auth.uid();

alter table public.settings alter column user_id set not null;
alter table public.baseline alter column user_id set not null;
alter table public.episodes alter column user_id set not null;
alter table public.biometric_readings alter column user_id set not null;

-- One settings row and one baseline row per user.
create unique index if not exists settings_user_id_key on public.settings (user_id);
create unique index if not exists baseline_user_id_key on public.baseline (user_id);

create index if not exists episodes_user_id_created_at_idx
  on public.episodes (user_id, created_at desc);

create index if not exists biometric_readings_user_id_recorded_at_idx
  on public.biometric_readings (user_id, recorded_at desc);

-- Remove permissive/global policies and replace them with per-user rules.
drop policy if exists "Allow all" on public.biometric_readings;
drop policy if exists "Users can view own settings" on public.settings;
drop policy if exists "Users can insert own settings" on public.settings;
drop policy if exists "Users can update own settings" on public.settings;
drop policy if exists "Users can delete own settings" on public.settings;
drop policy if exists "Users can view own baseline" on public.baseline;
drop policy if exists "Users can insert own baseline" on public.baseline;
drop policy if exists "Users can update own baseline" on public.baseline;
drop policy if exists "Users can delete own baseline" on public.baseline;
drop policy if exists "Users can view own episodes" on public.episodes;
drop policy if exists "Users can insert own episodes" on public.episodes;
drop policy if exists "Users can update own episodes" on public.episodes;
drop policy if exists "Users can delete own episodes" on public.episodes;
drop policy if exists "Users can view own biometric readings" on public.biometric_readings;
drop policy if exists "Users can insert own biometric readings" on public.biometric_readings;
drop policy if exists "Users can update own biometric readings" on public.biometric_readings;
drop policy if exists "Users can delete own biometric readings" on public.biometric_readings;

alter table public.settings enable row level security;
alter table public.baseline enable row level security;
alter table public.episodes enable row level security;
alter table public.biometric_readings enable row level security;

create policy "Users can view own settings"
  on public.settings
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.settings
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own settings"
  on public.settings
  for delete
  using (auth.uid() = user_id);

create policy "Users can view own baseline"
  on public.baseline
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own baseline"
  on public.baseline
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own baseline"
  on public.baseline
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own baseline"
  on public.baseline
  for delete
  using (auth.uid() = user_id);

create policy "Users can view own episodes"
  on public.episodes
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own episodes"
  on public.episodes
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own episodes"
  on public.episodes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own episodes"
  on public.episodes
  for delete
  using (auth.uid() = user_id);

create policy "Users can view own biometric readings"
  on public.biometric_readings
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own biometric readings"
  on public.biometric_readings
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own biometric readings"
  on public.biometric_readings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own biometric readings"
  on public.biometric_readings
  for delete
  using (auth.uid() = user_id);

-- Automatically provision per-user singleton rows for new auth users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.settings (
    user_id,
    user_email,
    caregiver_email,
    caregiver_consent,
    caregiver_name,
    alert_threshold_min,
    sensitivity,
    demo_mode,
    demo_episode_delay_ms,
    notifications_enabled
  )
  values (
    new.id,
    new.email,
    null,
    false,
    null,
    10,
    'medium',
    true,
    30000,
    false
  )
  on conflict (user_id) do nothing;

  insert into public.baseline (
    user_id,
    avg_resting_hr,
    avg_daytime_hr,
    avg_stress,
    avg_overnight_hrv,
    hrv_5min_high,
    hrv_status,
    established,
    sample_days,
    recent_days
  )
  values (
    new.id,
    58,
    76,
    22,
    42,
    null,
    null,
    false,
    0,
    '[]'::jsonb
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

commit;
