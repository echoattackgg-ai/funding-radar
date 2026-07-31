"use client";

import { useMemo, useState } from "react";

type Direction = "long" | "short";

const inputClass =
  "w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground outline-none focus:border-white/30";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

export default function LiquidationCalculator() {
  const [positionSize, setPositionSize] = useState("1000");
  const [leverage, setLeverage] = useState("10");
  const [entryPrice, setEntryPrice] = useState("60000");
  const [direction, setDirection] = useState<Direction>("long");

  const result = useMemo(() => {
    const size = parseFloat(positionSize);
    const lev = parseFloat(leverage);
    const entry = parseFloat(entryPrice);

    if (!(size > 0) || !(lev > 0) || !(entry > 0)) {
      return null;
    }

    const percentMove = 100 / lev;
    const liquidationPrice =
      direction === "long" ? entry * (1 - 1 / lev) : entry * (1 + 1 / lev);

    return { liquidationPrice, percentMove };
  }, [positionSize, leverage, entryPrice, direction]);

  return (
    <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-medium">
        Калькулятор цены ликвидации
      </h2>

      <div className="space-y-4">
        <Field label="Размер позиции, USD">
          <input
            type="number"
            min="0"
            value={positionSize}
            onChange={(e) => setPositionSize(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Плечо (x)">
          <input
            type="number"
            min="1"
            value={leverage}
            onChange={(e) => setLeverage(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Цена входа, USD">
          <input
            type="number"
            min="0"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Направление">
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as Direction)}
            className={inputClass}
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </Field>
      </div>

      <div className="mt-6 rounded-lg bg-white/5 p-4">
        {result ? (
          <>
            <p className="text-sm text-zinc-400">Цена ликвидации</p>
            <p className="text-2xl font-semibold">
              $
              {result.liquidationPrice.toLocaleString("ru-RU", {
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="mt-3 text-sm text-zinc-400">
              Рынок должен пойти против позиции на
            </p>
            <p className="text-2xl font-semibold">
              {result.percentMove.toFixed(2)}%
            </p>
          </>
        ) : (
          <p className="text-sm text-zinc-400">
            Заполните поля выше корректными значениями.
          </p>
        )}
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl backdrop-saturate-150">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent opacity-60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-2xl border border-white/10"
        />
        <div className="relative">
          <p className="mb-2 text-xs font-medium tracking-wide text-zinc-300 uppercase">
            Формула расчёта
          </p>
          <p className="font-mono text-xs leading-relaxed text-zinc-300">
            Изолированная маржа, упрощённо — без комиссий и ставки
            поддерживающей маржи:
            <br />
            Long: Цена_ликв = Цена_входа × (1 − 1 / Плечо)
            <br />
            Short: Цена_ликв = Цена_входа × (1 + 1 / Плечо)
            <br />
            Движение против позиции = 100 / Плечо, %
          </p>
        </div>
      </div>
    </div>
  );
}
