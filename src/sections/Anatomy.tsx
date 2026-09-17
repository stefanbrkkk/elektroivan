import { useMemo, useRef } from 'react';
import { site } from '../config/site';
import { useLenis } from '../components/SmoothScroll';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { ScrollTrigger, gsap, unveil, useGSAP, whenNear } from '../motion/motion';
import { flickerFault } from '../motion/flicker';
import type { CurrentPathHandle, SparksHandle } from '../motion/types';
import { CircuitSvg } from './anatomy/CircuitSvg';
import { getCircuitLayout } from './anatomy/layout';

const BEATS = ['fault', 'fix', 'flow'] as const;
/** Samples taken along the rendered circuit path to locate each component. */
const SAMPLES = 120;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * "Anatomy of a fault" (docs/BRIEF.md §6.5) — the centrepiece.
 *
 * A pinned section scrubbed through five steps of three beats each
 * (fault → fix → flow) plus a closing beat where the whole circuit is lit.
 * Every visual is driven by one master timeline, so scrolling backwards
 * un-fixes the fault exactly the way it was fixed; step/beat state is written
 * straight to the DOM (`data-step`, `data-beat`, counter text, dots) from the
 * timeline's own update, never through React state.
 *
 * Reduced motion gets no pin and no scrub: all five steps, the connected
 * circuit and the lit bulb are simply there.
 */
