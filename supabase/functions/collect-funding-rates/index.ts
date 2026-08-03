// Забирает ставки фандинга по списку монет (см. ../_shared/coins.mjs) с Binance,
// Bybit и OKX и сохраняет в таблицу funding_rates.
// Вызывается по расписанию через pg_cron (см. supabase/migrations/0002_schedule_funding_collection.sql).

import { createClient } from "npm:@supabase/supabase-js@2";
import { COINS } from "../_shared/coins.mjs";

const MS_PER_HOUR = 60 * 60 * 1000;

type Row = {
  exchange: string;
  symbol: string;
  ticker: string;
  rate_percent: number;
  interval_hours: number;
  apr_percent: number;
};

function toApr(ratePercent: number, intervalHours: number) {
  const paymentsPerYear = (24 / intervalHours) * 365;
  return ratePercent * paymentsPerYear;
}

// Binance и Bybit отдают ставки по всем инструментам одним запросом —
// забираем всё сразу и потом фильтруем под наш список монет, вместо
// отдельного запроса на каждую монету.

async function getBinanceRows(): Promise<Row[]> {
  const [premiumRes, infoRes] = await Promise.all([
    fetch("https://fapi.binance.com/fapi/v1/premiumIndex"),
    fetch("https://fapi.binance.com/fapi/v1/fundingInfo"),
  ]);
  const premiumBySymbol = new Map(
    (await premiumRes.json()).map((item: { symbol: string }) => [item.symbol, item]),
  );
  const infoBySymbol = new Map(
    (await infoRes.json()).map((item: { symbol: string }) => [item.symbol, item]),
  );

  const rows: Row[] = [];
  for (const coin of COINS) {
    const premium = premiumBySymbol.get(coin.binance) as
      | { lastFundingRate: string; symbol: string }
      | undefined;
    if (!premium) continue;

    const info = infoBySymbol.get(coin.binance) as
      | { fundingIntervalHours: number }
      | undefined;
    const intervalHours = info?.fundingIntervalHours ?? 8;
    const ratePercent = Number(premium.lastFundingRate) * 100;

    rows.push({
      exchange: "Binance",
      symbol: coin.symbol,
      ticker: premium.symbol,
      rate_percent: ratePercent,
      interval_hours: intervalHours,
      apr_percent: toApr(ratePercent, intervalHours),
    });
  }
  return rows;
}

async function getBybitRows(): Promise<Row[]> {
  const res = await fetch("https://api.bybit.com/v5/market/tickers?category=linear");
  const data = await res.json();
  const bySymbol = new Map(
    data.result.list.map((item: { symbol: string }) => [item.symbol, item]),
  );

  const rows: Row[] = [];
  for (const coin of COINS) {
    const ticker = bySymbol.get(coin.bybit) as
      | { fundingRate: string; fundingIntervalHour: string; symbol: string }
      | undefined;
    if (!ticker) continue;

    const ratePercent = Number(ticker.fundingRate) * 100;
    const intervalHours = Number(ticker.fundingIntervalHour);

    rows.push({
      exchange: "Bybit",
      symbol: coin.symbol,
      ticker: ticker.symbol,
      rate_percent: ratePercent,
      interval_hours: intervalHours,
      apr_percent: toApr(ratePercent, intervalHours),
    });
  }
  return rows;
}

// OKX не отдаёт ставки по всем инструментам одним запросом — нужен отдельный
// запрос на каждую монету. Делаем их параллельно и пропускаем те, что упали
// (монеты может не быть на бирже, или запрос мог не выполниться).

async function getOkxRow(coin: (typeof COINS)[number]): Promise<Row | null> {
  try {
    const res = await fetch(
      `https://www.okx.com/api/v5/public/funding-rate?instId=${coin.okx}`,
    );
    const data = await res.json();
    const entry = data.data?.[0];
    if (!entry) return null;

    const ratePercent = Number(entry.fundingRate) * 100;
    const intervalHours =
      (Number(entry.nextFundingTime) - Number(entry.fundingTime)) / MS_PER_HOUR;

    return {
      exchange: "OKX",
      symbol: coin.symbol,
      ticker: entry.instId,
      rate_percent: ratePercent,
      interval_hours: intervalHours,
      apr_percent: toApr(ratePercent, intervalHours),
    };
  } catch {
    return null;
  }
}

async function getOkxRows(): Promise<Row[]> {
  const results = await Promise.all(COINS.map(getOkxRow));
  return results.filter((row): row is Row => row !== null);
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SERVICE_KEY")!,
  );

  const [binanceRows, bybitRows, okxRows] = await Promise.all([
    getBinanceRows(),
    getBybitRows(),
    getOkxRows(),
  ]);
  const rows = [...binanceRows, ...bybitRows, ...okxRows];

  const { error } = await supabase.from("funding_rates").insert(rows);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, count: rows.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
