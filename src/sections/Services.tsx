import type { ReactNode } from 'react';
import { site, type Service } from '../config/site';

const SIZE_CLASSES: Record<Service['size'], string> = {
  lg: 'md:col-span-4 md:row-span-2',
  md: 'md:col-span-2',
  sm: 'md:col-span-2',
};

const ICONS: Record<Service['id'], ReactNode> = {
  emergency: (
    <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="var(--color-volt)" />
  ),
  panel: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="var(--color-volt)" strokeWidth="1.5" />
      <path d="M8 8h3M8 12h3M8 16h3" stroke="var(--color-volt)" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  wiring: (
    <path
      d="M4 6c4 0 2 6 6 6s2-6 6-6 2 6 6 6"
      fill="none"
      stroke="var(--color-volt)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  ),
  lighting: (
    <>
      <circle cx="12" cy="10" r="6" fill="none" stroke="var(--color-volt)" strokeWidth="1.5" />
      <path d="M9 20h6M10 22h4" stroke="var(--color-volt)" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  appliances: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="2" fill="none" stroke="var(--color-volt)" strokeWidth="1.5" />
      <circle cx="12" cy="9" r="2" fill="none" stroke="var(--color-volt)" strokeWidth="1.5" />
      <path d="M8 15h8" stroke="var(--color-volt)" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  diagnostics: (
    <>
      <circle cx="12" cy="13" r="7" fill="none" stroke="var(--color-volt)" strokeWidth="1.5" />
      <path d="M12 13l4-4M6 4l2 2" stroke="var(--color-volt)" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
};

/**
 * Static bento grid. Per-card icon micro-animations, tilt and cursor
 * spotlight from docs/BRIEF.md §6.6 are fine pointer-only, decorative
 * enhancements — deliberately skipped here so touch users lose nothing and
 * the reduced-motion baseline stays clean.
 */
export function Services() {
  return (
    <section id="usluge" data-testid="section-services" className="section">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-arc">{site.services.eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-text md:text-5xl">{site.services.title}</h2>
        <p className="mt-4 max-w-2xl text-muted">{site.services.intro}</p>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-6 md:auto-rows-[11rem]">
          {site.services.items.map((service) => (
            <article
              key={service.id}
              data-testid="service-card"
              className={`glass flex flex-col justify-between p-6 transition-transform duration-200 hover:-translate-y-1 ${SIZE_CLASSES[service.size]}`}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                {ICONS[service.id]}
              </svg>
              <div className="mt-4">
                <h3 className="font-display text-lg font-semibold text-text">{service.title}</h3>
                <p className="mt-2 text-sm text-muted">{service.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
