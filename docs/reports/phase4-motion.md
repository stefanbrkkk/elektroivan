# Phase 4 — motion-engineer (review-1.md fixes)

Scope: the motion-engineer-owned files only — `src/motion/*`,
`src/sections/{Hero,Anatomy,Contact}.tsx`, `src/sections/anatomy/*`,
`e2e/motion.spec.ts`. Nothing else was touched; the builder's own phase-4 fixes
(merged at `ad156c8`) were left alone, including the new `--color-line-strong`
token this report consumes.

---

## M5 — the finale fired while the main line was still ~200px short of the switch

Two separate things were wrong, and both are fixed.

**1. The cable finished at the wrong place.** `MainLine`'s energized path was
scrubbed by `trigger: document.body, end: 'bottom bottom'`, i.e. it only reached
`[data-mainline-end]` once the page was scrolled to the very bottom — past the
footer, switch long gone. The trigger now ends on the switch instead:

```ts
end: () => `+=${arrivalScroll()}`
```

`arrivalScroll()` returns the scroll offset at which `[data-mainline-end]` sits
at 75% of the viewport height, clamped to `[1, maxScroll]`. It is a function, so
`invalidateOnRefresh` + `refreshPriority: -999` recompute it after every refresh,
with the pin spacers already applied. The growth is still whole-page scroll —
it just completes at the switch rather than at the footer.

**2. Beat 1 did not exist as a beat, and did not exist at all below 1024px.**
BRIEF §6.11 asks for "struja stigne do prekidača (poslednji deo kabla se
energizuje)" *before* the switch flips. `Contact` now owns the last 120px of
cable: a short `CurrentPath` stub (`[data-mainline-end]`, `z-10`) sitting on the
switch's left edge, energized at `t=0` of the finale timeline over 0.34s. The
whole timeline shifted behind it (switch flip 0.34 → `setOn` 0.5, filament 0.64,
bulb 0.84, cone 0.89, card 1.04, sweep 1.39/2.04). On ≥1024px the site cable
hands over to it; below that there is no site cable at all, so the stub *is* the
arrival, and a `mask-image` fade on `<1024px` lets it emerge out of the dark
instead of starting in mid-air.

**Ordering is now guaranteed by construction**, not by luck: the finale's enter
trigger moved from `trigger: root, start: 'top 60%'` (which fired a whole
viewport early — the section top is ~285px above the switch) to
`trigger: switchEl, start: 'top 60%'`. The cable is timed off the same element
at `top 75%`, so the arrival is always ~110px of scroll *ahead* of the scene at
1440×900 and ~75px at 360×640.

