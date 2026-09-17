# v2 redesign — builder log

Reference: `/home/user/mile-vodoinstalacije/reports/final/*.png`. Target: `docs/DESIGN.md` §2–§3.

## What changed

### `src/styles/global.css` (blueprint system)
- Page-fixed blueprint grid on `body::before`: 24px minor lines at 5%, 120px major lines at 9%, both arc-tinted
  (`#8FD8FF`), radially masked toward the edges. Replaces the per-section dot grid as the page texture
  (`.dot-grid` is kept, it is still used by motion-engineer-owned sections).
- Film grain on `body::after`, 6%, `display: block` only from 1024px.
- `#root { position: relative; z-index: 1 }` so content always sits above the fixed grid.
- New classes: `.blueprint-grid`, `.container-x`, `.display-xl/-lg/-md`, `.serif-accent`, `.label-mono`,
  `.sheet-header`/`--center`/`.sheet-label`(+`__word/__num/__sep/__total/__rule/__eyebrow`)/`.sheet-title`/`.sheet-intro`,
  `.corner-marks` (+ `.corner-marks__b` for the bottom pair), `.dim-line`, `.hatch`, `.card`, `.btn`,
  `.btn-primary`, `.btn-outline`, `.service-art` watermark states.
- Services hover micro-animations rewritten for the new dimensional art: `.art-lever`, `.art-door`,
  `.art-drum`, `.art-plug`, `.art-needle`, `.art-spark`, `.art-bulb-glow`, `.art-bulb-wire`.
  All transforms use `transform-box: fill-box`; the block stays gated on
  `(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)`.
- Cursor dot recoloured to volt (ring stays arc), per DESIGN §2's energy/information split.

### New files
- `src/components/svg/ServiceArt.tsx` — six dimensional watermark drawings in a 200×200 box
  (MCB on a DIN rail, distribution board with a door, cable drum, E27 bulb, boiler + Schuko plug, multimeter).
  Built from `Materials` gradients with `PART_OUTLINE` / `PART_HIGHLIGHT`, screw heads, shade bands.
- `src/components/svg/Boards.tsx` — `OldBoard` / `NewBoard`, both 900×540, sharing one hatched wall:
  rusted steel box + three ceramic screw fuses with porcelain glaze + cloth-covered tangled wires + soot smudge
  + a hand-written label vs. white polymer enclosure + two DIN rails + 8 MCBs (`C1–C8`, `16A`) + RCD (`30 mA`,
  test button) + N/PE terminal bars + three conduits.

### Sections
- `Nav`: full-bleed glass bar with a hairline bottom border, 64px tall, bigger wordmark, volt bolt,
  2px volt active underline (unchanged behaviour: hide/reveal, focus trap, scroll lock, IO active link).
- `Trust`: stats now live in an engineering **title block** — a bordered, divided grid inside `.corner-marks`,
  with a sheet-label header row (`List 02 / 10 — Poverenje`) plus a `Demo` cell carrying `trust.demoNote`.
  Count-up, `stat-value`, marquee and `marquee-toggle` unchanged; marquee items got a volt diamond separator.
- `Services`: `SectionHeader` (sheet 04), bigger bento gap/rows, `.card` styling, mono index `01–06`,
  display titles 1.5/1.75rem and a large `ServiceArt` watermark bottom-right (35% desktop / 22% <640px,
  full colour + animation on hover/focus). Per-size text box widths keep copy clear of the drawing.
- `BeforeAfter`: `SectionHeader` (sheet 06) + `.corner-marks` frame + `.dim-line` caption. The new board is
  the base layer and the old board is clipped from the left, so the wipe finally reads left = `Pre`,
  right = `Posle` (v1 had them inverted relative to the tags). Slider mechanics and a11y unchanged.
- `Testimonials` (sheet 07): `SectionHeader`, `.card` quotes with a rule between name and area.
- `Faq` (sheet 08): `SectionHeader`, mono index `01–06` per trigger, round `+/–` marker, roomier rows.
- `Footer`: `List 10 / 10` sheet label above the copyright, outline button.

### e2e
- `services-1440.png` is now a viewport clip instead of an element screenshot.
- New `blueprint section screenshots` describe block captures `trust-1440.png`, `before-after-1440.png`
  and `faq-1440.png` (d1440 only, viewport clips).
- The services geometry assertion (no descendant overflowing its card) is unchanged and still passes.

## Checks

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | pass (0 warnings) |
| `npm run build` | pass, prerender complete |
| `PW_PORT=4174 npx playwright test e2e/smoke.spec.ts e2e/nav.spec.ts e2e/interactions.spec.ts` | 104 passed, 16 skipped (d1440-only shots), 0 failed |
| Console during the screenshot pass (1440 + 390) | no errors, no warnings |

## Screenshots
`docs/reports/v2-builder/` — `trust`, `services`, `services-grid`, `before-after`, `testimonials`, `faq`,
`footer` at `-1440` and `-390`.

## Open issues
- `src/sections/{Hero,Anatomy,Process,Contact,IntroReveal}.tsx` and `src/motion/*` are motion-engineer-owned and
  still carry v1 chrome at the time of this log; they will pick up `SectionHeader`, `.card` and the sheet classes.
- Lighthouse (G3) not re-run here; the added SVG is inline markup only, no new network requests.
