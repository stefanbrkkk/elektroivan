# v2 — motion-engineer (full logs)

Owner: `motion-engineer`. Scope: `src/motion/*`, `src/sections/{IntroReveal,Hero,Anatomy,Process,Contact}.tsx`,
`src/sections/anatomy/*`, `e2e/motion.spec.ts`. Nothing outside that list was touched
(`src/App.tsx`, `src/config/site.ts`, `src/styles/*`, `src/components/*`, the other sections and
`e2e/*` besides `motion.spec.ts` all belong to the builder).

The brief: the client rejected v1 as flat and thin next to the plumber site
`/home/user/mile-vodoinstalacije`. They want a big hero illustration detail like Mile's copper
elbow, and an electrical installation that is **taken apart all at once and put back together**
while the fault/fix story still plays.

---

## 1. Files

| file | state | what it is |
|---|---|---|
| `src/motion/parts.tsx` | **new** | Shared dimensional parts: `Screw`, `Terminal`, `Mcb`, `Rcd`, `DinRail`, `TerminalBar`, `CableClip`. |
| `src/motion/HeroRail.tsx` | **new** | The hero's 520-unit DIN-rail group. |
| `src/motion/ProcessGlyphs.tsx` | **new** | Four dimensional glyphs + `ProcessGlyphDefs`. |
| `src/sections/anatomy/diorama.ts` | **new** | 14-part geometry (desktop + phone), explosion axes, leader anchors. |
| `src/sections/anatomy/Diorama.tsx` | **new** | The cutaway diorama SVG. |
| `src/sections/anatomy/CircuitSvg.tsx`, `layout.ts` | **deleted** | Replaced by the two files above. |
| `src/motion/MainLine.tsx` | changed | Real cable: 10px sheath, light top edge, copper glow core, clips with screws, stripped end. |
| `src/motion/motion.css` | changed | `.jv-bracket`, `.jv-process-rail`, taller phone stage caps. |
| `src/sections/Hero.tsx` | rewritten | Two-column hero; the DIN group replaces the plug. |
| `src/sections/Anatomy.tsx` | rewritten | Explode → five steps → assemble master timeline. |
| `src/sections/Process.tsx` | changed | Mile-style pinned track, sheet header, bracketed glyphs. |
| `src/sections/Contact.tsx` | changed | Dimensional rocker switch, E27 pendant, display title. |
| `src/sections/IntroReveal.tsx` | changed | Fuse-box door outline instead of the bulb glyph. |
| `e2e/motion.spec.ts` | changed | New timeline fractions + the explode/assemble test. |

Everything is drawn with the builder's `Materials` gradients and `part-style.ts`
(`PART_OUTLINE` / `PART_HIGHLIGHT`), and uses the builder's global classes
(`.container-x`, `.section`, `.display-*`, `.serif-accent`, `.label-mono`, `.card`, `.btn*`,
`.corner-marks`, `.hatch`, `SectionHeader`). No private copies of any of them.

---

## 2. The illustration technique

Copied from Mile's `HeroElbow.tsx` / `pipe-style.ts` and adapted to electrical parts:

- a material gradient from `Materials` for the body (`m-polymer-dark`, `m-polymer-light`,
  `m-steel`, `m-brass`, `m-copper`, `m-ins-blue`, `m-ins-brown`, `m-ins-ye-gn`);
- a 1.25px near-black outline at 60% (`PART_OUTLINE`);
- a 1px top-left highlight at 35% white and a 3–3.5px bottom-right shade band (`BodyShading`);
- real screw heads: steel disc + slot + rim highlight, each at its own angle;
- recessed copper screw terminals (dark cavity → copper clamp → screw);
- printed markings (`B16`, `6kA`, `30 mA`, `FID 40A`, `I`/`0`, `RT · 1F`) in JetBrains Mono.

Those markings are printed text on a component, not site copy — the SVGs are `aria-hidden`, and
`src/config/site.ts` is frozen during parallel work. Same for the 14 part names on the leader
labels (`01 Kutija`, `02 DIN šina`, …), which docs/DESIGN.md §3.5 specifies verbatim.

---

## 3. Hero (DESIGN §3.3)

`HeroRail.tsx`, viewBox `0 0 420 520` → ~520px tall at 1440, `max-w-[230px]` at 390.

Back plate (hatched, four mounting screws) → corner marks → steel top-hat DIN rail (362 wide, its
lips reading on both sides of the modules) → a 1-module B16 MCB with a white lever in a recessed
slot → a 2-module 30 mA RCD with a test button → a dimension line with ticks reading
`2 modula · 36 mm` → the cable leaving the bottom terminal.

