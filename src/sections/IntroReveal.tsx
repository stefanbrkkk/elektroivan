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
        <svg width="132" height="152" viewBox="0 0 132 152" aria-hidden="true">
          {/* fuse-box door outline, drawn in the dark */}
          <circle data-halo="" cx="66" cy="76" r="46" fill="var(--color-volt)" opacity="0" />
          <rect x="10" y="10" width="112" height="132" rx="8" fill="none" stroke="var(--color-line)" strokeWidth="2" />
          <rect x="22" y="24" width="88" height="104" rx="4" fill="none" stroke="var(--color-line)" strokeWidth="1.5" />
          <path d="M 22 60 H 110" stroke="var(--color-line)" strokeWidth="2" />
          {[34, 56, 78].map((x) => (
            <rect key={x} x={x} y="36" width="18" height="48" rx="2" fill="none" stroke="var(--color-line)" strokeWidth="1.5" />
          ))}
          <path d="M 118 70 h 8 M 118 82 h 8" stroke="var(--color-line)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="112" cy="76" r="3" fill="none" stroke="var(--color-line)" strokeWidth="1.5" />
          {/* the filament that catches inside the middle module */}
          <path
            data-filament=""
            d="M 58 74 c 0 -7 4 -8 4 -12 s -2 -5 4 -5 s 4 3 4 5 s 4 5 4 12"
            fill="none"
            stroke="var(--color-volt-hi)"
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity="0.16"
          />
          <path d="M 22 98 H 110" stroke="var(--color-line)" strokeWidth="1.5" strokeDasharray="4 8" />
        </svg>
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          {site.ui.loaderLabel}
        </span>
      </div>
    </div>
  );
}
