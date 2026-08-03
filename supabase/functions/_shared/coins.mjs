// Единый список монет и их тикеров на каждой бирже.
// Тикеры проверены напрямую в API бирж (не по памяти) — обрати внимание на
// MATIC/POL: после ребрендинга все три биржи используют тикер POL, а не MATIC.
export const COINS = [
  { symbol: "BTC", binance: "BTCUSDT", bybit: "BTCUSDT", okx: "BTC-USDT-SWAP" },
  { symbol: "ETH", binance: "ETHUSDT", bybit: "ETHUSDT", okx: "ETH-USDT-SWAP" },
  { symbol: "SOL", binance: "SOLUSDT", bybit: "SOLUSDT", okx: "SOL-USDT-SWAP" },
  { symbol: "XRP", binance: "XRPUSDT", bybit: "XRPUSDT", okx: "XRP-USDT-SWAP" },
  { symbol: "DOGE", binance: "DOGEUSDT", bybit: "DOGEUSDT", okx: "DOGE-USDT-SWAP" },
  { symbol: "BNB", binance: "BNBUSDT", bybit: "BNBUSDT", okx: "BNB-USDT-SWAP" },
  { symbol: "ADA", binance: "ADAUSDT", bybit: "ADAUSDT", okx: "ADA-USDT-SWAP" },
  { symbol: "AVAX", binance: "AVAXUSDT", bybit: "AVAXUSDT", okx: "AVAX-USDT-SWAP" },
  { symbol: "LINK", binance: "LINKUSDT", bybit: "LINKUSDT", okx: "LINK-USDT-SWAP" },
  { symbol: "LTC", binance: "LTCUSDT", bybit: "LTCUSDT", okx: "LTC-USDT-SWAP" },
  { symbol: "DOT", binance: "DOTUSDT", bybit: "DOTUSDT", okx: "DOT-USDT-SWAP" },
  { symbol: "TRX", binance: "TRXUSDT", bybit: "TRXUSDT", okx: "TRX-USDT-SWAP" },
  { symbol: "ATOM", binance: "ATOMUSDT", bybit: "ATOMUSDT", okx: "ATOM-USDT-SWAP" },
  { symbol: "POL", binance: "POLUSDT", bybit: "POLUSDT", okx: "POL-USDT-SWAP" },
  { symbol: "UNI", binance: "UNIUSDT", bybit: "UNIUSDT", okx: "UNI-USDT-SWAP" },
  { symbol: "NEAR", binance: "NEARUSDT", bybit: "NEARUSDT", okx: "NEAR-USDT-SWAP" },
  { symbol: "APT", binance: "APTUSDT", bybit: "APTUSDT", okx: "APT-USDT-SWAP" },
  { symbol: "ARB", binance: "ARBUSDT", bybit: "ARBUSDT", okx: "ARB-USDT-SWAP" },
];
