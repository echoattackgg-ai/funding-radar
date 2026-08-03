alter table funding_rates add column symbol text;

update funding_rates set symbol = 'BTC' where symbol is null;

alter table funding_rates alter column symbol set not null;

create index if not exists funding_rates_symbol_idx
  on funding_rates (symbol);
