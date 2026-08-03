"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  IMMATURE_FRACTION_THRESHOLD,
  type ExchangeName,
  type FundingRateRow,
  type GroupedFundingRate,
  type Maturity,
} from "@/lib/funding-rates";
import { AFFILIATE_LINKS } from "@/lib/affiliate-links";
import RelativeTime from "@/components/RelativeTime";
import GlassCard from "@/components/GlassCard";
import StateMessage from "@/components/StateMessage";
import CoinIcon from "@/components/CoinIcon";
import Tooltip from "@/components/Tooltip";

const EXCHANGES: ExchangeName[] = ["Binance", "Bybit", "OKX"];

// Биржи часто возвращают одну и ту же "базовую" ставку 0.0100% за интервал,
// когда рынок не создаёт давления на фандинг ни на одной из бирж — такие
// строки одинаковы везде и не несут сравнительной информации.
const BASE_RATE_PERCENT = 0.01;
const EPSILON = 1e-9;

// На мобильном полный список — это бесконечный скролл карточек, а самые
// интересные строки и так наверху (сортировка по умолчанию — по спреду).
const MOBILE_DEFAULT_VISIBLE = 10;

type SortKey = "symbol" | ExchangeName | "spread";
type SortDirection = "asc" | "desc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "symbol", label: "Coin" },
  ...EXCHANGES.map((exchange) => ({ key: exchange, label: exchange })),
  { key: "spread", label: "Spread" },
];

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

