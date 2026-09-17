# DECISIONS

## Phase 0 — environment (2026-09-17)
- `node -v` → v22.22.2 (≥20 OK), npm 10.9.7, `git --version` → 2.43.0.
- `vercel` CLI not installed and no `VERCEL_TOKEN`; `vercel whoami` cannot pass → deploy will be reported as the one remaining external step (BRIEF §8). Project name suggestion: `jovan-elektro`.
- Repo is a fresh clone with zero commits on branch `claude/hopeful-meitner-x5cd1c`; remote has no branches. All work is committed on that branch.
- Session env var `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS=1` cannot be set from inside a running session; built-in Explore/Plan/general-purpose agents are simply not used. Lookups go to `scout`.
- GSAP official skills cloned from `greensock/gsap-skills` and copied into `.claude/skills/` (gsap-core, gsap-scrolltrigger, gsap-plugins, gsap-react); preloaded to `motion-engineer` via `skills:`.
- `omitClaudeMd: true` set on scout/qa-runner (ignored if unsupported by Claude Code 2.1.42).
- Playwright's preinstalled Chromium is build 1194 at `/opt/pw-browsers/chromium` (symlink). If `@playwright/test` needs a different build, use `executablePath` instead of downloading.
- Intro loader keeps its root element mounted (inert + `hidden`) after finishing so the "12 sections in order" test is deterministic.
- SEO/prerender: `vite build` client + `vite build --ssr src/entry-server.tsx`, then `scripts/prerender.mts` renders `<App/>` with `renderToString` into `dist/index.html` and injects meta/OG/JSON-LD from `site.ts`; `main.tsx` hydrates. Components never touch `window` during render.
- TypeScript pinned to 5.9.x (latest 7.x is the native port; typescript-eslint peer range is `<6.1`).

## Package versions (npm registry, 2026-09-17 — to be confirmed by scout)
| package | version |
|---|---|
| vite | 8.3.0 |
| @vitejs/plugin-react | 6.1.1 |
| react / react-dom | 19.3.0 |
| typescript | 5.9.3 |
| tailwindcss / @tailwindcss/vite | 4.3.3 |
| gsap | 3.15.0 |
| @gsap/react | 2.1.2 |
| lenis | 1.3.26 |
| @fontsource-variable/bricolage-grotesque, @fontsource/instrument-serif, @fontsource-variable/geist, @fontsource-variable/jetbrains-mono | 5.3.0 |
| @playwright/test | 1.63.0 |
| lighthouse | 13.4.1 |
| eslint | 10.10.0 |
| typescript-eslint | 8.70.0 |
| vercel (CLI, not installed) | 59.20.0 |