**Seamless join.** The stub is an `<svg>`, so its own viewport clips both of its
round stroke caps flat at x=0, and `endX` is now `endRect.left` exactly (was
`+4`). Combined with the stub painting above the cable layer (`z-10` vs the
layer's `z-index: 5`), neither sheath cap punches a dark notch into the other's
amber core. Verified at 3× device scale on a 90×24 crop of the join: continuous.

**Measured at the finale screenshot position (1440×900):**

| | before | after |
|---|---|---|
| `mainline-energized` `stroke-dashoffset` | ~200px short | **0** of 12638 |
| stub box | — | 580→700, centre y 377.70 |
| main line path end | 584, y 377.70 | 580, y 377.700 |

`finale-1440-lit.png`: the amber cable now runs into the switch while the bulb
is lit. `finale-360-lit.png`: the stub arrives at the switch on the phone too.

## M6 — the light cone read as a flat polygon cutting across the card

`clip-path` cannot be softened by a filter on the same element: CSS applies
`filter` **before** `clip-path`, so `filter: blur()` on `.jv-cone` would have
left both diagonals as 1px lines. The wedge therefore moved to `.jv-cone::before`
and the blur stayed on `.jv-cone` — blurring the *parent* of the clipped child
does soften it. `blur(18px)` below 1024px, `blur(30px)` above (BRIEF §7: the
wider raster is only worth it on a desktop GPU).

The fixed `h-[420px]` is gone. The cone is now a sibling of the card rather than
of the bulb, anchored `top-24 -bottom-16`, so it runs 64px past the card's bottom
edge at *every* viewport — the gradient reaches `transparent` at 96%, which lands
below the glass instead of on it. Measured: 1440 → cone 284…869, card 442…805;
360 → cone 236…876, card 394…812.

Only `opacity` is still animated.

## M3 (my part) — 44px touch targets

- `contact-copy`: `inline-flex min-h-11 min-w-11 items-center justify-center`
  (visual padding unchanged, hit box grown).
- anatomy dots: `h-11 w-9` → `h-11 w-11`. Five 44px dots plus the counter fit the
  360px row (≈291px of 328 available); the pinned-layout overlap test still
  passes at m360/m390/t768.

## M9 (my part) — safe-area insets on the fixed progress bar

`.jv-progress` now has `top: env(safe-area-inset-top, 0px)` and
`padding-left/right: env(safe-area-inset-left/right, 0px)`. Tailwind preflight's
`box-sizing: border-box` keeps the 2px height; the padding only shortens the
fill. No cascade-layer hazard here — `motion.css` is unlayered and the element
carries no competing Tailwind utility (contrast with the builder's `.safe-*`
finding).

## Minor 11 (my part) — 3:1 outlined borders

`hero-cta-secondary` and `contact-copy` moved from `border-line` (1.40:1) to the
builder's `border-line-strong` (`color-mix(in srgb, var(--color-muted) 60%,
transparent)`, 3.36:1).

## Minor 1 / Minor 4 — hero

`max-w-4xl` → `max-w-6xl` (now on the same grid as Nav/Trust/Services/Anatomy),
and `data-magnetic` added to `hero-cta-primary` (BRIEF §4 "na primarnim
dugmadima", plural).

## Minor 2 — reduced motion no longer scrubs the main line

Under `reduced` the component now creates **no ScrollTrigger at all**: `build()`
writes `stroke-dashoffset: 0` (full length) and `setFill(1)` fills the mobile
bar once, and only `refreshInit` stays subscribed — a pure re-measure, not a
scrub. Verified: `strokeDashoffset: "0px"` at 1440, fill transform
`matrix(1,0,0,1,0,0)` at 360, with no trigger to update either.

## Minor 3 — static spark glyphs only where a fault is illustrated

`SparksProps.faultGlyph` (additive, default `false`): the reduced-motion arc
glyph now renders only where it is opted into. The only opt-in is the hero's
"Varniči?" word. Gone from under the "Kopiraj" button and from the repaired
circuit next to "Spojeno. Bez varnica." (see `finale-360-reduced.png`).

## Minor 12 — dead ternary

`opacity={lit ? 0 : 0}` → `opacity={0}` on the cable's copper strands (the
timeline reveals them on the fault beat; the static state is always 0).

## Minor 17 — live flicker loops no longer share a property with the master

Two new elements exist purely so each animated property has exactly one owner:

| beat | master owns | live loop owns |
|---|---|---|
| step 3 fault (arc) | `<g data-testid="anatomy-arc">` `autoAlpha` | inner `<polyline data-part="arc-flicker">` `opacity` |
| step 5 fault (bulb) | `<circle data-testid="anatomy-bulb">` `opacity` | sibling `<circle data-part="bulb-flicker">` `opacity` |

`stopLoops()` parks both with a direct style write (`arc-flicker` → 1,
`bulb-flicker` → 0) rather than `gsap.set`: single owner, nothing to read back,
no forced style resolution on every segment change. Scrubbing through a fault
beat can no longer strand a value.

## Minor 15 / 16 — the desktop anatomy reads as a purpose-made circuit

The old desktop layout was `M 140 220 H 900 V 112` inside a `14 44 950 268`
viewBox: a dead-straight 3.5:1 strip using ~200 of the stage's 487px, with the
socket and the switch rendering as blank boxes at the DIM 0.5 opacity.

**Composition.** `.jv-stage-svg` is `width: 100%; height: auto`, so the
*viewBox's own aspect ratio* is what sizes the box. Hugging the drawing with
`0 0 720 480` (1.5:1, against the stage's 1.38:1) renders the SVG at 671×447 in
a 487px box and makes every component a third larger at the same time. Supply
side across the top (panel → breaker → RCD), the damaged cable dropping down the
wall on the vertical run, socket and switch along the bottom, and the wire
climbing from the switch to the pendant bulb. Drawing height in
`anatomy-1440-40.png`: **~135px → ~400px of 487**.

The cable sits on the vertical run through `CircuitNode.rotate: 90`, which
needed one fix: that rotation is now a **static inner `<g>`**, not something the
timeline writes. GSAP resolves a percentage `transformOrigin` against
`getBBox()`, and the cable's bbox is `[-109, -123, 204, 210]` — not the
component's own `(0, 0)` once halo and spark pool widen it — so letting GSAP own
`rotation` slid the component ~140 user units off the path (measured:
`matrix(0,1.08,-1.08,0,302,274)` where `(440, 240)` was wanted). The node group
keeps x/y/scale; orientation is fixed markup.

**Detail at DIM.** A shared `SocketFace` draws the Schuko recess, both pin
holes, the earth clips and a fixing screw as *strokes* (a `--color-bg` fill is
invisible on a dark stage), and the switch plate gained two fixing screws plus a
lit edge and pivot line on its rocker. Both are legible at 0.5 opacity now —
compare `anatomy-1440-40.png` before/after.

## `progress(1)` and callbacks — the reviewer is right

Confirmed in `node_modules/gsap/gsap-core.js`: `progress(value, suppressEvents)`
(line ~1715) forwards `suppressEvents` untouched, so an omitted argument is
`undefined` → falsy → callbacks **fire**. Only `seek()` (line ~1868) defaults it
to suppressed via `_isNotFalse`. `ScrollTrigger.js:1715` likewise scrubs with
`animation.totalProgress(clipped, !!(_refreshing && …))` — suppressed *only*
during a refresh, not during ordinary scrubbing.

So `IntroReveal`'s interrupt (`timeline.progress(1)`) does reach `onComplete` →
`finish()` → `markIntroDone()`, and the hero sequence fires. Verified in the
browser: wheel at t=150ms → intro `hidden`, all three hero words at opacity 1,
tagline 0.9999, plug cable `stroke-dashoffset: 0px`.

`Contact`'s manual `setOn(true)` beside the safety net's `progress(1)` is
harmless belt-and-braces and stays; its comment was corrected. The DECISIONS
note is corrected in `## Phase 4 — motion-engineer`.

