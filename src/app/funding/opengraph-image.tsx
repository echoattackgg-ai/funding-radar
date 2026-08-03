import { renderOgImage, OG_SIZE } from "@/lib/og-image";

export const alt = "All funding rates — Funding Radar";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    title: "All funding rates, sorted by spread",
    subtitle: "Every tracked coin across Binance, Bybit and OKX in one table.",
  });
}
