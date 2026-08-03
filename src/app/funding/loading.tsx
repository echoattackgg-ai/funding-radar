import CardSkeleton from "@/components/CardSkeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-12">
      <div className="h-10 w-64 animate-pulse rounded bg-white/10" />
      <CardSkeleton className="max-w-4xl" rows={10} />
    </div>
  );
}
