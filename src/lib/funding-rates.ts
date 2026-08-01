import { createSupabaseClient } from "@/lib/supabase";

export type FundingRateRow = {
  exchange: string;
  ticker: string;
  rate_percent: number;
  interval_hours: number;
  apr_percent: number;
  fetched_at: string;
};

export async function getLatestFundingRates(): Promise<FundingRateRow[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("funding_rates")
    .select("exchange, ticker, rate_percent, interval_hours, apr_percent, fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return [];
  }

  const latestByPair = new Map<string, FundingRateRow>();
  for (const row of data) {
    const key = `${row.exchange}:${row.ticker}`;
    if (!latestByPair.has(key)) {
      latestByPair.set(key, row);
    }
  }

  return [...latestByPair.values()].sort((a, b) =>
    a.exchange.localeCompare(b.exchange) || a.ticker.localeCompare(b.ticker),
  );
}
