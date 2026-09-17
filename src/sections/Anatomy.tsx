import { useMemo, useRef } from 'react';
import { site } from '../config/site';
import { SectionHeader } from '../components/SectionHeader';
import { useLenis } from '../components/SmoothScroll';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { ScrollTrigger, gsap, unveil, useGSAP, whenNear } from '../motion/motion';
import { flickerFault } from '../motion/flicker';
import type { CurrentPathHandle, SparksHandle } from '../motion/types';
import { Diorama } from './anatomy/Diorama';
import { PART_COUNT, getDiorama } from './anatomy/diorama';

const BEATS = ['fault', 'fix', 'flow'] as const;

/* ------------------------------------------------------------- the clock --
 * One master timeline, 25 units long, split exactly the way docs/DESIGN.md
 * §3.5 asks for: 0–12 % the whole installation explodes at once, 12–84 % the
 * five fault/fix/flow steps, 84–100 % everything snaps back at once.
 * `e2e/motion.spec.ts` derives its scroll fractions from the same numbers. */
const EXPLODE = 3;
const BEAT = 1.2;
const BEAT_COUNT = 15;
const ASSEMBLE = 4;
const TOTAL = EXPLODE + BEAT * BEAT_COUNT + ASSEMBLE;
const ASSEMBLE_START = EXPLODE + BEAT * BEAT_COUNT;
/** Opacity of the parts the current step is not about. */
const DIM = 0.55;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * "Anatomy of a fault" (docs/BRIEF.md §6.5, docs/DESIGN.md §3.5) — the
 * centrepiece.
 *
 * A pinned cutaway diorama of a whole installation: enclosure, door, DIN rail,
 * breaker, RCD, N/PE bars, a three-conductor cable, a Schuko socket in three
 * parts, a wall switch and an E27 pendant — fourteen parts. Scrubbing the pin
 * blows the installation apart **at once** along per-part axes (with arc
 * leader lines and part numbers drawing in), plays the five fault → fix → flow
 * steps with the focused part brought forward and glowing while the rest stay
 * exploded and dimmed, then snaps everything back **at once**, closes the
 * door, runs the current through and lights the bulb.
 *
 * Every visual is driven by that one timeline, so scrolling backwards
 * un-fixes the fault exactly the way it was fixed; step/beat state is written
 * straight to the DOM (`data-step`, `data-beat`, counters, dots) from the
 * timeline's own update, never through React state.
 *
 * Reduced motion gets no pin and no scrub: the assembled, lit diorama and all
 * five step cards are simply there.
 */
