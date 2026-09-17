# DESIGN DIRECTION v2 — „Radionica pod naponom“ (redesign, 2026)

Reference the client loves: `/home/user/mile-vodoinstalacije` (plumber site) — read its `CLAUDE.md`, look at `reports/final/*.png`
(hero-1440, anatomy-step3-1440, anatomy-finale-1440, services-1440, process-1440, before-after-1440, contact-1440) and skim
`src/components/svg/HeroElbow.tsx`, `pipe-style.ts`, `AnatomyAssembly.tsx` for the illustration technique.
What works there and must be matched or beaten here: a **technical-drawing world** (blueprint grid, sheet numbers, dimension lines,
hatching, corner marks), **big dimensional illustrations** (shaded, highlighted, bolted — not thin outlines), generous display type,
rich cards with large titles and watermark icons, one continuous energised line down the left margin, and the "Sastavljeno" finale.
What we keep from v1: palette, fonts, copy, ids/testids (docs/CONTRACT.md), Lenis+GSAP architecture, gates.

## 1. Concept
A night in an electrician's workshop. The page is a set of **blueprint sheets** („List 01/10 … 10/10“) pinned on a dark board.
Every illustration is a real component drawn like a product cutaway: DIN-rail breakers, an RCD, terminal bars, a Schuko socket,
a lamp holder, cable with copper strands. The story: the power is out → we open the board and **take the whole installation apart
at once** (exploded view) → each faulty part is shown and fixed → **everything snaps back together at once** → the light comes on.

## 2. Visual system
- Background `#0A0B10`, surfaces `#13151E`/`#171A26`, lines `#262B3B`. Blueprint grid: fine lines every 24px at 5% and major lines
  every 120px at 9% (arc-tinted `#8FD8FF`), fixed to the page (not per section), plus 6% film grain on ≥1024px.
- Volt `#FFB92B` (gradient `#FFD36A→#F59E0B`) is *energy* only: current, glow, primary buttons, lit filament, eyebrows.
  Arc `#8FD8FF` is *information*: dimension lines, sheet labels, callouts, indicators, links. Fault `#FF6A3D` only in fault beats.
