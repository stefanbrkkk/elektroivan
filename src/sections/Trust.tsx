import { useRef, useState } from 'react';
import { site } from '../config/site';
import { DemoBadge } from '../components/DemoBadge';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { gsap, useGSAP } from '../motion/motion';

/**
 * Trust stats + services marquee (docs/BRIEF.md §6.4). Stats count up once
 * on scroll-in (skipped entirely under reduced motion, which already shows
 * the final values via SSR). The marquee is a seamless CSS loop (duplicate
 * list, `translateX(-50%)`), paused on hover/focus and by an explicit
 * toggle, and frozen automatically by the global reduced-motion rule.
 */
export function Trust() {
  const [hovered, setHovered] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const paused = hovered || manualPause;
  const reducedMotion = usePrefersReducedMotion();

  const sectionRef = useRef<HTMLElement>(null);
  const valueRefs = useRef<Array<HTMLElement | null>>([]);

  const loopItems = [...site.trust.marquee, ...site.trust.marquee];

  useGSAP(
    () => {
      if (reducedMotion) return;
      site.trust.stats.forEach((stat, index) => {
        const el = valueRefs.current[index];
        if (!el) return;
        const counter = { value: 0 };
        el.textContent = `0${stat.suffix ?? ''}`;
        gsap.to(counter, {
          value: stat.value,
          duration: 1.6,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: () => {
            el.textContent = `${Math.round(counter.value)}${stat.suffix ?? ''}`;
          },
        });
      });
    },
    { dependencies: [reducedMotion], scope: sectionRef }
  );

  return (
    <section ref={sectionRef} id="poverenje" data-testid="section-trust" className="section">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-arc">{site.trust.eyebrow}</h2>
          <DemoBadge />
        </div>

        <dl className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {site.trust.stats.map((stat, index) => (
            <div key={stat.label}>
              <dt className="text-sm text-muted">{stat.label}</dt>
              <dd
                ref={(el) => {
                  valueRefs.current[index] = el;
                }}
                data-testid="stat-value"
                style={{ minWidth: `${String(stat.value).length + (stat.suffix?.length ?? 0)}ch` }}
                className="inline-block font-mono text-4xl font-bold tabular-nums text-text md:text-5xl"
              >
                {stat.value}
                {stat.suffix}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-2 text-xs text-muted">{site.trust.demoNote}</p>

        <div
          className="relative mt-12 overflow-hidden border-y border-line py-4"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
        >
          <ul
            data-testid="marquee"
            className={`marquee-track flex w-max whitespace-nowrap ${paused ? 'marquee-paused' : ''}`}
          >
            {/* The gap lives on every item (including the last), not on the
                list, so one full copy is exactly `-50%` wide and the loop
                seam never jumps (M4, docs/reports/review-1.md). */}
            {loopItems.map((item, index) => (
              <li
                key={`${item}-${index}`}
                aria-hidden={index >= site.trust.marquee.length}
                className="pr-10 font-mono text-sm uppercase tracking-wide text-muted"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          data-testid="marquee-toggle"
          aria-pressed={manualPause}
          onClick={() => setManualPause((value) => !value)}
          className="focus-ring mt-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line-strong px-3 py-1.5 text-xs text-muted"
        >
          {manualPause ? site.testimonials.play : site.testimonials.pause}
        </button>
      </div>
    </section>
  );
}
