// Забирает текущие ставки фандинга по списку монет (см. ../supabase/functions/_shared/coins.mjs)
// с публичных API Binance, Bybit и OKX, приводит к единому виду и считает годовую доходность (APR).
// Запуск: node scripts/funding-rate.mjs

import { COINS } from "../supabase/functions/_shared/coins.mjs";

const MS_PER_HOUR = 60 * 60 * 1000;

function toApr(ratePercent, intervalHours) {
  const paymentsPerYear = (24 / intervalHours) * 365;
  return ratePercent * paymentsPerYear;
}

function formatRow({ exchange, symbol, ticker, ratePercent, intervalHours }) {
  return {
    exchange,
    symbol,
    ticker,
    "rate, %": ratePercent.toFixed(4),
    "interval, h": intervalHours,
    "APR, %": toApr(ratePercent, intervalHours).toFixed(2),
  };
}

async function getBinanceRows() {
  const [premiumRes, infoRes] = await Promise.all([
    fetch("https://fapi.binance.com/fapi/v1/premiumIndex"),
    fetch("https://fapi.binance.com/fapi/v1/fundingInfo"),
  ]);
  const premiumBySymbol = new Map((await premiumRes.json()).map((item) => [item.symbol, item]));
  const infoBySymbol = new Map((await infoRes.json()).map((item) => [item.symbol, item]));

  const rows = [];
  for (const coin of COINS) {
    const premium = premiumBySymbol.get(coin.binance);
    if (!premium) continue;

    const intervalHours = infoBySymbol.get(coin.binance)?.fundingIntervalHours ?? 8;
    rows.push(
      formatRow({
        exchange: "Binance",
        symbol: coin.symbol,
        ticker: premium.symbol,
        ratePercent: Number(premium.lastFundingRate) * 100,
        intervalHours,
      }),
    );
  }
  return rows;
}

async function getBybitRows() {
  const res = await fetch("https://api.bybit.com/v5/market/tickers?category=linear");
  const data = await res.json();
  const bySymbol = new Map(data.result.list.map((item) => [item.symbol, item]));

  const rows = [];
  for (const coin of COINS) {
    const ticker = bySymbol.get(coin.bybit);
    if (!ticker) continue;

    rows.push(
      formatRow({
        exchange: "Bybit",
        symbol: coin.symbol,
        ticker: ticker.symbol,
        ratePercent: Number(ticker.fundingRate) * 100,
        intervalHours: Number(ticker.fundingIntervalHour),
      }),
    );
  }
  return rows;
}

async function getOkxRow(coin) {
  try {
    const res = await fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${coin.okx}`);
    const data = await res.json();
    const entry = data.data?.[0];
    if (!entry) return null;

    const intervalHours = (Number(entry.nextFundingTime) - Number(entry.fundingTime)) / MS_PER_HOUR;
    return formatRow({
      exchange: "OKX",
      symbol: coin.symbol,
      ticker: entry.instId,
      ratePercent: Number(entry.fundingRate) * 100,
      intervalHours,
    });
  } catch {
    return null;
  }
}

async function getOkxRows() {
  const results = await Promise.all(COINS.map(getOkxRow));
  return results.filter((row) => row !== null);
}

const [binanceRows, bybitRows, okxRows] = await Promise.all([
  getBinanceRows(),
  getBybitRows(),
  getOkxRows(),
]);

console.table([...binanceRows, ...bybitRows, ...okxRows]);
