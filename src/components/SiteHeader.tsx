import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight text-foreground">
            Funding Radar
          </span>
          <span className="hidden text-sm text-zinc-400 sm:inline">
            Live funding rates across exchanges
          </span>
        </Link>

        <nav>
          <Link
            href="/funding"
            className="text-sm text-zinc-300 underline decoration-dotted hover:text-foreground"
          >
            All rates
          </Link>
        </nav>
      </div>
    </header>
  );
}
