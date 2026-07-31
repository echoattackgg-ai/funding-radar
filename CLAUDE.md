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

- Next.js App Router, single route (`/`) at `src/app/page.tsx`. TypeScript + Tailwind CSS v4 via `@tailwindcss/postcss` — there is no `tailwind.config.*`; the theme is declared inline in `src/app/globals.css` with `@theme inline`.
- Path alias `@/*` → `src/*` (see `tsconfig.json`).
- Dark theme is forced, not OS-driven: the `dark` class is hardcoded on `<html>` in `src/app/layout.tsx`, and `globals.css` defines a single dark `:root` palette. There is no light-mode variant.
- `src/app/layout.tsx` renders `CryptoSideBackground` behind `{children}` on every page — it's purely decorative (`aria-hidden`, `pointer-events-none`).
- `src/components/CryptoSideBackground.tsx` — one full-viewport fixed gradient layer (`-z-20`, mixed black/white/gray radial gradients) plus two `lg:`-only side strips (`-z-10`) holding floating "glass" coin bubbles. The full-width gradient and the side strips must stay visually seamless (same gradient recipe) — don't reintroduce a per-strip background. Bubble float animation is the `.crypto-bubble` / `bubble-float` keyframe in `globals.css`.
- `src/components/LiquidationCalculator.tsx` — the only client component (`"use client"`) and the only interactive piece. Computes crypto-futures liquidation price with the simplified isolated-margin formula (no fees, no maintenance-margin rate):
  - long: `entry * (1 - 1/leverage)`
  - short: `entry * (1 + 1/leverage)`
  - percent move against position: `100 / leverage` (same for both directions)
  - Position size (USD) is collected as an input but does not affect this formula — it cancels out algebraically.
- "Liquid glass" visual pattern (used for the formula box and the coin bubbles): `backdrop-blur`, translucent `bg-white/10`, `border-white/15`, plus a `pointer-events-none` absolutely-positioned gradient overlay div for the highlight/shine. Reuse this pattern for new glass-style UI instead of inventing a new one.

## Deployment

- GitHub repo: `echoattackgg-ai/funding-radar` (remote `origin`), deployed to Vercel at `funding-radar-nine.vercel.app`.
- Vercel is connected to the GitHub repo and auto-deploys on every push to `main` — no manual Vercel step needed after `git push`.
