import { useRef } from 'react';
import { site } from '../config/site';
import { AnchorLink } from '../components/AnchorLink';
import { Sparks } from '../motion/Sparks';
import { HeroRail } from '../motion/HeroRail';
import { EASE, ScrollTrigger, gsap, isLateBoot, unveil, useGSAP } from '../motion/motion';
import { flickerOn } from '../motion/flicker';
import { onIntroDone } from '../motion/intro';
import type { CurrentPathHandle, SparksHandle } from '../motion/types';
import { useFinePointer } from '../hooks/useFinePointer';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/**
 * Hero (docs/BRIEF.md §6.3, docs/DESIGN.md §3.3).
 *
 * Left: the three question words light up one by one like neon tubes
 * (flicker: ≤3 brightness changes, ≤600ms each), "Varniči?" throws a small
 * spark burst, then "Jovan rešava." and the rest rise in calmly.
 *
 * Right: a large dimensional DIN-rail group (B16 breaker + 30 mA RCD on a
 * steel rail). Once the words are lit, the breaker's white lever **snaps up**
 * with a short "klak" scale pulse, its ON window lights, an amber wash comes
 * up behind the group and a volt pulse leaves the bottom terminal into the
 * cable that hands over to the main line.
 *
 * Nothing here is required for the content to be readable: every animated
 * element carries a CSS fallback class (see src/motion/motion.css) and
 * reduced motion shows the final, lit state immediately.
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
      const rail = root.querySelector<SVGSVGElement>('[data-hero-rail]');
      const mcb = root.querySelector<SVGGElement>('[data-hero-mcb]');
      const lever = root.querySelector<SVGGElement>('[data-hero-mcb] [data-part="lever"]');
      const indicator = root.querySelector<SVGRectElement>('[data-hero-mcb] [data-part="indicator"]');
      const glow = root.querySelector<SVGEllipseElement>('[data-hero-glow]');
      const hintPulse = root.querySelector<SVGCircleElement>('[data-hero-hint-pulse]');

      unveil(words, reveals);

      if (reduced) {
        gsap.set([...words, ...reveals], { opacity: 1, y: 0 });
        if (lever) gsap.set(lever, { y: 0 });
        if (indicator) gsap.set(indicator, { opacity: 1 });
        if (glow) gsap.set(glow, { opacity: 0.55 });
        cableRef.current?.setProgress(1);
        return undefined;
      }

      const late = isLateBoot();
      gsap.set(words, { opacity: late ? 1 : 0.16 });
      gsap.set(reveals, { opacity: late ? 1 : 0, y: late ? 0 : 14 });
      // The breaker starts OFF: lever pushed down in its slot, window dark.
      if (lever) gsap.set(lever, { y: late ? 0 : 26 });
      if (indicator) gsap.set(indicator, { opacity: late ? 1 : 0 });
      if (glow) gsap.set(glow, { opacity: late ? 0.55 : 0 });
      if (late) cableRef.current?.setProgress(1);

      let intro: gsap.core.Timeline | null = null;

      const playIntro = () => {
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

        // --- the breaker goes ON ---------------------------------------
        if (lever) intro.to(lever, { y: 0, duration: 0.42, ease: 'back.out(2.2)' }, 1.05);
        if (mcb) {
          // "klak": one short squash-and-settle, transform only.
          intro.to(mcb, { scale: 1.035, duration: 0.1, transformOrigin: '50% 50%' }, 1.16);
          intro.to(mcb, { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.45)' }, 1.26);
        }
        if (indicator) intro.to(indicator, { opacity: 1, duration: 0.3 }, 1.3);
        if (glow) intro.to(glow, { opacity: 0.55, duration: 0.8, ease: 'power2.out' }, 1.3);
        intro.call(
          () => {
            cableRef.current?.timeline(0, 1, { duration: 0.9, ease: 'power1.inOut' });
            cableRef.current?.pulseOnce();
          },
          undefined,
          1.34
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
      if (rail && finePointer) {
        // ±6px, as specified — the illustration breathes, it does not slide.
        const moveX = gsap.quickTo(rail, 'x', { duration: 0.9, ease: 'power3' });
        const moveY = gsap.quickTo(rail, 'y', { duration: 0.9, ease: 'power3' });
        onPointerMove = (event: PointerEvent) => {
          const relX = event.clientX / window.innerWidth - 0.5;
          const relY = event.clientY / window.innerHeight - 0.5;
          moveX(relX * 12);
          moveY(relY * 12);
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
      className="section min-h-app relative flex items-center overflow-hidden pt-8 md:pt-16"
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

      <div className="container-x relative">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-8">
          <div>
            <h1 data-testid="hero-title" aria-label={ariaLabel} className="display-xl text-text">
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
                        faultGlyph
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
              className="serif-accent jv-veil mt-4 text-arc"
              style={{ fontSize: 'clamp(2rem, 4.6vw, 3.75rem)', lineHeight: 1.05 }}
            >
              {site.hero.tagline}
            </p>

            <p data-hero-reveal="" className="jv-veil mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
              {site.hero.subtitle}
            </p>

            <div data-hero-reveal="" className="jv-veil mt-8 flex flex-wrap gap-4">
              <AnchorLink
                href="#kontakt"
                data-testid="hero-cta-primary"
                data-magnetic
                className="btn btn-primary focus-ring"
              >
                {site.hero.ctaPrimary}
              </AnchorLink>
              <AnchorLink
                href="#usluge"
                data-testid="hero-cta-secondary"
                className="btn btn-outline focus-ring"
              >
                {site.hero.ctaSecondary}
              </AnchorLink>
            </div>

            {/* The story hint sits on the start of the cable that leaves the
                breaker: a mono label with a pulse sliding down a short wire. */}
            <div data-hero-reveal="" className="jv-veil mt-8 flex items-center gap-3 md:mt-12">
              <svg width="10" height="40" viewBox="0 0 10 40" aria-hidden="true">
                <line x1="5" y1="2" x2="5" y2="38" stroke="var(--color-line)" strokeWidth="2" strokeLinecap="round" />
                <circle data-hero-hint-pulse="" cx="5" cy="8" r="3" fill="var(--color-volt)" opacity="0.9" />
              </svg>
              <p className="label-mono">{site.hero.scrollHint}</p>
            </div>
          </div>

          <div data-hero-reveal="" className="jv-veil">
            <HeroRail
              ref={cableRef}
              className="jv-hero-rail mx-auto block h-auto w-full max-w-[230px] sm:max-w-[320px] lg:max-w-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
