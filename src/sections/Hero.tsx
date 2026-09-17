import { useRef } from 'react';
import { site } from '../config/site';
import { AnchorLink } from '../components/AnchorLink';
import { Sparks } from '../motion/Sparks';
import { CurrentPath } from '../motion/CurrentPath';
import { EASE, ScrollTrigger, gsap, isLateBoot, unveil, useGSAP } from '../motion/motion';
import { flickerOn } from '../motion/flicker';
import { onIntroDone } from '../motion/intro';
import type { CurrentPathHandle, SparksHandle } from '../motion/types';
import { useFinePointer } from '../hooks/useFinePointer';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/** Cable running out of the plug in the bottom-left illustration. */
const PLUG_CABLE = 'M20 236 C 96 236 118 196 150 168 C 182 140 214 132 250 132';

/**
 * Hero (docs/BRIEF.md §6.3). The three question words light up one by one
 * like neon tubes (flicker: ≤3 brightness changes, ≤600ms each), "Varniči?"
 * throws a small spark burst, then "Jovan rešava." and the rest rise in
 * calmly. Behind it: two slow amber fields, the dot grid, a plug-and-cable
 * illustration that gets one pulse of current on load and follows a fine
 * pointer a little, plus a scroll hint with a pulse sliding down a wire.
 *
 * Nothing here is required for the content to be readable: every animated
 * element carries a CSS fallback class (see src/motion/motion.css) and
 * reduced motion shows the final state immediately.
 */
