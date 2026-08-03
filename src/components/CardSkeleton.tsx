import GlassCard from "@/components/GlassCard";

export default function CardSkeleton({
  className = "",
  rows = 6,
  rowHeight = "h-8",
}: {
  className?: string;
  rows?: number;
  rowHeight?: string;
}) {
  return (
    <GlassCard className={`w-full p-6 ${className}`}>
      <div className="mb-4 h-5 w-40 animate-pulse rounded bg-white/10" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`${rowHeight} animate-pulse rounded bg-white/5`} />
        ))}
      </div>
    </GlassCard>
  );
}
