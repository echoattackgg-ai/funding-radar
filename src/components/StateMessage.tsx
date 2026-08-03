import GlassCard from "@/components/GlassCard";

type Variant = "empty" | "error";

const DESCRIPTION_COLOR: Record<Variant, string> = {
  empty: "text-zinc-400",
  error: "text-red-400",
};

export default function StateMessage({
  title,
  description,
  variant = "empty",
  className = "",
}: {
  title?: string;
  description: string;
  variant?: Variant;
  className?: string;
}) {
  return (
    <GlassCard className={`p-6 ${className}`}>
      {title && <h2 className="mb-2 text-lg font-medium">{title}</h2>}
      <p className={`text-sm ${DESCRIPTION_COLOR[variant]}`}>{description}</p>
    </GlassCard>
  );
}
