# Review 3 — v2 redesign (reviewer, read-only)

Commit read: **807cef7** (`v2: motion visual iteration, report and decisions`), working tree clean at read time.
Motion-owned files (`src/motion/*`, `src/sections/{Hero,Anatomy,Process,Contact,IntroReveal}.tsx`,
`src/sections/anatomy/*`) were reviewed **as they were at that commit** while the motion engineer was editing them.

Evidence: `docs/reports/v2-motion/*.png` (06:20), `docs/reports/v2-builder/*.png` (05:45 — predates the motion
commit, so its anatomy/hero/process crops are stale), `/home/user/mile-vodoinstalacije/reports/final/*-1440.png`,
`dist/index.html` (06:26, fresh), `npm run typecheck` + `npm run lint` (both pass, 0 errors / 0 warnings).
Not run (port 4173 in use): Playwright, build, preview, Lighthouse.

**Counts: 0 critical · 5 major · 16 minor.**

---

## Major

### MAJ-1 Anatomy callouts are painted underneath the parts → unreadable
`src/sections/anatomy/Diorama.tsx:398-403` renders `<g data-leaders>` *before* the parts
("leader lines sit under the parts so a part never hides behind text" — the opposite happens: the text hides
behind the parts). Combined with label anchors that land inside exploded part geometry
(`src/sections/anatomy/diorama.ts:62,70,72,74`: `rail lx 322/ly 300`, `socket-insert lx 752/ly 396`,
`switch lx 752/ly 600`, `bulb lx 752/ly 158`), the numbered callouts are clipped on every desktop frame:
`anatomy-1440-8.png` shows `32 DIN šina` (the `0` covered), `M hanizam`, `14 ijalica`, `12 Prekidač` cut by the
switch, `Maska` colliding with `02 DIN šina`. This is the centrepiece and DESIGN §3.5 requires legible
`01 Kutija / 02 DIN šina …` callouts.
**Fix:** split the group — keep `[data-leader-line]` below the parts, render a second `<g>` holding every
`[data-leader-label]` *after* the parts map (same `opacity` tweens, selector unchanged); and move the four
colliding anchors outward (`socket-insert` → `lx 760/ly 470`, `switch` → `lx 700/ly 620`, `bulb` → `lx 756/ly 120`,
`rail` → `lx 300/ly 330`) so no label box overlaps an exploded part.

### MAJ-2 `aria-label` on a `<p>` (ARIA-prohibited attribute) in every section header
`src/components/SectionHeader.tsx:29` — `<p className="sheet-label" aria-label={...}>`. `role=paragraph`
prohibits `aria-label`; axe/Lighthouse report `aria-prohibited-attr`, which puts the Accessibility ≥95 gate
(BRIEF §7/§9 G4) at risk, and the label is silently dropped by several screen readers.
**Fix:** drop the `aria-label` and give the parts real text, e.g. a visually hidden
`<span className="sr-only">List 03 od 10:</span>` before the number and `aria-hidden` on the decorative rule,
or wrap the run in `<span role="img" aria-label="…">`.

### MAJ-3 Pinned anatomy stage reads empty; the assembled finale is small and off-centre
Desktop viewBox `760×620` (`src/sections/anatomy/diorama.ts:114`) is much larger than the drawing's ink: at 1440
(`anatomy-1440-100.png`) the assembled installation occupies ~35 % of the stage with ~200 px of dead space below
it, and the whole composition sits left of the stage centre while the right column (counter + dots at y≈324, card
at y≈365-570) floats in another ~300 px of emptiness. DESIGN §5 asks the anatomy to read as rich as Mile's
`anatomy-finale-1440.png`; today it is the thinnest screen of the page.
**Fix:** crop the viewBox to the real ink box (about `100 40 620 540`) and re-centre the assembled group, or add
`lg:min-h-[64svh]` + `-mt-*` so the drawing fills the 3fr column; pull the counter/dots row
(`src/sections/Anatomy.tsx:470-495`) down next to the card instead of 40 px above it.

