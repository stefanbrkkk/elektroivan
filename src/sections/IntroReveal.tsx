import { useRef } from 'react';
import { site } from '../config/site';
import { gsap, isLateBoot, unveil, useGSAP } from '../motion/motion';
import { flickerOn } from '../motion/flicker';
import { introWasSeen, markIntroDone, rememberIntro } from '../motion/intro';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const INTERRUPT_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/**
 * Once-per-session loader overlay (docs/BRIEF.md §6.1): in the dark, a bulb
 * filament flickers on (≤3 brightness changes, ≤600ms) and its light spreads
 * outward to reveal the page. The whole thing is capped at ~1.1s, never waits
 * for fonts or network, and any input finishes it immediately.
 *
 * The element stays mounted afterwards (`hidden`), so the section order stays
 * deterministic. `html[data-intro="skip"]` (reduced motion or a session that
 * already saw it) hides it from the first paint via CSS, and the
 * `.jv-intro-auto` class is a pure-CSS fallback that clears the overlay even
 * if the bundle never runs.
 */
export function IntroReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return undefined;

      const finish = () => {
        rememberIntro();
        root.hidden = true;
        root.setAttribute('aria-hidden', 'true');
        markIntroDone();
      };

      const skipped =
        reduced ||
        introWasSeen() ||
        isLateBoot() ||
        document.documentElement.getAttribute('data-intro') === 'skip';

      if (skipped) {
        root.hidden = true;
        root.setAttribute('aria-hidden', 'true');
        markIntroDone();
        return undefined;
      }

      // Take over from the CSS fallback before it can fire.
      unveil(root);
      root.classList.remove('jv-intro-auto');

      const filament = root.querySelector<SVGPathElement>('[data-filament]');
      const halo = root.querySelector<SVGCircleElement>('[data-halo]');
      const light = root.querySelector<HTMLElement>('[data-light]');

      const timeline = gsap.timeline({ onComplete: finish });
      gsap.set(root, { opacity: 1 });
      if (light) gsap.set(light, { scale: 0, opacity: 0.9, transformOrigin: '50% 50%' });

      if (filament) {
        timeline.add(flickerOn(filament, { glow: halo ?? undefined, duration: 0.5 }), 0);
      }
      if (light) {
        timeline.to(light, { scale: 9, duration: 0.55, ease: 'power2.in' }, 0.45);
      }
      timeline.to(root, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0.62);

      const interrupt = () => {
        timeline.progress(1);
      };
      for (const type of INTERRUPT_EVENTS) {
        window.addEventListener(type, interrupt, { passive: true, once: true });
      }

      return () => {
        for (const type of INTERRUPT_EVENTS) {
          window.removeEventListener(type, interrupt);
        }
        timeline.kill();
      };
    },
    { dependencies: [reduced], revertOnUpdate: true }
  );

  return (
    <div
      id="intro"
      ref={rootRef}
      data-testid="section-intro"
      className="jv-intro jv-intro-auto"
      role="status"
      aria-label={site.ui.loaderLabel}
    >
      <div
        data-light=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--color-volt-hi) 70%, transparent) 0%, transparent 70%)',
        }}
      />
      <div className="relative flex flex-col items-center gap-4">
        <svg width="84" height="104" viewBox="0 0 84 104" aria-hidden="true">
          <circle data-halo="" cx="42" cy="40" r="30" fill="var(--color-volt)" opacity="0" />
          <path
            d="M42 8c-13 0-22 9.6-22 21.4 0 7.6 3.8 12.6 7.2 16.6 2.6 3 4.4 5.2 4.4 8.4v3.2h20.8v-3.2c0-3.2 1.8-5.4 4.4-8.4 3.4-4 7.2-9 7.2-16.6C64 17.6 55 8 42 8Z"
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="2"
          />
          <path
            d="M31.6 66h20.8m-19.6 8h18.4m-16 8h13.6"
            stroke="var(--color-line)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            data-filament=""
            d="M34 44c0-6 3-8 4-12s-2-6 4-6 3 4 4 6 4 6 4 12"
            fill="none"
            stroke="var(--color-volt-hi)"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.16"
          />
        </svg>
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          {site.ui.loaderLabel}
        </span>
      </div>
    </div>
  );
}