export function Hero() {
  const ariaLabel = site.hero.words.join(' ');
  const rootRef = useRef<HTMLElement>(null);
  const sparksRef = useRef<SparksHandle>(null);
  const cableRef = useRef<CurrentPathHandle>(null);
  const reduced = usePrefersReducedMotion();
  const finePointer = useFinePointer();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return undefined;

      const words = gsap.utils.toArray<HTMLElement>('[data-hero-word]', root);
      const reveals = gsap.utils.toArray<HTMLElement>('[data-hero-reveal]', root);
      const fields = gsap.utils.toArray<HTMLElement>('[data-hero-field]', root);
      const plug = root.querySelector<SVGGElement>('[data-hero-plug]');
      const hintPulse = root.querySelector<SVGCircleElement>('[data-hero-hint-pulse]');

      unveil(words, reveals);

      if (reduced) {
        gsap.set([...words, ...reveals], { opacity: 1, y: 0 });
        cableRef.current?.setProgress(1);
        return undefined;
      }

      const late = isLateBoot();
      gsap.set(words, { opacity: late ? 1 : 0.16 });
      gsap.set(reveals, { opacity: late ? 1 : 0, y: late ? 0 : 14 });

      let intro: gsap.core.Timeline | null = null;

      const playIntro = () => {
        cableRef.current?.timeline(0, 1, { duration: 1.2, ease: 'none' });
        cableRef.current?.pulseOnce();

        if (late) {
          gsap.set([...words, ...reveals], { opacity: 1, y: 0 });
          return;
        }

        intro = gsap.timeline();
        words.forEach((word, index) => {
          intro?.add(flickerOn(word, { duration: 0.45 }), index * 0.26);
        });
        intro.call(() => sparksRef.current?.burst(10), undefined, 0.62);
        intro.to(reveals[0], { opacity: 1, y: 0, duration: 0.7, ease: EASE.out }, 0.95);
        intro.to(
          reveals.slice(1),
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: EASE.out },
          1.15
        );
      };

      const unsubscribe = onIntroDone(playIntro);

      // Background: two amber fields drifting slowly, paused off screen.
      const drift = gsap.timeline({ repeat: -1, yoyo: true, paused: true });
      if (fields[0]) {
        drift.to(fields[0], { xPercent: 7, yPercent: -5, duration: 16, ease: 'sine.inOut' }, 0);
      }
      if (fields[1]) {
        drift.to(fields[1], { xPercent: -6, yPercent: 6, duration: 20, ease: 'sine.inOut' }, 0);
      }

      const hint = hintPulse
        ? gsap.timeline({ repeat: -1, repeatDelay: 0.5, paused: true }).fromTo(
            hintPulse,
            { y: 0, opacity: 0 },
            { keyframes: [{ opacity: 1, duration: 0.2 }, { y: 20, opacity: 0, duration: 1.1 }] }
          )
        : null;

      const visibility = ScrollTrigger.create({
        trigger: root,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          if (self.isActive) {
            drift.play();
            hint?.play();
          } else {
            drift.pause();
            hint?.pause();
          }
        },
      });

      let onPointerMove: ((event: PointerEvent) => void) | null = null;
      if (plug && finePointer) {
        const moveX = gsap.quickTo(plug, 'x', { duration: 0.8, ease: 'power3' });
        const moveY = gsap.quickTo(plug, 'y', { duration: 0.8, ease: 'power3' });
        onPointerMove = (event: PointerEvent) => {
          const relX = event.clientX / window.innerWidth - 0.5;
          const relY = event.clientY / window.innerHeight - 0.5;
          moveX(relX * 26);
          moveY(relY * 16);
        };
        window.addEventListener('pointermove', onPointerMove, { passive: true });
      }

      return () => {
        unsubscribe();
        intro?.kill();
        drift.kill();
        hint?.kill();
        visibility.kill();
        if (onPointerMove) window.removeEventListener('pointermove', onPointerMove);
      };
    },
    { dependencies: [reduced, finePointer], revertOnUpdate: true }
  );

  return (
    <section
      id="pocetak"
      ref={rootRef}
      data-testid="section-hero"
      className="dot-grid section min-h-app relative flex items-center overflow-hidden pt-16"
    >
      <div
        data-hero-field=""
        aria-hidden="true"
        className="jv-field -left-24 top-0 h-[60vmin] w-[60vmin] md:h-[52vmin] md:w-[52vmin]"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--color-volt) 16%, transparent) 0%, transparent 68%)',
        }}
      />
      <div
        data-hero-field=""
        aria-hidden="true"
        className="jv-field -right-16 bottom-4 h-[68vmin] w-[68vmin]"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--color-volt-lo) 13%, transparent) 0%, transparent 70%)',
        }}
      />

      <svg
        aria-hidden="true"
        viewBox="0 0 400 260"
        className="pointer-events-none absolute -bottom-10 -left-6 w-[260px] opacity-80 md:w-[420px]"
      >
        <g data-hero-plug="">
          <CurrentPath ref={cableRef} d={PLUG_CABLE} strokeWidth={9} coreWidth={3} />
          <g>
            <rect
              x="244"
              y="104"
              width="62"
              height="56"
              rx="12"
              fill="var(--color-surface)"
              stroke="var(--color-line)"
              strokeWidth="2"
            />
            <rect x="302" y="116" width="34" height="8" rx="4" fill="var(--color-muted)" />
            <rect x="302" y="140" width="34" height="8" rx="4" fill="var(--color-muted)" />
            <circle cx="275" cy="132" r="7" fill="var(--color-bg)" stroke="var(--color-line)" strokeWidth="2" />
          </g>
        </g>
      </svg>

      <div className="relative mx-auto w-full max-w-4xl px-4 md:px-6">
        <h1
          data-testid="hero-title"
          aria-label={ariaLabel}
          className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-text sm:text-6xl md:text-7xl lg:text-8xl"
        >
          {site.hero.words.map((word, index) => (
            <span key={word} aria-hidden="true" className="block">
              <span data-hero-word="" className="jv-unlit jv-neon relative inline-block text-volt">
                {word}
                {index === 2 ? (
                  <Sparks
                    ref={sparksRef}
                    count={12}
                    spread={22}
                    size={72}
                    className="absolute -right-10 top-1/2 -translate-y-1/2"
                  />
                ) : null}
              </span>
            </span>
          ))}
        </h1>

        <p
          data-hero-reveal=""
          data-testid="hero-tagline"
          className="jv-veil mt-5 font-serif text-3xl italic text-arc md:text-4xl"
        >
          {site.hero.tagline}
        </p>

        <p data-hero-reveal="" className="jv-veil mt-6 max-w-xl text-lg text-muted">
          {site.hero.subtitle}
        </p>

        <div data-hero-reveal="" className="jv-veil mt-8 flex flex-wrap gap-4">
          <AnchorLink
            href="#kontakt"
            data-testid="hero-cta-primary"
            className="focus-ring glow-amber rounded-md bg-volt px-6 py-3 font-semibold text-bg"
          >
            {site.hero.ctaPrimary}
          </AnchorLink>
          <AnchorLink
            href="#usluge"
            data-testid="hero-cta-secondary"
            className="focus-ring rounded-md border border-line px-6 py-3 font-semibold text-text"
          >
            {site.hero.ctaSecondary}
          </AnchorLink>
        </div>

        <div data-hero-reveal="" className="jv-veil mt-16 flex items-center gap-3">
          <svg width="10" height="44" viewBox="0 0 10 44" aria-hidden="true">
            <line x1="5" y1="2" x2="5" y2="42" stroke="var(--color-line)" strokeWidth="2" strokeLinecap="round" />
            <circle data-hero-hint-pulse="" cx="5" cy="8" r="3" fill="var(--color-volt)" opacity="0.9" />
          </svg>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            {site.hero.scrollHint}
          </p>
        </div>
      </div>
    </section>
  );
}
