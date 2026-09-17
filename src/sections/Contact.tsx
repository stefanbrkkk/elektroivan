import { useRef, useState } from 'react';
import { mailtoHref, site } from '../config/site';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { Sparks } from '../motion/Sparks';
import { EASE, ScrollTrigger, gsap, unveil, useGSAP, whenNear } from '../motion/motion';
import { flickerOn } from '../motion/flicker';
import type { SparksHandle } from '../motion/types';

const CARD_HIDDEN = 'inset(0% 0% 100% 0%)';
const CARD_SHOWN = 'inset(0% 0% 0% 0%)';

/** Clipboard API first, `execCommand` on a hidden textarea as the fallback. */
async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    /* denied or unavailable — fall through to the legacy path */
  }

  try {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.opacity = '0';
    area.style.pointerEvents = 'none';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    return copied;
  } catch {
    return false;
  }
}

/**
 * Finale (docs/BRIEF.md §6.11): the main line arrives at the wall switch, the
 * switch flips, the bulb's filament flickers on (≤3 brightness changes,
 * ≤600ms), a light cone opens downwards and the glass contact card is revealed
 * inside that light — clip-path top→bottom, a small overshoot on the rise and
 * one highlight sweep.
 *
 * One timeline is reused: it plays on enter and only reverses once the section
 * has fully left the viewport (and never while something inside the card has
 * focus). A 2.5s safety net forces the end state if ScrollTrigger never fires,
 * and the CSS fallback class covers a bundle that never runs at all.
 */
