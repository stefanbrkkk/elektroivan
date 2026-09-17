# Phase 2 — builder report

Date: 2026-09-17. Scope: deliverables 1–10 from the phase-2c delegation (visual polish per BRIEF §4, §6.2/6.4/6.6/6.8/6.9/6.10/6.12, §7 mobile/a11y/SEO/perf, §9 G2) on the files owned by `builder` (see `docs/CONTRACT.md`), run in parallel with `motion-engineer` on their disjoint files. `App.tsx`, `src/config/site.ts` and `src/motion/*` were never edited.

## Changed files

`src/sections/{Nav,Trust,Services,BeforeAfter,Testimonials,Faq,Footer}.tsx`, `src/components/Cursor.tsx`, `src/main.tsx`, `src/entry-server.tsx`, `src/styles/global.css`, `playwright.config.ts`, `e2e/smoke.spec.ts` (extended), `e2e/nav.spec.ts` (new), `e2e/interactions.spec.ts` (new), `docs/DECISIONS.md`.

## What was done, per deliverable

1. **Nav** — sticky glass header (64px), bolt wordmark, `nav-link-<id>` anchors, volt `nav-cta` (`data-magnetic`, text `#0A0B10`). Hide-on-scroll-down/show-on-scroll-up via a passive rAF-throttled scroll listener with a 12px hysteresis band and a 96px top-of-page exemption, transform-only (`-translate-y-full`/`translate-y-0`), never while the mobile panel is open. Active-section indicator via `IntersectionObserver` (`aria-current="true"`, `-35%/-50%` root margin). Mobile breakpoint moved to **1024px** (phase-1 placeholder used 768px — see DECISIONS). Full-screen `nav-menu` panel: `role="dialog"`/`aria-modal` only while open, real focus trap (Tab/Shift+Tab cycle inside), Escape closes, focus returns to `nav-toggle` on close, closes after a link is chosen, staggered `gsap.fromTo` entrance (skipped under reduced motion). Scroll lock via `lenis?.stop()`/`start()` + `<html>` `overflow:hidden`, restored on close.
2. **Trust** — count-up via `gsap` + `ScrollTrigger` (`once: true`, skipped under reduced motion, which shows the SSR final values), reserved `Nch` width per stat, `tabular-nums`. Fixed a hover/manual-pause state conflict on the marquee toggle (see DECISIONS).
3. **Services** — true 4-column bento (`grid-flow-dense`, `auto-rows-[11rem]`): 1 col <640px, 2 cols ≥640px, the intended 4×3 asymmetric bento ≥1024px (lg 2×2 + three md 2×1 + two sm 1×1 = 12 cells exactly). Six purpose-built icons with fine-pointer-only CSS hover/focus micro-animations (breaker lever flip, bulb glow, plug slide, meter needle, bolt sparks, current-flow wire overlay — all with an always-visible base state, per BRIEF §7's "everything readable without hover" rule). Cursor spotlight (radial-gradient via `--spot-x/--spot-y`) and ≤6° 3D tilt, both fine-pointer-gated and rAF-implicit (React state-free, direct `style.setProperty`). Staggered scroll-reveal (`gsap`, `once`, skipped under reduced motion). **Found and fixed a real Chromium rendering bug** in the pinned browser build where the tilt transform, if applied to a `flex h-full` box, corrupted descendant SVG sizing for narrow grid cells — see DECISIONS for the root-cause isolation and fix (tilt now scoped to a small `inline-block` icon wrapper only).
4. **BeforeAfter** — enriched both illustrations (ceramic fuses + raised caps + soot for the old panel; six labelled MCBs + a distinct RCD/"FID" module + a tidy bundled-wire fan for the new one), still clearly illustrative, never photographic. Fixed arrow-key step to ±2 (was ±5) and widened the `ba-slider` hit area to 44px (was a literal 0px-wide box) per §7's touch-target rule; divider/handle stay pixel-synced to the same `value`.
5. **Testimonials** — real SVG volt stars (`role="img" aria-label="5 od 5"`, was plain `★` glyphs). Fixed the same hover/manual-pause conflict as Trust, and re-scoped the hover/focus handlers to the row-track container instead of the whole `<section>` (the toggle button was previously inside that region, so focusing it after a click kept the rows paused forever — caught by `interactions.spec.ts`, see DECISIONS).
6. **Faq** — `grid-template-rows: 0fr → 1fr` animated panel height (global reduced-motion rule already makes this instant), `aria-hidden` kept in sync with `aria-expanded`, ArrowUp/ArrowDown/Home/End move focus between `faq-trigger`s (Enter/Space already worked via native `<button>` semantics).
7. **Footer** — `back-to-top` now calls the shared `scrollToHash('#pocetak', ...)` helper instead of duplicating Lenis/`window.scrollTo` logic.
8. **Cursor** — dot + ring via `gsap.quickTo`, ring grows over `a, button, [role=button], [role=slider]`, magnetic pull on `[data-magnetic]` (added to `nav-cta`), fine-pointer + full-motion only, hidden on window `mouseout`, native cursor restored for `input/textarea/select/[contenteditable]`. Rendered as a sibling of `<App/>` in `main.tsx`/`entry-server.tsx` (not inside the frozen `App.tsx`) so SSR/hydration trees stay identical.
9. **SEO/perf** — verified `dist/index.html` still has title/description/OG/Twitter/JSON-LD (unchanged from phase 1, still correct: canonical/telephone/`aggregateRating`/address all correctly omitted while `siteUrl`/`phone` are empty), favicon/apple-touch-icon/robots.txt/sitemap.xml, font preload, gsap's own chunk. No CLS regressions observed (Lighthouse not re-run this phase — motion-engineer's sections are still in flux; recommend a final `npm run lh` pass once all sections are done).
10. **e2e** — extended `smoke.spec.ts` (service/FAQ/stat/marquee/testimonial existence counts) and added `nav.spec.ts` (all 6 nav links + both hero CTAs scroll to their section; mobile-menu open/close/`aria-expanded`/Escape+focus-return/Tab-trap/close-on-link, gated to <1024px viewports; skip-link). `interactions.spec.ts` covers contact-copy clipboard + toast, FAQ keyboard (Enter/Space + Arrow/Home/End), `ba-slider` keyboard, and marquee/testimonials pause toggles (`aria-pressed` + `animationPlayState`). `playwright.config.ts` gained `PW_PORT`/`PLAYWRIGHT_BASE_URL` support so this agent's runs never collide with another agent's preview server.