- Materials (SVG gradients, shared defs in `src/components/svg/Materials.tsx`, light from top-left):
  `copper` (#F6C08B→#C96A2C→#7A3B12), `brass` (#F2D98A→#B8912E), `polymer-dark` (#2A2F3D→#151823), `polymer-light`
  (#F3F1EA→#C9C7BE), `steel` (#D7DBE3→#8A8F9C→#5C616D), `insulation-blue` (#6BA8FF→#2C5FBF), `insulation-brown`
  (#A8663A→#5E3418), `insulation-ye-gn` (stripes #F1D33B/#3FA34D), plus `glow-volt`, `glow-arc` radial gradients and a
  `soft-shadow` filter (used sparingly, ≥1024px only). Every part: 1.25px outline `#0A0B10` at 60%, a 1px top-left highlight at
  35% white, a bottom-right shade band. Screw heads: circle + slot + highlight. Nothing is a plain flat rectangle.
- Sheet chrome per section: eyebrow `LIST 03 / 10 ———` (mono, arc), title in display 800 (`clamp(2.5rem, 6vw, 5.5rem)`), optional
  subtitle; corner marks `⌐ ¬` at the section's frame; thin dimension line with ticks under key illustrations, hatch (`////`) for
  walls. `SectionHeader` component owns this.
- Type: Bricolage 800 display (hero up to 9rem, tight tracking, `text-wrap: balance`), Instrument Serif italic for the human line,
  Geist 17/1.6 body, JetBrains Mono for labels/counters/dimensions. Cards: 1px line, 12px radius, surface + subtle inner top light,
  hover lifts 2px + line brightens to arc 40%.
- Left margin (≥1024px): the **main cable** is a real cable: 10px grey PVC sheath (`#3A3F4E` with a lighter top edge), copper core
  visible only where energised (volt glow), **cable clips** (obujmice) with a screw at every bend, a stripped end at the switch.
  <1024px: the top progress bar stays.

## 3. Sections and choreography (all ids/testids unchanged — see CONTRACT)
1. **Intro** (≤1.2s): a fuse-box door outline in the dark; a filament glows, then the dark „lifts“ radially. Interruptible.
2. **Nav**: as now, blueprint chrome; active link gets a 2px volt underline; wordmark bolt in volt.
3. **Hero** (like Mile's layout, mirrored intent): left the three words (neon ignition, ≤3 changes each) + „Jovan rešava.“ + two CTAs;
   right a **large dimensional DIN-rail group**: an MCB (grey polymer body, white lever, „B16“ label, screw terminals with copper) next
   to an RCD (test button, „30 mA“) on a steel DIN rail, drawn 520px tall at 1440 with a dimension line („2 modula · 36 mm“), casting a
   soft amber glow once ON. Sequence: words ignite → the **MCB lever snaps up** (ON, with a „klak“ scale-pulse) → a volt pulse leaves
   the breaker's bottom terminal into the cable that becomes the main line. Mouse parallax ±6px on fine pointers. The old plug
   illustration and the scroll wire are replaced by: a mono „Prati struju“ label with a small pulse sliding down the main cable start.
4. **Trust**: stats in a blueprint „title block“ (like an engineering drawing's title block: boxes with mono labels), marquee below.
5. **Anatomy — exploded installation (the centrepiece).** Pinned stage. One SVG diorama of a mini installation drawn as a cutaway:
   distribution box (enclosure, DIN rail, MCB, RCD, N/PE terminal bars, door), a cable run (3 conductors: blue/brown/yellow-green,
   copper strands at the cut), a Schuko socket (cover, frame, insert with brass contacts, claws, two screws), a switch, and a lamp holder
   with an E27 bulb. Timeline over the pin (desktop 600vh, phone ≤300vh):
   - **0–12 % Rastavljanje** — the *whole* installation explodes **at once** along per-part axes (enclosure door swings and lifts, DIN
     rail parts slide up, socket cover lifts toward the viewer with scale 1→1.08, screws spin out, conductors fan apart), arc-coloured
     **leader lines + part numbers** (`01 Kutija`, `02 DIN šina` …) draw in with DrawSVG, a mono „Delovi: 14“ counter counts up.
   - **12–84 % Pet kvarova** (5 steps × fault/fix/flow, cards + counter + dots exactly as CONTRACT): each step brings its part forward
     (translate toward the viewer + glow), shows the fault micro-animation (lever drops + spark; RCD trips red; cable break with
     jagged arc + sparks then insulating tape wraps; socket soot + sparks then old insert slides out / new slides in; bulb flickers
     then burns steady), then a volt pulse travels to the next part. Parts not in focus stay exploded and dimmed to 55%.
   - **84–100 % Sastavljanje** — everything snaps back **at once** (each part on its own axis, `back.out(1.4)`, staggered by 40ms with
     tiny screw-tighten rotations), the door closes, current runs through the whole line, the bulb lights, `anatomy-final`
     „Spojeno. Bez varnica.“ in Instrument Serif. Scrub-safe both directions. Phone: vertical diorama, card below, no overlaps at
     360×640. Reduced motion: assembled + lit diorama, all five cards listed.
6. **Services**: bento with big titles (display 1.5–1.75rem), each card a large **watermark illustration** bottom-right (25% opacity,
   dimensional: breaker, board, cable drum, bulb, boiler+plug, multimeter) that comes to full colour and animates on hover (lever flips,
   bulb lights, plug enters, needle swings, spark). Tilt/spotlight on fine pointers only.
7. **Process**: horizontal pinned track like Mile's (numbered `01–04` mono, glyph in a bracket frame, big title), the cable under
   the cards energises with progress; vertical <768px.
8. **Before/after**: two dimensional boards (old: ceramic fuses, cloth wires, soot; new: MCB row, RCD, labelled circuits, tidy
   conduits) with the same slider mechanics; a mono „Pre“/„Posle“ tag.
9. **Testimonials / 10. FAQ**: as now with the new chrome (sheet labels, card style).
11. **Contact/finale**: the cable arrives at a dimensional **wall switch** (real rocker), the **pendant bulb** (E27 holder, filament),
    the cone of light, the glass card with a big display title like Mile's contact. Sequence unchanged (CONTRACT).
12. **Footer**: minimal + „List 10/10“. Sheet numbers: hero 01, trust 02, anatomy 03, services 04, process 05, before/after 06, testimonials 07, faq 08, contact 09, footer 10 (`SHEETS` in `src/components/SectionHeader.tsx`).

## 4. Motion rules (unchanged, non-negotiable)
Transform/opacity/stroke-dashoffset/clip-path only; photosensitivity limits (≤3 changes per flicker, ≤600ms, never >3/s);
reduced motion = complete static experience; Lenis on gsap ticker; `useGSAP` cleanup; near-viewport init with reserved heights;
CLS < 0.05; Lighthouse mobile ≥85/95/95/100. Eases: `expo.out` for reveals, `back.out(1.4)` for snaps, `power2.inOut` for scrubs.

## 5. Acceptance (visual)
Fable compares screenshots against Mile's: hero must read as rich as `hero-1440.png`; anatomy must show a clearly exploded, labelled
installation at 8% and a clean assembled lit one at 100%; services cards must feel as substantial as Mile's; nothing flat, empty
or thin-lined remains.