### MAJ-4 Socket "soot" is a bright orange blob
`src/sections/anatomy/Diorama.tsx:173` — `<ellipse data-part="soot" fill="#FF6A3D">` tweened to `opacity: 0.5`
(`src/sections/Anatomy.tsx:363`). On `anatomy-390-60.png` it reads as an orange glow/rendering error, not as the
`čađava mrlja` BRIEF §6.5.4 asks for, and it spends the fault colour on a surface rather than a state.
**Fix:** paint the soot dark (`fill="#07080C"`, target `opacity: 0.55`, feathered with a small radial gradient)
and keep `--color-fault` for a thin scorch rim plus the existing sparks.

### MAJ-5 The finale is the only section without sheet chrome
`src/sections/Contact.tsx:367` renders a bare `label-mono` eyebrow; DESIGN §3.12 assigns contact **List 09 / 10**,
and Trust (02), Anatomy (03), Services (04), Process (05), Before/after (06), Testimonials (07), FAQ (08) and
Footer (10) all carry it. `finale-1440.png` shows just `KONTAKT`, so the sheet story visibly breaks at the climax.
**Fix:** render `SectionHeader sheet={9} eyebrow={site.contact.eyebrow} title={site.contact.title}` inside the card
(with `as="h2"`, the existing `h2` removed), or at minimum the `sheet-label` span row above the eyebrow.

---

## Minor

