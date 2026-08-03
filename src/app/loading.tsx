import CardSkeleton from "@/components/CardSkeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-12">
      <div className="h-10 w-56 animate-pulse rounded bg-white/10" />
      <CardSkeleton className="max-w-2xl" rows={5} />
      <CardSkeleton className="max-w-md" rows={4} rowHeight="h-10" />
    </div>
  );
}
