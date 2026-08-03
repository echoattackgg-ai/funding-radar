"use client";

import { useEffect, useState } from "react";

const rtf = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });

function formatRelative(diffMs: number): string {
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 60) return "только что";

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return rtf.format(-diffMin, "minute");

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return rtf.format(-diffHour, "hour");

  const diffDay = Math.round(diffHour / 24);
  return rtf.format(-diffDay, "day");
}

function formatAbsoluteUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

export default function RelativeTime({ dateIso }: { dateIso: string }) {
  const date = new Date(dateIso);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span title={formatAbsoluteUtc(date)} suppressHydrationWarning>
      {formatRelative(Date.now() - date.getTime())}
    </span>
  );
}
