# Phase 2 — motion-engineer (full logs)

Owner: `motion-engineer`. Files changed: `src/motion/*` (motion.ts, motion.css, types.ts, flicker.ts,
Sparks.tsx, CurrentPath.tsx, MainLine.tsx, intro.ts), `src/sections/{IntroReveal,Hero,Anatomy,Process,Contact}.tsx`,
`src/sections/anatomy/{layout.ts,CircuitSvg.tsx}`, `e2e/motion.spec.ts`. Nothing else was touched.

## What is implemented

| Deliverable | Where | Notes |
|---|---|---|
| gsap registration, `EASE`, `ScrollTrigger.config({ignoreMobileResize:true})`, batched `requestRefresh()`, fonts+ResizeObserver watchers | `src/motion/motion.ts` | `installMotionWatchers()` is ref-counted and owned by `MainLine` |
| `Sparks` (8–14 arc particles, 0.3–0.6s, halved on coarse/<768, IntersectionObserver-gated, static glyph under reduced motion) | `src/motion/Sparks.tsx` | `as="svg" \| "g"`, handle `burst/start/stop` |
| `flickerOn` (≤3 changes ≤0.6s) and `flickerFault` (1 dip per ≥0.8s) | `src/motion/flicker.ts` | |
| `CurrentPath` (sheath + copper hint + DrawSVG core + ≥1024px blur glow + MotionPath pulse) | `src/motion/CurrentPath.tsx` | handle `setProgress/timeline/startPulse/stopPulse/pulseOnce` |
| `MainLine` (≥1024px routed document-height cable with clamp rings ending on `[data-mainline-end]`; <1024px 2px progress bar) | `src/motion/MainLine.tsx` | geometry rebuilt on every `refreshInit` |
| Intro reveal (filament flicker + light spread, ≤1.1s, interruptible, once per session) | `src/sections/IntroReveal.tsx` | `src/motion/intro.ts` replays "done" for late subscribers |
| Hero (neon word flicker, sparks on "Varniči?", tagline/CTA rise, drifting fields, plug cable pulse, pointer parallax, scroll hint) | `src/sections/Hero.tsx` | |
| Anatomy (pinned, 5 steps × 3 beats + final, per-component micro-animations, counter, dots, reversible) | `src/sections/Anatomy.tsx`, `src/sections/anatomy/*` | 500vh desktop / 280vh phones |
| Process (pinned horizontal ≥768px, vertical story below, cable energizes with progress) | `src/sections/Process.tsx` | |
| Finale (switch, bulb, light cone, card clip-path reveal + sweep, copy + toast + sparks) | `src/sections/Contact.tsx` | one timeline, play/reverse, 2.5s safety net |
| G3 spec | `e2e/motion.spec.ts` | 9 tests × 4 viewports |

## Verification

