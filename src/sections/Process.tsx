import { useRef } from 'react';
import { site } from '../config/site';
import { SectionHeader } from '../components/SectionHeader';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { CurrentPath } from '../motion/CurrentPath';
import { ProcessGlyph, ProcessGlyphDefs } from '../motion/ProcessGlyphs';
import { ScrollTrigger, gsap, useGSAP } from '../motion/motion';
import type { CurrentPathHandle } from '../motion/types';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * "Kako radim" (docs/BRIEF.md §6.7, docs/DESIGN.md §3.7): four numbered sheets
 * strung along one cable that energizes with scroll progress. ≥768px the
 * section pins and the track moves horizontally past a fixed sheet header;
 * below that the very same steps become a vertical story with a vertical
 * cable and no pin. Reduced motion: plain static flow, cable fully energized.
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
    <div className="container-x">
      <SectionHeader sheet={5} eyebrow={site.process.eyebrow} title={site.process.title} />
    </div>
  );

  const cards = steps.map((step, index) => (
    <li
      key={step.title}
      data-testid="process-step"
      className={
        horizontal
          ? 'card relative flex h-[340px] w-[72vw] max-w-[420px] shrink-0 flex-col justify-between p-7'
          : 'card relative ml-12 flex flex-col gap-4 p-6'
      }
    >
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-2xl font-semibold text-arc">{pad(index + 1)}</span>
        {/* bracket frame around the glyph, like a drawing detail callout */}
        <span className="jv-bracket relative block h-24 w-24 shrink-0">
          <ProcessGlyph index={index} className="h-full w-full" />
        </span>
      </div>
      <div>
        <h3 className="display-md text-text">{step.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">{step.description}</p>
      </div>
    </li>
  ));

  return (
    <section id="kako-radim" ref={rootRef} data-testid="section-process" className="section relative">
      <ProcessGlyphDefs />
      {horizontal ? null : header}

      {horizontal ? (
        <div
          ref={pinRef}
          className="min-h-app relative flex flex-col justify-center gap-10 overflow-hidden"
        >
          {header}
          <div ref={trackRef} data-testid="process-track" className="jv-track relative items-stretch gap-10 px-[6vw] pb-12 lg:pl-28">
            <svg
              aria-hidden="true"
              viewBox="0 0 1000 40"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full"
            >
              <CurrentPath ref={cableRef} d="M 0 20 H 1000" strokeWidth={10} coreWidth={3.4} nonScalingStroke />
            </svg>
            <ul className="jv-track relative items-stretch gap-10">{cards}</ul>
          </div>
        </div>
      ) : (
        <div className="container-x relative mt-10">
          <svg
            aria-hidden="true"
            viewBox="0 0 40 1000"
            preserveAspectRatio="none"
            className="jv-process-rail pointer-events-none absolute bottom-6 top-6 w-10"
          >
            <CurrentPath ref={cableRef} d="M 20 0 V 1000" strokeWidth={10} coreWidth={3.4} nonScalingStroke />
          </svg>
          <ul data-testid="process-track" className="relative flex flex-col gap-6">
            {cards}
          </ul>
        </div>
      )}
    </section>
  );
}