export function Anatomy() {
  const steps = site.anatomy.steps;
  const reduced = usePrefersReducedMotion();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const lenis = useLenis();
  const layout = useMemo(() => getDiorama(!desktop), [desktop]);

  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLParagraphElement>(null);
  const partsRef = useRef<HTMLParagraphElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const currentRef = useRef<CurrentPathHandle>(null);
  const sparks = {
    breaker: useRef<SparksHandle>(null),
    cable: useRef<SparksHandle>(null),
    socket: useRef<SparksHandle>(null),
  };

  function goToStep(index: number) {
    const trigger = triggerRef.current;
    if (!trigger) {
      document
        .getElementById(`anatomija-korak-${index + 1}`)
        ?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      return;
    }
    const at = (EXPLODE + (index * 3 + 0.45) * BEAT) / TOTAL;
    const top = trigger.start + (trigger.end - trigger.start) * at;
    if (lenis) {
      lenis.scrollTo(top, { immediate: reduced });
    } else {
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  useGSAP(
    () => {
      const root = rootRef.current;
      const pin = pinRef.current;
      if (!root || !pin) return undefined;

      const q = <T extends Element>(selector: string) => root.querySelector<T>(selector);
      const cards = gsap.utils.toArray<HTMLElement>('[data-testid="anatomy-card"]', root);
      const dots = gsap.utils.toArray<HTMLElement>('[data-anatomy-dot]', root);
      const finalText = q<HTMLElement>('[data-testid="anatomy-final"]');
      const bulb = q<SVGCircleElement>('[data-testid="anatomy-bulb"]');
      const bulbGlow = q<SVGCircleElement>('[data-part-id="bulb"] [data-part="bulb-glow"]');
      const filament = q<SVGPathElement>('[data-part-id="bulb"] [data-part="filament"]');
      const arc = q<SVGGElement>('[data-testid="anatomy-arc"]');
      const tape = q<SVGGElement>('[data-testid="anatomy-tape"]');
      // The two elements the live fault loops own outright. Nothing on the
      // scrubbed master ever touches them.
      const arcFlickerEl = q<SVGPolylineElement>('[data-testid="anatomy-arc"] [data-part="arc-flicker"]');
      const bulbFlickerEl = q<SVGCircleElement>('[data-part-id="bulb"] [data-part="bulb-flicker"]');

      unveil(cards, finalText);

      if (reduced) {
        root.dataset.step = String(steps.length);
        root.dataset.beat = 'final';
        currentRef.current?.setProgress(1);
        return undefined;
      }

      // ---------------------------------------------------------------- eager
      gsap.set(cards, { opacity: 0, y: 10 });
      if (finalText) gsap.set(finalText, { opacity: 0, y: 10 });
      let sceneBuilt = false;
      const safetyNet = gsap.delayedCall(4, () => {
        if (sceneBuilt) return;
        gsap.set(cards, { opacity: 1, y: 0 });
        if (finalText) gsap.set(finalText, { opacity: 1, y: 0 });
      });

      // The spine fixes the master's duration whether or not the scene has been
      // built yet, so the pin distance and the time→state mapping never change.
      const master = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      master.to({}, { duration: TOTAL }, 0);

      // --- live (non-scrubbed) loops, owned by the beat state -----------
      let arcFlicker: gsap.core.Timeline | null = null;
      let bulbFlicker: gsap.core.Timeline | null = null;
      let lastSegment = -2;
      let lastParts = -1;

      const stopLoops = () => {
        arcFlicker?.kill();
        arcFlicker = null;
        bulbFlicker?.kill();
        bulbFlicker = null;
        if (arcFlickerEl) arcFlickerEl.style.opacity = '1';
        if (bulbFlickerEl) bulbFlickerEl.style.opacity = '0';
        sparks.cable.current?.stop();
        sparks.socket.current?.stop();
      };

      const applyState = () => {
        const t = master.progress() * TOTAL;

        // "Delovi: 14" counts up over the first part of the explosion, so the
        // number is already complete while the parts are still separating.
        const shown = Math.round(gsap.utils.clamp(0, 1, t / (EXPLODE * 0.4)) * PART_COUNT);
        if (shown !== lastParts && partsRef.current) {
          lastParts = shown;
          partsRef.current.textContent = `Delovi: ${pad(shown)}`;
        }

        // -1 = taking apart, 0…14 = the five steps, 15 = putting back together
        const segment =
          t < EXPLODE ? -1 : t >= ASSEMBLE_START ? BEAT_COUNT : Math.floor((t - EXPLODE) / BEAT);
        if (segment === lastSegment) return;
        lastSegment = segment;

        const isFinal = segment >= BEAT_COUNT;
        const step = segment < 0 ? 0 : isFinal ? steps.length - 1 : Math.floor(segment / 3);
        const beat = segment < 0 ? 'fault' : isFinal ? 'final' : BEATS[segment % 3];

        root.dataset.step = String(step + 1);
        root.dataset.beat = beat;
        if (counterRef.current) {
          counterRef.current.textContent = `${pad(step + 1)}/${pad(steps.length)}`;
        }
        cards.forEach((card, index) => {
          card.dataset.active = index === step ? 'true' : 'false';
        });
        dots.forEach((dot, index) => {
          dot.dataset.active = index === step ? 'true' : 'false';
          if (index === step) dot.setAttribute('aria-current', 'step');
          else dot.removeAttribute('aria-current');
        });
        if (bulb) {
          bulb.dataset.lit = segment >= BEAT_COUNT - 1 ? 'true' : 'false';
        }

        stopLoops();
        if (segment < 0 || isFinal) return;

        const id = steps[step].id;
        if (beat === 'fault' && id === 'breaker') sparks.breaker.current?.burst(8);
        if (beat === 'fault' && id === 'cable') {
          sparks.cable.current?.start();
          if (arcFlickerEl) arcFlicker = flickerFault(arcFlickerEl, { dip: 0.22, interval: 0.9 });
        }
        if (beat === 'fault' && id === 'socket') sparks.socket.current?.start();
        if (beat === 'fault' && id === 'lamp' && bulbFlickerEl) {
          bulbFlicker = flickerFault(bulbFlickerEl, { dip: 0.12, interval: 1.2 });
        }
      };

      master.eventCallback('onUpdate', applyState);

      const trigger = ScrollTrigger.create({
        trigger: pin,
        start: 'top top',
        // Desktop 600vh of scroll over the pin, phones stay under 300vh
        // (BRIEF §7). Every tween value below is in SVG user units, so a
        // resize never invalidates the animation — only this end distance.
        end: () => `+=${Math.round((desktop ? 6 : 2.9) * window.innerHeight)}`,
        pin,
        anticipatePin: 1,
        scrub: 0.5,
        animation: master,
      });
      triggerRef.current = trigger;
      applyState();

      // ----------------------------------------------------------------- lazy
      const buildScene = () => {
        sceneBuilt = true;
        safetyNet.kill();

        const inner = (id: string) => q<SVGGElement>(`[data-part-id="${id}"]`);
        const part = (id: string, name: string) =>
          q<SVGElement>(`[data-part-id="${id}"] [data-part="${name}"]`);
        const leaders = q<SVGGElement>('[data-leaders]');
        const leaderLines = gsap.utils.toArray<SVGPathElement>('[data-leaders] [data-leader-line]', root);
        const leaderLabels = gsap.utils.toArray<SVGGElement>('[data-leaders] [data-leader-label]', root);

        if (arc) gsap.set(arc, { autoAlpha: 0 });
        if (tape) gsap.set(tape, { autoAlpha: 0 });
        currentRef.current?.setProgress(0);

        // ---------------------------------------------- 0–12 %: all at once
        layout.parts.forEach((p, index) => {
          const group = inner(p.id);
          if (!group) return;
          master.to(
            group,
            {
              x: p.ex,
              y: p.ey,
              rotation: p.rot,
              scale: p.sc,
              duration: EXPLODE * 0.78,
              ease: 'power2.out',
              transformOrigin: '50% 50%',
            },
            index * 0.012
          );
          master.to(group, { opacity: DIM, duration: EXPLODE * 0.3 }, EXPLODE * 0.66);
        });

        if (leaders) master.to(leaders, { opacity: 1, duration: 0.3 }, EXPLODE * 0.15);
        if (leaderLines.length) {
          master.fromTo(
            leaderLines,
            { drawSVG: '0% 0%' },
            { drawSVG: '0% 100%', duration: EXPLODE * 0.4, stagger: 0.02, ease: 'power1.out' },
            EXPLODE * 0.2
          );
        }
        if (leaderLabels.length) {
          master.to(leaderLabels, { opacity: 1, duration: 0.3, stagger: 0.02 }, EXPLODE * 0.45);
        }
        // Once the taking-apart beat is over the callouts step back so the
        // five fault/fix steps read against a calm drawing.
        if (leaders) master.to(leaders, { opacity: 0.45, duration: 0.5 }, EXPLODE);
        master.fromTo(cards[0], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, EXPLODE * 0.6);

        // ------------------------------------------ 12–84 %: the five steps
        let flowFrom = 0;
        steps.forEach((step, index) => {
          const p = layout.parts.find((item) => item.id === layout.focus[step.id]);
          const group = p ? inner(p.id) : null;
          const halo = p ? part(p.id, 'halo') : null;
          const start = EXPLODE + index * 3 * BEAT;

          // the focused part comes forward and lights up
          if (p && group) {
            master.to(
              group,
              {
                x: p.ex * 0.3,
                y: p.ey * 0.3,
                rotation: p.rot * 0.3,
                scale: p.sc * 1.16,
                opacity: 1,
                duration: BEAT * 0.55,
                ease: 'power2.out',
              },
              start
            );
          }
          if (halo) master.to(halo, { opacity: 0.6, duration: BEAT * 0.55 }, start);
          if (index > 0) master.to(cards[index - 1], { opacity: 0, y: -8, duration: BEAT * 0.3 }, start);
          master.fromTo(
            cards[index],
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: BEAT * 0.4 },
            start + BEAT * 0.15
          );

          const fix = start + BEAT;

          if (step.id === 'breaker') {
            const lever = part('mcb', 'lever');
            const flash = part('mcb', 'flash');
            const indicator = part('mcb', 'indicator');
            if (lever) master.to(lever, { y: 26, duration: BEAT * 0.3, ease: 'power3.in' }, start + 0.15);
            if (flash) {
              master
                .to(flash, { opacity: 0.4, duration: 0.12 }, start + 0.42)
                .to(flash, { opacity: 0, duration: 0.26 }, start + 0.54);
            }
            if (lever) master.to(lever, { y: 0, duration: BEAT * 0.45, ease: 'back.out(1.8)' }, fix + 0.1);
            if (indicator) master.to(indicator, { opacity: 1, duration: 0.3 }, fix + 0.4);
          }

          if (step.id === 'rcd') {
            const lever = part('rcd', 'lever');
            const test = part('rcd', 'test');
            const indicator = part('rcd', 'indicator');
            const ok = part('rcd', 'ok');
            if (lever) master.to(lever, { y: 26, duration: BEAT * 0.28, ease: 'power3.in' }, start + 0.15);
            if (indicator) master.to(indicator, { opacity: 1, duration: 0.3 }, start + 0.4);
            if (test) {
              master
                .to(test, { scale: 0.76, duration: 0.2, transformOrigin: '50% 50%' }, fix + 0.1)
                .to(test, { scale: 1, duration: 0.3 }, fix + 0.35);
            }
            if (indicator) master.to(indicator, { opacity: 0, duration: 0.25 }, fix + 0.35);
            if (lever) master.to(lever, { y: 0, duration: BEAT * 0.45, ease: 'back.out(1.8)' }, fix + 0.4);
            if (ok) master.to(ok, { opacity: 1, duration: 0.3 }, fix + 0.7);
          }

          if (step.id === 'cable') {
            const copper = part('cable', 'copper');
            const clip = part('cable', 'tape-clip');
            if (copper) master.to(copper, { opacity: 1, duration: 0.3 }, start + 0.2);
            if (arc) master.to(arc, { autoAlpha: 1, duration: 0.2 }, start + 0.25);
            if (arc) master.to(arc, { autoAlpha: 0, duration: 0.2 }, fix + 0.05);
            if (tape) master.to(tape, { autoAlpha: 1, duration: 0.15 }, fix + 0.05);
            if (clip) {
              master.fromTo(
                clip,
                { attr: { width: 0, x: -32 } },
                { attr: { width: 64 }, duration: BEAT * 0.55, ease: 'steps(4)' },
                fix + 0.1
              );
            }
            if (copper) master.to(copper, { opacity: 0, duration: 0.25 }, fix + 0.55);
          }

          if (step.id === 'socket') {
            const soot = part('socket-cover', 'soot');
            const oldSocket = part('socket-insert', 'old-socket');
            const newSocket = part('socket-insert', 'new-socket');
            const sweep = part('socket-cover', 'sweep');
            if (soot) master.to(soot, { opacity: 0.5, duration: 0.35 }, start + 0.2);
            if (oldSocket) {
              master.to(oldSocket, { x: 86, opacity: 0, duration: BEAT * 0.45, ease: 'power2.in' }, fix + 0.05);
            }
            if (newSocket) {
              master.fromTo(
                newSocket,
                { x: -86, opacity: 0 },
                { x: 0, opacity: 1, duration: BEAT * 0.5, ease: 'power3.out' },
                fix + 0.4
              );
            }
            if (soot) master.to(soot, { opacity: 0, duration: 0.3 }, fix + 0.5);
            if (sweep) {
              master.fromTo(sweep, { x: 0, opacity: 0.3 }, { x: 92, opacity: 0, duration: BEAT * 0.5 }, fix + 0.75);
            }
          }

          if (step.id === 'lamp') {
            const rocker = part('switch', 'rocker');
            if (rocker) master.to(rocker, { y: 8, duration: 0.25 }, start + 0.15);
            if (rocker) master.to(rocker, { y: -8, duration: 0.35, ease: 'back.out(2)' }, fix + 0.1);
            // calm ignition — no flicker, the fault is fixed
            if (bulb) master.to(bulb, { opacity: 0.85, duration: BEAT * 0.5, ease: 'power2.out' }, fix + 0.2);
            if (filament) master.to(filament, { opacity: 1, duration: BEAT * 0.45 }, fix + 0.2);
            if (bulbGlow) master.to(bulbGlow, { opacity: 0.8, duration: BEAT * 0.55 }, fix + 0.3);
          }

          // --- beat 3: the current moves on -----------------------------
          const flowAt = start + 2 * BEAT;
          const flow = currentRef.current?.timeline(flowFrom, layout.flow[index], {
            duration: BEAT * 0.8,
          });
          if (flow) master.add(flow, flowAt);
          flowFrom = layout.flow[index];
          if (p && group) {
            master.to(
              group,
              {
                x: p.ex,
                y: p.ey,
                rotation: p.rot,
                scale: p.sc,
                opacity: DIM,
                duration: BEAT * 0.6,
                ease: 'power2.inOut',
              },
              flowAt
            );
          }
          if (halo) master.to(halo, { opacity: 0, duration: BEAT * 0.5 }, flowAt);
        });

        // --------------------------------------- 84–100 %: back together
        if (leaderLabels.length) {
          master.to(leaderLabels, { opacity: 0, duration: ASSEMBLE * 0.2 }, ASSEMBLE_START);
        }
        if (leaders) master.to(leaders, { opacity: 0, duration: ASSEMBLE * 0.3 }, ASSEMBLE_START);
        if (partsRef.current) {
          master.to(partsRef.current, { opacity: 0, duration: ASSEMBLE * 0.3 }, ASSEMBLE_START);
        }
        layout.parts.forEach((p, index) => {
          const group = inner(p.id);
          if (!group) return;
          master.to(
            group,
            {
              x: 0,
              y: 0,
              // back.out overshoots past zero and settles — the parts read as
              // being screwed down rather than dropped into place.
              rotation: 0,
              scale: 1,
              opacity: 1,
              duration: ASSEMBLE * 0.55,
              ease: 'back.out(1.4)',
            },
            ASSEMBLE_START + index * 0.04
          );
        });

        const tail = currentRef.current?.timeline(layout.flow[4], 1, { duration: ASSEMBLE * 0.5 });
        if (tail) master.add(tail, ASSEMBLE_START + 0.4);
        if (bulb) master.to(bulb, { opacity: 0.95, duration: ASSEMBLE * 0.4 }, ASSEMBLE_START + 1.2);
        if (bulbGlow) master.to(bulbGlow, { opacity: 1, duration: ASSEMBLE * 0.45 }, ASSEMBLE_START + 1.4);
        if (finalText) master.to(finalText, { opacity: 1, y: 0, duration: 0.5 }, ASSEMBLE_START + 1.6);

        if (trigger.progress > 0) master.progress(trigger.progress);
        lastSegment = -2;
        lastParts = -1;
        applyState();
      };

      const disposeNear = whenNear(pin, buildScene);

      return () => {
        safetyNet.kill();
        disposeNear();
        stopLoops();
        master.eventCallback('onUpdate', null);
        trigger.kill();
        triggerRef.current = null;
        master.kill();
      };
    },
    { dependencies: [reduced, desktop, layout], revertOnUpdate: true }
  );

  const counter = `${pad(reduced ? steps.length : 1)}/${pad(steps.length)}`;

  const controls = (
    <div className="flex items-center justify-between gap-4">
      <p ref={counterRef} data-testid="anatomy-counter" className="font-mono text-sm text-arc">
        {counter}
      </p>
      <div className="flex gap-0.5">
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            data-anatomy-dot=""
            data-testid={`anatomy-dot-${index + 1}`}
            data-active={(reduced ? index === steps.length - 1 : index === 0) ? 'true' : 'false'}
            aria-label={step.name}
            onClick={() => goToStep(index)}
            className="focus-ring group flex h-11 w-11 items-center justify-center rounded-md"
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-muted transition-colors group-data-[active=true]:bg-volt"
            />
          </button>
        ))}
      </div>
    </div>
  );

  const stepCards = steps.map((step, index) => (
    <article
      key={step.id}
      id={`anatomija-korak-${index + 1}`}
      data-testid="anatomy-card"
      data-step={index + 1}
      data-active={(reduced ? true : index === 0) ? 'true' : 'false'}
      className="jv-card jv-veil card p-5 md:p-6"
    >
      <p className="font-mono text-xs font-semibold tracking-widest text-arc">{pad(index + 1)}</p>
      <h3 className="display-md mt-1 text-text">{step.name}</h3>
      <dl className="mt-3 grid gap-2 text-[13px] leading-snug md:text-sm">
        <div>
          <dt className="mr-1 inline font-mono text-[10px] uppercase tracking-wide text-muted">
            {site.anatomy.labels.problem}:
          </dt>
          <dd className="inline text-muted">{step.problem}</dd>
        </div>
        <div>
          <dt className="mr-1 inline font-mono text-[10px] uppercase tracking-wide text-muted">
            {site.anatomy.labels.symptom}:
          </dt>
          <dd className="inline text-muted">{step.symptom}</dd>
        </div>
        <div>
          <dt className="mr-1 inline font-mono text-[10px] uppercase tracking-wide text-arc">
            {site.anatomy.labels.fix}:
          </dt>
          <dd className="inline text-text">{step.fix}</dd>
        </div>
      </dl>
    </article>
  ));

  const finalLine = (
    <p data-testid="anatomy-final" className="jv-veil serif-accent text-center text-2xl text-arc md:text-3xl">
      {site.anatomy.finalText}
    </p>
  );

  const partsTag = (
    <p
      ref={partsRef}
      data-anatomy-parts=""
      className="label-mono pointer-events-none absolute right-6 top-2 z-10 whitespace-nowrap"
    >
      Delovi: {pad(PART_COUNT)}
    </p>
  );

  const stage = (
    <Diorama layout={layout} lit={reduced} sparks={sparks} current={currentRef} />
  );

  // The stage: drawing first, closing line directly under it (never floating in
  // the stage's bottom inset — review-3 minor 3).
  const stageBlock = (
    <div className="flex w-full flex-col items-center gap-1">
      {stage}
      {finalLine}
    </div>
  );


  return (
    <section
      id="anatomija"
      ref={rootRef}
      data-testid="section-anatomy"
      data-step={reduced ? steps.length : 1}
      data-beat={reduced ? 'final' : 'fault'}
      className="section relative"
    >
      <div className="container-x">
        <SectionHeader
          sheet={3}
          eyebrow={site.anatomy.eyebrow}
          title={site.anatomy.title}
          intro={site.anatomy.intro}
        />
      </div>

      {reduced ? (
        <div className="container-x mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
          <div data-testid="anatomy-stage" className="corner-marks relative flex items-center justify-center p-4">
            <span className="corner-marks__b" aria-hidden="true" />
            {partsTag}
            {stage}
          </div>
          <div className="flex flex-col gap-4">
            {controls}
            {stepCards}
            {finalLine}
          </div>
        </div>
      ) : (
        <div
          ref={pinRef}
          className="min-h-app container-x mt-8 flex flex-col justify-center gap-3 py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-center lg:gap-10"
        >
          <div
            data-testid="anatomy-stage"
            className="corner-marks relative flex items-center justify-center p-1 md:p-2"
          >
            <span className="corner-marks__b" aria-hidden="true" />
            {partsTag}
            {stageBlock}
          </div>
          <div className="flex flex-col gap-3">
            {controls}
            <div className="jv-card-stack min-h-[208px] md:min-h-[240px]">{stepCards}</div>
          </div>
        </div>
      )}
    </section>
  );
}
