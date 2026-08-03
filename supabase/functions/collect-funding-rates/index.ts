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
  next_funding_at: string;
  last_paid_rate_percent: number | null;
  last_paid_at: string | null;
};

type LastPaid = { rate: number; at: string };

function toApr(ratePercent: number, intervalHours: number) {
  const paymentsPerYear = (24 / intervalHours) * 365;
  return ratePercent * paymentsPerYear;
}

// Binance и Bybit отдают ставки по всем инструментам одним запросом —
// забираем всё сразу и потом фильтруем под наш список монет, вместо
// отдельного запроса на каждую монету.

async function getBinanceRows(lastPaidByTicker: Map<string, LastPaid>): Promise<Row[]> {
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
      | { lastFundingRate: string; symbol: string; nextFundingTime: number }
      | undefined;
    if (!premium) continue;

    const info = infoBySymbol.get(coin.binance) as
      | { fundingIntervalHours: number }
      | undefined;
    const intervalHours = info?.fundingIntervalHours ?? 8;
    const ratePercent = Number(premium.lastFundingRate) * 100;
    const lastPaid = lastPaidByTicker.get(coin.binance);

    rows.push({
      exchange: "Binance",
      symbol: coin.symbol,
      ticker: premium.symbol,
      rate_percent: ratePercent,
      interval_hours: intervalHours,
      apr_percent: toApr(ratePercent, intervalHours),
      next_funding_at: new Date(premium.nextFundingTime).toISOString(),
      last_paid_rate_percent: lastPaid?.rate ?? null,
      last_paid_at: lastPaid?.at ?? null,
    });
  }
  return rows;
}

async function getBybitRows(lastPaidByTicker: Map<string, LastPaid>): Promise<Row[]> {
  const res = await fetch("https://api.bybit.com/v5/market/tickers?category=linear");
  const data = await res.json();
  const bySymbol = new Map(
    data.result.list.map((item: { symbol: string }) => [item.symbol, item]),
  );

  const rows: Row[] = [];
  for (const coin of COINS) {
    const ticker = bySymbol.get(coin.bybit) as
      | { fundingRate: string; fundingIntervalHour: string; symbol: string; nextFundingTime: string }
      | undefined;
    if (!ticker) continue;

    const ratePercent = Number(ticker.fundingRate) * 100;
    const intervalHours = Number(ticker.fundingIntervalHour);
    const lastPaid = lastPaidByTicker.get(coin.bybit);

    rows.push({
      exchange: "Bybit",
      symbol: coin.symbol,
      ticker: ticker.symbol,
      rate_percent: ratePercent,
      interval_hours: intervalHours,
      apr_percent: toApr(ratePercent, intervalHours),
      next_funding_at: new Date(Number(ticker.nextFundingTime)).toISOString(),
      last_paid_rate_percent: lastPaid?.rate ?? null,
      last_paid_at: lastPaid?.at ?? null,
    });
  }
  return rows;
}

// OKX не отдаёт ставки по всем инструментам одним запросом — нужен отдельный
// запрос на каждую монету. Делаем их параллельно и пропускаем те, что упали
// (монеты может не быть на бирже, или запрос мог не выполниться).
//
// В этом же ответе OKX присылает и последнюю уже выплаченную ставку
// (settFundingRate/prevFundingTime) — отдельный запрос истории, в отличие
// от Binance и Bybit, не нужен.

