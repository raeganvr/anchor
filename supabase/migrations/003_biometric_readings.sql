-- supabase/migrations/003_biometric_readings.sql
-- Time-series buffer for raw biometric readings.
-- Simulates what Garmin Connect stores on their servers.
-- We only keep 48 hours — older data is aggregated into baseline, not needed raw.

create table if not exists biometric_readings (
  id            uuid primary key default gen_random_uuid(),
  recorded_at   timestamptz not null,
  source        text not null default 'simulated'
                  check (source in ('simulated', 'garmin', 'strava')),
  hr_bpm        integer check (hr_bpm between 20 and 250),
  stress_level  integer check (stress_level between 0 and 100),
  hrv_rmssd     numeric(6,2),   -- ms, sleep readings only; null during day
  created_at    timestamptz not null default now()
);

-- Primary access pattern: "give me the last N hours"
create index biometric_readings_recorded_at_idx
  on biometric_readings (recorded_at desc);

-- Row-level security (match existing tables)
alter table biometric_readings enable row level security;

create policy "Allow all" on biometric_readings for all using (true);
