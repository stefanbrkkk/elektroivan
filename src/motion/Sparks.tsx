import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { SparksHandle, SparksProps } from './types';

/**
 * Static placeholder for the spark-burst particle system (docs/BRIEF.md
 * §5.3): a small, inert, decorative SVG. motion-engineer wires the
 * imperative burst/start/stop behaviour in phase 2 (GSAP-driven, ≤14
 * particles, halved on mobile, disabled under reduced motion).
 */
export const Sparks = forwardRef<SparksHandle, SparksProps>(function Sparks(
  { active = false, count = 10, className },
  ref
) {
  const rootRef = useRef<SVGSVGElement>(null);

  useImperativeHandle(ref, () => ({
    burst: () => {},
    start: () => {},
    stop: () => {},
  }));

  return (
    <svg
      ref={rootRef}
      className={className}
      data-active={active}
      data-count={count}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ pointerEvents: 'none', overflow: 'visible' }}
    />
  );
});