export function Contact() {
  const [toast, setToast] = useState('');
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const sparksRef = useRef<SparksHandle>(null);
  const emailRef = useRef<HTMLAnchorElement>(null);

  async function handleCopy() {
    const copied = await copyToClipboard(site.email);
    if (copied) {
      setToast(site.contact.copied);
      sparksRef.current?.burst(8);
      return;
    }

    setToast(site.contact.copyFailed);
    const email = emailRef.current;
    const selection = window.getSelection();
    if (email && selection) {
      const range = document.createRange();
      range.selectNodeContents(email);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return undefined;

      const card = root.querySelector<HTMLElement>('[data-testid="contact-card"]');
      const switchEl = root.querySelector<HTMLElement>('[data-testid="contact-switch"]');
      const rocker = root.querySelector<HTMLElement>('[data-contact-rocker]');
      const click = root.querySelector<HTMLElement>('[data-contact-click]');
      const bulb = root.querySelector<SVGCircleElement>('[data-testid="contact-bulb"]');
      const filament = root.querySelector<SVGPathElement>('[data-contact-filament]');
      const halo = root.querySelector<SVGCircleElement>('[data-contact-halo]');
      const cone = root.querySelector<HTMLElement>('[data-contact-cone]');
      const sweep = root.querySelector<HTMLElement>('[data-contact-sweep]');

      unveil(card);

      const setOn = (on: boolean) => {
        switchEl?.setAttribute('data-on', on ? 'true' : 'false');
        bulb?.setAttribute('data-lit', on ? 'true' : 'false');
      };

      if (reduced) {
        setOn(true);
        if (card) gsap.set(card, { opacity: 1, y: 0, clipPath: CARD_SHOWN });
        if (cone) gsap.set(cone, { opacity: 1 });
        if (bulb) gsap.set(bulb, { opacity: 0.9 });
        if (filament) gsap.set(filament, { opacity: 1 });
        if (halo) gsap.set(halo, { opacity: 1 });
        if (rocker) gsap.set(rocker, { y: 18 });
        return undefined;
      }

      // The card is the only element whose resting state is not already in the
      // markup (`.jv-veil` hides it, and unveil() just took that away).
      gsap.set(card, { opacity: 0, y: 28, clipPath: CARD_HIDDEN });
      setOn(false);

      // The scene itself is built near the viewport (BRIEF §7): the section's
      // height is plain flow content, nothing here moves it, so CLS stays 0.
      let disposeScene: (() => void) | null = null;

      const buildScene = () => {
        // Restate the dark start state the markup already paints, so the
        // timeline records the right "from" values even after a reverse.
        if (bulb) gsap.set(bulb, { opacity: 0.08 });
        if (filament) gsap.set(filament, { opacity: 0.16 });
        if (halo) gsap.set(halo, { opacity: 0 });
        if (cone) gsap.set(cone, { opacity: 0 });

        const timeline = gsap.timeline({ paused: true });

        if (rocker) {
          timeline.to(rocker, { y: 18, duration: 0.18, ease: 'power3.in' }, 0);
        }
        timeline.add(() => setOn(!timeline.reversed()), 0.16);
        if (click) {
          timeline
            .to(click, { opacity: 0.35, duration: 0.1 }, 0.16)
            .to(click, { opacity: 0, duration: 0.2 }, 0.26);
        }
        if (filament) {
          timeline.add(flickerOn(filament, { glow: halo ?? undefined, duration: 0.5 }), 0.3);
        }
        if (bulb) {
          timeline.to(bulb, { opacity: 0.9, duration: 0.45, ease: 'power2.out' }, 0.5);
        }
        if (cone) {
          timeline.to(cone, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.55);
        }
        timeline.to(
          card,
          { opacity: 1, y: 0, clipPath: CARD_SHOWN, duration: 0.75, ease: 'back.out(1.1)' },
          0.7
        );
        if (sweep) {
          timeline.fromTo(
            sweep,
            { xPercent: -120, opacity: 0 },
            { xPercent: 260, opacity: 1, duration: 0.8, ease: EASE.quart },
            1.05
          );
          timeline.to(sweep, { opacity: 0, duration: 0.2 }, 1.7);
        }

        const play = () => {
          if (timeline.progress() === 1 && !timeline.reversed()) return;
          timeline.play();
        };
        const rewind = () => {
          // Never pull content out from under the keyboard.
          if (card && document.activeElement && card.contains(document.activeElement)) return;
          timeline.reverse();
        };

        // `onToggle` + `onRefresh` rather than onEnter/onEnterBack: a refresh
        // (pin spacers, fonts, resize) can land while the section is already on
        // screen, and enter callbacks are suppressed during a refresh.
        const enter = ScrollTrigger.create({
          trigger: root,
          start: 'top 60%',
          end: 'bottom top',
          onToggle: (self) => {
            if (self.isActive) play();
          },
          onRefresh: (self) => {
            if (self.isActive) play();
          },
        });

        const leave = ScrollTrigger.create({
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => {
            if (!self.isActive) rewind();
          },
        });

        // Safety net: if ScrollTrigger never fires but the section is on screen,
        // show the finished scene anyway.
        const safety = gsap.delayedCall(2.5, () => {
          if (timeline.progress() > 0 || timeline.isActive()) return;
          const rect = root.getBoundingClientRect();
          if (rect.top >= window.innerHeight || rect.bottom <= 0) return;
          // `progress()` is a seek: it suppresses callbacks, so mirror the
          // switch/bulb state by hand.
          timeline.progress(1);
          setOn(true);
        });

        disposeScene = () => {
          safety.kill();
          enter.kill();
          leave.kill();
          timeline.kill();
        };
      };

      const disposeNear = whenNear(root, buildScene);

      return () => {
        disposeNear();
        disposeScene?.();
      };
    },
    { dependencies: [reduced], revertOnUpdate: true }
  );

  return (
    <section
      id="kontakt"
      ref={rootRef}
      data-testid="section-contact"
      className="dot-grid section relative overflow-hidden"
    >
      <div className="relative mx-auto max-w-2xl px-4 md:px-6">
        <div className="relative flex flex-col items-center">
          <div
            data-contact-cone=""
            aria-hidden="true"
            className="jv-cone left-1/2 top-24 h-[420px] w-[130%] -translate-x-1/2"
          />

          <svg width="96" height="150" viewBox="0 0 96 150" aria-hidden="true" className="relative">
            <line x1="48" y1="0" x2="48" y2="46" stroke="var(--color-line)" strokeWidth="2" />
            <rect x="40" y="44" width="16" height="12" rx="3" fill="var(--color-line)" />
            <circle data-contact-halo="" cx="48" cy="86" r="40" fill="var(--color-volt)" opacity="0" />
            <path
              d="M 30 88 a 18 18 0 1 1 36 0 c 0 7 -4 10 -6 14 l 0 6 l -24 0 l 0 -6 c -2 -4 -6 -7 -6 -14 Z"
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="2"
            />
            <path
              d="M 39 112 h 18 M 41 118 h 14"
              stroke="var(--color-line)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              data-contact-filament=""
              d="M 41 94 c 0 -6 3 -7 3 -11 s -2 -4 4 -4 s 4 3 4 4 s 3 5 3 11"
              fill="none"
              stroke="var(--color-volt-hi)"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.16"
            />
            <circle
              data-testid="contact-bulb"
              data-lit="false"
              cx="48"
              cy="88"
              r="19"
              fill="var(--color-volt-hi)"
              opacity="0.08"
            />
          </svg>

          <div
            data-testid="contact-switch"
            data-on="false"
            data-mainline-end=""
            aria-hidden="true"
            className="glass relative mt-2 h-16 w-11 overflow-hidden"
          >
            <span
              data-contact-rocker=""
              className="absolute inset-x-1.5 top-1.5 block h-6 rounded-sm bg-line"
            />
            <span
              data-contact-click=""
              className="absolute inset-0 block bg-volt-hi opacity-0"
            />
          </div>
        </div>

        <div
          data-testid="contact-card"
          className="jv-veil glass relative z-10 mt-8 overflow-hidden p-6 text-center md:p-8"
        >
          <span data-contact-sweep="" aria-hidden="true" className="jv-sweep" />

          <p className="font-mono text-xs uppercase tracking-widest text-arc">
            {site.contact.eyebrow}
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-text md:text-4xl">
            {site.contact.title}
          </h2>
          <p className="mt-3 text-muted">{site.contact.lead}</p>

          <a
            ref={emailRef}
            href={mailtoHref}
            data-testid="contact-email"
            style={{ overflowWrap: 'anywhere' }}
            className="focus-ring mt-6 block font-display text-2xl font-semibold text-volt md:text-3xl"
          >
            {site.email}
          </a>

          <div className="relative mt-4 flex flex-col items-center gap-2">
            <Sparks
              ref={sparksRef}
              count={10}
              spread={20}
              size={64}
              className="absolute left-1/2 top-0 -translate-x-1/2"
            />
            <button
              type="button"
              data-testid="contact-copy"
              onClick={() => {
                void handleCopy();
              }}
              className="focus-ring relative rounded-md border border-line px-4 py-2 text-sm text-text"
            >
              {site.contact.copy}
            </button>
            <p data-testid="contact-toast" aria-live="polite" className="min-h-5 text-sm text-arc">
              {toast}
            </p>
          </div>

          <p data-testid="contact-hours" className="mt-6 font-mono text-sm text-muted">
            {site.contact.hoursLabel}: {site.hours}
          </p>

          {site.phone ? (
            <a
              href={`tel:${site.phone}`}
              data-testid="contact-phone"
              className="focus-ring mt-4 inline-block rounded-md bg-volt px-4 py-2 text-sm font-semibold text-bg"
            >
              {site.contact.call}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
