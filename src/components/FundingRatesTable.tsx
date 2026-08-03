"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ExchangeName, FundingRateRow, GroupedFundingRate } from "@/lib/funding-rates";
import RelativeTime from "@/components/RelativeTime";

const EXCHANGES: ExchangeName[] = ["Binance", "Bybit", "OKX"];

// Биржи часто возвращают одну и ту же "базовую" ставку 0.0100% за интервал,
// когда рынок не создаёт давления на фандинг ни на одной из бирж — такие
// строки одинаковы везде и не несут сравнительной информации.
const BASE_RATE_PERCENT = 0.01;
const EPSILON = 1e-9;

type SortKey = "symbol" | ExchangeName | "spread" | "updated";
type SortDirection = "asc" | "desc";

function sortValue(row: GroupedFundingRate, key: SortKey): number | string {
  if (key === "symbol") return row.symbol;
  if (key === "spread") return row.spread ?? -Infinity;
  if (key === "updated") return row.updatedAt;
  return row.rates[key]?.apr_percent ?? -Infinity;
}

function hasVisibleSpread(row: GroupedFundingRate): boolean {
  return row.spread !== null && Math.abs(row.spread) > EPSILON;
}

function isUninformativeRow(row: GroupedFundingRate): boolean {
  if (hasVisibleSpread(row)) return false;

  const present = EXCHANGES.map((exchange) => row.rates[exchange]).filter(
    (cell): cell is FundingRateRow => !!cell,
  );
  if (present.length < 2) return false;

  return present.every((cell) => Math.abs(cell.rate_percent - BASE_RATE_PERCENT) < EPSILON);
}

export default function FundingRatesTable({
  rows,
  limit,
  seeAllHref,
}: {
  rows: GroupedFundingRate[];
  limit?: number;
  seeAllHref?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("spread");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const aBoring = isUninformativeRow(a);
      const bBoring = isUninformativeRow(b);
      if (aBoring !== bBoring) return aBoring ? 1 : -1;

      const aValue = sortValue(a, sortKey);
      const bValue = sortValue(b, sortKey);
      const comparison =
        typeof aValue === "string"
          ? aValue.localeCompare(bValue as string)
          : aValue - (bValue as number);
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return copy;
  }, [rows, sortKey, sortDirection]);

  const visibleRows = limit ? sortedRows.slice(0, limit) : sortedRows;

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }

  if (rows.length === 0) {
    return (
      <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-2 text-lg font-medium">Funding rates by coin</h2>
        <p className="text-sm text-zinc-400">No data yet.</p>
      </div>
    );
  }

  function SortableHeader({ label, sortKeyValue }: { label: string; sortKeyValue: SortKey }) {
    const active = sortKey === sortKeyValue;
    return (
      <th
        className="cursor-pointer pb-2 pr-4 font-medium select-none hover:text-zinc-200"
        onClick={() => toggleSort(sortKeyValue)}
      >
        {label}
        {active && (
          <span className="ml-1 text-zinc-500">{sortDirection === "asc" ? "▲" : "▼"}</span>
        )}
      </th>
    );
  }

  return (
    <div
      className={`w-full ${limit ? "max-w-2xl" : "max-w-4xl"} rounded-xl border border-white/10 bg-white/5 p-6`}
    >
      <h2 className="mb-4 text-lg font-medium">Funding rates by coin</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-zinc-400 uppercase">
              <SortableHeader label="Coin" sortKeyValue="symbol" />
              {EXCHANGES.map((exchange) => (
                <SortableHeader key={exchange} label={exchange} sortKeyValue={exchange} />
              ))}
              <SortableHeader label="Spread" sortKeyValue="spread" />
              <SortableHeader label="Updated" sortKeyValue="updated" />
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const present = EXCHANGES.map((exchange) => row.rates[exchange]).filter(
                (cell): cell is FundingRateRow => !!cell,
              );
              const showHighlight = hasVisibleSpread(row);
              const maxApr = showHighlight ? Math.max(...present.map((c) => c.apr_percent)) : null;
              const minApr = showHighlight ? Math.min(...present.map((c) => c.apr_percent)) : null;

              return (
                <tr key={row.symbol}>
                  <td className="py-2 pr-4 font-medium">{row.symbol}</td>
                  {EXCHANGES.map((exchange) => {
                    const cell = row.rates[exchange];
                    const isMax = maxApr !== null && cell?.apr_percent === maxApr;
                    const isMin = minApr !== null && cell?.apr_percent === minApr;

                    return (
                      <td
                        key={exchange}
                        className={
                          "py-2 pr-4" +
                          (isMax
                            ? " bg-green-500/10 text-green-400"
                            : isMin
                              ? " bg-red-500/10 text-red-400"
                              : "")
                        }
                      >
                        {cell ? (
                          <span title={`${cell.rate_percent.toFixed(4)}% per ${cell.interval_hours}h interval`}>
                            <span className="font-medium">{cell.apr_percent.toFixed(2)}%</span>{" "}
                            <span className="text-xs text-zinc-500">
                              ({cell.rate_percent.toFixed(4)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 pr-4">
                    {row.spread !== null ? `${row.spread.toFixed(2)} pp` : "—"}
                  </td>
                  <td className="py-2 text-zinc-400">
                    <RelativeTime dateIso={row.updatedAt} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {limit && seeAllHref && rows.length > limit && (
        <div className="mt-4 text-sm">
          <Link href={seeAllHref} className="text-zinc-300 underline hover:text-foreground">
            See all →
          </Link>
        </div>
      )}
    </div>
  );
}
