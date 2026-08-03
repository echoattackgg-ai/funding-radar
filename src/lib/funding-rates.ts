import { createSupabaseClient } from "@/lib/supabase";

export type ExchangeName = "Binance" | "Bybit" | "OKX";

const EXCHANGES: ExchangeName[] = ["Binance", "Bybit", "OKX"];

export type FundingRateRow = {
  exchange: ExchangeName;
  symbol: string;
  ticker: string;
  rate_percent: number;
  interval_hours: number;
  apr_percent: number;
  fetched_at: string;
};

export type GroupedFundingRate = {
  symbol: string;
  rates: Partial<Record<ExchangeName, FundingRateRow>>;
  spread: number | null;
  updatedAt: string;
};

export async function getGroupedFundingRates(): Promise<GroupedFundingRate[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("funding_rates")
    .select("exchange, symbol, ticker, rate_percent, interval_hours, apr_percent, fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(500);

  if (error || !data) {
    return [];
  }

  const latestByPair = new Map<string, FundingRateRow>();
  for (const row of data as FundingRateRow[]) {
    const key = `${row.exchange}:${row.symbol}`;
    if (!latestByPair.has(key)) {
      latestByPair.set(key, row);
    }
  }

  const bySymbol = new Map<string, Partial<Record<ExchangeName, FundingRateRow>>>();
  for (const row of latestByPair.values()) {
    const entry = bySymbol.get(row.symbol) ?? {};
    entry[row.exchange] = row;
    bySymbol.set(row.symbol, entry);
  }

  const grouped: GroupedFundingRate[] = [...bySymbol.entries()].map(([symbol, rates]) => {
    const present = EXCHANGES.map((exchange) => rates[exchange]).filter(
      (row): row is FundingRateRow => !!row,
    );
    const aprValues = present.map((row) => row.apr_percent);
    const spread = present.length >= 2 ? Math.max(...aprValues) - Math.min(...aprValues) : null;
    const updatedAt = present.reduce(
      (latest, row) => (row.fetched_at > latest ? row.fetched_at : latest),
      present[0]?.fetched_at ?? "",
    );

    return { symbol, rates, spread, updatedAt };
  });

  grouped.sort((a, b) => (b.spread ?? -Infinity) - (a.spread ?? -Infinity));

  return grouped;
}
