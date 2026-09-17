# Review 1 — gate G5 (reviewer, phase 4)

Scope: `docs/BRIEF.md` §4–§9 against the tree at `21a6a2f` (working tree clean), the
screenshots in `test-results/shots/` (54 files, all four viewports) and the QA logs in
`docs/reports/phase3-qa/`. Read-only audit; nothing was changed.

**Verdict: G5 does not pass — 1 critical, 9 major, 18 minor.**

---

## CRITICAL

### C1 — The desktop cursor disappears completely on load
`src/components/Cursor.tsx:97-101` (and `src/styles/global.css:193-196`)

On mount the effect calls `hide()` (both cursor elements to `opacity: 0`) and adds
`cursor-none` to `<html>`, which hides the **native** pointer. The only thing that ever
calls `show()` is `window.addEventListener('pointerenter', show)`. `pointerenter` does not
bubble, so a bubble-phase listener on `window` is not invoked for an event dispatched at an
element — and even if it were, no `pointerenter` is generated for a page that loads with the
pointer already inside the viewport. `handlePointerMove` (lines 45-81) moves the dot/ring but
never restores opacity. Result: on every fine-pointer load the visitor has **no pointer at
all** — native hidden, custom invisible — until they move the mouse out of the window and
back in. Every hover, click target and the magnetic CTA become guesswork (BRIEF §4: the
cursor "ne kvari prirodni pokazivač ni fokus").

Fix:
```ts
function handlePointerMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return;
  show();                       // ← first line of the handler
```
and swap the window listener to `pointerover` (bubbles) as a belt-and-braces.

---

## MAJOR

### M1 — Services keep pointer tilt + spotlight under reduced motion
`src/sections/Services.tsx:108,136-137,149`; CSS `src/styles/global.css:259-279`

`ServiceCard` gates the 3D tilt and the cursor spotlight on `useFinePointer()` only. It never
reads `usePrefersReducedMotion()` (the import at line 4 is consumed by the parent at line 171,
not by the card). A reduced-motion visitor on a mouse still gets six cards that rotate in 3D
and a gradient that chases the cursor — continuous pointer-driven parallax, which BRIEF §5.2
removes outright ("bez pinning-a, scrub-a, smooth-scroll-a, parallax-a … i neprekidnih
pokreta") and §4 repeats for pointer effects.

Fix:
```ts
const reduced = usePrefersReducedMotion();
const interactive = useFinePointer() && !reduced;   // use `interactive` at 136/137/149
```
and add `@media (prefers-reduced-motion: no-preference)` around the `global.css:259` block.

### M2 — `body { overflow-x: hidden }` is the forbidden fix, and it blinds the G2 gate
`src/styles/global.css:38`; assertion at `e2e/smoke.spec.ts:30-35`

BRIEF §7 names this exact line: "bez horizontalnog overflow-a (**ne skrivaj ga
`overflow-x: hidden` na body-ju umesto popravke širina**)". Worse, it makes `body` a scroll
container, so `document.documentElement.scrollWidth <= window.innerWidth` becomes true by
construction and the G2 overflow check can never fail. I found no section that actually
needs it — every wide element already clips itself (`Hero` `overflow-hidden`,
`Process` pin `overflow-hidden`, both marquee wrappers, `Contact`, `BeforeAfter` track) and
`MainLine` sizes its layer to `documentElement.clientWidth` — so removing it should be safe
and makes the gate meaningful again.

Fix: delete line 38; re-run `smoke.spec.ts` on all four viewports and fix whatever real
overflow surfaces.

### M3 — Five interactive controls are below the 44px touch minimum
`src/sections/Trust.tsx:104`, `src/sections/Testimonials.tsx:93`,
`src/sections/Contact.tsx:315`, `src/sections/Footer.tsx:25`, `src/sections/Anatomy.tsx:400`

BRIEF §7: "Dodirne mete ≥44px." Actual box heights: both marquee toggles
(`px-3 py-1.5 text-xs`) ≈ **30px**; "Kopiraj" and "Nazad na vrh" (`px-4 py-2 text-sm`) ≈
**38px**; the five anatomy dots are `h-11 w-9` = **44×36** (not the 44×44 that
`docs/DECISIONS.md:41` claims). Lighthouse's a11y 100 does not clear this — its `target-size`
audit uses 24px, not the brief's 44.

Fix: `min-h-11` on the four buttons (keep the visual padding, grow the hit box), and
`w-9` → `w-11` on the anatomy dot at `Anatomy.tsx:400`.

