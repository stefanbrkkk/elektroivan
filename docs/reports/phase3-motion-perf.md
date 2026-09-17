# Phase 3 — motion-engineer: gate G4 main-thread cost (full logs)

Owner: `motion-engineer`. Task: Lighthouse mobile Performance was **82** (threshold ≥85), driven by
**TBT 620 ms**, **Style & Layout 1448 ms** and **Script Evaluation 1138 ms**.

Files changed (nothing outside this agent's ownership):
`src/motion/motion.ts`, `src/motion/CurrentPath.tsx`, `src/motion/MainLine.tsx`,
`src/motion/Sparks.tsx`, `src/sections/Anatomy.tsx`, `src/sections/Contact.tsx`.

Measurement conditions: production build served by `npm run preview` (port 4173), Lighthouse 13.4.1
mobile preset (412×823 @ DPR 1.75, `throttlingMethod: simulate`, 1638 kbps / 150 ms RTT,
`cpuSlowdownMultiplier: 4`), `CHROME_PATH=/opt/pw-browsers/chromium`. Lighthouse's mobile preset
**simulates** throttling, so its FCP/LCP/TBT are Lantern estimates — that is where all of the
run-to-run spread below comes from, not from the code.

---

## 1. Result

| before, run | Performance | A11y | BP | SEO | FCP | LCP | TBT | CLS | SI | TTI | long tasks >50ms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **82** | 100 | 100 | 100 | 1959 ms | 2123 ms | 617 ms | 0 | 2780 ms | 4339 ms | 437 ms, 142 ms, 142 ms, 135 ms, 133 ms |
| 2 | **81** | 100 | 100 | 100 | 2106 ms | 2418 ms | 560 ms | 0 | 2672 ms | 3970 ms | 408 ms, 135 ms, 134 ms, 123 ms, 121 ms |
| 3 | **83** | 100 | 100 | 100 | 2107 ms | 2407 ms | 507 ms | 0 | 2618 ms | 3858 ms | 407 ms, 146 ms, 128 ms, 122 ms |
| 4 | **78** | 100 | 100 | 100 | 2753 ms | 2916 ms | 504 ms | 0 | 2753 ms | 3914 ms | 428 ms, 135 ms, 129 ms, 124 ms |
| **median** | **82** | 100 | 100 | 100 | 2106 ms | 2412 ms | **534 ms** | 0 | 2712 ms | 3942 ms | |

| after, run | Performance | A11y | BP | SEO | FCP | LCP | TBT | CLS | SI | TTI | long tasks >50ms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **90** | 100 | 100 | 100 | 2851 ms | 3013 ms | 48 ms | 0 | 2851 ms | 3304 ms | 143 ms, 124 ms |
| 2 | **91** | 100 | 100 | 100 | 2749 ms | 2899 ms | 56 ms | 0 | 2749 ms | 3368 ms | 130 ms, 116 ms |
| 3 | **97** | 100 | 100 | 100 | 1956 ms | 2117 ms | 51 ms | 0 | 2433 ms | 3310 ms | 143 ms, 126 ms, 50 ms |
| 4 | **89** | 100 | 100 | 100 | 2856 ms | 3006 ms | 57 ms | 0 | 2856 ms | 3463 ms | 137 ms, 131 ms |
| 5 | **97** | 100 | 100 | 100 | 1952 ms | 2113 ms | 55 ms | 0 | 2421 ms | 3308 ms | 140 ms, 129 ms |
| **median** | **91** | 100 | 100 | 100 | 2749 ms | 2899 ms | **55 ms** | 0 | 2749 ms | 3310 ms | |

| main-thread group | before (median of 4) | after (median of 5) |
|---|---|---|
| Style & Layout | 1254 ms | 664 ms |
| Script Evaluation | 998 ms | 424 ms |
| Other | 510 ms | 494 ms |
| Rendering | 168 ms | 163 ms |
| Parse HTML & CSS | 30 ms | 28 ms |

**Performance 82 → 91 (median), worst of five runs 89, best 97. TBT 534 ms → 55 ms. CLS stays 0.**
Long tasks: five (437/142/142/135/133 ms) → two (~140 ms for the document's first
style+layout+paint, which lands *before* FCP and therefore outside the TBT window, and ~125 ms for
React hydration).

The residual score spread is entirely FCP/LCP: Lantern reports either ~1.95 s or ~2.85 s for the
same build, and the same bimodality is present in the "before" runs (1959 / 2106 / 2107 / 2753 ms).
Observed (unthrottled) FCP is 120–146 ms in every run, before and after.

---

## 2. Root causes

Traced with `Tracing.start` (`disabled-by-default-devtools.timeline` + `v8.cpu_profiler`) under the
same emulation (412×823, 4× CPU, 1.6 Mbps / 150 ms). Three of the four hypotheses in the brief held;
one did not.

### 2.1 DrawSVG re-measured its target on every tween init — the single biggest item

`Pc` in the gsap chunk is DrawSVG's `getLength`. It had **415 ms of self time** in a 9 s trace, more
than every other JS frame put together. Its body (minified, `dist/assets/gsap-*.js`):

```js
Pc=function(e){ ... jc(e)&&(i=e.getScreenCTM(),...);  try{o=e.getBBox()} ...
  t===`path` && (c=n.strokeDasharray, n.strokeDasharray=`none`,
                 a=e.getTotalLength()||0, ... n.strokeDasharray=c)
```

That is **write → read → write** on a layout-affecting property, i.e. two forced layouts of the whole
document *per target, per tween init*, and the plugin's `init` runs `Pc(e)` unconditionally. The page
was paying for it in three places at once:

- `CurrentPath.apply()` was `gsap.set(cores, { drawSVG })`, and **Process called it from a scrubbed
  `onUpdate`** — two measurements (core + glow), i.e. four forced layouts, *per scroll frame*;
- Anatomy's master timeline holds six `CurrentPath.timeline()` sub-timelines whose `fromTo` uses
  `immediateRender`, so twelve measurements at build time and twelve more on every
  `invalidateOnRefresh` refresh;
- the glow copy is `display: none` below 1024px (`.jv-glow-lg`), so half of those measurements were
  of a hidden path — expensive *and* meaningless (gsap even carries a `Some browsers won't measure
  invisible elements` warning for exactly this).

**Fix** (`src/motion/CurrentPath.tsx`): draw the core with the `stroke-dashoffset` scrub that BRIEF
§5.3 offers as the alternative to DrawSVG. `getTotalLength()` is called **once per mount** (on the
core, whose `d` the glow shares, so one measurement covers both paths), `stroke-dasharray` is written
once, and every later update writes only `stroke-dashoffset` — no reads, no layout. `timeline()`
tweens that one numeric property so GSAP still owns the render (a callback would be suppressed on a
seek, which is exactly what a scrubbed master timeline does to its children). `DrawSVGPlugin` stays
registered and exported, as docs/CONTRACT.md requires.

### 2.2 Every scene was built inside the hydration commit — the 437 ms task

`useGSAP` is a layout effect, so Anatomy's whole scene (240 `getPointAtLength()` samples, a
nearest-point search per component, ~100 tweens over SVG elements) plus the Process and Contact
scenes ran synchronously in React's commit. The CPU profile attributes 144 ms of self time to
Anatomy's callback alone, and React's scheduler frame contained **205 forced layouts**.

