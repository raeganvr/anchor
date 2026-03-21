-- Add notifications_enabled flag to settings (off by default to avoid email spam during development)
alter table settings
  add column if not exists notifications_enabled boolean not null default false;