### M4 — Both marquees jump at the seam once per loop
`src/styles/global.css:178-188` + `:346-362`; tracks at `src/sections/Trust.tsx:85` and
`src/sections/Testimonials.tsx:58`

The track holds the list twice in a `flex w-max gap-N` and animates `translateX(0 → -50%)`.
With `n` items per copy and gap `g`, the track is `2L + (2n-1)g` wide, so `-50%` shifts by
`L + (n-0.5)g`, but one copy occupies `L + n·g`. Every loop therefore snaps back by exactly
`g/2` — **20px** for the services strip (`gap-10`, 28s) and **8px** for each testimonial row
(`gap-4`, 28s/32s). BRIEF §6.4 asks for "beskonačna pokretna traka … **bez trzaja na spoju**".

Fix: move the gap onto the items so the last one carries it too —
`className="… flex w-max"` (drop `gap-10`) and `pr-10` on each `<li>`; then `-50%` is exactly
one copy.

### M5 — The finale fires while the main line is still short of the switch
`src/motion/MainLine.tsx:213-226` vs `src/sections/Contact.tsx:165-175`; evidence:
`test-results/shots/finale-1440-lit.png`

`MainLine`'s energized path is driven by whole-document progress (`trigger: document.body`,
`end: 'bottom bottom'`), so the tip only reaches `[data-mainline-end]` when the page is
scrolled to the very bottom — past the footer, with the switch already off screen. The finale
scene plays at `start: 'top 60%'` of `#kontakt`. In the 1440 screenshot the bulb is fully lit
and the card revealed while the amber tip sits ~200px to the left of the switch with dead grey
cable between them. BRIEF §6.11 requires beat 1 — "struja stigne do prekidača (poslednji deo
kabla se energizuje)" — *before* the switch flips; as shipped that beat never happens.

Fix: end the main-line trigger on the switch instead of the document —
`{ trigger: '[data-mainline-end]', start: 'top bottom', end: 'top 55%' }` for the last
stretch (or add a short `CurrentPath` tail inside `Contact` driven by the finale timeline at
`t=0`).

### M6 — The light cone reads as a flat polygon cutting across the contact card
`src/motion/motion.css:162-172`; element at `src/sections/Contact.tsx:217-221`; evidence:
`finale-1440-lit.png`, `finale-360-lit.png`, `finale-360-reduced.png`

`.jv-cone` is a `clip-path: polygon(...)` over a linear-gradient with a fixed
`h-[420px]`. Both diagonal edges are hard 1px boundaries and the gradient's transparent stop
lands mid-card, so the card shows a visible horizontal seam where the "light" stops, plus two
diagonal lines crossing its glass. It looks like a rendering artifact rather than
"svetlosni konus … u tom svetlu se pojavljuje staklasta kontakt-kartica" (BRIEF §6.11.4).

Fix: soften the wedge and let it die out below the card —
add `filter: blur(28px)` (or a `mask-image: linear-gradient(to bottom, #000 40%, transparent)`)
and make the height `min(60svh, 720px)` so the fade finishes past the card's bottom edge.

### M7 — Lighthouse mobile Performance is below the §7 threshold, and G4 was recorded as PASS
`.lighthouse/report.report.json` (fetchTime 02:09 → **0.78**);
`docs/reports/phase3-qa/g4-lighthouse.txt:6,19` (**82**, "G4 Result: PASS")

BRIEF §7/§9 set Performance ≥85. The newest run scores 78, the QA run 82; neither clears the
bar, and the QA log calls it a pass ("performance at 82 is acceptable"), which §9 forbids
("Nedostupna provera ostaje označena kao neizvršena, nikad kao prolazna"). A11y 100 / BP 100 /
SEO 100 / CLS 0 are all fine. Drivers: FCP 2.8s, TBT 500ms, `unused-javascript` 66 KiB
(index 42 KiB + gsap 26 KiB), `mainthread-work-breakdown` 0, `forced-reflow-insight` ~94ms.

Fix: lazy-load the below-the-fold motion — `React.lazy`/`import()` for
`Anatomy`/`Process`/`Contact` (and with them SplitText/DrawSVG/MotionPath, registered on
first use rather than in `src/motion/motion.ts:15`), keeping the reserved heights that already
give CLS 0. Re-measure and record the real number either way.

### M8 — G3 failed and the services bento has never been looked at ≥1024px
`docs/reports/phase3-qa/g3-screenshots.txt:29`; grid at `src/sections/Services.tsx:203`

