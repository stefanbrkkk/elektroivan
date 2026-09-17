import { site } from '../config/site';
import { AnchorLink } from '../components/AnchorLink';

/**
 * Static/reduced-motion baseline for the hero: exact required copy, the
 * only `<h1>` on the page, and both functional CTAs. The neon word-by-word
 * flicker, spark burst, background parallax and cable pulse are
 * motion-engineer's phase 2 work (docs/BRIEF.md §6.3) — content here never
 * depends on that animation to be visible.
 */
export function Hero() {
  const ariaLabel = site.hero.words.join(' ');

  return (
    <section
      id="pocetak"
      data-testid="section-hero"
      className="dot-grid section min-h-app relative flex items-center pt-16"
    >
      <div className="glow-amber pointer-events-none absolute left-1/2 top-1/3 -z-10 h-72 w-72 -translate-x-1/2 rounded-full" aria-hidden="true" />

      <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
        <h1
          data-testid="hero-title"
          aria-label={ariaLabel}
          className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-text sm:text-6xl md:text-7xl lg:text-8xl"
        >
          {site.hero.words.map((word) => (
            <span key={word} aria-hidden="true" className="block text-volt">
              {word}
            </span>
          ))}
        </h1>

        <p data-testid="hero-tagline" className="mt-5 font-serif text-3xl italic text-arc md:text-4xl">
          {site.hero.tagline}
        </p>

        <p className="mt-6 max-w-xl text-lg text-muted">{site.hero.subtitle}</p>

        <div className="mt-8 flex flex-wrap gap-4">
          <AnchorLink
            href="#kontakt"
            data-testid="hero-cta-primary"
            className="focus-ring rounded-md bg-volt px-6 py-3 font-semibold text-bg"
          >
            {site.hero.ctaPrimary}
          </AnchorLink>
          <AnchorLink
            href="#usluge"
            data-testid="hero-cta-secondary"
            className="focus-ring rounded-md border border-line px-6 py-3 font-semibold text-text"
          >
            {site.hero.ctaSecondary}
          </AnchorLink>
        </div>

        <p className="mt-16 font-mono text-xs uppercase tracking-widest text-muted">
          {site.hero.scrollHint}
        </p>
      </div>
    </section>
  );
}
