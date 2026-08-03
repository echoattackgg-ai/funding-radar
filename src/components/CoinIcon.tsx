"use client";

import { useState } from "react";

// Иконки лежат локально в public/coins — список тикеров, для которых
// на диске реально есть файл. Значит, для тикеров вне списка мы даже
// не пытаемся грузить картинку (нет смысла бить по несуществующему пути),
// а сразу показываем запасной кружок с буквой.
const AVAILABLE_ICONS = new Set([
  "ada",
  "atom",
  "avax",
  "bnb",
  "btc",
  "doge",
  "dot",
  "eth",
  "link",
  "ltc",
  "sol",
  "trx",
  "uni",
  "xrp",
]);

export default function CoinIcon({ symbol, size = 20 }: { symbol: string; size?: number }) {
  const ticker = symbol.toLowerCase();
  const [failed, setFailed] = useState(false);

  // Контейнер всегда одного размера — картинка это или буква, вёрстка вокруг
  // тикера не смещается ни при отсутствии иконки, ни при ошибке загрузки.
  const boxStyle = { width: size, height: size, fontSize: Math.round(size * 0.5) };

  if (!AVAILABLE_ICONS.has(ticker) || failed) {
    return (
      <span
        style={boxStyle}
        aria-hidden="true"
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 font-semibold text-zinc-300"
      >
        {symbol.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/coins/${ticker}.svg`}
      alt=""
      width={size}
      height={size}
      style={boxStyle}
      className="inline-block shrink-0 rounded-full"
      onError={() => setFailed(true)}
    />
  );
}
