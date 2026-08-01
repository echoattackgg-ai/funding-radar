// Забирает текущую ставку фандинга по BTC с публичных API Binance, Bybit и OKX,
// приводит к единому виду и считает годовую доходность (APR).
// Запуск: node scripts/funding-rate.mjs

const MS_PER_HOUR = 60 * 60 * 1000;

function toApr(ratePercent, intervalHours) {
  const paymentsPerYear = (24 / intervalHours) * 365;
  return ratePercent * paymentsPerYear;
}

function formatRow({ биржа, тикер, ratePercent, intervalHours, nextFundingTime }) {
  return {
    биржа,
    тикер,
    "ставка, %": ratePercent.toFixed(4),
    "интервал, ч": intervalHours,
    "APR, %": toApr(ratePercent, intervalHours).toFixed(2),
    "следующее начисление": new Date(nextFundingTime).toLocaleString("ru-RU"),
  };
}

async function getBinance() {
  const [premiumRes, infoRes] = await Promise.all([
    fetch("https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT"),
    fetch("https://fapi.binance.com/fapi/v1/fundingInfo"),
  ]);
  const premium = await premiumRes.json();
  const info = await infoRes.json();
  const symbolInfo = info.find((item) => item.symbol === "BTCUSDT");

  return formatRow({
    биржа: "Binance",
    тикер: premium.symbol,
    ratePercent: Number(premium.lastFundingRate) * 100,
    intervalHours: symbolInfo.fundingIntervalHours,
    nextFundingTime: Number(premium.nextFundingTime),
  });
}

async function getBybit() {
  const res = await fetch("https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT");
  const data = await res.json();
  const ticker = data.result.list[0];

  return formatRow({
    биржа: "Bybit",
    тикер: ticker.symbol,
    ratePercent: Number(ticker.fundingRate) * 100,
    intervalHours: Number(ticker.fundingIntervalHour),
    nextFundingTime: Number(ticker.nextFundingTime),
  });
}

async function getOkx() {
  const res = await fetch("https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP");
  const data = await res.json();
  const entry = data.data[0];
  const intervalHours = (Number(entry.nextFundingTime) - Number(entry.fundingTime)) / MS_PER_HOUR;

  return formatRow({
    биржа: "OKX",
    тикер: entry.instId,
    ratePercent: Number(entry.fundingRate) * 100,
    intervalHours,
    nextFundingTime: Number(entry.nextFundingTime),
  });
}

const results = await Promise.all([getBinance(), getBybit(), getOkx()]);

console.table(results);