QA's own log says **G3 FAIL** (`services-1440.png` missing), yet `SUMMARY.txt` reports
"3 of 4 gates passing" without escalating. That matters here because the desktop grid is
`lg:auto-rows-[11rem]` — fixed 176px rows with no `overflow` guard. Inside a `sm` cell
(≈264px wide, `p-6`) the tallest card ("Rasveta, prekidači i utičnice" + its two-line
description) needs ≈216px, so its text spills ~40px outside the glass panel and over the row
below. Unverified, but the geometry says it is very likely.

Fix: capture `services-1440.png`, then either drop the fixed rows
(`lg:auto-rows-fr` / `lg:auto-rows-[minmax(11rem,auto)]`) or shorten the two `sm`
descriptions in `src/config/site.ts`.

### M9 — `viewport-fit=cover` is set but no safe-area inset is ever applied
`index.html:5`; unused helpers at `src/styles/global.css:155-169`; consumers:
`src/sections/Nav.tsx:201,203` (fixed header), `Nav.tsx:193` (full-screen panel),
`src/motion/motion.css:95-104` (fixed progress bar)

`viewport-fit=cover` actively opts the page into the notch/home-indicator area, and
`.safe-top` / `.safe-bottom` / `.safe-left` / `.safe-right` are defined but referenced
nowhere in `src/`. On a notched iPhone the sticky header sits under the status bar and the
mobile menu's last link under the home indicator. BRIEF §7 lists "iOS safe-area insets" as a
requirement.

Fix: `className="… safe-top"` on the header wrapper at `Nav.tsx:203`, `safe-bottom` on the
panel at `Nav.tsx:193`, and `padding-left/right: env(safe-area-inset-*)` on `.jv-progress`.

---

## MINOR

1. **Hero column does not line up with the rest of the page.** `src/sections/Hero.tsx:193`
   uses `max-w-4xl` while `Nav.tsx:203`, `Trust`, `Services`, `Testimonials` and `Anatomy`
   use `max-w-6xl`. At 1440 the wordmark starts at x≈168 and the H1 at x≈296 (see
   `hero-1440.png`) — the most visible edge on the site is off-grid. Fix: `max-w-6xl` on the
   hero container.
2. **Reduced motion still scrubs the main line.** `src/motion/MainLine.tsx:192-194,217` keeps
   a `scrub` trigger writing `stroke-dashoffset` (and `scaleX` on the mobile bar). BRIEF §5.2
   removes scrub. Fix: under `reduced`, set the path to full length once and skip the trigger.
3. **Static spark glyphs show in "fixed" end states.** `src/motion/Sparks.tsx:152-160` renders
   a visible arc polyline under reduced motion — a stray blue squiggle under the "Kopiraj"
   button (`finale-360-reduced.png`) and on the repaired circuit, next to "Spojeno. Bez
   varnica." Fix: render the glyph only where a fault is being illustrated, or `opacity: 0.25`.
4. **Magnetic pull is on the nav CTA only.** `data-magnetic` at `src/sections/Nav.tsx:240`;
   the hero primary CTA (`src/sections/Hero.tsx:232`) has none, but BRIEF §4 says "na
   primarnim dugmadima" (plural). Fix: add `data-magnetic` to `hero-cta-primary`.
5. **The menu's close button is outside its own focus trap.** `src/sections/Nav.tsx:133`
   only collects focusables inside `#nav-menu`, and `aria-modal="true"` (line 218) hides the
   toggle (line 248) from AT. Escape works, so this is not blocking. Fix: include
   `toggleRef.current` in the `focusables()` list.
6. **`aria-current="true"` on nav links.** `src/sections/Nav.tsx:229` — `"location"` (or
   `"page"`) is the meaningful token for an in-page section indicator.
7. **Active-section indicator is only a colour change.** `src/sections/Nav.tsx:231`
   (muted → text). BRIEF §6.2 asks for an "indikator"; consider a 2px volt underline.
8. **Trust has no heading.** `src/sections/Trust.tsx:48-53` opens with an eyebrow `<p>`; every
   other section has an `<h2>`, so `#poverenje` is an unnamed region. Fix: promote the eyebrow
   or add a visually-hidden `<h2>`.
9. **Serbian UI string outside `site.ts`.** `src/sections/Testimonials.tsx:18`
   `aria-label={`${rating} od 5`}` is hardcoded; BRIEF §3 wants all visible/announced copy in
   the config.
