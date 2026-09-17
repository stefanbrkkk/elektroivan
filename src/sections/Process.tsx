import { useRef } from 'react';
import { site } from '../config/site';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { CurrentPath } from '../motion/CurrentPath';
import { ScrollTrigger, gsap, useGSAP } from '../motion/motion';
import type { CurrentPathHandle } from '../motion/types';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * "Kako radim" (docs/BRIEF.md §6.7): four steps strung along one cable that
 * energizes with scroll progress. ≥768px the section pins and the track moves
 * horizontally; below that the very same steps become a vertical story with a
 * vertical cable and no pin. Reduced motion: plain static flow, cable fully
 * energized.
 */
export function Process() {
  const steps = site.process.steps;
  const reduced = usePrefersReducedMotion();
  const wide = useMediaQuery('(min-width: 768px)');
  const horizontal = wide && !reduced;

  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cableRef = useRef<CurrentPathHandle>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return undefined;

      if (reduced) {
        cableRef.current?.setProgress(1);
        return undefined;
      }

      if (horizontal) {
        const pin = pinRef.current;
        const track = trackRef.current;
        if (!pin || !track) return undefined;

        const distance = () => Math.max(1, track.scrollWidth - window.innerWidth + 32);

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin,
            anticipatePin: 1,
            scrub: 0.5,
            invalidateOnRefresh: true,
            onUpdate: (self) => cableRef.current?.setProgress(self.progress),
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      }

      const trigger = ScrollTrigger.create({
        trigger: root,
        start: 'top 75%',
        end: 'bottom 60%',
        scrub: 0.5,
        onUpdate: (self) => cableRef.current?.setProgress(self.progress),
      });

      return () => trigger.kill();
    },
    { dependencies: [reduced, horizontal], revertOnUpdate: true }
  );

  const header = (
    <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-arc">{site.process.eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold text-text md:text-5xl">
        {site.process.title}
      </h2>
    </div>
  );

  const cards = steps.map((step, index) => (
    <li
      key={step.title}
      data-testid="process-step"
      className={
        horizontal
          ? 'glass relative flex h-[340px] w-[70vw] max-w-[400px] shrink-0 flex-col justify-between p-7'
          : 'glass relative ml-12 flex flex-col p-5'
      }
    >
      <span className="font-mono text-sm text-volt">{pad(index + 1)}</span>
      <div>
        <h3 className="mt-2 font-display text-xl font-semibold text-text md:text-2xl">
          {step.title}
        </h3>
        <p className="mt-2 text-sm text-muted md:text-base">{step.description}</p>
      </div>
    </li>
  ));

  return (
    <section id="kako-radim" ref={rootRef} data-testid="section-process" className="section relative">
      {horizontal ? null : header}

      {horizontal ? (
        <div
          ref={pinRef}
          className="min-h-app relative flex flex-col justify-center gap-12 overflow-hidden"
        >
          {header}
          <div
            ref={trackRef}
            data-testid="process-track"
            className="jv-track relative items-stretch gap-10 px-[6vw] pb-14"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 1000 40"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full"
            >
              <CurrentPath
                ref={cableRef}
                d="M 0 20 H 1000"
                strokeWidth={7}
                coreWidth={3}
                nonScalingStroke
              />
            </svg>
            <ul className="jv-track relative items-stretch gap-10">{cards}</ul>
          </div>
        </div>
      ) : (
        <div className="relative mx-auto mt-10 max-w-6xl px-4 md:px-6">
          <svg
            aria-hidden="true"
            viewBox="0 0 40 1000"
            preserveAspectRatio="none"
            className="pointer-events-none absolute bottom-6 left-4 top-6 w-10 md:left-6"
          >
            <CurrentPath
              ref={cableRef}
              d="M 20 0 V 1000"
              strokeWidth={7}
              coreWidth={3}
              nonScalingStroke
            />
          </svg>
          <ul data-testid="process-track" className="relative flex flex-col gap-6">
            {cards}
          </ul>
        </div>
      )}
    </section>
  );
}
