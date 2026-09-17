# CONTRACT — locked interfaces (phase 1). Do not change without the supervisor.

## Section order, ids, testids, owners
| # | Section | Element / id | `data-testid` | File | Owner |
|---|---|---|---|---|---|
| 1 | Intro reveal (loader) | `<div>` overlay, stays mounted (inert, `hidden` when done) | `section-intro` | `src/sections/IntroReveal.tsx` | motion-engineer |
| 2 | Navigation | `<header id="navigacija">` | `section-nav` | `src/sections/Nav.tsx` | builder |
| 3 | Hero | `<section id="pocetak">` (contains the only `<h1>`) | `section-hero` | `src/sections/Hero.tsx` | motion-engineer |
| 4 | Trust (stats + marquee) | `<section id="poverenje">` | `section-trust` | `src/sections/Trust.tsx` | builder |
| 5 | Anatomy of a fault | `<section id="anatomija">` | `section-anatomy` | `src/sections/Anatomy.tsx` | motion-engineer |
| 6 | Services | `<section id="usluge">` | `section-services` | `src/sections/Services.tsx` | builder |
| 7 | How I work | `<section id="kako-radim">` | `section-process` | `src/sections/Process.tsx` | motion-engineer |
| 8 | Before / after | `<section id="pre-posle">` | `section-before-after` | `src/sections/BeforeAfter.tsx` | builder |
| 9 | Testimonials | `<section id="utisci">` | `section-testimonials` | `src/sections/Testimonials.tsx` | builder |
| 10 | FAQ | `<section id="pitanja">` | `section-faq` | `src/sections/Faq.tsx` | builder |
| 11 | Finale / contact | `<section id="kontakt">` | `section-contact` | `src/sections/Contact.tsx` | motion-engineer |
| 12 | Footer | `<footer id="podnozje">` | `section-footer` | `src/sections/Footer.tsx` | builder |

Sections 3–11 live inside `<main id="sadrzaj">` (skip link target). Order in `src/App.tsx` is exactly the table order; `MainLine` is rendered once at the top of App (fixed/absolute overlay).

### Other frozen testids / hooks
- Nav: `nav-toggle` (mobile button, `aria-expanded`), `nav-menu` (mobile panel), `nav-link-<id>` (anchor links, id = section id), `nav-cta` (→ `#kontakt`), `skip-link`.
- Hero: `hero-title` (`<h1>` with `aria-label="Iskače? Treperi? Varniči?"`), `hero-tagline`, `hero-cta-primary` (→ `#kontakt`), `hero-cta-secondary` (→ `#usluge`).
- Trust: `stat-value` (each), `marquee`, `marquee-toggle`.
- Anatomy: `anatomy-stage` (svg wrapper), `anatomy-card`, `anatomy-counter` (text `01/05`…), `anatomy-dot-<1..5>` (buttons), `anatomy-final` (“Spojeno. Bez varnica.”), `anatomy-arc`, `anatomy-sparks`, `anatomy-tape`, `anatomy-bulb` (with `data-lit="true|false"`). Root `<section>` carries `data-step="1..5"`, `data-beat="fault|fix|flow|final"`.
- Services: `service-card` (×6). Process: `process-step` (×4), `process-track`.
- Before/after: `ba-slider` (`role="slider"`, `aria-valuenow`), `ba-handle`.
- Testimonials: `testimonial-card`, `testimonials-toggle`. FAQ: `faq-trigger` (×6 buttons), `faq-panel` (×6).
- Contact: `contact-switch` (`data-on="true|false"`, carries `data-mainline-end`), `contact-bulb` (`data-lit`), `contact-card`, `contact-email` (mailto), `contact-copy`, `contact-toast` (`aria-live`, text “Kopirano ✓”), `contact-hours`, `contact-phone` (only when phone set).
- Footer: `back-to-top`. Main line: `mainline` (svg, ≥1024px) with `mainline-energized` path; `progress-bar` (<1024px).
- Root `<html>` gets `data-intro="skip"` from an inline script when reduced motion or `sessionStorage.jovanIntroSeen`; CSS hides the overlay then. `<html>` also gets `data-pointer="fine|coarse"` and `data-motion="full|reduced"` from the same inline script (client-only hints; React must not rely on them during render).