**Fix**: heavy scenes initialise near the viewport (BRIEF §7), through a shared
`whenNear(element, build)` helper in `src/motion/motion.ts` (IntersectionObserver,
`rootMargin: '400px 0px'`). Measured section offsets at 412×823 / 360×640 / 1440×900 confirm the
observer does **not** fire during load: the Anatomy pin sits 692 / 733 / 612 px below the fold.

Height reservation, so CLS stays 0: Anatomy keeps its **pin and its ScrollTrigger eager** — only the
tweens are lazy. The paused master timeline is created with one empty
`to({}, { duration: segments })` "spine", which fixes its duration at 16 whether or not the scene
exists, so the pin distance, the pin-spacer height and the `segment → progress` mapping never change,
no extra refresh is needed, and `data-step` / `data-beat` / the counter are already correct while the
visitor scrolls in. Contact's section is plain flow content, so its timeline and its two triggers are
built lazily as a unit. The sample count also went 240 → 120 (1/120 of the path is far finer than the
scene needs).

### 2.3 Four `ScrollTrigger.refresh()` calls on boot, ~260 ms each

The trace attributes **519 ms inclusive to two `requestRefresh` rAF callbacks**, containing 264
forced `Layout` and 384 forced `UpdateLayoutTree` events; a third refresh came from ScrollTrigger's
own `load` listener (277 ms, 132 forced layouts). Every one of those layouts was
`dirtyObjects: 1045 / totalObjects: 1058` — a full-document relayout. Sources: ScrollTrigger's
`DOMContentLoaded` + `load` auto-refreshes, `document.fonts.ready`, the `ResizeObserver`'s initial
callback, and the same observer firing again when pin spacers changed the body height.

