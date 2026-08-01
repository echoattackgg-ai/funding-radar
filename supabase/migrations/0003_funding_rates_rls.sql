alter table funding_rates enable row level security;

create policy "Allow public read access to funding_rates"
  on funding_rates
  for select
  to anon, authenticated
  using (true);
