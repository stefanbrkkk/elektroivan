import { useState } from 'react';
import { site, type Testimonial } from '../config/site';
import { DemoBadge } from '../components/DemoBadge';

function Stars() {
  return (
    <div aria-hidden="true" className="flex gap-0.5 text-volt">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index}>★</span>
      ))}
    </div>
  );
}

function Card({ item }: { item: Testimonial }) {
  return (
    <figure data-testid="testimonial-card" className="glass w-72 shrink-0 p-5">
      <Stars />
      <blockquote className="mt-3 text-sm text-text">&ldquo;{item.text}&rdquo;</blockquote>
      <figcaption className="mt-4 text-xs text-muted">
        <span className="font-semibold text-text">{item.name}</span> — {item.area}
      </figcaption>
    </figure>
  );
}

/**
 * Two CSS-only marquee rows scrolling in opposite directions, paused on
 * hover/focus and by the explicit toggle, and frozen automatically by the
 * global reduced-motion rule (docs/BRIEF.md §6.9).
 */
export function Testimonials() {
  const [paused, setPaused] = useState(false);
  const items = site.testimonials.items;
  const half = Math.ceil(items.length / 2);
  const rowA = items.slice(0, half);
  const rowB = items.slice(half);

  function renderRow(row: Testimonial[], direction: 'forward' | 'reverse') {
    const loop = [...row, ...row];
    const trackClass = direction === 'forward' ? 'marquee-track' : 'marquee-track-reverse';
    return (
      <ul className={`flex w-max gap-4 ${trackClass} ${paused ? 'marquee-paused' : ''}`}>
        {loop.map((item, index) => (
          <li key={`${item.name}-${index}`} aria-hidden={index >= row.length}>
            <Card item={item} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section
      id="utisci"
      data-testid="section-testimonials"
      className="section"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-arc">{site.testimonials.eyebrow}</p>
          <DemoBadge />
        </div>
        <h2 className="mt-2 font-display text-3xl font-bold text-text md:text-5xl">{site.testimonials.title}</h2>

        <div className="mt-10 flex flex-col gap-4 overflow-hidden">
          {renderRow(rowA, 'forward')}
          {renderRow(rowB, 'reverse')}
        </div>

        <button
          type="button"
          data-testid="testimonials-toggle"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
          className="focus-ring mt-6 rounded-md border border-line px-3 py-1.5 text-xs text-muted"
        >
          {paused ? site.testimonials.play : site.testimonials.pause}
        </button>

        <p className="mt-2 text-xs text-muted">{site.testimonials.demoNote}</p>
      </div>
    </section>
  );
}
