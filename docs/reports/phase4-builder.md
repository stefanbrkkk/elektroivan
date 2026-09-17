# Phase 4 — builder: review-1.md fixes

Scope: fix every review-1.md finding that falls in builder-owned files (`docs/CONTRACT.md`):
C1, M1, M2, M3, M4, M8, M9, minors 5, 6, 7, 8, 9, 10, 11, 13, 14. Items in
motion-engineer/App.tsx-owned files (M5, M6, M7, minors 1–4, 12, 15–18) are out of
scope and untouched.

## Files changed

- `src/components/Cursor.tsx` — C1
- `src/sections/Services.tsx` — M1, M8
- `src/styles/global.css` — M1, M2, M9 (cascade-layer fix), minor 14
- `src/styles/tokens.css` — minor 11 (`--color-line-strong`)
- `src/sections/Trust.tsx` — M3, M4, minor 8, minor 11
- `src/sections/Testimonials.tsx` — M3, M4, minor 9, minor 11
- `src/sections/Footer.tsx` — M3, minor 11
- `src/sections/Nav.tsx` — M9, minors 5, 6, 7
- `src/sections/BeforeAfter.tsx` — minor 13
- `scripts/prerender.mts` — minor 10
- `README.md` — minor 10
- `e2e/interactions.spec.ts` — M8 (new `services-1440.png` test)
- `e2e/nav.spec.ts` — updated focus-trap test to account for minor 5's fix
- `docs/DECISIONS.md` — Phase 4 — builder section (append)

## Checks

### `npm run typecheck`
```
> tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit
```
Clean, no output, exit 0.

### `npm run lint`
```
> eslint . --max-warnings 0
```
Clean, no output, exit 0.

### `npm run build`
```
vite build ... ✓ built in 294ms
vite build --ssr ... ✓ built in 64ms
site.siteUrl is empty: skipping dist/sitemap.xml and the robots.txt Sitemap: line.
Prerender complete: dist/index.html, dist/robots.txt
```
0 errors / 0 warnings. Verified in `dist/`: no `sitemap.xml`, `robots.txt` has no
`Sitemap:` line, `dist/index.html` has no `<link rel="canonical">`, and
`og:image` stays `content="/og.png"` (relative).

### e2e (`PW_PORT=4174 npx playwright test e2e/smoke.spec.ts e2e/nav.spec.ts e2e/interactions.spec.ts`)
All 4 projects (m360, m390, t768, d1440):
```
101 passed (1.3m)
7 skipped   # the new services-1440 test, mobile-only tests, on non-matching projects
0 failed
```
`playwright.config.ts` already supported `PW_PORT` (no change needed there).

### `test-results/shots/services-1440.png`
Inspected visually: all six bento cards' titles/descriptions sit fully inside
their glass panels at 1440px, no clipped or overflowing text, `minmax(11rem,auto)`
rows grow the two `sm` cells that need the extra height. Also visible: the
active nav link ("Usluge") now shows the 2px volt underline (minor 7).

### Manual verification beyond the required checks

- **C1**: scripted a real page load + `page.mouse.move()` in Chromium and read
  `getComputedStyle` before/after: before any pointer event, native cursor is
  visible (no `cursor-none` on `<html>`) and the custom dot/ring are
  `opacity:0` (no dead zone); after one `mousemove`, `cursor-none` is applied
  and the dot is `opacity:1`.
- **M1**: hovered a service card with `reducedMotion: 'reduce'` — spotlight
  stayed at `opacity:0` and no `pointermove` handler was attached (`onpointermove`
  prop is `undefined` when not interactive).
- **M4**: measured both marquees' DOM geometry — first-half width / full
  track width = exactly `0.5` for Trust's strip and both Testimonials rows,
  confirming `translateX(-50%)` lands on exactly one copy (no seam gap).
- **M9**: reproduced Tailwind v4's cascade-layer order (`theme, base,
  components, utilities`) in an isolated two-file test — a `components`-layer
  rule for the same property as a `utilities`-layer rule loses regardless of
  source order/specificity unless `!important`. Confirmed the shipped
  `.safe-top`/`.safe-bottom` (now `!important` + additive `calc(var(--safe-p*,
  0px) + env(...))`) resolve correctly: header gets exactly the inset, the
  mobile panel gets its existing `1rem` base plus the inset.
- **Minor 11 contrast**: computed WCAG relative-luminance contrast for the
  review's suggested `color-mix(..., 45%, transparent)` — **2.37:1**, still
  below 3:1 — and for the shipped `60%` — **3.36:1**. See `docs/DECISIONS.md`
  for the full numbers and the formula used (cross-checked against the
  review's own `1.40:1` figure for bare `--color-line`, reproduced exactly).

## Open issues / left for other owners

- review-1.md's M5, M6, M7 and minors 1–4, 12, 15–18 are in
  `src/motion/*`, `src/sections/{Hero,Anatomy,Process,Contact}.tsx` or
  `src/sections/anatomy/*` — motion-engineer-owned, not touched here.
- Minor 11's border-contrast fix was applied only to the outlined controls in
  builder-owned files (Trust/Testimonials toggles, Footer back-to-top). Hero's
  "Pogledaj usluge" and Contact's "Kopiraj" still use the old `border-line`
  and need the same `border-line-strong` swap from whoever owns those files.