## `src/config/site.ts` schema (types exported; copywriter edits values only)
```ts
export interface NavLink { label: string; href: `#${string}` }
export interface Stat { value: number; suffix?: string; label: string }            // DEMO
export interface AnatomyStep { id: 'breaker'|'rcd'|'cable'|'socket'|'lamp'; name: string; problem: string; symptom: string; fix: string }
export interface Service { id: 'emergency'|'panel'|'wiring'|'lighting'|'appliances'|'diagnostics'; title: string; description: string; size: 'lg'|'md'|'sm' }
export interface ProcessStep { title: string; description: string }
export interface Testimonial { name: string; area: string; text: string; rating: 5 } // DEMO
export interface FaqItem { question: string; answer: string }
export interface SiteConfig {
  name: string; wordmark: string; trade: string; city: string; email: string; phone: string; hours: string; siteUrl: string;
  seo: { title: string; description: string; ogTitle: string; ogDescription: string; locale: 'sr_Latn' };
  nav: { links: NavLink[]; cta: string; menuOpen: string; menuClose: string; skipLink: string };
  hero: { words: [string, string, string]; tagline: string; subtitle: string; ctaPrimary: string; ctaSecondary: string; scrollHint: string };
  trust: { eyebrow: string; stats: Stat[]; marquee: string[]; demoNote: string };
  anatomy: { eyebrow: string; title: string; intro: string; labels: { problem: string; symptom: string; fix: string }; steps: AnatomyStep[]; finalText: string };
  services: { eyebrow: string; title: string; intro: string; items: Service[] };
  process: { eyebrow: string; title: string; steps: ProcessStep[] };
  beforeAfter: { eyebrow: string; title: string; intro: string; beforeLabel: string; afterLabel: string; sliderLabel: string; demoNote: string };
  testimonials: { eyebrow: string; title: string; items: Testimonial[]; demoNote: string; pause: string; play: string };
  faq: { eyebrow: string; title: string; items: FaqItem[] };
  contact: { eyebrow: string; title: string; lead: string; emailLabel: string; copy: string; copied: string; copyFailed: string; hoursLabel: string; call: string; subject: string };
  footer: { backToTop: string; rights: string };
  ui: { demoBadge: string; loaderLabel: string; menuLabel: string };
}
export const site: SiteConfig
export const mailtoHref: string  // `mailto:${email}?subject=${encodeURIComponent(subject)}`
```
Fixed texts (verbatim): hero words `["Iskače?","Treperi?","Varniči?"]`, tagline `"Jovan rešava."`, ctaPrimary `"Pošalji upit"`, ctaSecondary `"Pogledaj usluge"`, anatomy.finalText `"Spojeno. Bez varnica."`, contact.title `"Hajde da upalimo svetlo."`, contact.copy `"Kopiraj"`, contact.copied `"Kopirano ✓"`, contact.subject `"Upit sa sajta"`, seo.title `"Električar Jovan | Beograd"`. Process step titles: Javite se, Dijagnoza, Popravka, Garancija. Six services and six FAQ topics per BRIEF §6.6 / §6.10.

## CSS tokens (`src/styles/tokens.css`, Tailwind v4 `@theme`)
`--color-bg #0A0B10`, `--color-surface #13151E`, `--color-line #262B3B`, `--color-text #F3F1EA`, `--color-muted #9AA0B4`, `--color-volt #FFB92B`, `--color-volt-hi #FFD36A`, `--color-volt-lo #F59E0B`, `--color-arc #8FD8FF`, `--color-fault #FF6A3D`;
`--font-display` (Bricolage Grotesque Variable), `--font-serif` (Instrument Serif), `--font-sans` (Geist Variable), `--font-mono` (JetBrains Mono Variable); `--radius-md: 8px`; `--ease-out-expo`, `--ease-out-quart`.
Utility classes: `.glass` (surface/60 + backdrop-blur + 1px light border), `.dot-grid` (6% dots), `.grain`, `.glow-amber`, `.focus-ring` (arc color, 2px offset). Section padding: `py-20 md:py-32` (≥80px / ≥120px).

## Motion tools (`src/motion/`, owner motion-engineer; builder does not import them)
```ts
// motion.ts — single registration point
export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, useGSAP }; export const EASE = { out: 'expo.out', quart: 'quart.out' };
// Sparks.tsx — <Sparks ref active count className /> ; handle: { burst(n?): void; start(): void; stop(): void }
// flicker.ts — flickerOn(target, { intensity?: number; glow?: gsap.TweenTarget; duration?: number /* ≤0.6 */ }): gsap.core.Timeline  (≤3 brightness changes)
// CurrentPath.tsx — <CurrentPath ref d strokeWidth coreWidth pulse /> ; handle: { setProgress(p): void; timeline(from, to, vars?): gsap.core.Timeline; startPulse(): void; stopPulse(): void }
// MainLine.tsx — <MainLine /> : ≥1024px cable overlay ending at `[data-mainline-end]`; <1024px top progress bar
```
Smooth scroll: `src/components/SmoothScroll.tsx` exports `SmoothScroll` provider and `useLenis()` returning `Lenis | null`; `scrollToHash(hash)` helper in `src/lib/scroll.ts` (uses lenis.scrollTo when available, else `scrollIntoView`; respects reduced motion with `immediate`).
Hooks: `usePrefersReducedMotion(): boolean`, `useFinePointer(): boolean` (both SSR-safe, default false).

## File ownership (phase 2 parallel work)
- builder: `index.html`, `src/main.tsx`, `src/entry-server.tsx`, `src/styles/*`, `src/components/*`, `src/hooks/*`, `src/lib/*`, `src/sections/{Nav,Trust,Services,BeforeAfter,Testimonials,Faq,Footer}.tsx`, `scripts/*`, `public/*`, `e2e/*` except motion.spec.ts, `vercel.json`, `README.md`, config files.
- motion-engineer: `src/motion/*`, `src/sections/{IntroReveal,Hero,Anatomy,Process,Contact}.tsx`, `e2e/motion.spec.ts`.
- copywriter: `src/config/site.ts` values (phase 2, before parallel work). Frozen afterwards.
- Frozen during parallel work: `src/App.tsx`, `src/config/site.ts`, `src/motion/types.ts`. Only the supervisor changes them.
