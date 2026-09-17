import { useRef, useState } from 'react';
import { mailtoHref, site } from '../config/site';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { SectionHeader } from '../components/SectionHeader';
import { Materials } from '../components/svg/Materials';
import { CurrentPath } from '../motion/CurrentPath';
import { Sparks } from '../motion/Sparks';
import { EASE, ScrollTrigger, gsap, unveil, useGSAP, whenNear } from '../motion/motion';
import { flickerOn } from '../motion/flicker';
import type { CurrentPathHandle, SparksHandle } from '../motion/types';

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
 * Beat 1 is a real beat, not an assumption: the last stretch of cable into the
 * switch is a short `CurrentPath` stub owned by this scene and energized at
 * `t=0`, before anything else moves. On ≥1024px `MainLine` ends exactly on its
 * left edge (`[data-mainline-end]`) and is fully drawn by the time this scene
 * starts; below that there is no site cable at all, so the stub carries the
 * whole arrival (docs/reports/review-1.md M5).
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
  const tailRef = useRef<CurrentPathHandle>(null);
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
        tailRef.current?.setProgress(1);
        if (card) gsap.set(card, { opacity: 1, y: 0, clipPath: CARD_SHOWN });
        if (cone) gsap.set(cone, { opacity: 1 });
        if (bulb) gsap.set(bulb, { opacity: 0.9 });
        if (filament) gsap.set(filament, { opacity: 1 });
        if (halo) gsap.set(halo, { opacity: 1 });
        if (rocker) gsap.set(rocker, { scaleY: -1, transformOrigin: '50% 50%' });
        return undefined;
      }

      // The card is the only element whose resting state is not already in the
      // markup (`.jv-veil` hides it, and unveil() just took that away).
      gsap.set(card, { opacity: 0, y: 28, clipPath: CARD_HIDDEN });
      setOn(false);
      tailRef.current?.setProgress(0);

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

        // beat 1 — the current reaches the switch
        const tail = tailRef.current?.timeline(0, 1, { duration: 0.34, ease: 'power1.out' });
        if (tail) timeline.add(tail, 0);

        // beat 2 — the switch flips, with a "click" highlight
        if (rocker) {
          // A rocker tips: `scaleY` 1 → -1 passes through the flat middle and
          // lands with the lit edge at the bottom, exactly like the real part.
          timeline.to(
            rocker,
            { scaleY: -1, duration: 0.2, ease: 'power3.in', transformOrigin: '50% 50%' },
            0.34
          );
        }
        timeline.add(() => setOn(!timeline.reversed()), 0.5);
        if (click) {
          timeline
            .to(click, { opacity: 0.35, duration: 0.1 }, 0.5)
            .to(click, { opacity: 0, duration: 0.2 }, 0.6);
        }
        // beat 3 — the filament catches
        if (filament) {
          timeline.add(flickerOn(filament, { glow: halo ?? undefined, duration: 0.5 }), 0.64);
        }
        if (bulb) {
          timeline.to(bulb, { opacity: 0.9, duration: 0.45, ease: 'power2.out' }, 0.84);
        }
        // beat 4 — the light cone opens and the card appears inside it
        if (cone) {
          timeline.to(cone, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.89);
        }
        timeline.to(
          card,
          { opacity: 1, y: 0, clipPath: CARD_SHOWN, duration: 0.75, ease: 'back.out(1.1)' },
          1.04
        );
        if (sweep) {
          timeline.fromTo(
            sweep,
            { xPercent: -120, opacity: 0 },
            { xPercent: 260, opacity: 1, duration: 0.8, ease: EASE.quart },
            1.39
          );
          timeline.to(sweep, { opacity: 0, duration: 0.2 }, 2.04);
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
        // The switch, not the section: `MainLine`'s energized tip is timed off
        // the same element (`top 75%`), so the current always arrives before
        // the scene starts. Triggering off the section top fired the finale a
        // whole viewport early, with the cable still short of the switch.
        const enter = ScrollTrigger.create({
          trigger: switchEl ?? root,
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
          // `progress(1)` does *not* suppress callbacks (only `seek()` does,
          // see docs/DECISIONS.md phase 4), but mirroring the switch/bulb state
          // by hand is cheap and makes the end state independent of ordering.
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
        {/* Sibling of the card, not of the bulb: anchored `top-24 -bottom-16`
            it always runs past the card's bottom edge, at every viewport, so
            the gradient finishes fading below the glass instead of on it. */}
        <div
          data-contact-cone=""
          aria-hidden="true"
          className="jv-cone -bottom-16 left-1/2 top-28 w-[130%] -translate-x-1/2"
        />

        <div className="relative flex flex-col items-center">
          {/* E27 pendant: drop cable, ceiling rose, brass-threaded holder and
              a glass envelope with a real filament. */}
          <svg width="150" height="210" viewBox="0 0 150 210" aria-hidden="true" className="relative">
            <Materials />
            <line x1="75" y1="0" x2="75" y2="34" stroke="#3A3F4E" strokeWidth="5" strokeLinecap="round" />
            <line x1="73.4" y1="2" x2="73.4" y2="32" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="1.6" strokeLinecap="round" />
            <rect x="63" y="30" width="24" height="16" rx="5" fill="url(#m-polymer-dark)" stroke="#0A0B10" strokeOpacity="0.6" strokeWidth="1.25" />
            <circle data-contact-halo="" cx="75" cy="118" r="66" fill="url(#m-glow-volt)" opacity="0" />
            {/* polymer skirt + E27 brass thread */}
            <path d="M 54 46 H 96 L 92 70 H 58 Z" fill="url(#m-polymer-dark)" stroke="#0A0B10" strokeOpacity="0.6" strokeWidth="1.25" />
            <path d="M 57 49 L 60 67" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.4" strokeLinecap="round" />
            <rect x="60" y="70" width="30" height="20" rx="2" fill="url(#m-brass)" stroke="#0A0B10" strokeOpacity="0.6" strokeWidth="1" />
            <path d="M 60 75 H 90 M 60 80 H 90 M 60 85 H 90" stroke="#7A5C13" strokeOpacity="0.7" strokeWidth="1.6" />
            <path d="M 62 72 H 88" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" />
            {/* glass envelope */}
            <path
              d="M 68 90 c 0 7 -22 12 -22 29 a 29 29 0 1 0 58 0 c 0 -17 -22 -22 -22 -29 Z"
              fill="#11141D"
              fillOpacity="0.65"
              stroke="#5C616D"
              strokeWidth="1.6"
            />
            <path d="M 53 130 a 27 27 0 0 1 10 -19" fill="none" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="2.4" strokeLinecap="round" />
            <path
              data-contact-filament=""
              d="M 67 132 c 0 -8 5 -9 5 -14 s -3 -6 3 -6 s 3 4 3 6 s 5 6 5 14"
              fill="none"
              stroke="#FFE9B0"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity="0.16"
            />
            <path d="M 71 118 v -16 M 79 118 v -16" stroke="#8A8F9C" strokeWidth="1.6" strokeLinecap="round" />
            <circle
              data-testid="contact-bulb"
              data-lit="false"
              cx="75"
              cy="122"
              r="26"
              fill="#FFD36A"
              opacity="0.08"
            />
          </svg>

          {/* Dimensional wall switch with a real tilting rocker. The last
              stretch of cable (beat 1) is anchored to the switch's own left
              edge rather than to a magic offset (review-3 minor 15): its box is
              `[data-mainline-end]`, so MainLine stops exactly there and the two
              read as one cable. */}
          <div className="relative mt-3 h-24 w-24">
            <svg
              data-mainline-end=""
              aria-hidden="true"
              width="120"
              height="20"
              viewBox="0 0 120 20"
              className="jv-contact-tail pointer-events-none absolute right-full top-1/2 z-10 -translate-y-1/2"
            >
              <CurrentPath ref={tailRef} d="M 0 10 H 120" strokeWidth={10} coreWidth={3.2} />
            </svg>

          <div
            data-testid="contact-switch"
            data-on="false"
            aria-hidden="true"
            className="block h-full w-full"
          >
            {/* the pendant SVG above already put the shared material defs in
                the document — `url(#id)` resolves document-wide. */}
            <svg viewBox="0 0 96 96" className="h-full w-full">
              <rect x="4" y="4" width="88" height="88" rx="10" fill="url(#m-polymer-light)" stroke="#0A0B10" strokeOpacity="0.6" strokeWidth="1.25" />
              <path d="M 12 6 H 84 M 6 12 V 84" fill="none" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M 90 14 V 82 M 14 90 H 82" fill="none" stroke="#000000" strokeOpacity="0.3" strokeWidth="3.5" strokeLinecap="round" />
              <rect x="22" y="18" width="52" height="60" rx="5" fill="#B6B4AC" />
              <g data-contact-rocker="">
                <rect x="24" y="20" width="48" height="56" rx="5" fill="url(#m-polymer-light)" stroke="#0A0B10" strokeOpacity="0.5" strokeWidth="1" />
                <path d="M 29 25 H 67" stroke="#FFFFFF" strokeOpacity="0.95" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M 24 48 H 72" stroke="#8A8F9C" strokeWidth="1.4" />
                <path d="M 29 71 H 67" stroke="#000000" strokeOpacity="0.22" strokeWidth="2.6" strokeLinecap="round" />
              </g>
              <g fill="none" stroke="#8A8F9C" strokeWidth="1.2">
                <circle cx="48" cy="12" r="3" />
                <circle cx="48" cy="84" r="3" />
              </g>
              <rect data-contact-click="" x="4" y="4" width="88" height="88" rx="10" fill="#FFD36A" opacity="0" />
            </svg>
          </div>
          </div>
        </div>

        <div
          data-testid="contact-card"
          className="jv-veil glass relative z-10 mt-10 overflow-hidden rounded-xl p-6 md:p-10"
        >
          <span data-contact-sweep="" aria-hidden="true" className="jv-sweep" />

          {/* The finale carries the same sheet chrome as every other section —
              List 09 / 10 (docs/DESIGN.md §3.12, review-3 MAJ-5). */}
          <SectionHeader
            sheet={9}
            eyebrow={site.contact.eyebrow}
            title={site.contact.title}
            intro={site.contact.lead}
          />

          <p className="label-mono mt-8">{site.contact.emailLabel}</p>

          <a
            ref={emailRef}
            href={mailtoHref}
            data-testid="contact-email"
            style={{ overflowWrap: 'anywhere' }}
            className="focus-ring mt-1 block font-display text-2xl font-extrabold text-volt md:text-4xl"
          >
            {site.email}
          </a>

          <div className="relative mt-5 flex flex-col items-start gap-2">
            <Sparks
              ref={sparksRef}
              count={10}
              spread={20}
              size={64}
              className="absolute left-8 top-0 -translate-x-1/2"
            />
            <button
              type="button"
              data-testid="contact-copy"
              onClick={() => {
                void handleCopy();
              }}
              className="btn btn-outline focus-ring relative text-sm"
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