10. **Relative URLs in the SEO payload.** `scripts/prerender.mts:49,104` emit
    `og:image="/og.png"`, `image` in the JSON-LD and `<loc>/</loc>` — OG scrapers and sitemap
    validators both need absolute URLs. Correct once `siteUrl` is filled in (BRIEF §8), but the
    sitemap is invalid as shipped. Fix: skip `sitemap.xml`/`og:image` until `siteUrl` is set.
11. **Outlined buttons' border is 1.40:1.** `--color-line #262B3B` on `--color-bg`
    (`src/styles/tokens.css:9`) is used as the only boundary of "Pogledaj usluge", "Kopiraj",
    both marquee toggles and "Nazad na vrh" — below WCAG 1.4.11's 3:1 for UI boundaries. The
    labels themselves are fine. Fix: `color-mix(in srgb, var(--color-muted) 45%, transparent)`
    for interactive borders. (Computed for the record: volt-button text `#0A0B10` on `#FFB92B`
    = **11.45:1**, AAA; text 17.4:1; muted 7.6:1; arc 12.6:1 — all pass.)
12. **Dead ternary.** `src/sections/anatomy/CircuitSvg.tsx:195`
    `opacity={lit ? 0 : 0}` — presumably meant `lit ? 0 : 1` or a plain `0`.
13. **The new panel's FID module overlaps breaker #6.** `src/sections/BeforeAfter.tsx:82`
    places it at `x=316,w=46` while the sixth MCB ends at `x=318` and the enclosure at `x=360`
    — 2px overlap and 2px overflow. Fix: `x="310"` + shrink the MCB row to 5.
14. **The reduced-motion rule does not zero animation *delay*.** `src/styles/global.css:366-374`
    overrides duration/iteration only, while `.jv-veil`/`.jv-unlit`
    (`src/motion/motion.css:34-42`) carry a `1400ms` delay. JS `unveil()` covers it, but a slow
    boot leaves a reduced-motion visitor with a blank hero/contact card for 1.4s. Fix: add
    `animation-delay: 0.001ms !important` to the block.
15. **Desktop anatomy stage is mostly empty.** `layout.ts:56-57` is a dead-straight
    `M 140 220 H 900 V 112` (~3.5:1) inside a `lg:min-h-[54svh]` box
    (`src/sections/Anatomy.tsx:494`) — in `anatomy-1440-40.png` the drawing occupies ~200 of
    487px. Fix: give the desktop path one gentle bend/drop and raise the viewBox height.
16. **Socket and switch read as blank boxes.** `CircuitSvg.tsx:247-289,291-318` — at the DIM
    0.5 opacity their only details are `fill: var(--color-bg)` holes, invisible on the dark
    stage (visible in every `anatomy-*` shot). Fix: stroke the holes in `--color-line` and add
    a screw/rocker highlight.
17. **Live flicker loops fight the scrubbed master on the same property.**
    `src/sections/Anatomy.tsx:337,343` run `flickerFault` on `opacity` for elements the master
    timeline also tweens (`:211-213`, `:257`). Harmless while parked, but scrubbing through a
    fault beat leaves the arc/bulb at whatever value the loop was killed at. Fix: flicker a
    dedicated child element, not the one the timeline owns.
18. **Marquee "pause on focus" is vacuous.** `Trust.tsx:80-81` / `Testimonials.tsx:81-82`
    attach focus handlers to rows that contain nothing focusable, so BRIEF §6.4/§6.9's
    "pauza … pri fokusu" only ever fires via hover. Not worth code, but worth knowing.

Also, for the record: `docs/DECISIONS.md:79,89` states that `timeline.progress(1)` suppresses
callbacks. It does not — `node_modules/gsap/gsap-core.js:1715` passes `suppressEvents` through
as `undefined`; it is `seek()` (`:1868`, `_isNotFalse`) that defaults to suppressed. The
manual `setOn(true)` in `Contact.tsx:195` is harmless belt-and-braces, and
`IntroReveal.tsx:72`'s interrupt correctly *does* reach `onComplete` → `markIntroDone()`, so
interrupting the loader does not strand the hero. No change needed, only the note.

---

## Verified OK

- **Photosensitivity (§4).** `flickerOn` (`flicker.ts:10-36`) is exactly 3 brightness changes,
  duration clamped to 0.2–0.6s; `flickerFault` (`:45-66`) is 2 changes per ≥0.8s cycle
  (≤2.5/s); the breaker flash is one up/down pair over 0.36s (`Anatomy.tsx:179-183`); sparks
  overlap continuously (spawn 0.24s, life 0.3–0.6s) rather than strobing, are 7px lines
  (≪1% of viewport) and halve on coarse pointers (`Sparks.tsx:70-72`). No element exceeds
  3 changes/s anywhere I could find.