**Fix** (`src/motion/motion.ts`):

- `ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,resize' })` — the `DOMContentLoaded`
  refresh fires before a single trigger exists (the bundle is a deferred module) and the `load` one is
  replaced by ours;
- one **settle refresh** in the microtask after whichever of `load` / `fonts.ready` comes last
  (capped at 2.5 s so a stalled font loader cannot block it);
- `requestRefresh()` is a no-op until that settle refresh has run (it covers them), and afterwards
  debounces by 240 ms and drops every request that arrives while one is pending;
- the `ResizeObserver` seeds its baseline from **its own first callback** (`contentRect.height`), so
  installing it neither forces a layout nor asks for a refresh.

Result: exactly one refresh on boot (the remaining ~50 ms task), and across the whole trace the forced
layout count fell from **615 → 48** `Layout` events (361 ms → 78 ms) and **959 → 97**
`UpdateLayoutTree` events (305 ms → 91 ms).

### 2.4 A refresh cancels a scroll that is in flight — regression found and fixed

Collapsing four refreshes into one exposed a latent bug the extra refreshes had been hiding:
`ScrollTrigger.refresh()` re-applies the scroll offset it recorded, which **kills a native smooth
`scrollIntoView()` mid-flight**. With the refresh now landing later (it waits for `fonts.ready`), an
anchor link clicked right after `load` would scroll ~12 px and stop dead. `e2e/nav.spec.ts` caught it:
6–8 failures at t768 (`nav-link-pre-posle` / `utisci` / `pitanja`, `hero-cta-*`), reproduced
deterministically at `--repeat-each=3` and traced with an instrumented copy of the spec:

```
SIV 485 #utisci docH=13300 top=10711      <- smooth scrollIntoView starts
t=565 y=12 docH=13300                     <- ...and never moves again
```

**Fix**: a passive, capture-phase `scroll` listener records *when* the page last moved (it never reads
a scroll offset, so it costs no layout), and a refresh waits for 140 ms of scroll quiet before running,
with a 4 s ceiling so it can never be starved. `e2e/nav.spec.ts` then passes 144/144 across all four
viewports at `--repeat-each=3`.

### 2.5 Hypothesis that did NOT hold: `backdrop-filter` / `will-change`

Measured directly (same emulation, CSS injected before navigation, TBT proxy = Σ max(0, task−50) over
long tasks after FCP, 2 runs each):

| variant | TBT proxy |
|---|---|
| baseline | 1057 ms |
| `.glass { backdrop-filter: none }` (33 elements) | 1264 ms |
| `.jv-field, .jv-track { will-change: auto }` | 1221 ms |

Neither helps — both are compositor/paint work, not main-thread blocking (`Layerize` and `Paint` are
their own trace groups and barely moved). **No builder-owned CSS was touched.** The one filter-related
change that was worth making is 2.1's: not measuring the `display: none` glow path below 1024px.

### 2.6 Smaller items

- `Sparks`: the mount-time `gsap.set(particles, { opacity: 0 })` restated what the markup already says
  (`opacity="0"` per line, `data-active="false"` on the group) — six emitters × up to 14 particles ×
  one `getComputedStyle` each, inside the boot task. Dropped; the reset now runs only when a particle
  has actually been thrown (`thrown` flag), keeping `stop()` / `sync()` semantics identical.
- `Contact`: the four `gsap.set(bulb/filament/halo/cone)` calls also only restated the markup; they
  moved into the lazily built scene, where they still establish the timeline's "from" values.
- `MainLine`: the `<svg>` cable is no longer rendered below 1024px at all (it was `display: none` dead
  weight in the layout tree) — BRIEF §7's "keep the phone path light". The prerendered
  `dist/index.html` is 1.77 kB instead of 1.93 kB as a result; on ≥1024px it mounts on the first
  client render, exactly like `Nav`'s desktop/mobile split.

---

## 3. What the phone path now does (<1024px)

No MainLine SVG (2 px progress bar only), no Lenis (coarse pointer), no SVG blur glow
(`.jv-glow-lg` is `display: none` *and* excluded from any measurement), spark counts halved at spawn
(`isSmallOrCoarse()`), Anatomy pin 2.8 × viewport instead of 5 ×, Process vertical instead of pinned
horizontal (<768px), off-screen loops paused (IntersectionObserver), and the Anatomy/Contact scenes
built only within 400 px of the viewport.