## Phase 1 — builder
- `gsap/all` has no type declarations for gsap 3.15 (implicit `any`, `TS7016`); `src/motion/motion.ts` imports `gsap`, `gsap/ScrollTrigger`, `gsap/SplitText`, `gsap/DrawSVGPlugin`, `gsap/MotionPathPlugin` from their individual subpaths instead — typechecks cleanly under `strict`.
- `gsap.*` ambient types (`gsap.TweenTarget`, `gsap.core.Timeline`, …) come from gsap's global namespace declaration merged in from `gsap-core.d.ts`; `src/motion/types.ts` uses them with no import (an `import type { gsap } from './motion'` shadows the global and is reported unused by `noUnusedLocals`).
- `@eslint/js` added as an explicit devDependency (10.0.1) — required directly by the flat `eslint.config.js` but not shipped as a transitive dependency of `eslint` itself.
- `@types/node`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals` were not pinned in the table above; resolved to each package's latest version compatible with eslint 10 / React 19 (22.20.3, 7.1.1, 0.5.7, 17.12.0 respectively).
- Trust's and Testimonials' marquee pause/play toggle buttons both reuse `site.testimonials.pause`/`.play` ("Pauziraj/Pokreni traku") — the `SiteConfig` schema (frozen by CONTRACT) has no separate label for Trust's marquee, and the wording is generic enough ("traku" = the strip) to fit both.
- The one-time `img, svg { display: block }` reset originally added to `global.css` was removed entirely rather than kept behind `@layer base`: on this Tailwind v4.3.3 + `@tailwindcss/vite` pipeline a custom rule duplicating a selector Tailwind's own preflight already owns is not reliably reordered relative to generated utilities (verified empirically — it silently defeated `hidden`/`lg:block`/`lg:hidden` on `<svg>`), even wrapped in `@layer`. Tailwind's preflight already sets `display:block` on `img`/`svg`/etc. correctly, so the duplicate was both redundant and buggy. The rest of the resets/utility-like classes stay grouped in `@layer base`/`@layer components` (confirmed safe: `.glass`'s `border-radius` correctly loses to a `rounded-full` utility on the same element).
- `.focus-ring` is scoped to `:focus-visible` (`.focus-ring:focus-visible { outline: … }`), not a permanently-applied outline — the earlier unscoped version showed a permanent ring around every link/button.
- Anatomy's five step-navigation dots keep a small 10×10px visual dot but size the actual `<button>` hit area to 44×44px (`h-11 w-11`, inner `<span>` for the dot), per BRIEF §7's ≥44px touch-target rule (also flagged by Lighthouse's `target-size` audit).
- `og-build.mts` and `og.html` render via `page.goto('file://<temp-file>')` rather than `page.setContent()` — Chromium blocks `file://` subresources (fonts, the favicon image) from a document that isn't itself `file://`-origin, which would otherwise silently fall back to system fonts / a broken icon.
- Lighthouse 13.4.1 ships a 5th "Agentic Browsing" category by default; `scripts/lighthouse.mts` explicitly filters to the four BRIEF §7 categories (performance, accessibility, best-practices, seo) rather than printing whatever the installed version happens to report.
- The display-font woff2 preloaded in `index.html` is committed as a static file at `public/fonts/bricolage-grotesque-latin-wght-normal.woff2` (copied once from the installed Fontsource package) — simplest way to get a stable `/fonts/...` URL for the `<link rel="preload">` without a custom Vite plugin.

## Scout findings (phase 0)

All versions confirmed current (2026-09-17). Key findings:

| Package | Status | Note |
|---|---|---|
| vite 8.3.0 | ✓ | ESM-first; HMR on file changes |
| @vitejs/plugin-react 6.1.1 | ✓ | Auto JSX refresh; React 19 ready |
| tailwindcss 4.3.3 + @tailwindcss/vite | ✓ | CSS-first with `@import "tailwindcss"; @theme {}` in CSS |
| gsap 3.15.0 | ✓ | ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin in public package; import as `gsap/ScrollTrigger` |
| @gsap/react 2.1.2 | ✓ | useGSAP hook; peer: gsap ≥3.12.5, react ≥17 |
| lenis 1.3.26 | ✓ | GSAP: `autoRaf:false`, `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add(t=>lenis.raf(t*1000))` |
| Fontsource 5.3.0 | ✓ | bricolage-grotesque: `wght.css`; instrument-serif: `latin-ext-400-italic.css`+`latin-400-italic.css`; geist/jetbrains-mono: `wght.css` |
| @playwright/test 1.63.0 | ⚠ | Version OK, but expects Chromium revision 1243; preinstalled is 1194 — use `executablePath` override |
| lighthouse 13.4.1 | ✓ | Mobile: `--form-factor=mobile`; CHROME_PATH env var for binary path |
| Node 22.22.2 | ✓ | Supports .mts natively since 22.18; no tsx needed |

