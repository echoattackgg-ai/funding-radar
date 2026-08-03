// Общий "жидкое стекло" контейнер: полупрозрачный фон, блюр и блик сверху.
// См. CLAUDE.md — переиспользуем этот паттерн вместо нового для любого
// нового стеклянного блока в интерфейсе.
//
// variant="accent" — та же основа, но с более чёткой (не еле заметной)
// границей и лёгким акцентным свечением. Для блоков, которые должны
// визуально выделяться среди остальных стеклянных карточек на странице.
export default function GlassCard({
  children,
  className = "",
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "accent";
}) {
  const borderClass = variant === "accent" ? "border-orange-400/40" : "border-white/15";
  const shadowClass =
    variant === "accent"
      ? "shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_24px_rgba(251,146,60,0.12)]"
      : "shadow-[0_8px_32px_rgba(0,0,0,0.45)]";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${borderClass} bg-white/10 ${shadowClass} backdrop-blur-xl backdrop-saturate-150 ${className}`}
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
