"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ExchangeName, FundingRateRow, GroupedFundingRate } from "@/lib/funding-rates";
import { AFFILIATE_LINKS } from "@/lib/affiliate-links";
import RelativeTime from "@/components/RelativeTime";
import GlassCard from "@/components/GlassCard";
import StateMessage from "@/components/StateMessage";

const EXCHANGES: ExchangeName[] = ["Binance", "Bybit", "OKX"];

// Биржи часто возвращают одну и ту же "базовую" ставку 0.0100% за интервал,
// когда рынок не создаёт давления на фандинг ни на одной из бирж — такие
// строки одинаковы везде и не несут сравнительной информации.
const BASE_RATE_PERCENT = 0.01;
const EPSILON = 1e-9;

type SortKey = "symbol" | ExchangeName | "spread";
type SortDirection = "asc" | "desc";

function sortValue(row: GroupedFundingRate, key: SortKey): number | string {
  if (key === "symbol") return row.symbol;
  if (key === "spread") return row.spread ?? -Infinity;
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

function SortableHeader({
  label,
  sortKeyValue,
  href,
  align = "left",
  sortKey,
  sortDirection,
  onSort,
}: {
  label: string;
  sortKeyValue: SortKey;
  href?: string;
  align?: "left" | "right";
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === sortKeyValue;
  return (
    <th
      className={`cursor-pointer pb-2 pr-4 font-medium select-none hover:text-zinc-200 ${
        align === "right" ? "text-right" : "text-left"
      }`}
      onClick={() => onSort(sortKeyValue)}
    >
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 text-sky-400/90 underline decoration-dotted underline-offset-2 hover:text-sky-300"
        >
          {label}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </a>
      ) : (
        label
      )}
      {active && <span className="ml-1 text-zinc-500">{sortDirection === "asc" ? "▲" : "▼"}</span>}
    </th>
  );
}

export default function FundingRatesTable({
  rows,
  error,
  limit,
  seeAllHref,
}: {
  rows: GroupedFundingRate[];
  error?: boolean;
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

  const latestUpdatedAt = useMemo(
    () =>
      rows.reduce(
        (latest, row) => (row.updatedAt > latest ? row.updatedAt : latest),
        rows[0]?.updatedAt ?? "",
      ),
    [rows],
  );

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }

  if (error) {
    return (
      <StateMessage
        title="Funding rates by coin"
        description="Couldn't load rates right now. Try refreshing the page."
        variant="error"
        className="w-full max-w-2xl"
      />
    );
  }

  if (rows.length === 0) {
    return (
      <StateMessage
        title="Funding rates by coin"
        description="No data yet."
        className="w-full max-w-2xl"
      />
    );
  }

  return (
    <GlassCard className={`w-full ${limit ? "max-w-3xl" : "max-w-4xl"} p-6`}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-medium">Funding rates by coin</h2>
        {latestUpdatedAt && (
          <p className="text-xs whitespace-nowrap text-zinc-500">
            Updated <RelativeTime dateIso={latestUpdatedAt} />
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm tabular-nums">
          <thead>
            <tr className="text-xs text-zinc-400 uppercase">
              <SortableHeader
                label="Coin"
                sortKeyValue="symbol"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={toggleSort}
              />
              {EXCHANGES.map((exchange) => (
                <SortableHeader
                  key={exchange}
                  label={exchange}
                  sortKeyValue={exchange}
                  href={AFFILIATE_LINKS[exchange]}
                  align="right"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              ))}
              <SortableHeader
                label="Spread"
                sortKeyValue="spread"
                align="right"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={toggleSort}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {visibleRows.map((row) => {
              const present = EXCHANGES.map((exchange) => row.rates[exchange]).filter(
                (cell): cell is FundingRateRow => !!cell,
              );
              const showHighlight = hasVisibleSpread(row);
              const maxApr = showHighlight ? Math.max(...present.map((c) => c.apr_percent)) : null;
              const minApr = showHighlight ? Math.min(...present.map((c) => c.apr_percent)) : null;

              return (
                <tr key={row.symbol} className="transition-colors hover:bg-white/5">
                  <td className="py-2 pr-4 font-medium">{row.symbol}</td>
                  {EXCHANGES.map((exchange) => {
                    const cell = row.rates[exchange];
                    const isMax = maxApr !== null && cell?.apr_percent === maxApr;
                    const isMin = minApr !== null && cell?.apr_percent === minApr;

                    return (
                      <td
                        key={exchange}
                        className={
                          "py-2 pr-4 text-right" +
                          (isMax
                            ? " bg-green-500/10 text-green-400"
                            : isMin
                              ? " bg-red-500/10 text-red-400"
                              : "")
                        }
                      >
                        {cell ? (
                          <span
                            className="inline-flex w-full items-baseline justify-end gap-1 whitespace-nowrap"
                            title={`${cell.rate_percent.toFixed(4)}% per ${cell.interval_hours}h interval`}
                          >
                            <span className="inline-block w-[8ch] text-right text-base font-semibold tabular-nums">
                              {cell.apr_percent.toFixed(2)}%
                            </span>
                            <span className="inline-block w-[11ch] text-right text-xs text-zinc-500/80 tabular-nums">
                              ({cell.rate_percent.toFixed(4)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 pr-4 text-right whitespace-nowrap">
                    <span className="inline-block w-[8ch] text-right tabular-nums">
                      {row.spread !== null ? `${row.spread.toFixed(2)} pp` : "—"}
                    </span>
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
    </GlassCard>
  );
}
