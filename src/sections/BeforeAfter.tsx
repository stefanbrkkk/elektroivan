import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { site } from '../config/site';
import { DemoBadge } from '../components/DemoBadge';

const STEP = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function OldPanel() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="300" fill="var(--color-surface)" />
      <rect x="40" y="40" width="320" height="220" rx="8" fill="var(--color-bg)" stroke="var(--color-line)" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={100 + i * 100} cy={90} r={22} fill="none" stroke="var(--color-muted)" strokeWidth={3} />
      ))}
      <path
        d="M70 150 C150 210 130 130 220 200 S300 140 340 210"
        stroke="var(--color-muted)"
        strokeWidth={2}
        fill="none"
      />
      <path
        d="M80 220 C160 170 200 240 260 190 S330 220 350 180"
        stroke="var(--color-muted)"
        strokeWidth={2}
        fill="none"
      />
      <circle cx="140" cy="215" r="18" fill="var(--color-fault)" opacity="0.25" />
    </svg>
  );
}

function NewPanel() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="300" fill="var(--color-surface)" />
      <rect x="40" y="40" width="320" height="220" rx="8" fill="var(--color-bg)" stroke="var(--color-line)" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x={70 + (i % 4) * 65}
          y={70 + Math.floor(i / 4) * 90}
          width="48"
          height="70"
          rx="4"
          fill="none"
          stroke="var(--color-arc)"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}

/**
 * Fully functional compare slider (pointer-drag + keyboard), since
 * BeforeAfter is builder-owned long-term, not a motion-engineer handoff.
 * Illustrations are original inline SVG, never photos (docs/BRIEF.md §6.8).
 */
export function BeforeAfter() {
  const [value, setValue] = useState(50);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    setValue(Math.round(ratio * 100));
  }, []);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromClientX(event.clientX);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    updateFromClientX(event.clientX);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    draggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      setValue((current) => clamp(current - STEP, 0, 100));
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      setValue((current) => clamp(current + STEP, 0, 100));
      event.preventDefault();
    } else if (event.key === 'Home') {
      setValue(0);
      event.preventDefault();
    } else if (event.key === 'End') {
      setValue(100);
      event.preventDefault();
    }
  }

  return (
    <section id="pre-posle" data-testid="section-before-after" className="section">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-arc">{site.beforeAfter.eyebrow}</p>
          <DemoBadge />
        </div>
        <h2 className="mt-2 font-display text-3xl font-bold text-text md:text-5xl">{site.beforeAfter.title}</h2>
        <p className="mt-4 max-w-2xl text-muted">{site.beforeAfter.intro}</p>

        <div
          ref={trackRef}
          className="relative mt-8 aspect-[4/3] w-full touch-none select-none overflow-hidden rounded-md border border-line"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="absolute inset-0">
            <OldPanel />
          </div>
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}>
            <NewPanel />
          </div>

          <span className="absolute left-3 top-3 rounded-md bg-bg/70 px-2 py-1 font-mono text-xs text-muted">
            {site.beforeAfter.beforeLabel}
          </span>
          <span className="absolute right-3 top-3 rounded-md bg-bg/70 px-2 py-1 font-mono text-xs text-muted">
            {site.beforeAfter.afterLabel}
          </span>

          <div
            data-testid="ba-slider"
            role="slider"
            tabIndex={0}
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={site.beforeAfter.sliderLabel}
            onKeyDown={handleKeyDown}
            className="focus-ring absolute inset-y-0 flex w-0 -translate-x-1/2 items-center justify-center"
            style={{ left: `${value}%` }}
          >
            <span aria-hidden="true" className="h-full w-0.5 bg-volt" />
            <span data-testid="ba-handle" aria-hidden="true" className="glass glow-amber absolute h-8 w-8 rounded-full" />
          </div>
        </div>

        <p className="mt-3 text-xs text-muted">{site.beforeAfter.demoNote}</p>
      </div>
    </section>
  );
}
