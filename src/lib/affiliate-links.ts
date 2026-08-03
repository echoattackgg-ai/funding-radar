import type { ExchangeName } from "@/lib/funding-rates";

// Партнёрские ссылки на биржи. Binance сюда не добавляем — партнёрской
// программы там нет, название остаётся обычным текстом.
export const AFFILIATE_LINKS: Partial<Record<ExchangeName, string>> = {
  Bybit: "https://www.bybit.com/invite?ref=WZPXPQ&medium=referral&utm_campaign=evergreen",
  OKX: "https://okx.com/join/84367603",
};
