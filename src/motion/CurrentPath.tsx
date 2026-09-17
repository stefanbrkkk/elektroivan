import { forwardRef, useId, useImperativeHandle, useRef } from 'react';
import { MotionPathPlugin, gsap, useGSAP } from './motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import type { CurrentPathHandle, CurrentPathProps } from './types';

/** How much of the path the travelling pulse covers before it reaches the tip. */
const PULSE_SPAN = 0.26;

/**
 * Current flowing along an SVG path (docs/BRIEF.md §5.3), as one `<g>`:
 * a dark sheath, a thin copper hint, the energized core drawn with DrawSVG
 * (`0% → p%`), a blurred copy of the core for glow on ≥1024px only, and a
 * small pulse dot that rides the path (MotionPath) and stops exactly at the
 * energized end.
 *
 * The energized length is driven imperatively (`setProgress`, `timeline`) so
 * scroll scrubbing never re-renders React.
 */
export const CurrentPath = forwardRef<CurrentPathHandle, CurrentPathProps>(function CurrentPath(
  {
    d,
    strokeWidth = 6,
    coreWidth = 2,
    pulse = false,
    className,
    progress = 0,
    pulseDuration = 1.6,
    nonScalingStroke = false,
    testId,
  },
  ref
) {
  const rootRef = useRef<SVGGElement>(null);
  const controls = useRef<CurrentPathHandle>({
    setProgress: () => {},
    timeline: () => gsap.timeline(),
    startPulse: () => {},
    stopPulse: () => {},
    pulseOnce: () => {},
  });
  const reduced = usePrefersReducedMotion();
  const filterId = `jv-current-glow-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;

  useImperativeHandle(ref, () => ({
    setProgress: (p: number) => controls.current.setProgress(p),
    timeline: (from: number, to: number, vars?: gsap.TweenVars) =>
      controls.current.timeline(from, to, vars),
    startPulse: () => controls.current.startPulse(),
    stopPulse: () => controls.current.stopPulse(),
    pulseOnce: () => controls.current.pulseOnce(),
  }));

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return undefined;

      const core = root.querySelector<SVGPathElement>('[data-core]');
      const glow = root.querySelector<SVGPathElement>('[data-core-glow]');
      const dot = root.querySelector<SVGCircleElement>('[data-pulse-dot]');
      if (!core) return undefined;

      const cores: SVGPathElement[] = glow ? [core, glow] : [core];
      let current = progress;

      const apply = (value: number) => {
        current = gsap.utils.clamp(0, 1, value);
        gsap.set(cores, {
          drawSVG: `0% ${current * 100}%`,
          autoAlpha: current <= 0.002 ? 0 : 1,
        });
        if (dot && current <= 0.002) gsap.set(dot, { opacity: 0 });
      };

      apply(progress);

      let pulseTween: gsap.core.Tween | null = null;

      const startPulse = (repeat: number) => {
        if (!dot || reduced) return;
        pulseTween?.kill();

        const rawPath = MotionPathPlugin.cacheRawPathMeasurements(
          MotionPathPlugin.getRawPath(core)
        );
        const state = { t: 0 };
        const setX = gsap.quickSetter(dot, 'x', 'px');
        const setY = gsap.quickSetter(dot, 'y', 'px');

        pulseTween = gsap.to(state, {
          t: 1,
          duration: pulseDuration,
          repeat,
          ease: 'none',
          onUpdate: () => {
            if (current <= 0.002) {
              gsap.set(dot, { opacity: 0 });
              return;
            }
            const end = current;
            const start = Math.max(0, end - PULSE_SPAN);
            const point = MotionPathPlugin.getPositionOnPath(
              rawPath,
              start + (end - start) * state.t,
              false
            ) as { x: number; y: number };
            setX(point.x);
            setY(point.y);
            gsap.set(dot, { opacity: 1 });
          },
          onComplete: () => {
            gsap.set(dot, { opacity: 0 });
          },
        });
      };

      controls.current = {
        setProgress: apply,
        timeline: (from: number, to: number, vars?: gsap.TweenVars) => {
          const tl = gsap.timeline({
            // Keep the pulse's endpoint in sync while the core draws.
            onUpdate: () => {
              current = from + (to - from) * tl.progress();
            },
          });
          tl.set(cores, { autoAlpha: 1 }, 0).fromTo(
            cores,
            { drawSVG: `0% ${from * 100}%` },
            { drawSVG: `0% ${to * 100}%`, ease: 'none', duration: 1, ...vars }
          );
          return tl;
        },
        startPulse: () => startPulse(-1),
        stopPulse: () => {
          pulseTween?.kill();
          pulseTween = null;
          if (dot) gsap.set(dot, { opacity: 0 });
        },
        pulseOnce: () => startPulse(0),
      };

      if (pulse && !reduced) startPulse(-1);

      return () => {
        pulseTween?.kill();
        pulseTween = null;
        controls.current = {
          setProgress: () => {},
          timeline: () => gsap.timeline(),
          startPulse: () => {},
          stopPulse: () => {},
          pulseOnce: () => {},
        };
      };
    },
    { dependencies: [d, pulse, reduced, pulseDuration], revertOnUpdate: true }
  );

  const vectorEffect = nonScalingStroke ? 'non-scaling-stroke' : undefined;

  return (
    <g ref={rootRef} className={className} data-testid={testId} aria-hidden="true">
      <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      {/* sheath */}
      <path
        d={d}
        fill="none"
        stroke="var(--color-line)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect={vectorEffect}
      />
      {/* copper hint — the bare conductor showing through at the joints */}
      <path
        d={d}
        fill="none"
        stroke="var(--color-volt-lo)"
        strokeWidth={Math.max(0.8, coreWidth * 0.5)}
        strokeLinecap="round"
        strokeDasharray="2 14"
        opacity="0.35"
        vectorEffect={vectorEffect}
      />
      {/* glow copy of the energized core — desktop only.
          NOTE: no `vector-effect` on the two paths DrawSVG measures: Chromium
          cannot measure a non-proportionally-scaled non-scaling-stroke path
          and logs a console warning. */}
      <g className="jv-glow-lg">
        <path
          data-core-glow=""
          d={d}
          fill="none"
          stroke="var(--color-volt-hi)"
          strokeWidth={coreWidth * 3}
          strokeLinecap="round"
          opacity="0.5"
          filter={`url(#${filterId})`}
        />
      </g>
      {/* energized core */}
      <path
        data-core=""
        d={d}
        fill="none"
        stroke="var(--color-volt)"
        strokeWidth={coreWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        data-pulse-dot=""
        r={Math.max(2, coreWidth * 1.6)}
        cx="0"
        cy="0"
        fill="var(--color-volt-hi)"
        opacity="0"
      />
    </g>
  );
});
