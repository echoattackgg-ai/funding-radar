import { renderOgImage, OG_SIZE } from "@/lib/og-image";

export const alt = "Funding Radar";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    title: "Funding rates across exchanges, side by side",
    subtitle: "Binance, Bybit and OKX compared in real time — spot the spread before it closes.",
  });
}
