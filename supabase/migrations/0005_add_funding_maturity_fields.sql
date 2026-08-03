-- Момент следующей выплаты (= конец текущего интервала начисления) и последняя
-- фактически выплаченная ставка. Нужны, чтобы отличать "прогноз только что
-- родился и ещё скачет" от устоявшегося значения — см. src/lib/funding-rates.ts.
alter table funding_rates
  add column next_funding_at timestamptz,
  add column last_paid_rate_percent numeric,
  add column last_paid_at timestamptz;
