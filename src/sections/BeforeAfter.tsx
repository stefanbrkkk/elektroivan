import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { site } from '../config/site';
import { DemoBadge } from '../components/DemoBadge';

const STEP = 2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function OldPanel() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="300" fill="var(--color-surface)" />
      <rect x="40" y="40" width="320" height="220" rx="8" fill="var(--color-bg)" stroke="var(--color-line)" />
      {/* Ceramic (diazed) fuses: round porcelain bodies with a raised center cap */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={100 + i * 100} cy={90} r={22} fill="none" stroke="var(--color-muted)" strokeWidth={3} />
          <circle cx={100 + i * 100} cy={90} r={9} fill="none" stroke="var(--color-muted)" strokeWidth={2} />
          <rect x={100 + i * 100 - 2} y={68} width={4} height={10} fill="var(--color-muted)" />
        </g>
      ))}
      {/* Tangled, unlabelled wiring */}
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
      <path
        d="M120 240 C150 260 180 210 230 245 S300 260 330 235"
        stroke="var(--color-line)"
        strokeWidth={2}
        fill="none"
      />
      {/* Soot / scorch mark from an old fault */}
      <circle cx="140" cy="215" r="20" fill="var(--color-fault)" opacity="0.22" />
      <circle cx="140" cy="215" r="9" fill="var(--color-fault)" opacity="0.3" />
    </svg>
  );
}

function NewPanel() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="300" fill="var(--color-surface)" />
      <rect x="40" y="40" width="320" height="220" rx="8" fill="var(--color-bg)" stroke="var(--color-line)" />
      {/* A neat row of modern MCBs, each with a labelled circuit number */}
      {Array.from({ length: 6 }).map((_, i) => (
        <g key={i}>
          <rect
            x={64 + i * 44}
            y={70}
            width={34}
            height={62}
            rx="3"
            fill="none"
            stroke="var(--color-arc)"
            strokeWidth={2}
          />
          <rect x={64 + i * 44 + 12} y={80} width={10} height={16} rx="2" fill="var(--color-arc)" />
          <text
            x={64 + i * 44 + 17}
            y={148}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--color-muted)"
          >
            {i + 1}
          </text>
        </g>
      ))}
      {/* RCD (FID): a wider module with its own test button */}
      <rect x="316" y="70" width="46" height="62" rx="3" fill="none" stroke="var(--color-volt)" strokeWidth={2} />
      <rect x="330" y="80" width="18" height="12" rx="2" fill="var(--color-volt)" />
      <text
        x="339"
        y="148"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="9"
        letterSpacing="0.05em"
        fill="var(--color-muted)"
      >
        FID
      </text>
      {/* Tidy, bundled wiring fanning down to each circuit */}
      <path d="M200 132 V190" stroke="var(--color-line)" strokeWidth={3} fill="none" />
      {Array.from({ length: 6 }).map((_, i) => (
        <path
          key={i}
          d={`M200 190 L${81 + i * 44} 235`}
          stroke="var(--color-muted)"
          strokeWidth={1.5}
          fill="none"
        />
      ))}
      <rect x="192" y="186" width="16" height="8" rx="2" fill="var(--color-line)" />
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
            className="focus-ring absolute inset-y-0 flex w-11 -translate-x-1/2 touch-none items-center justify-center"
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
