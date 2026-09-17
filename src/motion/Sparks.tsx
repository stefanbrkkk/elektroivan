import { forwardRef, useImperativeHandle, useRef } from 'react';
import { gsap, isSmallOrCoarse, useGSAP } from './motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import type { SparksHandle, SparksProps } from './types';

const MIN_PARTICLES = 8;
const MAX_PARTICLES = 14;

/**
 * Tiny spark burst system (docs/BRIEF.md §5.3): 8–14 thin arc-colored lines
 * thrown out at random angles, 300–600ms of life, transform/opacity only and
 * never interactive. Particles spawn only while the scene is `active` *and*
 * the element is on screen; the count is halved on phones. Under reduced
 * motion nothing moves — a small static arc glyph is drawn instead.
 *
 * Renders a standalone `<svg>` by default (position it with `className`), or
 * a bare `<g>` with `as="g"` to live inside an existing SVG scene.
 */
export const Sparks = forwardRef<SparksHandle, SparksProps>(function Sparks(
  {
    active = false,
    count = 12,
    className,
    as = 'svg',
    transform,
    spread = 18,
    size = 56,
    testId,
  },
  ref
) {
  const rootRef = useRef<SVGSVGElement | SVGGElement>(null);
  const controls = useRef<SparksHandle>({
    burst: () => {},
    start: () => {},
    stop: () => {},
  });
  const reduced = usePrefersReducedMotion();

  const poolSize = Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, count));

  useImperativeHandle(ref, () => ({
    burst: (n?: number) => controls.current.burst(n),
    start: () => controls.current.start(),
    stop: () => controls.current.stop(),
  }));

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return undefined;

      if (reduced) {
        // Static glyph only — no timelines to own, nothing to clean up.
        controls.current = { burst: () => {}, start: () => {}, stop: () => {} };
        return undefined;
      }

      const particles = Array.from(root.querySelectorAll<SVGLineElement>('[data-spark]'));
      if (particles.length === 0) return undefined;

      let onScreen = false;
      let wanted = active;

      const setVisible = (visible: boolean) => {
        root.setAttribute('data-active', visible ? 'true' : 'false');
      };

      const spawn = (n?: number) => {
        const half = isSmallOrCoarse();
        const requested = n ?? particles.length;
        const amount = Math.max(3, Math.round(half ? requested / 2 : requested));
        const used = particles.slice(0, Math.min(amount, particles.length));

        for (const particle of used) {
          const angle = gsap.utils.random(0, Math.PI * 2);
          const distance = gsap.utils.random(spread * 0.5, spread);
          gsap.killTweensOf(particle);
          gsap.set(particle, {
            x: 0,
            y: 0,
            opacity: 1,
            scale: gsap.utils.random(0.5, 1),
            rotation: (angle * 180) / Math.PI,
            svgOrigin: '0 0',
          });
          gsap.to(particle, {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            opacity: 0,
            duration: gsap.utils.random(0.3, 0.6),
            ease: 'power2.out',
          });
        }
      };

      // One owned loop: overlapping short-lived particles, so the scene reads
      // as a steady shower instead of a strobe.
      const loop = gsap.timeline({ repeat: -1, paused: true });
      loop.call(() => spawn()).to({}, { duration: 0.24 });

      const sync = () => {
        if (wanted && onScreen) {
          setVisible(true);
          if (!loop.isActive()) loop.play(0);
        } else {
          loop.pause(0);
          gsap.killTweensOf(particles);
          gsap.set(particles, { opacity: 0 });
          setVisible(false);
        }
      };

      const observer = new IntersectionObserver(
        (entries) => {
          onScreen = entries.some((entry) => entry.isIntersecting);
          sync();
        },
        { rootMargin: '10% 0px' }
      );
      observer.observe(root);

      controls.current = {
        burst: (n?: number) => {
          if (!onScreen) return;
          setVisible(true);
          spawn(n);
        },
        start: () => {
          wanted = true;
          sync();
        },
        stop: () => {
          wanted = false;
          sync();
        },
      };

      gsap.set(particles, { opacity: 0 });
      setVisible(false);

      return () => {
        observer.disconnect();
        loop.kill();
        gsap.killTweensOf(particles);
        controls.current = { burst: () => {}, start: () => {}, stop: () => {} };
      };
    },
    { dependencies: [reduced, active, spread, poolSize], revertOnUpdate: true }
  );

  const children = reduced ? (
    <polyline
      points="-6,4 -2,-2 2,3 6,-4"
      fill="none"
      stroke="var(--color-arc)"
      strokeWidth="1.4"
      strokeLinecap="round"
      opacity="0.85"
    />
  ) : (
    Array.from({ length: poolSize }, (_, index) => (
      <line
        key={index}
        data-spark=""
        x1="0"
        y1="0"
        x2={index % 3 === 0 ? 2 : 7}
        y2="0"
        stroke={index % 4 === 0 ? 'var(--color-volt-hi)' : 'var(--color-arc)'}
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0"
      />
    ))
  );

  if (as === 'g') {
    return (
      <g
        ref={rootRef as React.Ref<SVGGElement>}
        className={className ? `jv-sparks ${className}` : 'jv-sparks'}
        data-testid={testId}
        data-active={reduced ? undefined : 'false'}
        transform={transform}
        aria-hidden="true"
      >
        {children}
      </g>
    );
  }

  return (
    <svg
      ref={rootRef as React.Ref<SVGSVGElement>}
      className={className ? `jv-sparks ${className}` : 'jv-sparks'}
      data-testid={testId}
      data-active={reduced ? undefined : 'false'}
      width={size}
      height={size}
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
});
