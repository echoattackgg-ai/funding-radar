export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 text-xs text-zinc-500">
        <p>Exchange links are affiliate links. We may earn a commission.</p>
        <p className="mt-1">© {year} Funding Radar</p>
      </div>
    </footer>
  );
}