## Phase 1 → 2 — supervisor
- Custom agent types from `.claude/agents/*.md` are not hot-loaded into a running session; the same roles are run through `general-purpose` with an explicit `model` override (haiku/sonnet/opus) and the role file read first. The agent files stay in the repo for future sessions.
- Phase 2 ordering: copywriter (site.ts values only) runs concurrently with motion-engineer (disjoint files; the schema is frozen, only values change). Builder phase 2 starts when the copywriter finishes, so at most two agents run at once.
- Remote repository had no branches before the first push; the work branch is the only branch, so a pull request needs a base branch (e.g. `main`) that only the repository owner should create.

## Phase 2 — builder
- **Real Chromium bug found and worked around**: applying a 3D `transform: perspective(...) rotateX()/rotateY()` (for Services' cursor-tilt, BRIEF §6.6) to a `flex h-full flex-col justify-between` box that is itself a narrow CSS Grid item makes the pinned Chromium build (`/opt/pw-browsers/chromium`, revision 1194) report a corrupted `getBoundingClientRect()`/computed height (0px or exactly half) for descendant `<svg>` icons — verified independent of GSAP (reproduced with `prefers-reduced-motion: reduce`, which skips all GSAP code, and with an isolated non-React repro page). Fix: the `<article class="service-card">` keeps the original `flex flex-col justify-between` layout (and owns no transform of its own), and the pointer-tilt transform is scoped to a small `inline-block` wrapper around only the 28×28 icon — never around a flex/percentage-height box. Verified the six icons render at their correct size in every bento cell (`sm`, `md`, `lg`) after the fix, tilt/spotlight still animate on hover.
- Nav's mobile-panel breakpoint changed from the phase-1 baseline's `768px` to **1024px**, matching BRIEF §6.2's "Mobile (<1024px)" wording literally (`useMediaQuery('(min-width: 1024px)')`, `lg:` Tailwind prefixes) — phase-1's placeholder used `md:` (768px). This also makes `t768` a mobile-menu viewport per the phase-2 delegation's e2e list.
- Trust's and Testimonials' marquee pause state was previously a single boolean shared between hover and the explicit toggle button; hovering off would silently un-pause a row the visitor had explicitly paused (and, worse, Testimonials wrapped the *entire* `<section>`, including the toggle button itself, in the hover/focus handlers — focusing the toggle after a click kept the row paused forever regardless of the toggle's own state, caught by `interactions.spec.ts`). Fixed by tracking `hovered` and `manualPause` separately (`paused = hovered || manualPause`) and scoping Testimonials' hover/focus handlers to the row-track container only, not the toggle button.
- BeforeAfter's `ba-slider` arrow-key step changed from the phase-1 placeholder's `±5` to **`±2`** per the phase-2 delegation, and its hit area widened from `w-0` (a literal zero-width slider, centered exactly on the 1px divider line) to `w-11` (44px, meeting the §7 touch-target rule) — the whole track already handled drag-from-anywhere, but the focusable `role="slider"` element itself had no real target size.
- FAQ's height-open/close transition uses a `grid-template-rows: 0fr → 1fr` trick on the panel itself (not a hard `hidden` toggle) so it can animate; the global `@media (prefers-reduced-motion: reduce)` rule (phase 1, `transition-duration: 0.001ms !important`) already makes this instant with no extra JS branch. `aria-hidden` on the panel is kept in sync with `aria-expanded` for screen readers independent of the animation.
- `Cursor.tsx` is rendered as a sibling of `<App/>` (`<><App/><Cursor/></>`) in both `main.tsx` and `entry-server.tsx`, never inside `<App/>`, which is frozen/motion-engineer-owned — this keeps the hydrated tree shape identical to the server-rendered one (Cursor renders `null` on the server and on the first client render, matching the project's existing SSR-safe hook pattern) without touching `App.tsx`.
- `playwright.config.ts` now reads `PW_PORT` (webServer port, default 4173 unchanged) and `PLAYWRIGHT_BASE_URL` (skip launching a webServer entirely) so this agent's own `test:e2e` runs never collide with another agent's preview server on the same machine.
