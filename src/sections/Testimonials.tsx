import { useState } from 'react';
import { site, type Testimonial } from '../config/site';
import { DemoBadge } from '../components/DemoBadge';
import { SectionHeader } from '../components/SectionHeader';

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
      <path
        d="M10 1.5l2.59 5.25 5.79.84-4.19 4.08.99 5.77L10 14.9l-5.18 2.54.99-5.77L1.62 7.6l5.79-.84L10 1.5z"
        fill="var(--color-volt)"
      />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div role="img" aria-label={`${rating} ${site.testimonials.ratingLabel}`} className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon key={index} />
      ))}
    </div>
  );
}

function Card({ item }: { item: Testimonial }) {
  return (
    <figure data-testid="testimonial-card" className="card m-0 flex w-80 shrink-0 flex-col p-6">
      <Stars rating={item.rating} />
      <blockquote className="m-0 mt-4 flex-1 text-[0.95rem] leading-relaxed text-text">
        &ldquo;{item.text}&rdquo;
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4 font-mono text-xs text-muted">
        <span className="text-text">{item.name}</span>
        <span aria-hidden="true" className="h-px w-6 bg-arc/50" />
        {item.area}
      </figcaption>
    </figure>
  );
}

/**
 * Two CSS-only marquee rows scrolling in opposite directions, paused on
 * hover/focus and by the explicit toggle, and frozen automatically by the
 * global reduced-motion rule (docs/BRIEF.md §6.9). Hover and the manual
 * toggle are tracked separately so leaving the row with the mouse never
 * silently un-pauses a row the visitor explicitly paused.
 */
export function Testimonials() {
  const [hovered, setHovered] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const paused = hovered || manualPause;
  const items = site.testimonials.items;
  const half = Math.ceil(items.length / 2);
  const rowA = items.slice(0, half);
  const rowB = items.slice(half);

  function renderRow(row: Testimonial[], direction: 'forward' | 'reverse') {
    const loop = [...row, ...row];
    const trackClass = direction === 'forward' ? 'marquee-track' : 'marquee-track-reverse';
    return (
      <ul className={`flex w-max ${trackClass} ${paused ? 'marquee-paused' : ''}`}>
        {/* The gap lives on every item (including the last), not on the
            list, so one full copy is exactly `-50%` wide and the loop seam
            never jumps (M4, docs/reports/review-1.md). */}
        {loop.map((item, index) => (
          <li key={`${item.name}-${index}`} aria-hidden={index >= row.length} className="pr-4">
            <Card item={item} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section id="utisci" data-testid="section-testimonials" className="section">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader sheet={7} eyebrow={site.testimonials.eyebrow} title={site.testimonials.title} />
          <DemoBadge />
        </div>

        <div
          className="mt-12 flex flex-col gap-5 overflow-hidden"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
        >
          {renderRow(rowA, 'forward')}
          {renderRow(rowB, 'reverse')}
        </div>

        <button
          type="button"
          data-testid="testimonials-toggle"
          aria-pressed={manualPause}
          onClick={() => setManualPause((value) => !value)}
          className="btn btn-outline focus-ring mt-8 text-xs"
        >
          {manualPause ? site.testimonials.play : site.testimonials.pause}
        </button>

        <p className="mt-3 font-mono text-xs text-muted">{site.testimonials.demoNote}</p>
      </div>
    </section>
  );
}
