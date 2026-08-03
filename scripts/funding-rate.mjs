// Забирает текущие ставки фандинга по списку монет (см. ../supabase/functions/_shared/coins.mjs)
// с публичных API Binance, Bybit и OKX, приводит к единому виду и считает годовую доходность (APR).
// Запуск: node scripts/funding-rate.mjs

import { COINS } from "../supabase/functions/_shared/coins.mjs";

const MS_PER_HOUR = 60 * 60 * 1000;

function toApr(ratePercent, intervalHours) {
  const paymentsPerYear = (24 / intervalHours) * 365;
  return ratePercent * paymentsPerYear;
}

// То же правило зрелости прогноза, что и на сайте (см. src/lib/funding-rates.ts):
// меньше четверти интервала прошло — значение ещё скачет.
function formatMaturity(nextFundingAtMs, intervalHours) {
  const totalMs = intervalHours * MS_PER_HOUR;
  const elapsedMs = Math.max(0, Date.now() - (nextFundingAtMs - totalMs));
  const elapsedMin = Math.round(elapsedMs / 60000);
  const totalMin = Math.round(totalMs / 60000);
  const fraction = totalMs > 0 ? elapsedMs / totalMs : 1;
  const label = elapsedMin >= 60 ? `${(elapsedMin / 60).toFixed(1)}h` : `${elapsedMin}m`;
  const totalLabel = totalMin >= 60 ? `${(totalMin / 60).toFixed(1)}h` : `${totalMin}m`;
  return `${label} / ${totalLabel}${fraction < 0.25 ? " (unreliable)" : ""}`;
}

function formatRow({ exchange, symbol, ticker, ratePercent, intervalHours, nextFundingAtMs, lastPaid }) {
  return {
    exchange,
    symbol,
    ticker,
    "rate, %": ratePercent.toFixed(4),
    "interval, h": intervalHours,
    "APR, %": toApr(ratePercent, intervalHours).toFixed(2),
    maturity: formatMaturity(nextFundingAtMs, intervalHours),
    "last paid, %": lastPaid !== null && lastPaid !== undefined ? lastPaid.toFixed(4) : "—",
  };
}

// Последняя фактически выплаченная ставка требует отдельного запроса истории
// на каждую монету (для Binance и Bybit — OKX отдаёт её в основном запросе).
// Обёрнуто отдельно от основного сбора: если история не отдалась, в таблице
// просто будет "—" в этой колонке, а не упавший скрипт.

async function getBinanceLastPaidRates() {
  const results = new Map();
  await Promise.all(
    COINS.map(async (coin) => {
      try {
        const res = await fetch(
          `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${coin.binance}&limit=1`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const entry = data[0];
        if (entry) results.set(coin.binance, Number(entry.fundingRate) * 100);
      } catch (err) {
        console.error(`Binance last-paid-rate fetch failed for ${coin.symbol}:`, err.message);
      }
    }),
  );
  return results;
}

async function getBybitLastPaidRates() {
  const results = new Map();
  await Promise.all(
    COINS.map(async (coin) => {
      try {
        const res = await fetch(
          `https://api.bybit.com/v5/market/funding/history?category=linear&symbol=${coin.bybit}&limit=1`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const entry = data.result?.list?.[0];
        if (entry) results.set(coin.bybit, Number(entry.fundingRate) * 100);
      } catch (err) {
        console.error(`Bybit last-paid-rate fetch failed for ${coin.symbol}:`, err.message);
      }
    }),
  );
  return results;
}

async function getBinanceRows(lastPaidByTicker) {
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
        nextFundingAtMs: Number(premium.nextFundingTime),
        lastPaid: lastPaidByTicker.get(coin.binance),
      }),
    );
  }
  return rows;
}

async function getBybitRows(lastPaidByTicker) {
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
        nextFundingAtMs: Number(ticker.nextFundingTime),
        lastPaid: lastPaidByTicker.get(coin.bybit),
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

    const prevFundingTime = Number(entry.prevFundingTime);
    const intervalHours = Number.isFinite(prevFundingTime)
      ? (Number(entry.fundingTime) - prevFundingTime) / MS_PER_HOUR
      : (Number(entry.nextFundingTime) - Number(entry.fundingTime)) / MS_PER_HOUR;

    return formatRow({
      exchange: "OKX",
      symbol: coin.symbol,
      ticker: entry.instId,
      ratePercent: Number(entry.fundingRate) * 100,
      intervalHours,
      nextFundingAtMs: Number(entry.fundingTime),
      lastPaid: entry.settState === "settled" ? Number(entry.settFundingRate) * 100 : undefined,
    });
  } catch {
    return null;
  }
}

async function getOkxRows() {
  const results = await Promise.all(COINS.map(getOkxRow));
  return results.filter((row) => row !== null);
}

const [binanceLastPaid, bybitLastPaid] = await Promise.all([
  getBinanceLastPaidRates(),
  getBybitLastPaidRates(),
]);

const [binanceRows, bybitRows, okxRows] = await Promise.all([
  getBinanceRows(binanceLastPaid),
  getBybitRows(bybitLastPaid),
  getOkxRows(),
]);

console.table([...binanceRows, ...bybitRows, ...okxRows]);