---

## 4. Verification

```
== npm run typecheck ==

> jovan-elektro@0.1.0 typecheck
> tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit

exit=0

== npm run lint ==

> jovan-elektro@0.1.0 lint
> eslint . --max-warnings 0

exit=0

== npm run build ==

> jovan-elektro@0.1.0 build
> vite build && vite build --ssr src/entry-server.tsx --outDir dist/server && node scripts/prerender.mts

vite v8.3.0 building client environment for production...
transforming...
✓ 58 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                          1.77 kB │ gzip:  0.76 kB
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
dist/assets/index-Bs6Sz2ME.css                                          44.25 kB │ gzip: 11.34 kB
dist/assets/rolldown-runtime-D9-fqq9M.js                                 0.08 kB │ gzip:  0.08 kB
dist/assets/gsap-4hdXqrla.js                                           152.96 kB │ gzip: 60.83 kB
dist/assets/index-4urB4TYl.js                                          312.09 kB │ gzip: 95.14 kB

✓ built in 287ms
vite v8.3.0 building ssr environment for production...
transforming...
✓ 33 modules transformed.
rendering chunks...
computing gzip size...
dist/server/entry-server.js  146.02 kB │ gzip: 38.82 kB

✓ built in 67ms
Prerender complete: dist/index.html, dist/robots.txt, dist/sitemap.xml
exit=0

== npx playwright test e2e/motion.spec.ts e2e/smoke.spec.ts --project=d1440 --project=m390 ==

Running 32 tests using 2 workers

[1/32] [m390] › e2e/motion.spec.ts:95:3 › G3 motion — the scroll story plays › anatomy scrubs through five steps and every frame differs
[2/32] [m390] › e2e/motion.spec.ts:134:3 › G3 motion — the scroll story plays › step 3 shows the arc and sparks on the fault beat, tape on the fix beat
[3/32] [m390] › e2e/motion.spec.ts:177:3 › G3 motion — the scroll story plays › progress dots jump to their step
[4/32] [m390] › e2e/motion.spec.ts:187:3 › G3 motion — the scroll story plays › the pinned anatomy fits one screen with nothing overlapping
[5/32] [m390] › e2e/motion.spec.ts:223:3 › G3 motion — the scroll story plays › main line energizes with scroll progress
[6/32] [m390] › e2e/motion.spec.ts:249:3 › G3 motion — the scroll story plays › finale lights up on enter and replays after leaving completely
[7/32] [m390] › e2e/motion.spec.ts:285:3 › G3 motion — the scroll story plays › hero words end up fully lit
[8/32] [m390] › e2e/motion.spec.ts:304:3 › G3 motion — the scroll story plays › intro reveal runs once per session and then stays hidden
[9/32] [m390] › e2e/motion.spec.ts:320:3 › G3 motion — reduced motion is a complete static experience › no pins, no loader, everything already in its final state
[10/32] [m390] › e2e/smoke.spec.ts:20:3 › phase 1 smoke › loads with no console errors/warnings and no horizontal overflow
[11/32] [m390] › e2e/smoke.spec.ts:35:3 › phase 1 smoke › renders all 12 sections in the locked order
[12/32] [m390] › e2e/smoke.spec.ts:47:3 › phase 1 smoke › has exactly one h1 with the required text/aria-label, and lang=sr-Latn
[13/32] [m390] › e2e/smoke.spec.ts:63:3 › phase 1 smoke › skip link targets #sadrzaj
[14/32] [m390] › e2e/smoke.spec.ts:70:3 › phase 1 smoke › contact email is correct and there is no phone/tel affordance
[15/32] [m390] › e2e/smoke.spec.ts:80:3 › phase 1 smoke › shows exactly six service cards and six FAQ trigger/panel pairs
[16/32] [m390] › e2e/smoke.spec.ts:88:3 › phase 1 smoke › trust stats, marquee, before/after slider and testimonial controls exist
[17/32] [d1440] › e2e/motion.spec.ts:95:3 › G3 motion — the scroll story plays › anatomy scrubs through five steps and every frame differs
[18/32] [d1440] › e2e/motion.spec.ts:134:3 › G3 motion — the scroll story plays › step 3 shows the arc and sparks on the fault beat, tape on the fix beat
[19/32] [d1440] › e2e/motion.spec.ts:177:3 › G3 motion — the scroll story plays › progress dots jump to their step
[20/32] [d1440] › e2e/motion.spec.ts:187:3 › G3 motion — the scroll story plays › the pinned anatomy fits one screen with nothing overlapping
[21/32] [d1440] › e2e/motion.spec.ts:223:3 › G3 motion — the scroll story plays › main line energizes with scroll progress
[22/32] [d1440] › e2e/motion.spec.ts:249:3 › G3 motion — the scroll story plays › finale lights up on enter and replays after leaving completely
[23/32] [d1440] › e2e/motion.spec.ts:285:3 › G3 motion — the scroll story plays › hero words end up fully lit
[24/32] [d1440] › e2e/motion.spec.ts:304:3 › G3 motion — the scroll story plays › intro reveal runs once per session and then stays hidden
[25/32] [d1440] › e2e/motion.spec.ts:320:3 › G3 motion — reduced motion is a complete static experience › no pins, no loader, everything already in its final state
[26/32] [d1440] › e2e/smoke.spec.ts:20:3 › phase 1 smoke › loads with no console errors/warnings and no horizontal overflow
[27/32] [d1440] › e2e/smoke.spec.ts:35:3 › phase 1 smoke › renders all 12 sections in the locked order
[28/32] [d1440] › e2e/smoke.spec.ts:47:3 › phase 1 smoke › has exactly one h1 with the required text/aria-label, and lang=sr-Latn
[29/32] [d1440] › e2e/smoke.spec.ts:63:3 › phase 1 smoke › skip link targets #sadrzaj
[30/32] [d1440] › e2e/smoke.spec.ts:70:3 › phase 1 smoke › contact email is correct and there is no phone/tel affordance
[31/32] [d1440] › e2e/smoke.spec.ts:80:3 › phase 1 smoke › shows exactly six service cards and six FAQ trigger/panel pairs
[32/32] [d1440] › e2e/smoke.spec.ts:88:3 › phase 1 smoke › trust stats, marquee, before/after slider and testimonial controls exist
  2 skipped
  30 passed (38.1s)
exit=0
```