### `npm run typecheck`
```
== npm run typecheck ==

> jovan-elektro@0.1.0 typecheck
> tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit

exit=0
```
### `npm run lint`
```
== npm run lint ==

> jovan-elektro@0.1.0 lint
> eslint . --max-warnings 0

exit=0
```
### `npm run build`
```
== npm run build ==

> jovan-elektro@0.1.0 build
> vite build && vite build --ssr src/entry-server.tsx --outDir dist/server && node scripts/prerender.mts

vite v8.3.0 building client environment for production...
transforming...
✓ 58 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                          1.93 kB │ gzip:  0.83 kB
dist/assets/geist-cyrillic-ext-wght-normal-DjL33-gN.woff2                7.42 kB
dist/assets/jetbrains-mono-vietnamese-wght-normal-Bt-aOZkq.woff2         7.50 kB
dist/assets/geist-vietnamese-wght-normal-6IgcOCM7.woff2                  8.00 kB
dist/assets/bricolage-grotesque-vietnamese-wght-normal-BUzh504Q.woff2    8.60 kB
dist/assets/jetbrains-mono-greek-wght-normal-Bw9x6K1M.woff2              9.00 kB
dist/assets/instrument-serif-latin-ext-400-italic-D7-lnxEk.woff         10.50 kB
dist/assets/jetbrains-mono-cyrillic-wght-normal-D73BlboJ.woff2          12.10 kB
dist/assets/instrument-serif-latin-ext-400-italic-C9HzH3YL.woff2        12.38 kB
dist/assets/geist-cyrillic-wght-normal-BEAKL7Jp.woff2                   15.08 kB
dist/assets/jetbrains-mono-latin-ext-wght-normal-DBQx-q_a.woff2         15.19 kB
dist/assets/geist-latin-ext-wght-normal-DC-KSUi6.woff2                  16.51 kB
dist/assets/bricolage-grotesque-latin-ext-wght-normal-CcLUaPy7.woff2    18.66 kB
dist/assets/instrument-serif-latin-400-italic-u__WvvIK.woff             19.26 kB
dist/assets/instrument-serif-latin-400-italic-DKMiL14s.woff2            22.12 kB
dist/assets/geist-latin-wght-normal-BgDaEnEv.woff2                      29.40 kB
dist/assets/jetbrains-mono-latin-wght-normal-B9CIFXIH.woff2             40.40 kB
dist/assets/bricolage-grotesque-latin-wght-normal-DLoelf7F.woff2        41.34 kB
dist/assets/index-ColOzdEy.css                                          42.65 kB │ gzip: 11.12 kB
dist/assets/rolldown-runtime-D9-fqq9M.js                                 0.08 kB │ gzip:  0.08 kB
dist/assets/gsap-4hdXqrla.js                                           152.96 kB │ gzip: 60.83 kB
dist/assets/index-DewALHv8.js                                          310.85 kB │ gzip: 94.71 kB

✓ built in 291ms
vite v8.3.0 building ssr environment for production...
transforming...
✓ 33 modules transformed.
rendering chunks...
computing gzip size...
dist/server/entry-server.js  140.10 kB │ gzip: 36.78 kB

✓ built in 67ms
Prerender complete: dist/index.html, dist/robots.txt, dist/sitemap.xml
exit=0
```
### `npx playwright test e2e/motion.spec.ts --project=d1440 --project=m390`
```

Running 18 tests using 2 workers

  ✓   1 [m390] › e2e/motion.spec.ts:134:3 › G3 motion — the scroll story plays › step 3 shows the arc and sparks on the fault beat, tape on the fix beat (3.0s)
  ✓   2 [m390] › e2e/motion.spec.ts:95:3 › G3 motion — the scroll story plays › anatomy scrubs through five steps and every frame differs (4.2s)
  ✓   3 [m390] › e2e/motion.spec.ts:177:3 › G3 motion — the scroll story plays › progress dots jump to their step (2.7s)
  -   5 [m390] › e2e/motion.spec.ts:223:3 › G3 motion — the scroll story plays › main line energizes with scroll progress
  ✓   4 [m390] › e2e/motion.spec.ts:187:3 › G3 motion — the scroll story plays › the pinned anatomy fits one screen with nothing overlapping (1.9s)
  ✓   7 [m390] › e2e/motion.spec.ts:285:3 › G3 motion — the scroll story plays › hero words end up fully lit (3.6s)
  ✓   8 [m390] › e2e/motion.spec.ts:304:3 › G3 motion — the scroll story plays › intro reveal runs once per session and then stays hidden (1.7s)
  ✓   9 [m390] › e2e/motion.spec.ts:320:3 › G3 motion — reduced motion is a complete static experience › no pins, no loader, everything already in its final state (2.8s)
  ✓   6 [m390] › e2e/motion.spec.ts:249:3 › G3 motion — the scroll story plays › finale lights up on enter and replays after leaving completely (9.0s)
  ✓  11 [d1440] › e2e/motion.spec.ts:134:3 › G3 motion — the scroll story plays › step 3 shows the arc and sparks on the fault beat, tape on the fix beat (4.1s)
  ✓  10 [d1440] › e2e/motion.spec.ts:95:3 › G3 motion — the scroll story plays › anatomy scrubs through five steps and every frame differs (5.8s)
  -  13 [d1440] › e2e/motion.spec.ts:187:3 › G3 motion — the scroll story plays › the pinned anatomy fits one screen with nothing overlapping
  ✓  12 [d1440] › e2e/motion.spec.ts:177:3 › G3 motion — the scroll story plays › progress dots jump to their step (4.2s)
  ✓  14 [d1440] › e2e/motion.spec.ts:223:3 › G3 motion — the scroll story plays › main line energizes with scroll progress (3.6s)
  ✓  16 [d1440] › e2e/motion.spec.ts:285:3 › G3 motion — the scroll story plays › hero words end up fully lit (3.8s)
  ✓  17 [d1440] › e2e/motion.spec.ts:304:3 › G3 motion — the scroll story plays › intro reveal runs once per session and then stays hidden (2.1s)
  ✓  15 [d1440] › e2e/motion.spec.ts:249:3 › G3 motion — the scroll story plays › finale lights up on enter and replays after leaving completely (9.4s)
  ✓  18 [d1440] › e2e/motion.spec.ts:320:3 › G3 motion — reduced motion is a complete static experience › no pins, no loader, everything already in its final state (3.3s)

  2 skipped
  16 passed (35.9s)
```
### `npx playwright test e2e/smoke.spec.ts --project=d1440 --project=m360`
```

Running 14 tests using 2 workers

  ✓   2 [m360] › e2e/smoke.spec.ts:35:3 › phase 1 smoke › renders all 12 sections in the locked order (721ms)
  ✓   1 [m360] › e2e/smoke.spec.ts:20:3 › phase 1 smoke › loads with no console errors/warnings and no horizontal overflow (1.3s)
  ✓   3 [m360] › e2e/smoke.spec.ts:47:3 › phase 1 smoke › has exactly one h1 with the required text/aria-label, and lang=sr-Latn (622ms)
  ✓   4 [m360] › e2e/smoke.spec.ts:63:3 › phase 1 smoke › skip link targets #sadrzaj (614ms)
  ✓   5 [m360] › e2e/smoke.spec.ts:70:3 › phase 1 smoke › contact email is correct and there is no phone/tel affordance (714ms)
  ✓   6 [m360] › e2e/smoke.spec.ts:80:3 › phase 1 smoke › shows exactly six service cards and six FAQ trigger/panel pairs (687ms)
  ✓   7 [m360] › e2e/smoke.spec.ts:88:3 › phase 1 smoke › trust stats, marquee, before/after slider and testimonial controls exist (692ms)
  ✓   9 [d1440] › e2e/smoke.spec.ts:35:3 › phase 1 smoke › renders all 12 sections in the locked order (859ms)
  ✓   8 [d1440] › e2e/smoke.spec.ts:20:3 › phase 1 smoke › loads with no console errors/warnings and no horizontal overflow (1.5s)
  ✓  10 [d1440] › e2e/smoke.spec.ts:47:3 › phase 1 smoke › has exactly one h1 with the required text/aria-label, and lang=sr-Latn (905ms)
  ✓  11 [d1440] › e2e/smoke.spec.ts:63:3 › phase 1 smoke › skip link targets #sadrzaj (836ms)
  ✓  12 [d1440] › e2e/smoke.spec.ts:70:3 › phase 1 smoke › contact email is correct and there is no phone/tel affordance (872ms)
  ✓  13 [d1440] › e2e/smoke.spec.ts:80:3 › phase 1 smoke › shows exactly six service cards and six FAQ trigger/panel pairs (877ms)
  ✓  14 [d1440] › e2e/smoke.spec.ts:88:3 › phase 1 smoke › trust stats, marquee, before/after slider and testimonial controls exist (770ms)

  14 passed (9.2s)
```

