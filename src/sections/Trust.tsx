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
      <div className="container-x">
        {/* Engineering title block: the stats sit in a bordered grid of cells
            with mono labels, exactly like the title block of a technical
            drawing (docs/DESIGN.md §3.4). Labels come from site.trust.stats. */}
        <div className="corner-marks p-3 md:p-4">
          <span aria-hidden="true" className="corner-marks__b" />
          <div className="overflow-hidden rounded-[12px] border border-line">
            <div className="flex items-center justify-between gap-4 border-b border-line bg-surface/60 px-5 py-3">
              <h2 className="sheet-label m-0">
                <span className="sheet-label__word">List</span>
                <span className="sheet-label__num">02</span>
                <span className="sheet-label__sep">/</span>
                <span className="sheet-label__total">10</span>
                <span aria-hidden="true" className="sheet-label__rule" />
                <span className="sheet-label__eyebrow">{site.trust.eyebrow}</span>
              </h2>
              <DemoBadge />
            </div>

            <dl className="m-0 grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
              {site.trust.stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="flex flex-col justify-between gap-6 border-line p-6 sm:border-b lg:border-b-0 lg:border-r lg:last-of-type:border-r-0"
                >
                  <dt className="label-mono m-0 text-[0.7rem] leading-snug">{stat.label}</dt>
                  <dd
                    ref={(el) => {
                      valueRefs.current[index] = el;
                    }}
                    data-testid="stat-value"
                    style={{ minWidth: `${String(stat.value).length + (stat.suffix?.length ?? 0)}ch` }}
                    className="m-0 font-mono text-[clamp(2.25rem,4.5vw,3.5rem)] font-bold leading-none tabular-nums text-text"
                  >
                    {stat.value}
                    {stat.suffix}
                  </dd>
                </div>
              ))}

              {/* Fourth title-block cell: the demo disclaimer. */}
              <div className="flex flex-col justify-between gap-6 bg-surface/40 p-6">
                <dt className="label-mono m-0 text-[0.7rem] leading-snug">{site.ui.demoBadge}</dt>
                <dd className="m-0 max-w-[24ch] font-mono text-xs leading-relaxed text-muted">
                  {site.trust.demoNote}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div
          className="relative mt-10 overflow-hidden border-y border-line py-5"
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
                className="flex items-center gap-10 pr-10 font-mono text-sm uppercase tracking-[0.12em] text-muted"
              >
                {item}
                <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-volt/70" />
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          data-testid="marquee-toggle"
          aria-pressed={manualPause}
          onClick={() => setManualPause((value) => !value)}
          className="btn btn-outline focus-ring mt-4 text-xs"
        >
          {manualPause ? site.testimonials.play : site.testimonials.pause}
        </button>
      </div>
    </section>
  );
}
