# Električar Jovan — one-page demo site (Vite + React + TS + Tailwind v4 + GSAP + Lenis)

Stack: React 19, Vite 8, TypeScript strict, Tailwind CSS v4 (`@tailwindcss/vite`), gsap (ScrollTrigger, SplitText, DrawSVG, MotionPath) + `@gsap/react`, lenis, Fontsource fonts, Playwright, Lighthouse. Vercel static host. npm only.

## npm scripts
`dev` · `build` (vite build + prerender) · `preview` (port 4173) · `typecheck` · `lint` · `test:e2e` · `lh` · `og:build`

## Folder map
- `src/config/site.ts` — ALL business data + visible copy (typed). Nothing hardcoded elsewhere.
- `src/sections/` — one file per page section (ids/testids fixed in `docs/CONTRACT.md`).
- `src/motion/` — shared motion tools: `Sparks`, `Flicker`, `CurrentPath`, `MainLine`, `motion.ts` (gsap setup).
- `src/components/` — Nav, Cursor, SmoothScroll, small UI. `src/hooks/` — `usePrefersReducedMotion`, `useFinePointer`.
- `src/styles/` — `tokens.css` (@theme), `global.css`. `scripts/` — prerender, og build. `e2e/` — Playwright. `docs/` — BRIEF, CONTRACT, DECISIONS, reports.

## Rules
- UI text = Serbian, Latin script, ekavica, no anglicisms. Code, comments, identifiers = English.
- Business data and copy live only in `src/config/site.ts`. Demo stats/testimonials marked `// DEMO`.
- Never touch files you do not own (see ownership table in `docs/CONTRACT.md`). Ids and `data-testid` are frozen.
- Animate only `transform`, `opacity`, `stroke-dashoffset`. Respect `prefers-reduced-motion` fully. Photosensitivity: ≤3 brightness changes per flicker, ≤600ms, never >3 changes/s.
- No render-time `window` access (pages are prerendered); use effects / `useSyncExternalStore`.
- Subagent reports ≤150 words: changed files, done, checks run + result, open issues. Full logs go to `docs/reports/`.

# Compact instructions
Preserve: current phase and status, gate results (G1–G6) with evidence paths, open issues per owner, file ownership table, decisions made this session.