// Приоритет строк при сортировке: обычные строки наверх, затем строки, где
// биржи разошлись по фазе интервала (спред между "устоявшейся" и "только что
// открывшейся" биржей может быть фантомным), затем неинформативные (везде одна
// и та же базовая ставка). Если рано ВСЕ биржи разом — это не повод понижать
// строку, это свойство момента, а не конкретной пары (см. StabilityBanner).
function rowTier(row: GroupedFundingRate): number {
  if (isUninformativeRow(row)) return 2;
  if (row.hasPhaseDivergence) return 1;
  return 0;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h${minutes}m`;
}

function formatMaturity(maturity: Maturity): string {
  return `${formatDuration(maturity.elapsedMs)} / ${formatDuration(maturity.totalMs)}`;
}

function cellTooltipContent(cell: FundingRateRow): string {
  const base = `${cell.rate_percent.toFixed(4)}% per ${cell.interval_hours}h interval`;
  if (!cell.maturity) return base;

  const progress = `${formatMaturity(cell.maturity)} into this interval`;
  return cell.maturity.isImmature
    ? `${base} · ${progress} — too early, forecast may still change`
    : `${base} · ${progress}`;
}

// Всегда видимый значок (не только по наведению — важно для мобильных карточек,
// где ховера нет), с подсказкой-подробностью для тех, кто может её увидеть.
// Показывается ТОЛЬКО на строках с расхождением фаз (rowTier === 1) — если
// пометить рано абсолютно всё, пометка перестаёт что-либо означать.
function MaturityBadge({ maturity }: { maturity: Maturity }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-orange-400">
      early · {formatMaturity(maturity)}
    </span>
  );
}

// "Момент" — общее свойство всего среза данных, а не отдельной строки: если
// биржи используют один и тот же стандартный интервал (обычно 8ч, синхронно
// по UTC), они почти всегда стартуют и созревают одновременно. Берём самую
// частую длину интервала среди всех загруженных ячеек и самое частое время
// следующей выплаты внутри неё — это и есть "текущий цикл" сайта.
function computeGlobalMaturity(rows: GroupedFundingRate[]): Maturity | null {
  const cells = rows.flatMap((row) =>
    EXCHANGES.map((exchange) => row.rates[exchange]).filter(
      (cell): cell is FundingRateRow => !!cell && !!cell.maturity,
    ),
  );
  if (cells.length === 0) return null;

  const countByHours = new Map<number, number>();
  for (const cell of cells) {
    countByHours.set(cell.interval_hours, (countByHours.get(cell.interval_hours) ?? 0) + 1);
  }
  const [dominantHours] = [...countByHours.entries()].sort((a, b) => b[1] - a[1])[0];
  const dominantCells = cells.filter((cell) => cell.interval_hours === dominantHours);

  const countByNextFunding = new Map<string, number>();
  for (const cell of dominantCells) {
    const key = cell.next_funding_at!;
    countByNextFunding.set(key, (countByNextFunding.get(key) ?? 0) + 1);
  }
  const [dominantNextFunding] = [...countByNextFunding.entries()].sort((a, b) => b[1] - a[1])[0];

  return dominantCells.find((cell) => cell.next_funding_at === dominantNextFunding)!.maturity;
}

// Непрерывное затухание вместо жёсткого включения/выключения на 25% — плавно
// уходит в 0 к порогу, а не обрывается разом (см. обсуждение: резкий переход
// по всей таблице выглядел как сбой).
function cautionIntensity(fraction: number): number {
  return Math.max(0, Math.min(1, (IMMATURE_FRACTION_THRESHOLD - fraction) / IMMATURE_FRACTION_THRESHOLD));
}

function StabilityBanner({ maturity }: { maturity: Maturity }) {
  const intensity = cautionIntensity(maturity.fraction);
  return (
    <p className="mb-4 text-xs text-zinc-400">
      {formatMaturity(maturity)} into the current funding window.{" "}
      <span
        className="font-medium text-orange-400"
        style={{ opacity: intensity }}
        aria-hidden={intensity === 0}
      >
        Interval just reset — early forecasts can still swing; treat fresh spreads with caution.
      </span>
    </p>
  );
}

function computeRowMeta(row: GroupedFundingRate) {
  const present = EXCHANGES.map((exchange) => row.rates[exchange]).filter(
    (cell): cell is FundingRateRow => !!cell,
  );
  const showHighlight = hasVisibleSpread(row);
  const maxApr = showHighlight ? Math.max(...present.map((c) => c.apr_percent)) : null;
  const minApr = showHighlight ? Math.min(...present.map((c) => c.apr_percent)) : null;
  return { present, showHighlight, maxApr, minApr };
}

function ExternalLinkIcon() {
  return (
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
  );
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
          <ExternalLinkIcon />
        </a>
      ) : (
        label
      )}
      {active && <span className="ml-1 text-zinc-400">{sortDirection === "asc" ? "▲" : "▼"}</span>}
    </th>
  );
}

function MobileSortBar({
  sortKey,
  sortDirection,
  onSort,
}: {
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Sort rates"
      className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 sm:hidden"
    >
      {SORT_OPTIONS.map((option) => {
        const active = sortKey === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onSort(option.key)}
            className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              active
                ? "border-sky-400/40 bg-sky-500/15 text-sky-300"
                : "border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {option.label}
            {active && <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>}
          </button>
        );
      })}
    </div>
  );
}

function FundingRateCard({ row }: { row: GroupedFundingRate }) {
  const { present, showHighlight, maxApr, minApr } = computeRowMeta(row);
  const orderedPresent = [...present].sort((a, b) => b.apr_percent - a.apr_percent);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-3 px-1 pb-2">
        <span className="inline-flex items-center gap-2 text-lg font-semibold">
          <CoinIcon symbol={row.symbol} size={22} />
          {row.symbol}
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-orange-500/15 px-2.5 py-1 font-mono text-sm font-semibold tabular-nums text-orange-400">
            {row.spread !== null ? `${row.spread.toFixed(2)} pp` : "—"}
          </span>
          {row.hasPhaseDivergence && (
            <span className="text-[10px] font-medium whitespace-nowrap text-orange-400">
              exchanges out of sync
            </span>
          )}
        </span>
      </div>
      <div className="divide-y divide-white/5">
        {orderedPresent.map((cell) => {
          const isMax = showHighlight && cell.apr_percent === maxApr;
          const isMin = showHighlight && cell.apr_percent === minApr;
          const href = AFFILIATE_LINKS[cell.exchange];

          const rowClasses =
            "flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors" +
            (isMax
              ? " bg-green-500/10 text-green-400"
              : isMin
                ? " bg-red-500/10 text-red-400"
                : "");

          const content = (
            <>
              <span className="inline-flex items-center gap-1 font-medium">
                {cell.exchange}
                {href && <ExternalLinkIcon />}
              </span>
              <span className="flex flex-col items-end gap-0.5 text-right">
                <span className="block font-mono text-base font-semibold tabular-nums">
                  {cell.apr_percent.toFixed(2)}%
                </span>
                <span className="block font-mono text-xs tabular-nums text-zinc-400">
                  {cell.rate_percent.toFixed(4)}% · {cell.interval_hours}h
                </span>
                {row.hasPhaseDivergence && cell.maturity?.isImmature && (
                  <MaturityBadge maturity={cell.maturity} />
                )}
              </span>
            </>
          );

          return href ? (
            <a
              key={cell.exchange}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${rowClasses} hover:bg-white/5`}
            >
              {content}
            </a>
          ) : (
            <div key={cell.exchange} className={rowClasses}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
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
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const aTier = rowTier(a);
      const bTier = rowTier(b);
      if (aTier !== bTier) return aTier - bTier;

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
  const mobileVisibleRows = limit
    ? visibleRows
    : mobileExpanded
      ? sortedRows
      : sortedRows.slice(0, MOBILE_DEFAULT_VISIBLE);
  const showMobileExpandButton =
    !limit && !mobileExpanded && sortedRows.length > MOBILE_DEFAULT_VISIBLE;

  const latestUpdatedAt = useMemo(
    () =>
      rows.reduce(
        (latest, row) => (row.updatedAt > latest ? row.updatedAt : latest),
        rows[0]?.updatedAt ?? "",
      ),
    [rows],
  );

  const globalMaturity = useMemo(() => computeGlobalMaturity(rows), [rows]);

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
          <p className="text-xs whitespace-nowrap text-zinc-400">
            Updated <RelativeTime dateIso={latestUpdatedAt} />
          </p>
        )}
      </div>

      {globalMaturity && <StabilityBanner maturity={globalMaturity} />}

      <div className="hidden overflow-x-auto sm:block">
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
              const { maxApr, minApr } = computeRowMeta(row);

              return (
                <tr key={row.symbol} className="transition-colors hover:bg-white/5">
                  <td className="py-2 pr-4 font-medium">
                    <span className="inline-flex items-center gap-2">
                      <CoinIcon symbol={row.symbol} size={18} />
                      {row.symbol}
                    </span>
                  </td>
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
                          <Tooltip content={cellTooltipContent(cell)}>
                            <span className="inline-flex w-full flex-col items-end gap-0.5 font-mono whitespace-nowrap">
                              <span className="inline-flex items-baseline gap-1">
                                <span className="inline-block w-[8ch] text-right text-base font-semibold tabular-nums">
                                  {cell.apr_percent.toFixed(2)}%
                                </span>
                                <span className="inline-block w-[11ch] text-right text-xs text-zinc-400 tabular-nums">
                                  ({cell.rate_percent.toFixed(4)}%)
                                </span>
                              </span>
                              {row.hasPhaseDivergence && cell.maturity?.isImmature && (
                                <MaturityBadge maturity={cell.maturity} />
                              )}
                            </span>
                          </Tooltip>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 pr-4 text-right whitespace-nowrap">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      {row.hasPhaseDivergence && (
                        <Tooltip content="Exchanges are at very different points in their funding interval — this spread compares a settled rate against one that just reset.">
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-orange-400/40 bg-orange-500/10 text-[10px] leading-none font-semibold text-orange-400">
                            ~
                          </span>
                        </Tooltip>
                      )}
                      <span className="inline-block w-[8ch] font-mono text-right font-semibold tabular-nums text-orange-400">
                        {row.spread !== null ? `${row.spread.toFixed(2)} pp` : "—"}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden">
        <MobileSortBar sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} />
        <div className="space-y-3">
          {mobileVisibleRows.map((row) => (
            <FundingRateCard key={row.symbol} row={row} />
          ))}
        </div>
        {showMobileExpandButton && (
          <button
            type="button"
            onClick={() => setMobileExpanded(true)}
            className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10"
          >
            Show all ({sortedRows.length})
          </button>
        )}
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
