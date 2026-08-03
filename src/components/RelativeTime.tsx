"use client";

import { useEffect, useState } from "react";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function formatRelative(diffMs: number): string {
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 60) return "just now";

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return rtf.format(-diffMin, "minute");

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return rtf.format(-diffHour, "hour");

  const diffDay = Math.round(diffHour / 24);
  return rtf.format(-diffDay, "day");
}

const absoluteUtcFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatAbsoluteUtc(date: Date): string {
  return `${absoluteUtcFormatter.format(date)} UTC`;
}

export default function RelativeTime({ dateIso }: { dateIso: string }) {
  const date = new Date(dateIso);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span title={formatAbsoluteUtc(date)} suppressHydrationWarning>
      {formatRelative(now - date.getTime())}
    </span>
  );
}