- **Reduced motion elsewhere.** No pin, no scrub, no Lenis (`SmoothScroll.tsx:31`), no cursor
  (`Cursor.tsx:20`), no hero drift/parallax/hint (`Hero.tsx:49-53`), no loader
  (`IntroReveal.tsx:38-49` + `global.css:150`), no sparks/pulse, marquees frozen by CSS. All
  five anatomy steps, all four process steps, the lit bulb and the usable contact card are
  present in the static markup — confirmed by `motion.spec.ts:320-367` and
  `finale-*-reduced.png` / `hero-*-reduced.png`. (M1 is the one exception.)
- **GSAP/React hygiene.** One ticker: Lenis on `gsap.ticker` with `lagSmoothing(0)`
  (`SmoothScroll.tsx:35-41`) and a clean teardown; every animated component uses `useGSAP`
  with `revertOnUpdate` and returns a disposer; `ScrollTrigger.refresh()` is batched through
  `requestRefresh()` (`motion.ts:58-65`) behind a rAF, fed by `document.fonts.ready` and a
  ref-counted `ResizeObserver` with a 2px dead band (`:76-105`); `refreshPriority: -999` on
  the document-height trigger (`MainLine.tsx:224`) is genuinely required and correctly
  explained; `MainLine.build()` reads in one batched pass after collapsing the layer
  (`:79-130`); only transform / opacity / `stroke-dashoffset` / `clip-path` / `attr` are
  animated. StrictMode double-mount is safe (module-level ref counts, `once`-guarded pub/sub).
- **Anatomy correctness.** 16 segments = timeline duration, state derived from
  `master.progress()` in `onUpdate` rather than callbacks (`Anatomy.tsx:303-347`), so forward,
  backward and jump-to-step all land correctly; verified by `anatomy-*-{0,20,40,60,80,100}`
  and the `step3-fault` / `step3-fix` / `step3` triple at all four widths (arc + sparks on
  fault, tape and no sparks on fix, re-broken on scroll-back). Mobile pin is 2.8×innerHeight
  (§7's ~300vh cap) and the serpentine keeps the components legible at 360×640.
- **Finale replay.** One reused timeline played/reversed from `onToggle`+`onRefresh`
  (`Contact.tsx:152-184`) — no overlapping instances (`motion.spec.ts:272-282` asserts
  `toHaveCount(1)`), never reverses while focus is inside the card (`:157-159`), with a 2.5s
  safety net and a CSS fallback.
- **Accessibility.** `lang="sr-Latn"`, one `<h1>` with `aria-label="Iskače? Treperi? Varniči?"`
  over `aria-hidden` word spans, 7 `<h2>`s in order, working skip link, `:focus-visible` in arc
  at 2px offset globally, focus trap + Escape + focus return in the menu, `role="slider"` with
  `aria-valuenow/min/max/label`, real button/panel accordion with arrow-key roving focus,
  `aria-pressed` on both pause toggles, `aria-live="polite"` toast with reserved height that
  only says "Kopirano ✓" on success (with a select-the-email fallback), decorative SVG all
  `aria-hidden`. Lighthouse a11y = 100.
- **SEO / build.** `dist/index.html` contains the hero text, `<h1>`, description (124 chars),
  OG + Twitter + `summary_large_image`, `theme-color`, and JSON-LD `@type: Electrician` with
  no phone, no url, no address and no `aggregateRating`; `og.png` is 1200×630 and the
  apple-touch-icon 180×180; the duplicate `/fonts/...` preload was removed in `21a6a2f` and
  `dist` now ships exactly one preload pointing at the hashed asset the CSS actually uses.
  CLS 0, SEO 100, Best Practices 100. `vercel.json` is headers-only, no rewrites.
- **Copy.** Serbian, Latin, ekavica, no anglicisms; the verbatim strings all match
  `docs/CONTRACT.md:61`; demo markers on stats, testimonials and the before/after
  illustration; no invented prices, certificates or guarantee periods; the safety answer in
  FAQ 6 is correct.
- **Mobile.** Nav is exactly 64px, `dvh`/`svh` throughout, no `100vh`, passive scroll
  listener, no cursor/tilt/spotlight/Lenis on touch, the email fits one line at 360 with
  `overflow-wrap: anywhere` in reserve, `motion.spec.ts:187-221` proves the pinned step fits
  one screen with no internal scroll at 360/390/768.
