create table public.monitoring_checks (
  id bigint generated always as identity primary key,
  service_id text not null,
  service_name text not null,
  timestamp timestamptz not null,
  status_code integer not null,
  latency_ms integer,
  agent text not null,
  region text not null,
  is_available boolean not null,
  created_at timestamptz not null default now(),
  unique (service_id, timestamp, agent, region)
);

create index monitoring_checks_timestamp_idx
  on public.monitoring_checks (timestamp);

create index monitoring_checks_service_id_idx
  on public.monitoring_checks (service_id);

create index monitoring_checks_service_name_idx
  on public.monitoring_checks (service_name);

alter table public.monitoring_checks enable row level security;

create policy "Public can read monitoring checks"
  on public.monitoring_checks
  for select
  to anon, authenticated
  using (true);

revoke all on table public.monitoring_checks from anon, authenticated, public;
grant select on table public.monitoring_checks to anon, authenticated;
grant all on table public.monitoring_checks to service_role;
grant usage, select on sequence public.monitoring_checks_id_seq to service_role;
