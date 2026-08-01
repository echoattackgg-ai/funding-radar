// Забирает ставку фандинга по BTC с Binance, Bybit и OKX и сохраняет в таблицу funding_rates.
// Вызывается по расписанию через pg_cron (см. supabase/migrations/0002_schedule_funding_collection.sql).

import { createClient } from "npm:@supabase/supabase-js@2";

const MS_PER_HOUR = 60 * 60 * 1000;

function toApr(ratePercent: number, intervalHours: number) {
  const paymentsPerYear = (24 / intervalHours) * 365;
  return ratePercent * paymentsPerYear;
}

async function getBinance() {
  const [premiumRes, infoRes] = await Promise.all([
    fetch("https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT"),
    fetch("https://fapi.binance.com/fapi/v1/fundingInfo"),
  ]);
  const premium = await premiumRes.json();
  const info = await infoRes.json();
  const symbolInfo = info.find((item: { symbol: string }) => item.symbol === "BTCUSDT");
  const ratePercent = Number(premium.lastFundingRate) * 100;
  const intervalHours = symbolInfo.fundingIntervalHours;

  return {
    exchange: "Binance",
    ticker: premium.symbol,
    rate_percent: ratePercent,
    interval_hours: intervalHours,
    apr_percent: toApr(ratePercent, intervalHours),
  };
}

async function getBybit() {
  const res = await fetch("https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT");
  const data = await res.json();
  const ticker = data.result.list[0];
  const ratePercent = Number(ticker.fundingRate) * 100;
  const intervalHours = Number(ticker.fundingIntervalHour);

  return {
    exchange: "Bybit",
    ticker: ticker.symbol,
    rate_percent: ratePercent,
    interval_hours: intervalHours,
    apr_percent: toApr(ratePercent, intervalHours),
  };
}

async function getOkx() {
  const res = await fetch("https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP");
  const data = await res.json();
  const entry = data.data[0];
  const ratePercent = Number(entry.fundingRate) * 100;
  const intervalHours = (Number(entry.nextFundingTime) - Number(entry.fundingTime)) / MS_PER_HOUR;

  return {
    exchange: "OKX",
    ticker: entry.instId,
    rate_percent: ratePercent,
    interval_hours: intervalHours,
    apr_percent: toApr(ratePercent, intervalHours),
  };
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const rows = await Promise.all([getBinance(), getBybit(), getOkx()]);

  const { error } = await supabase.from("funding_rates").insert(rows);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, rows }), {
    headers: { "Content-Type": "application/json" },
  });
});
