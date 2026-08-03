// Общий "жидкое стекло" контейнер: полупрозрачный фон, блюр и блик сверху.
// См. CLAUDE.md — переиспользуем этот паттерн вместо нового для любого
// нового стеклянного блока в интерфейсе.
export default function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl backdrop-saturate-150 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-2xl border border-white/10"
      />
      <div className="relative">{children}</div>
    </div>
  );
}
