# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start the dev server (Turbopack) at http://localhost:3000
- `npm run build` — production build; also typechecks (`tsc`) as part of the build, so it's the fastest way to catch type errors
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config: `eslint-config-next` core-web-vitals + typescript)

No test framework is configured in this project.

## Architecture

- Next.js App Router, two routes: `/` (`src/app/page.tsx`) and `/funding` (`src/app/funding/page.tsx`). TypeScript + Tailwind CSS v4 via `@tailwindcss/postcss` — there is no `tailwind.config.*`; the theme is declared inline in `src/app/globals.css` with `@theme inline`.
- Path alias `@/*` → `src/*` (see `tsconfig.json`).
- Dark theme is forced, not OS-driven: the `dark` class is hardcoded on `<html>` in `src/app/layout.tsx`, and `globals.css` defines a single dark `:root` palette (`--background: #111113`, `--foreground: #f4f4f5`). There is no light-mode variant.
- Design direction is "Dune Data Grid": near-black background, thin 1px grid texture, orange (`orange-400`/`orange-500`) as the one brand/emphasis accent, sky blue reserved strictly for links ("blue means clickable"), green/red reserved strictly for data (max/min rate highlighting). Don't reuse orange for links or blue for non-link emphasis — that conflation was a deliberate fix, not an accident.
- Fonts: IBM Plex Sans (`--font-plex-sans`, Tailwind `font-sans`) for UI/headings, IBM Plex Mono (`--font-plex-mono`, Tailwind `font-mono`) for all numeric output. Any new numeric display should get `font-mono tabular-nums` explicitly — `tabular-nums` alone is not enough per the data-formatting rules below.
- Text contrast: don't use opacity modifiers (`/80`, `/70`…) on readable text — they were the cause of a past AA-contrast failure (`zinc-500/80` measured ~3:1). Secondary/muted text should be `zinc-400` at full opacity (~5.7:1 on the glass surfaces used throughout), not `zinc-500` or dimmer.
- `src/app/layout.tsx` renders `GridBackground` behind `{children}` on every page — it's purely decorative (`aria-hidden`, `pointer-events-none`).
- `src/components/GridBackground.tsx` — flat background color + a faint 1px grid (`.site-grid` in `globals.css`) + a soft top vignette, all fixed full-viewport layers at `-z-20`. No gradients, no animation, nothing that moves — kept deliberately the least decorative of the design directions considered.
- `src/components/LiquidationCalculator.tsx` — the only client component (`"use client"`) and the only interactive piece besides `FundingRatesTable`. Computes crypto-futures liquidation price with the simplified isolated-margin formula (no fees, no maintenance-margin rate):
  - long: `entry * (1 - 1/leverage)`
  - short: `entry * (1 + 1/leverage)`
  - percent move against position: `100 / leverage` (same for both directions)
  - Position size (USD) is collected as an input but does not affect this formula — it cancels out algebraically.
- "Liquid glass" visual pattern (`GlassCard`): `backdrop-blur`, translucent `bg-white/10`, `border-white/15`, plus a `pointer-events-none` absolutely-positioned gradient overlay div for the highlight/shine. `GlassCard` also has a `variant="accent"` (stronger orange-tinted border + glow, used by the liquidation calculator's outer card) — reuse this pattern for new glass-style UI instead of inventing a new one. Glass/blur is for containers only, never applied under numbers or other text that needs to stay crisply legible.
- `src/components/CoinIcon.tsx` — fixed-size icon next to a ticker, backed by local files in `public/coins/*.svg` (sourced once from the CC0 `cryptocurrency-icons` package, not fetched from any CDN at runtime). Falls back to a same-size circle with the ticker's first letter for any symbol without a local file, or if the `<img>` errors — the box size never changes, so layout never shifts. When new tickers get tracked, add an icon file and its lowercase key to `AVAILABLE_ICONS` in that component, or let it fall back intentionally.
- `src/components/Tooltip.tsx` — custom hover/focus tooltip (not the native `title` attribute), opaque `zinc-900` panel (not glass — legibility over consistency for tooltip text).

## Data formatting

- Store funding-rate data (`rate_percent`, `apr_percent`, `interval_hours`) at full precision everywhere it's persisted (Supabase `funding_rates` table, scripts' internal calculations) — never round before storing.
- Round only at display time, consistently across every surface that shows this data (website, social posts, Telegram/Discord bot, etc.):
  - funding rate (%): **4 decimal places**
  - APR (%): **2 decimal places**
- In code, apply this with `.toFixed(4)` for rate and `.toFixed(2)` for APR at the point of output (see `scripts/funding-rate.mjs` and `supabase/functions/collect-funding-rates/index.ts` for the calculation reference — those compute at full precision; formatting happens only when printing/rendering).

## Supabase

- API keys are the new format: `sb_publishable_...` for the browser (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) and `sb_secret_...` for server-side use (`SUPABASE_SERVICE_ROLE_KEY` locally, `SERVICE_KEY` as the edge function's own secret — the function can't read `SUPABASE_`-prefixed secrets since that prefix is reserved by the platform). Legacy JWT-format keys are disabled for this project.
- If RLS is enabled on a table with no read policy, Supabase returns an empty list with `200 OK` — no error. If a page shows no data but the table isn't actually empty, don't start debugging the fetch code — first compare the same query run with the anon key vs. the service-role key; a mismatch (anon empty, service-role has rows) means it's a missing RLS policy, not a bug in the app.

## Deployment

- GitHub repo: `echoattackgg-ai/funding-radar` (remote `origin`), deployed to Vercel at `funding-radar-nine.vercel.app`.
- Vercel is connected to the GitHub repo and auto-deploys on every push to `main` — no manual Vercel step needed after `git push`.

## Как со мной работать

- Я не программист, объясняй простым языком.
- Одна задача за раз.
- После изменений говори, что мне проверить.
- Перед сложным — сначала план, потом код.
- Отвечай на русском.
- Язык интерфейса продукта (UI-тексты, заголовки, подписи, сообщения об ошибках) — английский. Разговор со мной в чате — русский.

## Заметки

- **2026-08-01, 13:00–14:00 (UTC+3)** — OKX ушёл в отрицательный фандинг (APR: 0.81% → -1.26%), в то же время Bybit вырос до 5.03% APR. Спред между биржами — 6.3 п.п. Первое зафиксированное расхождение.