## Pre-existing test failure, fixed — not caused by this phase

`motion.spec.ts:320` ("no pins, no loader, everything already in its final
state") failed **at `ad156c8`**, before any of the above: confirmed by stashing
every source change and re-running it (still failed), 3/3 repeats.

Cause: the first screenshot taken after a programmatic `scrollTo(0, 0)` comes off
a compositor layer Chromium is still settling, and it rasterises six
anti-aliased pixels on the scroll-hint dot differently — deltas of 5…11/255 on a
single row, always the same six pixels. Nothing moves: the element's box is
`761.59375` in both frames to five decimals, its `transform` and style attributes
are byte-identical, and frames 1/2/3 compare `Buffer.compare === 0` to each
other. Only frame 0 is the odd one out.

Fix: one warm-up screenshot, thrown away, before the compared pair. The
assertion stays exact (`toBe(0)`).

---

## Checks

| check | result |
|---|---|
| `npm run typecheck` | clean |
| `npm run lint` (`--max-warnings 0`) | clean |
| `npm run build` | 0 errors, 0 warnings |
| `npx playwright test e2e/motion.spec.ts e2e/smoke.spec.ts` | **60 passed**, 4 skipped, 0 failed (m360 / m390 / t768 / d1440) |
| `npx playwright test` (whole suite) | **133 passed**, 11 skipped, 0 failed |
| `npm run lh` ×5 | Performance **88 / 95 / 92 / 98 / 90** → median **92** (all ≥85) |

Lighthouse (last run, mobile): Performance 90, Accessibility 100, Best Practices
100, SEO 100 · FCP 2.7s · LCP 2.9s · TBT 50ms · **CLS 0** · Speed Index 2.7s.

Evidence refreshed in `test-results/shots/` by the full run above (Playwright
clears that directory at the start of every run, so it holds the post-fix state):
`finale-{360,390,768,1440}-lit.png`, `finale-*-reduced.png`,
`anatomy-1440-{0,20,40,60,80,100}.png`, `anatomy-*-step3*.png`, `hero-*.png`.

## Open

- Nothing blocking. The desktop stage's bottom-left quadrant is empty by
  construction (the supply run is top-left, the load run bottom-right); it reads
  as a wall elevation rather than as unused space, but it is the one place left
  where the composition could be pushed further.
- The mobile serpentine layout (`getCircuitLayout(true)`) was deliberately not
  touched — review-1.md raised no issue with it and it is tuned against the
  360×640 no-internal-scroll gate.