### Full-matrix run (all four viewports, earlier in the session)

`npx playwright test e2e/motion.spec.ts` → **32 passed, 4 skipped** (the skips are the
`≥1024px`-only main-line test on the three narrow viewports and the phone-only
"pinned anatomy fits one screen" test on d1440).

### Evidence (screenshots)

`test-results/shots/`: `anatomy-{1440,390}-{0,20,40,60,80,100}.png`,
`anatomy-{1440,390}-step3-fault.png`, `anatomy-{1440,390}-step3-fix.png`,
`anatomy-{1440,390}-step3.png`, `finale-{1440,390}-lit.png`,
`finale-{1440,390}-reduced.png`, `hero-{1440,390}.png`, `hero-{1440,390}-reduced.png`.

Playwright clears `test-results/` at the start of every run, so the motion spec has to run
last (or alone) when this evidence is collected.

## Open issues / notes for other owners

- `index.html` (builder) preloads `/fonts/bricolage-grotesque-latin-wght-normal.woff2`, but the
  stylesheet loads the hashed Fontsource copy, so Chromium logs *"The resource … was preloaded
  using link preload but not used within a few seconds…"*. It is a console **warning** and
  therefore a G2 risk. It did not appear inside `smoke.spec.ts`'s collection window, but the fix
  belongs in `index.html`/the font pipeline (preload the hashed asset, or drop the preload).
- Any new ScrollTrigger added elsewhere can keep the default `refreshPriority`; see
  `docs/DECISIONS.md` (phase 2 — motion-engineer) for why exactly one trigger declares one.
- The anatomy pin is built on mount rather than lazily: the pin spacer *is* the height
  reservation, and building the (paused) timeline is cheap — no CLS either way.