### `npm run lh` (5 runs; per-run metrics in the table in §1)

```
Lighthouse scores (mobile) for http://localhost:4173:
  Performance: 90 / 91 / 97 / 89 / 97   (median 91)
  Accessibility: 100 / 100 / 100 / 100 / 100
  Best Practices: 100 / 100 / 100 / 100 / 100
  SEO: 100 / 100 / 100 / 100 / 100
```

### Full Playwright matrix

`npx playwright test` (all specs × m360/m390/t768/d1440): **132 passed, 8 skipped, 0 failed** — the
skips are the ≥1024px-only main-line test on the three narrow viewports and the phone-only "pinned
anatomy fits one screen" test on d1440.

`npx playwright test e2e/nav.spec.ts --project=t768 --project=m390 --project=m360 --project=d1440 --repeat-each=3`:
**144 passed, 12 skipped** — this is the run that caught §2.4.

---

## 5. Open issues / notes for other owners

- **Fonts cause seven full-document relayouts** (28–53 ms each at 4× CPU, `dirtyObjects` 1045/1058)
  between ~1.0 s and ~2.2 s as the woff2 subsets arrive. In the Lighthouse profile they land before
  FCP, so they do not count toward TBT, but they are the bulk of the remaining **Style & Layout
  664 ms** and they delay FCP/LCP — the metric that now limits the score. That is the font pipeline
  (`src/main.tsx` @fontsource imports + the `index.html` preload), i.e. builder-owned. Worth trying:
  fewer preloaded subsets, or `size-adjust` / `ascent-override` fallback faces so a swap does not
  change metrics.
- **`.claude/worktrees/` (a reviewer worktree) is not in `.gitignore`**, so Tailwind's automatic source
  detection scans the copy of `src/` inside it. The generated CSS grew 42.9 kB → 44.2 kB purely from
  that, with identical input files; adding `.claude/` to `.gitignore` restores it. Root-owned file, not
  touched here.
- The remaining ~125 ms hydration task is React hydrating ~830 nodes plus the eager parts of every
  scene (the Anatomy pin spacer is the largest single item and has to stay eager to reserve the
  height). Splitting it further means deferring effects across tasks — not worth it at TBT 55 ms.
- `backdrop-filter` on `.glass` and `will-change` on `.jv-field` were measured and are **not** worth
  changing (§2.5); please do not "optimise" them on suspicion.
