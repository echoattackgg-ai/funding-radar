"use client";

import { useId, useState } from "react";

// Свой тултип вместо браузерного title: непрозрачная тёмная панель (не стекло —
// под текстом читаемость важнее), работает и по наведению, и по фокусу с клавиатуры.
export default function Tooltip({
  content,
  children,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        aria-describedby={id}
        className="outline-none"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md border border-white/15 bg-zinc-900 px-2.5 py-1.5 text-xs whitespace-nowrap text-zinc-200 shadow-lg"
        >
          {content}
        </span>
      )}
    </span>
  );
}