## Checks run

```
npm run typecheck   → 0 errors
npm run lint        → 0 errors, 0 warnings
npm run build       → 0 errors, 0 warnings (client + SSR + prerender)
```

`npm run test:e2e` restricted to own specs (`e2e/smoke.spec.ts e2e/nav.spec.ts e2e/interactions.spec.ts`, never `e2e/motion.spec.ts`), against `npm run build && vite preview` on all 4 projects (m360/m390/t768/d1440), using `PW_PORT` to avoid clashing with the motion-engineer's own preview server:

```
100 passed, 4 skipped (mobile-menu tests correctly skipped on d1440 ≥1024px)
```

Run twice more for stability after fixes; one transient single-test failure (a console-warning check on `t768`, "no console errors/warnings") did not reproduce on immediate re-run in isolation or on two subsequent full-suite runs — most likely parallel-worker/resource-contention noise from two Playwright workers sharing the machine with a concurrently-running agent, not a code defect.

Manual verification beyond the automated gates (screenshots in `test-results/shots/`, cleared by each Playwright run's `outputDir` reset — re-generate with the scratchpad scripts described in this report if needed): confirmed Trust's stat count-up reaches the exact configured values (`8+`, `640+`, `35 min`) after a real scroll-into-view, confirmed Services' scroll-reveal correctly reaches `opacity: 1` after a real scroll, and confirmed all 6 service icons render at 28×28 in every bento cell after the Chromium-tilt-bug fix (see DECISIONS).

## Open issues / notes for the next phase

- `src/motion/*`, `Anatomy.tsx`, `Contact.tsx`, `Hero.tsx`, `IntroReveal.tsx`, `Process.tsx` are motion-engineer's in-progress work (not evaluated here); `e2e/motion.spec.ts` was never run by this agent per instructions.
- The delegation flagged that `interactions.spec.ts`'s contact-copy test might fail until motion-engineer finishes `Contact.tsx` — it passed in every run during this session (Contact's copy-to-clipboard logic was already functional in the phase-1 baseline), but re-run it once motion-engineer's Contact animation work lands, since it wasn't re-verified after their most recent edits.
- Lighthouse (`npm run lh`) was not re-run this phase (not in this delegation's verify list, and motion-engineer's sections are still changing); worth a fresh pass once all sections are final.
- A handful of untracked `probe*.tmp.mjs` files and `src/motion/intro.ts`/`motion.css`/`sections/anatomy/` at the repo root belong to motion-engineer's concurrent session — left untouched.
