// Single registration point for every GSAP plugin used on the site.
// Everything else imports gsap/plugins/EASE from here — never from 'gsap' directly.
//
// NOTE: `gsap/all` has no type declarations in gsap 3.15 (implicit `any`,
// see docs/DECISIONS.md), so plugins are imported from their individual
// subpaths instead — this typechecks cleanly under `strict`.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { useGSAP } from '@gsap/react';
import './motion.css';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, useGSAP);

const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  // Mobile browsers fire resize when the URL bar collapses; recomputing pins
  // there causes jumps (BRIEF §7).
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, useGSAP };

export const EASE = {
  out: 'expo.out',
  quart: 'quart.out',
} as const;

/** Class names used as the no-JS safety net (see src/motion/motion.css). */
const VEIL_CLASSES = ['jv-veil', 'jv-unlit'];

/**
 * Hands control of an element from the CSS fallback animation to GSAP.
 * Call this before the first `gsap.set()` on a veiled element, in the same
 * layout-effect tick, so nothing flashes.
 */
export function unveil(...targets: Array<Element | null | undefined | ArrayLike<Element>>): void {
  for (const target of targets) {
    if (!target) continue;
    const list: Element[] =
      target instanceof Element ? [target] : Array.from(target as ArrayLike<Element>);
    for (const element of list) {
      element.classList.remove(...VEIL_CLASSES);
    }
  }
}

let refreshQueued = false;

/**
 * Batched `ScrollTrigger.refresh()`: many callers (font loading, resize
 * observer, geometry rebuilds) can ask for a refresh in the same frame and
 * only one runs (BRIEF §4).
 */
export function requestRefresh(): void {
  if (!isBrowser || refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() => {
    refreshQueued = false;
    ScrollTrigger.refresh();
  });
}

let watcherUsers = 0;
let heightObserver: ResizeObserver | null = null;
let lastBodyHeight = 0;

/**
 * Installs the app-wide refresh watchers once (ref-counted): a refresh after
 * `document.fonts.ready` and one whenever the document height changes.
 * Returns the disposer to call from the owning component's cleanup.
 */
export function installMotionWatchers(): () => void {
  if (!isBrowser) return () => {};

  watcherUsers += 1;

  if (watcherUsers === 1) {
    if ('fonts' in document) {
      document.fonts.ready.then(() => requestRefresh()).catch(() => {});
    }

    lastBodyHeight = document.body.offsetHeight;
    heightObserver = new ResizeObserver(() => {
      const height = document.body.offsetHeight;
      // rAF-deferred refresh + a dead band: keeps pin-spacer height changes
      // from feeding back into an observer loop.
      if (Math.abs(height - lastBodyHeight) < 2) return;
      lastBodyHeight = height;
      requestRefresh();
    });
    heightObserver.observe(document.body);
  }

  return () => {
    watcherUsers = Math.max(0, watcherUsers - 1);
    if (watcherUsers === 0) {
      heightObserver?.disconnect();
      heightObserver = null;
    }
  };
}

/**
 * True when the bundle booted so late that the CSS fallback animations
 * (`.jv-veil` / `.jv-unlit` / `.jv-intro-auto`) have already finished. Entry
 * animations then jump straight to their end state instead of replaying and
 * flashing content that is already on screen.
 */
export function isLateBoot(): boolean {
  if (!isBrowser) return false;
  return performance.now() > 1700;
}

/** True on phones/tablets: halve particle counts and skip heavy filters. */
export function isSmallOrCoarse(): boolean {
  if (!isBrowser) return true;
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
}