export function Anatomy() {
  const steps = site.anatomy.steps;
  const segments = steps.length * 3 + 1;
  const reduced = usePrefersReducedMotion();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const lenis = useLenis();
  const layout = useMemo(() => getCircuitLayout(!desktop), [desktop]);

  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLParagraphElement>(null);
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
    const top =
      trigger.start + (trigger.end - trigger.start) * ((index * 3 + 0.45) / segments);
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

      const cards = gsap.utils.toArray<HTMLElement>('[data-testid="anatomy-card"]', root);
      const dots = gsap.utils.toArray<HTMLElement>('[data-anatomy-dot]', root);
      const finalText = root.querySelector<HTMLElement>('[data-testid="anatomy-final"]');
      const bulb = root.querySelector<SVGCircleElement>('[data-testid="anatomy-bulb"]');
      const bulbGlow = root.querySelector<SVGCircleElement>('[data-node="bulb"] [data-part="bulb-glow"]');
      const filament = root.querySelector<SVGPathElement>('[data-node="bulb"] [data-part="filament"]');
      const arc = root.querySelector<SVGPolylineElement>('[data-testid="anatomy-arc"]');
      const tape = root.querySelector<SVGGElement>('[data-testid="anatomy-tape"]');

      unveil(cards, finalText);

      if (reduced) {
        root.dataset.step = String(steps.length);
        root.dataset.beat = 'final';
        currentRef.current?.setProgress(1);
        return undefined;
      }

      // ---------------------------------------------------------------- eager
      // Only what the first paint and the reserved height depend on. The five
      // step cards share one box (`.jv-card-stack`), so they must be dimmed
      // before anything else runs.
      gsap.set(cards, { opacity: 0, y: 10 });
      gsap.set(cards[0], { opacity: 1, y: 0 });
      if (finalText) gsap.set(finalText, { opacity: 0, y: 10 });

      // The spine: one empty tween fixes the master's duration at `segments`
      // whether or not the scene has been built yet, so the pin distance and
      // the segment→progress mapping never change (no reflow, no refresh, and
      // `data-step`/`data-beat` are already correct while scrolling in).
      const master = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      master.to({}, { duration: segments }, 0);

      // --- live (non-scrubbed) loops, owned by the beat state -----------
      let arcFlicker: gsap.core.Timeline | null = null;
      let bulbFlicker: gsap.core.Timeline | null = null;
      let lastSegment = -1;

      const stopLoops = () => {
        arcFlicker?.kill();
        arcFlicker = null;
        bulbFlicker?.kill();
        bulbFlicker = null;
        sparks.cable.current?.stop();
        sparks.socket.current?.stop();
      };

      const applyState = () => {
        const raw = Math.floor(master.progress() * segments);
        const segment = gsap.utils.clamp(0, segments - 1, raw);
        if (segment === lastSegment) return;
        lastSegment = segment;

        const isFinal = segment >= segments - 1;
        const step = isFinal ? steps.length - 1 : Math.min(steps.length - 1, Math.floor(segment / 3));
        const beat = isFinal ? 'final' : BEATS[segment % 3];

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
          bulb.dataset.lit = step === steps.length - 1 && beat !== 'fault' ? 'true' : 'false';
        }

        stopLoops();

        if (beat === 'fault' && steps[step].id === 'breaker') {
          sparks.breaker.current?.burst(8);
        }
        if (beat === 'fault' && steps[step].id === 'cable') {
          sparks.cable.current?.start();
          if (arc) arcFlicker = flickerFault(arc, { dip: 0.22, interval: 0.9 });
        }
        if (beat === 'fault' && steps[step].id === 'socket') {
          sparks.socket.current?.start();
        }
        if (beat === 'fault' && steps[step].id === 'lamp' && bulb) {
          bulbFlicker = flickerFault(bulb, { dip: 0.12, interval: 1.2 });
        }
      };

      master.eventCallback('onUpdate', applyState);

      const trigger = ScrollTrigger.create({
        trigger: pin,
        start: 'top top',
        end: () => `+=${Math.round((desktop ? 5 : 2.8) * window.innerHeight)}`,
        pin,
        anticipatePin: 1,
        scrub: 0.5,
        invalidateOnRefresh: true,
        animation: master,
      });
      triggerRef.current = trigger;
      applyState();

      // ----------------------------------------------------------------- lazy
      // Everything below measures the circuit SVG or creates a tween on it.
      // Doing it inside the hydration commit was the single biggest chunk of
      // the ~440ms boot task (BRIEF §7: build heavy scenes near the viewport;
      // the pin spacer above already reserves the height, so CLS stays 0).
      const buildScene = () => {
        // Where each component sits along the circuit path, measured from the
        // rendered path so the two layouts need no hand-kept numbers.
        const corePath = root.querySelector<SVGPathElement>(
          '[data-testid="anatomy-stage"] path[data-core]'
        );
        const samples: { x: number; y: number }[] = [];
        if (corePath) {
          const total = corePath.getTotalLength();
          for (let i = 0; i <= SAMPLES; i += 1) {
            const point = corePath.getPointAtLength((total * i) / SAMPLES);
            samples.push({ x: point.x, y: point.y });
          }
        }
        const progressAt = (x: number, y: number) => {
          let best = 0;
          let bestDistance = Number.POSITIVE_INFINITY;
          samples.forEach((point, index) => {
            const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
            if (distance < bestDistance) {
              bestDistance = distance;
              best = index / (samples.length - 1);
            }
          });
          return best;
        };
        const nodeProgress = layout.nodes.map((item) => progressAt(item.x, item.y));

        const node = (id: string) => root.querySelector<SVGGElement>(`[data-node="${id}"]`);
        const part = (id: string, name: string) =>
          root.querySelector<SVGElement>(`[data-node="${id}"] [data-part="${name}"]`);

        // Baseline transforms: GSAP takes over the `transform` attribute the
        // layout put on every component group.
        for (const item of layout.nodes) {
          const element = node(item.id);
          if (!element) continue;
          gsap.set(element, {
            x: item.x,
            y: item.y,
            rotation: item.rotate,
            transformOrigin: '50% 50%',
            opacity: 0.5,
          });
        }

        if (arc) gsap.set(arc, { autoAlpha: 0 });
        if (tape) gsap.set(tape, { autoAlpha: 0 });
        currentRef.current?.setProgress(0);

        layout.nodes.forEach((item, index) => {
          const group = node(item.id);
          if (!group) return;
          const start = index * 3;
          const halo = part(item.id, 'halo');
          const previous = index === 0 ? 0 : nodeProgress[index - 1];

          // --- beat 1: the fault shows itself -----------------------------
          master.to(
            group,
            {
              x: item.x + layout.lift.x,
              y: item.y + layout.lift.y,
              scale: 1.08,
              opacity: 1,
              duration: 0.45,
              ease: 'power2.out',
            },
            start
          );
          if (halo) master.to(halo, { opacity: 0.55, duration: 0.45 }, start);
          if (index > 0) master.to(cards[index - 1], { opacity: 0, y: -8, duration: 0.3 }, start);
          master.fromTo(
            cards[index],
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4 },
            start + 0.15
          );

          if (item.id === 'breaker') {
            const lever = part('breaker', 'lever');
            const flash = part('breaker', 'flash');
            const indicator = part('breaker', 'indicator');
            if (lever) master.to(lever, { y: 17, rotation: 7, duration: 0.3, ease: 'power3.in' }, start + 0.1);
            if (flash) {
              master
                .to(flash, { opacity: 0.4, duration: 0.12 }, start + 0.32)
                .to(flash, { opacity: 0, duration: 0.24 }, start + 0.44);
            }
            if (lever) master.to(lever, { y: 0, rotation: 0, duration: 0.45, ease: 'back.out(1.6)' }, start + 1.05);
            if (indicator) master.to(indicator, { opacity: 1, duration: 0.3 }, start + 1.4);
          }

          if (item.id === 'rcd') {
            const lever = part('rcd', 'lever');
            const test = part('rcd', 'test');
            const indicator = part('rcd', 'indicator');
            const ok = part('rcd', 'ok');
            if (lever) master.to(lever, { y: 19, duration: 0.28, ease: 'power3.in' }, start + 0.1);
            if (indicator) master.to(indicator, { opacity: 1, duration: 0.3 }, start + 0.3);
            if (test) {
              master
                .to(test, { scale: 0.72, duration: 0.2, transformOrigin: '50% 50%' }, start + 1.05)
                .to(test, { scale: 1, duration: 0.3 }, start + 1.3);
            }
            if (indicator) master.to(indicator, { opacity: 0, duration: 0.25 }, start + 1.3);
            if (lever) master.to(lever, { y: 0, duration: 0.45, ease: 'back.out(1.6)' }, start + 1.35);
            if (ok) master.to(ok, { opacity: 1, duration: 0.3 }, start + 1.6);
          }

          if (item.id === 'cable') {
            const left = group.querySelector<SVGPathElement>('path[stroke-width="11"]');
            const copper = part('cable', 'copper');
            const clip = part('cable', 'tape-clip');
            if (left) master.to(left, { x: -5, duration: 0.3 }, start + 0.1);
            if (copper) master.to(copper, { opacity: 1, duration: 0.3 }, start + 0.15);
            if (arc) master.to(arc, { autoAlpha: 1, duration: 0.2 }, start + 0.2);
            // fix: four turns of insulating tape, then the arc dies
            if (arc) master.to(arc, { autoAlpha: 0, duration: 0.2 }, start + 1.05);
            if (tape) master.to(tape, { autoAlpha: 1, duration: 0.15 }, start + 1.05);
            if (clip) {
              master.fromTo(
                clip,
                { attr: { width: 0, x: -26 } },
                { attr: { width: 52 }, duration: 0.6, ease: 'steps(4)' },
                start + 1.1
              );
            }
            if (copper) master.to(copper, { opacity: 0, duration: 0.25 }, start + 1.5);
            if (left) master.to(left, { x: 0, duration: 0.3 }, start + 1.5);
          }

          if (item.id === 'socket') {
            const soot = part('socket', 'soot');
            const oldSocket = part('socket', 'old-socket');
            const newSocket = part('socket', 'new-socket');
            const sweep = part('socket', 'sweep');
            if (soot) master.to(soot, { opacity: 0.45, duration: 0.35 }, start + 0.15);
            if (oldSocket) master.to(oldSocket, { x: -74, opacity: 0, duration: 0.45, ease: 'power2.in' }, start + 1.05);
            if (newSocket) {
              master.fromTo(
                newSocket,
                { x: 74, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
                start + 1.35
              );
            }
            if (sweep) {
              master.fromTo(
                sweep,
                { x: 0, opacity: 0.28 },
                { x: 68, opacity: 0, duration: 0.5 },
                start + 1.7
              );
            }
          }

          if (item.id === 'lamp') {
            const rocker = part('lamp', 'rocker');
            if (rocker) master.to(rocker, { y: 7, duration: 0.25 }, start + 0.1);
            if (rocker) master.to(rocker, { y: -7, duration: 0.35, ease: 'back.out(2)' }, start + 1.05);
            // calm ignition — no flicker, the fault is fixed
            if (bulb) master.to(bulb, { opacity: 0.85, duration: 0.55, ease: 'power2.out' }, start + 1.2);
            if (filament) master.to(filament, { opacity: 1, duration: 0.5 }, start + 1.2);
            if (bulbGlow) master.to(bulbGlow, { opacity: 0.75, duration: 0.6 }, start + 1.3);
          }

          // --- beat 3: the current moves on -------------------------------
          const flow = currentRef.current?.timeline(previous, nodeProgress[index], { duration: 0.85 });
          if (flow) master.add(flow, start + 2);
          master.to(
            group,
            { x: item.x, y: item.y, scale: 1, opacity: 0.85, duration: 0.5, ease: 'power2.inOut' },
            start + 2
          );
          if (halo) master.to(halo, { opacity: 0, duration: 0.5 }, start + 2);
        });

        // --- closing beat: everything lit ---------------------------------
        const finalStart = steps.length * 3;
        const tail = currentRef.current?.timeline(nodeProgress[nodeProgress.length - 1], 1, {
          duration: 0.6,
        });
        if (tail) master.add(tail, finalStart);
        for (const item of layout.nodes) {
          const group = node(item.id);
          if (group) master.to(group, { opacity: 1, duration: 0.5 }, finalStart);
        }
        const bulbNode = root.querySelector<SVGGElement>('[data-node="bulb"]');
        if (bulbNode) master.to(bulbNode, { opacity: 1, duration: 0.5 }, finalStart);
        if (bulbGlow) master.to(bulbGlow, { opacity: 1, duration: 0.6 }, finalStart + 0.2);
        if (finalText) master.to(finalText, { opacity: 1, y: 0, duration: 0.5 }, finalStart + 0.3);

        // Catch up with wherever the pin already is, then re-derive the state.
        if (trigger.progress > 0) master.progress(trigger.progress);
        lastSegment = -1;
        applyState();
      };

      const disposeNear = whenNear(pin, buildScene);

      return () => {
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

  const header = (
    <div className="mx-auto max-w-6xl px-4 md:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-arc">{site.anatomy.eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold text-text md:text-5xl">
        {site.anatomy.title}
      </h2>
      <p className="mt-4 max-w-2xl text-muted">{site.anatomy.intro}</p>
    </div>
  );

  const controls = (
    <div className="flex items-center justify-between gap-4">
      <p ref={counterRef} data-testid="anatomy-counter" className="font-mono text-sm text-muted">
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
            className="focus-ring group flex h-11 w-9 items-center justify-center rounded-md"
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
      className="jv-card jv-veil glass p-4 md:p-5"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-arc">
        {pad(index + 1)}
      </p>
      <h3 className="mt-1 font-display text-base font-semibold text-text md:text-xl">
        {step.name}
      </h3>
      <dl className="mt-2 grid gap-1.5 text-[13px] leading-snug md:text-sm">
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
    <p
      data-testid="anatomy-final"
      className="jv-veil glass px-4 py-2 text-center font-display text-base font-semibold text-volt md:text-lg"
    >
      {site.anatomy.finalText}
    </p>
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
      {header}

      {reduced ? (
        <div className="mx-auto mt-10 grid max-w-6xl gap-8 px-4 md:px-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div data-testid="anatomy-stage" className="glass dot-grid flex items-center justify-center p-4">
            <CircuitSvg
              layout={layout}
              lit
              sparks={sparks}
              current={currentRef}
              label={site.anatomy.finalText}
            />
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
          className="min-h-app mx-auto mt-8 flex max-w-6xl flex-col justify-center gap-3 px-4 py-4 md:px-6 lg:grid lg:max-w-7xl lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center lg:gap-12"
        >
          <div
            data-testid="anatomy-stage"
            className="glass dot-grid relative flex items-center justify-center p-3 md:p-5 lg:min-h-[54svh]"
          >
            <CircuitSvg
              layout={layout}
              lit={false}
              sparks={sparks}
              current={currentRef}
              label={site.anatomy.title}
            />
            <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
              {finalLine}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {controls}
            <div className="jv-card-stack min-h-[190px] md:min-h-[230px]">{stepCards}</div>
          </div>
        </div>
      )}
    </section>
  );
}