Sequence, hung off `onIntroDone`:

| t | what |
|---|---|
| 0 / 0.26 / 0.52 | the three words ignite (`flickerOn`, ≤3 changes, ≤0.45s each) |
| 0.62 | spark burst on „Varniči?“ |
| 0.95 / 1.15 | „Jovan rešava.“ and the rest rise |
| 1.05 | **MCB lever snaps up** (`y: 26 → 0`, `back.out(2.2)`) |
| 1.16 / 1.26 | „klak“: `scale 1 → 1.035 → 1` (`elastic.out(1, 0.45)`) |
| 1.30 | ON window lights, amber wash up to 0.55 |
| 1.34 | volt pulse leaves the bottom terminal into the cable (`CurrentPath` 0→1 + `pulseOnce`) |

Mouse parallax ±6px on `[data-hero-rail]` (fine pointers only, `gsap.quickTo`).
The plug illustration and the old scroll wire are gone; the hint is a mono `.label-mono` label
(`site.hero.scrollHint` = „Priča se nastavlja“) with a pulse sliding down a short wire.
Reduced motion: lever up, window lit, wash on, cable full, words and reveals at 1.

At 360/390 the DIN group sits **below** the text column (default grid order, no `order-first`), so
it can never overlap the H1. The H1 keeps its three stacked words — that is the design (each word
is its own neon tube and its own flicker), and at 360 no single word wraps.

---

## 4. Main line (DESIGN §2)

`MainLine.tsx` keeps the v1 geometry and refresh logic verbatim — routed from DOM measurements,
rebuilt on `refreshInit` **and** `refresh`, `refreshPriority: -999`, `end: () => arrivalScroll()`,
layer `overflow: hidden`, separate bar trigger, no trigger at all under reduced motion. Only the
painting changed:

- sheath `#3A3F4E` at 10px (was `--color-line` at 7px);
- a lighter top edge: the same `d` at 2.4px `#565E70` inside `translate(-2.6 0)` — offsetting the
  stroke costs nothing and reads as the cylinder's lit side on a mostly-vertical cable;
- the energized copper core is 3.4px plus a blurred 10px copy behind it (`.jv-glow-lg`, ≥1024px);
  both paths share one `getTotalLength()` measurement and the same dash tween;
- every bend gets a real **cable clip**: polymer body, top highlight, a steel screw head with a
  slot (built with `createElementNS`, same as the old rings);
- a **stripped end** at the switch: three copper strands and a clamp, parked at `[data-mainline-end]`.

---

## 5. Anatomy — the exploded installation (DESIGN §3.5)

### 5.1 The 14 parts

`01 Kutija` (enclosure, cut away, hatched cavity, knockouts, corner screws) · `02 DIN šina` ·
`03 Osigurač` (B16 MCB) · `04 FID sklopka` (30 mA RCD) · `05 N letva` · `06 PE letva` ·
`07 Vrata` (door with hinges, latch, label field and an opening that frames the modules) ·
`08 Kabl` (3 conductors — brown/blue/yellow-green — cut in the middle, copper strands, arc, tape) ·
`09 Ram` · `10 Mehanizam` (brass contacts, expanding claws, two screws; old + new copies) ·
`11 Maska` (Schuko cover, earth clips, soot, sweep) · `12 Prekidač` · `13 Grlo E27` ·
`14 Sijalica` (brass cap, glass envelope, filament, glow).

Paint order **is** assembly order: box → rail → modules → bars → **door**, and
frame → insert → **cover**. That is why the door frames the modules and the cover sits on the
socket at 100% instead of the mechanism painting over both (the first cut had them inverted).

### 5.2 The clock

One 25-unit master timeline over the pin, split exactly as the brief asks:

```
EXPLODE      3 units   0 – 12 %
5 × 3 beats 18 units  12 – 84 %   (BEAT = 1.2)
ASSEMBLE     4 units  84 – 100 %
```

`e2e/motion.spec.ts` derives its scroll fractions from the same three constants.

**0–12 %** — every part tweens from the identity to its own `(ex, ey, rot, sc)` at once
(12ms stagger, `power2.out`), leader lines draw in with **DrawSVG**, the number labels fade in,
and the mono counter counts to `Delovi: 14` inside the first 40% of the explosion, so it already
reads 14 while the parts are still separating. At 12% everything drops to opacity 0.55.

