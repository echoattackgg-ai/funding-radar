create table if not exists funding_rates (
  id bigint generated always as identity primary key,
  exchange text not null,
  ticker text not null,
  rate_percent numeric not null,
  interval_hours numeric not null,
  apr_percent numeric not null,
  fetched_at timestamptz not null default now()
);

create index if not exists funding_rates_fetched_at_idx
  on funding_rates (fetched_at desc);
