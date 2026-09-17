# Phase 1 — builder report

Date: 2026-09-17. Scope: project foundation, gate G1 (typecheck, lint, build → 0 errors, 0 warnings), plus a best-effort look at G2 (own e2e smoke test) and G4 (Lighthouse), which are not formally graded in phase 1 but were run for confidence.

## Environment

```
$ node -v && npm -v
v22.22.2
10.9.7
```

npm registry reachable (`npm ping` succeeded). Playwright's preinstalled Chromium confirmed at `/opt/pw-browsers/chromium` (symlink to `chromium-1194`); `@playwright/test@1.63.0` expects a newer build (1243 per scout), so `executablePath` is set explicitly in `playwright.config.ts` and `scripts/og-build.mts`, matching scout's note.

## Installed versions (resolved by npm from DECISIONS.md pins + a few unpinned dev tools)

react/react-dom 19.3.0, vite 8.3.0, @vitejs/plugin-react 6.1.1, typescript 5.9.3, tailwindcss/@tailwindcss/vite 4.3.3, gsap 3.15.0, @gsap/react 2.1.2, lenis 1.3.26, Fontsource packages 5.3.0, @playwright/test 1.63.0, lighthouse 13.4.1, eslint 10.10.0, typescript-eslint 8.70.0. Unpinned by DECISIONS.md, resolved to latest compatible: @types/node 22.20.3, eslint-plugin-react-hooks 7.1.1, eslint-plugin-react-refresh 0.5.7, globals 17.12.0, @eslint/js 10.0.1 (added — required directly by the flat config but not a transitive dependency of `eslint`).

## `npm run typecheck`

```
> tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit
```
No output — 0 errors.

## `npm run lint`

```
> eslint . --max-warnings 0
```
No output — 0 errors, 0 warnings.

## `npm run build`

```
> vite build && vite build --ssr src/entry-server.tsx --outDir dist/server && node scripts/prerender.mts

vite v8.3.0 building client environment for production...
✓ 51 modules transformed.
dist/index.html                                                          1.93 kB
... (font files, one CSS chunk 30.49 kB, gsap chunk 152.96 kB, main chunk 264.29 kB)
✓ built in ~260ms
vite v8.3.0 building ssr environment for production...
✓ 26 modules transformed.
dist/server/entry-server.js  54.15 kB
✓ built in ~30ms
Prerender complete: dist/index.html, dist/robots.txt, dist/sitemap.xml
```
No warnings from Vite (chunk size well under the default 500 kB limit; `gsap` is still split into its own manual chunk for caching). `dist/server` is deleted by `scripts/prerender.mts` after use, confirmed absent post-build.

Verified in `dist/index.html`: hero `<h1 aria-label="Iskače? Treperi? Varniči?">`, `<title>Električar Jovan | Beograd</title>`, meta description, canonical omitted (siteUrl empty, as expected), `og:*`/`twitter:*` tags with `og:image=/og.png` + width/height 1200×630, `og:locale=sr_Latn`, JSON-LD `@type: "Electrician"` (no `url`/`telephone` — both empty in config, correctly omitted; no address; no aggregateRating). `dist/robots.txt` = `User-agent: *\nAllow: /` (no Sitemap line, siteUrl empty). `dist/sitemap.xml` has `<loc>/</loc>`.

## `npm run og:build`

```
Generated public/og.png (1200x630) and public/apple-touch-icon.png (180x180)
```
Verified both files are real PNGs at the exact pixel dimensions (checked PNG header), and — importantly — that the branded fonts actually load: `page.setContent()` cannot fetch `file://` subresources from Chromium's opaque-origin document, so the script writes the interpolated HTML to a temp file and navigates to it with `page.goto('file://…')`, then waits on `document.fonts.ready`. Confirmed via a throwaway script that both `Bricolage Grotesque Variable` and `JetBrains Mono Variable` report `status: 'loaded'` and the title element's computed `font-family` matches. Visually reviewed both images.

## `npm run test:e2e`

`e2e/smoke.spec.ts` (5 checks) × 4 projects (m360, m390, t768, d1440) = 20 tests, all passing against `npm run build && npm run preview`:

```
Running 20 tests using 2 workers
...
  20 passed (9.5s)
```

Checks: zero console errors/warnings + zero `scrollWidth > innerWidth`; all 12 `section-*` testids present in the exact CONTRACT order; exactly one `<h1>` with `aria-label`/text `"Iskače? Treperi? Varniči?"`; `<html lang="sr-Latn">`; skip link → `#sadrzaj`; `contact-email` href = `mailto:stefanbrkk@gmail.com?subject=Upit%20sa%20sajta`; no `contact-phone`, no `a[href^="tel:"]`.

## `npm run lh` (best-effort, not a phase-1 gate)

Against the production `vite preview` build, after fixing a touch-target issue found along the way (see below):

```
Lighthouse scores (mobile) for http://localhost:4173:
  Performance: 97
  Accessibility: 100
  Best Practices: 100
  SEO: 100
```
All four exceed the BRIEF §7 thresholds (≥85 / ≥95 / ≥95 / 100). Reports at `.lighthouse/report.report.json` and `.report.html`.

## Bugs found and fixed during self-review (not just ticking boxes)

1. **`.focus-ring` utility was permanently visible, not focus-only.** It was defined as a plain class (`outline: 2px solid var(--color-arc)`) instead of scoped to `:focus-visible`, so every link/button in the nav and hero showed a permanent blue outline box. Fixed to `.focus-ring:focus-visible { … }`. Found via a full-page screenshot review, not by reading code alone.
2. **Custom `svg, img { display: block }` reset in `global.css` silently defeated Tailwind's `hidden`/`lg:block`/`lg:hidden` utilities** on `<svg>` elements (`MainLine`'s cable, `Process`'s connector line): on this Tailwind v4.3.3 + `@tailwindcss/vite` build pipeline, a custom rule duplicating a selector Tailwind's own preflight already owns does not reliably get reordered relative to generated utilities, even when wrapped in `@layer base`/`@layer components` — verified empirically (computed `display` checked at 360px and 1440px before/after). Fix: deleted the duplicate rule entirely (Tailwind's preflight already sets `display:block` on `img`/`svg`/etc., correctly layered by Tailwind's own tooling) and kept the rest of the resets wrapped in `@layer base`/`@layer components` (confirmed safe against `.glass` vs `rounded-full` composing correctly). Documented as a decision below so motion-engineer/reviewer don't reintroduce it.
3. **Anatomy step-navigation dots were 10×10px** (`h-2.5 w-2.5` directly on the `<button>`), failing the ≥44px touch-target rule from BRIEF §7 and Lighthouse's `target-size` audit. Fixed by keeping the small visual dot as an inner `<span>` and sizing the actual `<button>` hit area to 44×44px (`h-11 w-11`, flex-centered).

## Open issues / notes for the next phase

- Sections owned long-term by `motion-engineer` (`IntroReveal`, `Hero`, `Anatomy`, `Process`, `Contact`) and all of `src/motion/*` are intentionally minimal, spec-compliant static/reduced-motion baselines per the phase-1 brief — no animation wiring yet.
- `gsap/all` has no usable type declarations in gsap 3.15 (implicit `any`, `TS7016`); `src/motion/motion.ts` imports each plugin from its own subpath instead, which typechecks cleanly under `strict`.
- No `vercel` CLI/token available in this environment — deploy remains the one external step (per BRIEF §8), unchanged from the phase-0 finding.
- `siteUrl` is intentionally empty per BRIEF §3; canonical/OG URLs and `sitemap.xml`/`robots.txt` Sitemap line are correctly omitted until a real domain is set after first deploy.