**12–84 %** — the five steps, `data-step` / `data-beat` / `anatomy-counter` / dots exactly as
CONTRACT. Each step pulls its focus part 70% of the way back toward its assembled place, scales it
1.16 and lights its halo; the micro-animations are the v1 ones re-pointed at the new parts (lever
drops + flash + sparks → lever back + ON window; RCD trips red → test button pressed, lever back,
OK window; copper strands + jagged arc + sparks → four `steps(4)` turns of tape; soot + sparks →
the old mechanism slides out, the new one slides in with a sweep; bulb flickers → steady light).
Leaders dim to 0.45 for the whole story so the drawing stays calm.

**84–100 %** — every part tweens back to `x: 0, y: 0, rotation: 0, scale: 1, opacity: 1` with
`back.out(1.4)` and a 40ms stagger; the overshoot past zero is the screw-tighten. The door closes,
the leaders fade out, the current runs the last stretch, the bulb lights and `anatomy-final` shows.

### 5.3 Why "identity" is literal

Each part is `<g transform="translate(x y)"><g data-part-id><g scale(k)>…</g></g></g>`. The static
placement is on the **outer** group, so the animated inner group carries no transform at all when
assembled. The new e2e assertion reads `element.transform.baseVal.consolidate()?.matrix` — a
missing attribute is the identity — and requires `|a-1|,|d-1| < 0.005`, `|b|,|c| < 0.005`,
`|e|,|f| < 0.5` for all 14.

### 5.4 Layout

Desktop viewBox `0 0 760 620` (1.23:1, close to the 3fr stage box, so the drawing renders ~664×542
instead of the 664×392 a wider box gave). Wall elevation: enclosure top-left, cable run across,
socket and switch bottom-right, pendant above. Pin = 600vh.

Phone viewBox `0 0 360 470`, the same story folded into a portrait column, part **numbers only** on
the leaders (the names do not fit at that scale), pin = 290vh (< 300vh, BRIEF §7). The parts
counter moved into the stage's top-right corner so the controls row stays `counter + 5 × 44px dots`
and the 360×640 no-overlap gate still passes.

Reduced motion: no pin, assembled and lit diorama (`lit` prop), all five cards, counter at `05/05`.

### 5.5 Performance discipline kept from v1

- the pin and its ScrollTrigger are eager (they are the height reservation, CLS stays 0), the
  tweens are built by `whenNear(pin, …)`;
- `invalidateOnRefresh` is **off** on the anatomy trigger now: every tween value is in SVG user
  units, so a resize cannot invalidate them — only `end: () => …` is re-evaluated. That also means
  DrawSVG measures the 14 leader lines exactly once instead of on every refresh;
- the 120-sample `getPointAtLength` path search is gone: the five flow targets are declared in
  `diorama.ts` (`flow: [...]`) instead of being searched for at build time;
- `CurrentPath` still draws with `stroke-dashoffset` (one `getTotalLength()` per mount);
- live fault loops still own their own element (`arc-flicker`, `bulb-flicker`) so a scrub can never
  strand a value the master also writes.

---

## 6. Process (DESIGN §3.7)

Pinned horizontal track ≥768px, vertical below, reduced-motion static — mechanics unchanged.
New: `SectionHeader` sheet 05 inside the pin, `01–04` in 1.5rem mono arc, a dimensional glyph in a
`.jv-bracket` frame (message + bolt, multimeter with probes, screwdriver, shield with a lit bulb),
`display-md` titles, `.card` surfaces, and the cable under the cards at 10px sheath / 3.4px core so
the energised part is as readable as Mile's.

`ProcessGlyphDefs` renders `<Materials />` once per section instead of once per glyph — SVG
`url(#id)` resolves document-wide, and four copies of twenty gradients is pure DOM weight. The
contact switch reuses the pendant's defs for the same reason.

---

## 7. Contact / finale (DESIGN §3.11)

Sequence, clipboard behaviour, triggers and the `[data-mainline-end]` stub are unchanged. New:

- a dimensional **E27 pendant**: drop cable with a lit edge, ceiling rose, polymer skirt, brass
  thread, glass envelope, stem wires and a filament;
- a dimensional **wall switch**: 88px plate with a lit top-left edge and a shaded bottom-right, a
  recessed bezel and a real rocker. The rocker tips with `scaleY: 1 → -1` around its own centre —
  it passes through the flat middle and lands with the lit edge at the bottom, which is what a
  rocker actually does. (The old `y: 18` slide was the one thing that read as a `<div>`.)
- the card is left-aligned with a `.display-lg` title at Mile's contact scale, a `.label-mono`
  „Mejl“ label above the address, and the copy button on `.btn .btn-outline`.

