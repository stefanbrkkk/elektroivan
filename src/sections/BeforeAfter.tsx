import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { site } from '../config/site';
import { DemoBadge } from '../components/DemoBadge';
import { SectionHeader } from '../components/SectionHeader';
import { OldBoard, NewBoard } from '../components/svg/Boards';

const STEP = 2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader sheet={6} eyebrow={site.beforeAfter.eyebrow} title={site.beforeAfter.title} intro={site.beforeAfter.intro} />
          <DemoBadge />
        </div>

        <div className="corner-marks mt-12 p-3 md:p-4">
          <span aria-hidden="true" className="corner-marks__b" />
          <div
            ref={trackRef}
            className="relative aspect-[5/3] w-full touch-none select-none overflow-hidden rounded-[12px] border border-line"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* The new board is the base layer; the old one is clipped from
                the left, so the wipe reads left = "Pre", right = "Posle". */}
            <div className="absolute inset-0">
              <NewBoard />
            </div>
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}>
              <OldBoard />
            </div>

            <span className="absolute left-4 top-4 rounded-md border border-line bg-bg/75 px-2.5 py-1 font-mono text-xs uppercase tracking-[0.18em] text-muted backdrop-blur-sm">
              {site.beforeAfter.beforeLabel}
            </span>
            <span className="absolute right-4 top-4 rounded-md border border-line bg-bg/75 px-2.5 py-1 font-mono text-xs uppercase tracking-[0.18em] text-arc backdrop-blur-sm">
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
              <span
                data-testid="ba-handle"
                aria-hidden="true"
                className="glass glow-amber absolute flex h-11 w-11 items-center justify-center rounded-full font-mono text-xs text-volt"
              >
                &#8596;
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="dim-line w-full max-w-sm">
            <span>3 kola &middot; 8 osigura&#269;a</span>
          </p>
          <p className="font-mono text-xs text-muted">{site.beforeAfter.demoNote}</p>
        </div>
      </div>
    </section>
  );
}
