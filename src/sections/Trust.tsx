import { useState } from 'react';
import { site } from '../config/site';
import { DemoBadge } from '../components/DemoBadge';

/**
 * Trust stats + services marquee. Count-up on scroll-in is motion-engineer's
 * phase 2 addition (docs/BRIEF.md §6.4); numbers are shown at their final
 * value here so the static/reduced-motion baseline is already correct.
 * The marquee loop is a plain CSS animation (no GSAP needed for a builder
 * file) and is frozen automatically by the global reduced-motion rule.
 */
export function Trust() {
  const [paused, setPaused] = useState(false);
  const loopItems = [...site.trust.marquee, ...site.trust.marquee];

  return (
    <section id="poverenje" data-testid="section-trust" className="section">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-arc">{site.trust.eyebrow}</p>
          <DemoBadge />
        </div>

        <dl className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {site.trust.stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-sm text-muted">{stat.label}</dt>
              <dd data-testid="stat-value" className="font-mono text-4xl font-bold tabular-nums text-text md:text-5xl">
                {stat.value}
                {stat.suffix}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-2 text-xs text-muted">{site.trust.demoNote}</p>

        <div
          className="relative mt-12 overflow-hidden border-y border-line py-4"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <ul
            data-testid="marquee"
            className={`marquee-track flex w-max gap-10 whitespace-nowrap ${paused ? 'marquee-paused' : ''}`}
          >
            {loopItems.map((item, index) => (
              <li
                key={`${item}-${index}`}
                aria-hidden={index >= site.trust.marquee.length}
                className="font-mono text-sm uppercase tracking-wide text-muted"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          data-testid="marquee-toggle"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
          className="focus-ring mt-3 rounded-md border border-line px-3 py-1.5 text-xs text-muted"
        >
          {paused ? site.testimonials.play : site.testimonials.pause}
        </button>
      </div>
    </section>
  );
}