async function getOkxRow(coin: (typeof COINS)[number]): Promise<Row | null> {
  try {
    const res = await fetch(
      `https://www.okx.com/api/v5/public/funding-rate?instId=${coin.okx}`,
    );
    const data = await res.json();
    const entry = data.data?.[0];
    if (!entry) return null;

    const ratePercent = Number(entry.fundingRate) * 100;
    const prevFundingTime = Number(entry.prevFundingTime);
    // Длина текущего (ещё не выплаченного) интервала — от предыдущей выплаты
    // до следующей. Раньше здесь ошибочно бралась длина СЛЕДУЮЩего интервала
    // (nextFundingTime - fundingTime), что обычно совпадает, но не гарантированно.
    const intervalHours = Number.isFinite(prevFundingTime)
      ? (Number(entry.fundingTime) - prevFundingTime) / MS_PER_HOUR
      : (Number(entry.nextFundingTime) - Number(entry.fundingTime)) / MS_PER_HOUR;

    const hasSettlement = entry.settState === "settled" && entry.settFundingRate;

    return {
      exchange: "OKX",
      symbol: coin.symbol,
      ticker: entry.instId,
      rate_percent: ratePercent,
      interval_hours: intervalHours,
      apr_percent: toApr(ratePercent, intervalHours),
      next_funding_at: new Date(Number(entry.fundingTime)).toISOString(),
      last_paid_rate_percent: hasSettlement ? Number(entry.settFundingRate) * 100 : null,
      last_paid_at: hasSettlement && Number.isFinite(prevFundingTime)
        ? new Date(prevFundingTime).toISOString()
        : null,
    };
  } catch {
    return null;
  }
}

async function getOkxRows(): Promise<Row[]> {
  const results = await Promise.all(COINS.map(getOkxRow));
  return results.filter((row): row is Row => row !== null);
}

// Последняя фактически выплаченная ставка для Binance/Bybit требует
// отдельного запроса истории на каждую монету. Это дополнительные данные,
// не критичные для основной таблицы, поэтому падение или лимит частоты на
// этих запросах не должны мешать записи текущих (прогнозных) ставок — каждый
// запрос обёрнут в свой try/catch, а сбои только логируются.

async function getBinanceLastPaidRates(): Promise<Map<string, LastPaid>> {
  const results = new Map<string, LastPaid>();
  await Promise.all(
    COINS.map(async (coin) => {
      try {
        const res = await fetch(
          `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${coin.binance}&limit=1`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const entry = data[0] as { fundingRate: string; fundingTime: number } | undefined;
        if (!entry) return;
        results.set(coin.binance, {
          rate: Number(entry.fundingRate) * 100,
          at: new Date(entry.fundingTime).toISOString(),
        });
      } catch (err) {
        console.error(
          `[collect-funding-rates] Binance last-paid-rate fetch failed for ${coin.symbol}:`,
          err,
        );
      }
    }),
  );
  return results;
}

async function getBybitLastPaidRates(): Promise<Map<string, LastPaid>> {
  const results = new Map<string, LastPaid>();
  await Promise.all(
    COINS.map(async (coin) => {
      try {
        const res = await fetch(
          `https://api.bybit.com/v5/market/funding/history?category=linear&symbol=${coin.bybit}&limit=1`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const entry = data.result?.list?.[0] as
          | { fundingRate: string; fundingRateTimestamp: string }
          | undefined;
        if (!entry) return;
        results.set(coin.bybit, {
          rate: Number(entry.fundingRate) * 100,
          at: new Date(Number(entry.fundingRateTimestamp)).toISOString(),
        });
      } catch (err) {
        console.error(
          `[collect-funding-rates] Bybit last-paid-rate fetch failed for ${coin.symbol}:`,
          err,
        );
      }
    }),
  );
  return results;
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SERVICE_KEY")!,
  );

  let binanceLastPaid = new Map<string, LastPaid>();
  let bybitLastPaid = new Map<string, LastPaid>();
  try {
    [binanceLastPaid, bybitLastPaid] = await Promise.all([
      getBinanceLastPaidRates(),
      getBybitLastPaidRates(),
    ]);
  } catch (err) {
    console.error("[collect-funding-rates] last-paid-rate enrichment failed entirely:", err);
  }

  const [binanceRows, bybitRows, okxRows] = await Promise.all([
    getBinanceRows(binanceLastPaid),
    getBybitRows(bybitLastPaid),
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
