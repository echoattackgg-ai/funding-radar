"use client";

import { useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";

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
    <GlassCard className="w-full max-w-md p-6">
      <h2 className="mb-4 text-lg font-medium">
        Liquidation price calculator
      </h2>

      <div className="space-y-4">
        <Field label="Position size, USD">
          <input
            type="number"
            min="0"
            value={positionSize}
            onChange={(e) => setPositionSize(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Leverage (x)">
          <input
            type="number"
            min="1"
            value={leverage}
            onChange={(e) => setLeverage(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Entry price, USD">
          <input
            type="number"
            min="0"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Direction">
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
            <p className="text-sm text-zinc-400">Liquidation price</p>
            <p className="text-2xl font-semibold tabular-nums">
              $
              {result.liquidationPrice.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="mt-3 text-sm text-zinc-400">
              The market needs to move against the position by
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {result.percentMove.toFixed(2)}%
            </p>
          </>
        ) : (
          <p className="text-sm text-zinc-400">
            Fill in the fields above with valid values.
          </p>
        )}
      </div>

      <GlassCard className="mt-4 p-4">
        <p className="mb-2 text-xs font-medium tracking-wide text-zinc-300 uppercase">
          Calculation formula
        </p>
        <p className="font-mono text-xs leading-relaxed text-zinc-300">
          Isolated margin, simplified — no fees, no maintenance margin
          rate:
          <br />
          Long: Liq_price = Entry_price × (1 − 1 / Leverage)
          <br />
          Short: Liq_price = Entry_price × (1 + 1 / Leverage)
          <br />
          Move against position = 100 / Leverage, %
        </p>
      </GlassCard>
    </GlassCard>
  );
}
