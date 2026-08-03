// Знак: радар-развёртка — три дуги растущего радиуса плюс луч и точка цели.
// Один цвет (акцентный оранжевый), читается на любом размере вплоть до фавикона.
export function LogoMark({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6.2" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5" />
      <line x1="12" y1="12" x2="19" y2="6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="17" cy="8.2" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" />
    </svg>
  );
}

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-orange-400">
        <LogoMark />
      </span>
      <span className="text-base font-semibold tracking-tight">
        <span className="text-foreground">Funding</span>{" "}
        <span className="text-orange-400">Radar</span>
      </span>
    </span>
  );
}
