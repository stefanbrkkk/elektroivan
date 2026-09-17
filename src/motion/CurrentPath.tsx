import { forwardRef, useImperativeHandle, useRef } from 'react';
import { gsap } from './motion';
import type { CurrentPathHandle, CurrentPathProps } from './types';

/**
 * Static placeholder for a current-carrying SVG path: a dark sheath plus a
 * volt-colored core. Renders the fully energized end-state so the
 * reduced-motion and no-JS baselines already look correct; motion-engineer
 * drives progress with DrawSVG/MotionPath scrub in phase 2.
 */
export const CurrentPath = forwardRef<CurrentPathHandle, CurrentPathProps>(function CurrentPath(
  { d, strokeWidth = 6, coreWidth = 2, pulse = false },
  ref
) {
  const coreRef = useRef<SVGPathElement>(null);

  useImperativeHandle(ref, () => ({
    setProgress: () => {},
    timeline: () => gsap.timeline(),
    startPulse: () => {},
    stopPulse: () => {},
  }));

  return (
    <g aria-hidden="true" data-pulse={pulse}>
      <path d={d} stroke="var(--color-line)" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <path ref={coreRef} d={d} stroke="var(--color-volt)" strokeWidth={coreWidth} fill="none" strokeLinecap="round" />
    </g>
  );
});