1. `src/sections/anatomy/Diorama.tsx:386` — `role="img" aria-label={label}` repeats the section `h2`
   ("Svaki kvar ima uzrok. Jovan ga nalazi."). Describe the drawing instead ("Šema instalacije: tabla, kabl,
   utičnica, prekidač i sijalica").
2. `src/sections/Anatomy.tsx:537-545` — `Delovi: 14` stays on screen through the assembled finale
   (`anatomy-1440-100.png`). Fade it with the leaders at `ASSEMBLE_START`.
3. `src/sections/Anatomy.tsx:600-602` — `anatomy-final` is pinned to the stage's bottom inset, ~110 px below the
   assembled drawing and left of centre. Place it directly under the diorama (or inside the SVG's bottom margin).
4. `src/sections/anatomy/diorama.ts:78-92` — phone leaders print bare numbers (`01`…`14`) with no legend
   (`anatomy-390-8.png`), so they carry no meaning. Show the name for the focused part only, or drop the numbers
   on phones.
5. `src/sections/Process.tsx:125` — the track pads `px-[6vw]` (≈86 px at 1440) while the main cable runs at
   x ≈ 17-91 (`src/motion/MainLine.tsx:131-132`): in `process-1440.png` the cable and a clamp are painted over
   card 01. Pad the track to `max(6vw, 7rem)` at ≥1024px (Mile leaves the same strip free).
6. `src/motion/MainLine.tsx:129` — `contentWidth = Math.min(1152, …)` no longer matches `.container-x`
   (`max-width: 80rem` = 1280, `src/styles/global.css:470-480`), so the gutter/bend maths drifts from the real
   content box. Read the container width or share a token.
7. `src/motion/parts.tsx:49-65` — `Terminal` fills the whole well with `url(#m-copper)`; six saturated orange
   blocks end up as the loudest element of the hero illustration (`hero-1440.png`). Inset the copper, darken it and
   put a steel screw head on top, as DESIGN §2 describes.
8. `src/sections/Hero.tsx:115-129` — the amber field drift and the hint-pulse are infinite per-element loops that
   also run on phones; BRIEF §7 asks for "nema stalne petlje po elementu" on mobile. Gate both with
   `isSmallOrCoarse()`.
9. `src/motion/flicker.ts:18` — the opening `.set(target, { opacity: dim })` is a 4th brightness change whenever the
   target is at full brightness on entry (only safe today because every caller pre-dims). Guard with
   `if (gsap.getProperty(target,'opacity') > dim) ` … or start the timeline from the current value.
10. `src/sections/Trust.tsx:65` + `:89-95` — demo data is marked twice (badge in the title bar *and* a fourth
    title-block cell); one of them is enough and the 3-stat rhythm reads better (`trust-1440.png`).
11. `src/sections/Trust.tsx:104-105` — `onFocus`/`onBlur` pause the marquee, but nothing inside it is focusable, so
    the "pause on focus" requirement (BRIEF §6.4) is satisfied only by the explicit toggle.
12. `docs/reports/v2-motion/hero-390.png` — the DIN group's dimension label (`2 modula · 36 mm`, rendered by
    `src/motion/HeroRail.tsx`) is ~7 px tall and unreadable on phones. Hide the dimension line below 640 px.
13. `src/styles/global.css:812-822` — `.service-art { opacity: .35 }` (0.22 under 640 px) leaves the watermarks
    grey and flat next to Mile's `services-1440.png`; card 01 in `services-grid-1440.png` has a large empty band.
    Raise to ~0.5 and let the material gradients show.
14. `dist/index.html` — `og:image` / `twitter:image` are relative (`/og.png`) and there is no `canonical`. Correct
    while `siteUrl` is empty, but crawlers need absolute URLs; make `scripts/` emit them the moment `siteUrl` is set
    (BRIEF §8).
15. `src/sections/Contact.tsx:327` — the cable stub is positioned with a magic `top-[258px]`; it is only correct
    because the pendant SVG is a fixed 150×210. Anchor it to the switch element instead.
16. `src/config/site.ts` (`hero.scrollHint`) — the hero hint reads `PRIČA SE NASTAVLJA`; DESIGN §3.3 specifies
    `Prati struju` on the start of the main cable. Copy is frozen, so this needs the supervisor — flagging the
    mismatch only.

---

## Verified OK

- **Motion rules.** Only `transform` / `opacity` / `stroke-dashoffset` / `clip-path` are animated; the anatomy tape
  uses a clip-rect width (DESIGN §4 allows clip-path). `flickerOn` = 3 changes in ≤0.6 s (`flicker.ts:10-36`);
  `flickerFault` = 2 changes per ≥0.8 s cycle ≤ 2.5/s (`flicker.ts:45-66`); sparks are 8-14 lines, 0.3-0.6 s,
  halved on coarse pointers, `pointer-events: none`, `aria-hidden`, and spawn only while `active` **and** on screen
  (`Sparks.tsx:107-135`, `motion.css:11-18`).
- **Reduced motion.** Anatomy (`Anatomy.tsx:112-117`, 575-587: assembled + lit + all five cards), Hero
  (`Hero.tsx:55-62`), Process (`Process.tsx:38-41`), Contact (`Contact.tsx:109-119`), MainLine
  (`MainLine.tsx:248-257`, no trigger at all), Sparks (static glyph), CurrentPath (no pulse). No pin, no scrub.
- **Cleanup / StrictMode.** Every scene is inside `useGSAP` with `revertOnUpdate`; `whenNear` observers, the
  `IntersectionObserver`s, the pointermove listener (`Hero.tsx:166`), ScrollTrigger `refreshInit`/`refresh`
  listeners (`MainLine.tsx:368-377`) and the ref-counted `installMotionWatchers` disposer are all released.
- **Scrub both directions / resize.** The anatomy master is one paused timeline of fixed length `TOTAL = 25`
  (`Anatomy.tsx:20-25,131-132`) with all values in SVG user units, so a resize only re-evaluates the pin `end`
  (`Anatomy.tsx:212`); the last tween ends at t≈24.2, so the mapping stays exact. Near-viewport build with a
  reserved `min-h-app` box plus a 4 s safety net (`Anatomy.tsx:123-127,453`).
- **Mobile.** `anatomy-390-*.png`: drawing, counter, dots and card stack inside one screen with no overlap; stage
  capped at 42svh / 34svh on short phones (`motion.css`), phone pin 2.9×`innerHeight` < 300vh
  (`Anatomy.tsx:212`), dots are 44×44 targets (`Anatomy.tsx:485`), safe-area helpers and the `dvh/svh` `min-h-app`
  are in place, no `overflow-x` hacks.
- **A11y basics.** One `h1` with `aria-label` and `aria-hidden` word spans (`Hero.tsx:201-218`); `h2` per section,
  `h3` per card — order is clean; decorative SVG all `aria-hidden`; `:focus-visible` arc ring;
  `--color-line-strong` at ≥3:1 for outlined controls; volt text/buttons on `#0A0B10` well above AA.
- **SEO/prerender.** `dist/index.html` (fresh) contains the hero words, `Spojeno. Bez varnica.`, the sheet labels,
  title `Električar Jovan | Beograd`, description, OG/Twitter tags, `theme-color`, `Electrician` JSON-LD with no
  phone/`aggregateRating`/address, and the pre-hydration `data-motion`/`data-pointer`/`data-intro` script.
- **Static gates.** `npm run typecheck` and `npm run lint` both clean.

---

## DESIGN.md §3 coverage

| § | Status |
|---|---|
| 3.1 Intro | Present (`IntroReveal.tsx`, `motion/intro.ts`, `.jv-intro*` in `motion.css`, session + reduced-motion skip via the inline script). **Not verified in detail this pass** (fuse-box door outline, ≤1.2 s, interruptibility). |
| 3.2 Nav | Blueprint chrome and volt wordmark bolt confirmed in `hero-1440.png`/`hero-390.png`; the 2 px volt active-link underline was not verified in code this pass. |
| 3.3 Hero | Done: three-word neon ignition, sparks on „Varniči?“, serif tagline, dimensional B16 + 30 mA DIN group with dimension line, ±6 px parallax (`Hero.tsx:149-156`), breaker "klak" and the volt pulse into the cable. Deviations: hint copy (minor 16), phone dimension label (minor 12), terminals (minor 7), H1 set entirely in volt where Mile uses white display + coloured accent. |
| 3.4 Trust | Title block + marquee done; demo marking duplicated (minor 10). |
| 3.5 Anatomy | Implemented end to end — explode at once with leaders and `Delovi` count-up, 5 × fault/fix/flow with focus-forward + `DIM 0.55`, snap back with `back.out(1.4)` + 40 ms stagger, current through the line, bulb lit, `Spojeno. Bez varnica.` Open: MAJ-1, MAJ-3, MAJ-4, minors 1-4. Screws do not visibly "spin out"/"tighten" (`rot` is part-level only) — simplification. |
| 3.6 Services | Bento + watermark art + hover micro-animations (lever, door, drum, plug, needle) gated to fine pointer + full motion (`global.css:269-343`). Watermarks too faint (minor 13). |
| 3.7 Process | Horizontal pinned track, mono `01-04`, bracket-framed glyphs, cable energising with progress, vertical <768 px. Cable/card collision (minor 5); cards feel airy but match Mile. |
| 3.8 Before/after | Two dimensional boards + slider present (`before-after-1440.png`); not re-audited this pass. |
| 3.9 / 3.10 Testimonials / FAQ | New sheet chrome (sheets 07/08) applied; card style consistent. |
| 3.11 Contact | Full four-beat finale with a dimensional rocker, E27 pendant, light cone and glass card; missing sheet label (MAJ-5), magic offset (minor 15). |
| 3.12 Footer | `List 10 / 10` present (`Footer.tsx:19-25`). Sheet numbering matches the table for 02-10. |
| §2 Materials | `m-copper, m-brass, m-polymer-dark/light, m-steel, m-ins-blue/brown/ye-gn, m-hatch, m-glow-volt, m-glow-arc, m-soft-shadow` all defined (`Materials.tsx:10-57`) and used; outline/highlight/shade convention honoured in `parts.tsx` and `Diorama.tsx`. |
| §2 Main cable | Real cable with 10 px sheath, lighter top edge, generated clamps with screws and a stripped end (`MainLine.tsx:184-232`); `<1024px` progress bar kept. Gutter constant drift (minor 6). |
