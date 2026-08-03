import { createSupabaseClient } from "@/lib/supabase";

export type ExchangeName = "Binance" | "Bybit" | "OKX";

const EXCHANGES: ExchangeName[] = ["Binance", "Bybit", "OKX"];

const MS_PER_HOUR = 60 * 60 * 1000;

// Ниже четверти интервала прошло — прогнозная ставка ещё скачет на паре точек
// наблюдений (см. заметку 2026-08-01 про фантомный спред у ATOM). Экспортится:
// используется и для непрерывного затухания предупреждения над таблицей.
export const IMMATURE_FRACTION_THRESHOLD = 0.25;

// Расхождение фаз внутри строки: одна биржа уже устоялась (прошло больше
// половины интервала), другая только начала (меньше четверти). Именно в этом
// случае сравнение бирж друг с другом нечестное — если обе биржи одинаково
// рано в цикле (частый случай: 8-часовые интервалы у бирж синхронны по UTC),
// это свойство самого момента, а не конкретной пары.
const DIVERGENT_MATURE_FRACTION_THRESHOLD = 0.5;

export type Maturity = {
  elapsedMs: number;
  totalMs: number;
  fraction: number;
  isImmature: boolean;
};

export type FundingRateRow = {
  exchange: ExchangeName;
  symbol: string;
  ticker: string;
  rate_percent: number;
  interval_hours: number;
  apr_percent: number;
  fetched_at: string;
  next_funding_at: string | null;
  last_paid_rate_percent: number | null;
  last_paid_at: string | null;
  maturity: Maturity | null;
  // Ставка last_paid_rate_percent хранится "как есть" (не годовая), приводим
  // к APR тем же способом, что и прогноз — чтобы фигуры были на одной шкале
  // и их можно было сравнивать на глаз (прогноз преувеличивает/преуменьшает
  // относительно факта — см. пример с ATOM/Bybit).
  last_paid_apr_percent: number | null;
};

export type GroupedFundingRate = {
  symbol: string;
  rates: Partial<Record<ExchangeName, FundingRateRow>>;
  spread: number | null;
  updatedAt: string;
  hasPhaseDivergence: boolean;
};

export type GroupedFundingRatesResult = {
  rows: GroupedFundingRate[];
  error: boolean;
};

// nowMs как параметр (а не Date.now() внутри) — чтобы все строки в одном
// рендере странице считали зрелость от одного и того же момента.
function computeMaturity(
  nextFundingAt: string | null,
  intervalHours: number,
  nowMs: number,
): Maturity | null {
  if (!nextFundingAt || !(intervalHours > 0)) return null;

  const totalMs = intervalHours * MS_PER_HOUR;
  const intervalStartMs = new Date(nextFundingAt).getTime() - totalMs;
  const elapsedMs = Math.min(totalMs, Math.max(0, nowMs - intervalStartMs));
  const fraction = elapsedMs / totalMs;

  return { elapsedMs, totalMs, fraction, isImmature: fraction < IMMATURE_FRACTION_THRESHOLD };
}

function toApr(ratePercent: number, intervalHours: number): number {
  const paymentsPerYear = (24 / intervalHours) * 365;
  return ratePercent * paymentsPerYear;
}

type FundingRateDbRow = Omit<FundingRateRow, "maturity" | "last_paid_apr_percent">;

export async function getGroupedFundingRates(): Promise<GroupedFundingRatesResult> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("funding_rates")
    .select(
      "exchange, symbol, ticker, rate_percent, interval_hours, apr_percent, fetched_at, next_funding_at, last_paid_rate_percent, last_paid_at",
    )
    .order("fetched_at", { ascending: false })
    .limit(500);

  if (error) {
    return { rows: [], error: true };
  }
  if (!data) {
    return { rows: [], error: false };
  }

  const nowMs = Date.now();
  const latestByPair = new Map<string, FundingRateRow>();
  for (const row of data as FundingRateDbRow[]) {
    const key = `${row.exchange}:${row.symbol}`;
    if (!latestByPair.has(key)) {
      latestByPair.set(key, {
        ...row,
        maturity: computeMaturity(row.next_funding_at, row.interval_hours, nowMs),
        last_paid_apr_percent:
          row.last_paid_rate_percent !== null
            ? toApr(row.last_paid_rate_percent, row.interval_hours)
            : null,
      });
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
    const hasPhaseDivergence =
      present.some((row) => row.maturity?.isImmature === true) &&
      present.some((row) => (row.maturity?.fraction ?? 0) >= DIVERGENT_MATURE_FRACTION_THRESHOLD);

    return { symbol, rates, spread, updatedAt, hasPhaseDivergence };
  });

  grouped.sort((a, b) => (b.spread ?? -Infinity) - (a.spread ?? -Infinity));

  return { rows: grouped, error: false };
}