---

## 8. Intro (DESIGN §3.1)

Same timing (≤1.1s, interruptible, once per session, skipped under reduced motion). The bulb glyph
is now a **fuse-box door outline**: enclosure, door panel, DIN rail line, three module outlines, a
cable gland and a dashed base line — with the filament catching inside the middle module and the
halo/radial lift unchanged.

---

## 9. Checks

| check | result |
|---|---|
| `npm run typecheck` | clean |
| `npm run lint` (`--max-warnings 0`) | clean |
| `npm run build` | 0 errors, 0 warnings |
| `npx playwright test e2e/motion.spec.ts e2e/smoke.spec.ts --project=d1440 --project=m390` | **32 passed**, 2 skipped, 0 failed |
| same two specs, all four viewports (m360/m390/t768/d1440) | **64 passed**, 4 skipped, 0 failed |
| `npm run lh` × 6 | Performance **86 / 87 / 87 / 87 / 85 / 96** → median **87** (threshold ≥85) |

Last Lighthouse run (mobile, production build over `vite preview`, Lighthouse mobile preset,
`CHROME_PATH=/opt/pw-browsers/chromium`): Performance 96, Accessibility 100, Best Practices 100,
SEO 100 · FCP 2.2s · LCP 2.2s · TBT 120ms · **CLS 0** · Speed Index 2.5s.

v1's median was 92; the drop to 87 is hydration cost, not layout — TBT went 55ms → 120ms while CLS
stayed 0. The prerendered document is 226 kB (27 kB gzipped), of which the anatomy diorama is
~56 kB. Deduplicating `<Materials />` (8 copies → 3) was the one safe win taken; deferring the
diorama's markup would trade it against "all content is in the DOM without JS", so it was not.

### e2e additions

- `EXPECTED_STEPS` is now `['1','1','2','4','5','5']` for the same
  `[0, 0.2, 0.4, 0.6, 0.8, 1]` scroll fractions — the assertion is unchanged, the mapping moved
  because 12% of the pin is now the explosion rather than step 1's fault beat.
- new test **"the installation comes apart at once and goes back together exactly"**: at 8% of the
  pin it asserts 14 `[data-part-id]` groups exist, ≥10 of them carry a non-identity transform and
  `[data-anatomy-parts]` reads `Delovi: 14`; at 100% every one of the 14 is back to the identity
  within 0.5 user units and `anatomy-bulb[data-lit="true"]`. It also writes
  `test-results/shots/anatomy-<vp>-8.png`.

---

## 10. Screenshots

`docs/reports/v2-motion/`:
`hero-{1440,390}.png`, `anatomy-{1440,390}-{8,20,40,60,80,100}.png`, `process-{1440,390}.png`,
`finale-{1440,390}.png`.

Captured against `npm run preview` (port 4173) with a throwaway Playwright script; the script is
not checked in because `scripts/` belongs to the builder. To reproduce: open the page with
`sessionStorage.jovanIntroSeen = '1'`, scroll to `pinTop + pinDistance * pct` for the anatomy
frames, to 34% of the process pin for the track, and to the contact section top − 40px for the
finale.

Compared side by side with `/home/user/mile-vodoinstalacije/reports/final/{hero,anatomy-step1,
anatomy-step3,anatomy-finale,process,contact}-1440.png`:

- **hero** — the DIN group carries the right half the way Mile's elbow does, with more technical
  chrome (back plate, corner marks, dimension line) than the reference;
- **anatomy** — at 8% a clearly exploded, numbered, leader-lined installation; at 100% a clean
  assembled, lit one. Mile's anatomy is a thin-stroke line drawing; this one is shaded and bolted;
- **process** — same composition as Mile's track, with a dimensional glyph instead of a line icon;
- **finale** — same scale and the same light-cone idea, with a real rocker and a filament bulb.

---

## 11. Open

- The prerendered document is large (226 kB / 27 kB gzipped) and the Lighthouse Performance floor
  across six runs was 85 — at the gate, not above it. If it needs headroom, the lever is the
  anatomy diorama's node count, not the animation.
- The hero H1 is three lines at 360 (one per word). That is the design — each word is its own neon
  tube — and no single word wraps; two lines is only reachable by giving up the per-word ignition.
- A handful of leader labels sit close to their part at 390 (numbers only there). Legible, but the
  phone drawing is the one place where a bit more air would help.
- `.jv-hero-rail` is a hook class with no rule of its own; the parallax targets `[data-hero-rail]`.
