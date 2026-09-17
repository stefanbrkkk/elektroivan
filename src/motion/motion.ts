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
  ScrollTrigger.config({
    // Mobile browsers fire resize when the URL bar collapses; recomputing pins
    // there causes jumps (BRIEF §7).
    ignoreMobileResize: true,
    // Default is 'visibilitychange,DOMContentLoaded,load,resize'. A full
    // `refresh()` costs ~130 forced layouts of the whole document, so the
    // DOMContentLoaded one (fires before a single trigger exists — the bundle
    // is a deferred module) and the load one are dropped: installMotionWatchers()
    // schedules exactly one debounced refresh that covers load *and* fonts
    // *and* the scenes that mounted during hydration (BRIEF §7 perf).
    autoRefreshEvents: 'visibilitychange,resize',
  });
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

/** Debounce for a coalesced refresh after the page has settled (BRIEF §7: ≥200ms). */
const REFRESH_DELAY = 240;
/** Never wait longer than this for the font loader before settling. */
const SETTLE_TIMEOUT = 2500;
/** How long the scroll position must hold still before a refresh is safe. */
const SCROLL_QUIET = 140;
/** Upper bound on postponing a refresh because the page keeps scrolling. */
const REFRESH_DEADLINE = 4000;

let refreshPending = false;
let settled = false;
let scrollMovedAt = 0;

if (isBrowser) {
  // Passive and write-only: it records *when* the page last moved, never reads
  // a scroll offset, so it costs no layout.
  window.addEventListener(
    'scroll',
    () => {
      scrollMovedAt = performance.now();
    },
    { passive: true, capture: true }
  );
}

function scrollIsQuiet(): boolean {
  return performance.now() - scrollMovedAt >= SCROLL_QUIET;
}

/**
 * `ScrollTrigger.refresh()` re-applies the scroll position it recorded, which
 * **cancels a scroll that is in flight** — a smooth `scrollIntoView()` from an
 * anchor link, or Lenis mid-tween. So a refresh waits for the scroll position
 * to hold still (`e2e/nav.spec.ts` catches the alternative: the page snaps back
 * to the top halfway to the section).
 */
function runRefresh(deadline: number): void {
  if (!scrollIsQuiet() && performance.now() < deadline) {
    window.setTimeout(() => runRefresh(deadline), SCROLL_QUIET);
    return;
  }
  refreshPending = false;
  ScrollTrigger.refresh();
}

function scheduleRefresh(delay: number): void {
  if (!isBrowser || refreshPending) return;
  refreshPending = true;
  const deadline = performance.now() + delay + REFRESH_DEADLINE;
  if (delay <= 0) runRefresh(deadline);
  else window.setTimeout(() => runRefresh(deadline), delay);
}

/**
 * The one refresh that replaces ScrollTrigger's own `DOMContentLoaded` + `load`
 * auto-refreshes, `document.fonts.ready` and the first body-height change: it
 * runs in the microtask right after whichever of `load` / `fonts.ready` comes
 * last, so it is normally over before the visitor can interact at all.
 */
function settleRefresh(): void {
  if (settled) return;
  settled = true;
  scheduleRefresh(0);
}

/**
 * Asks for a refresh *after* the page has settled (BRIEF §4/§7).
 *
 * One refresh re-measures every trigger and re-applies every pin spacer: on a
 * throttled phone that is ~130 forced layouts of the whole document (~140ms of
 * blocking time), which is why boot used to spend four of those. Requests
 * arriving before `settleRefresh()` are dropped — it covers them — and
 * afterwards the first request schedules one refresh `REFRESH_DELAY` ms later
 * while every request reaching it before then is dropped.
 */
export function requestRefresh(): void {
  if (!isBrowser || !settled) return;
  scheduleRefresh(REFRESH_DELAY);
}

let watcherUsers = 0;
let heightObserver: ResizeObserver | null = null;
let bodyHeight = -1;

/**
 * Installs the app-wide refresh watchers once (ref-counted): the settle
 * refresh after `load` and `document.fonts.ready`, plus one whenever the
 * document height changes afterwards. Everything funnels through
 * `requestRefresh()`, so the whole set collapses into a single refresh.
 * Returns the disposer to call from the owning component's cleanup.
 */
export function installMotionWatchers(): () => void {
  if (!isBrowser) return () => {};

  watcherUsers += 1;

  if (watcherUsers === 1) {
    const loaded =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            window.addEventListener('load', () => resolve(), { once: true, passive: true });
          });
    const fonts =
      'fonts' in document
        ? document.fonts.ready.then(
            () => undefined,
            () => undefined
          )
        : Promise.resolve();
    const guard = new Promise<void>((resolve) => {
      window.setTimeout(resolve, SETTLE_TIMEOUT);
    });
    void Promise.race([Promise.all([loaded, fonts]).then(() => undefined), guard]).then(
      settleRefresh
    );

    // The observer's own first callback seeds the baseline height, so
    // installing it neither forces a layout nor asks for a refresh that the
    // settle refresh above is about to do anyway.
    bodyHeight = -1;
    heightObserver = new ResizeObserver((entries) => {
      const height = Math.round(entries[entries.length - 1].contentRect.height);
      if (bodyHeight < 0) {
        bodyHeight = height;
        return;
      }
      // A dead band keeps pin-spacer height changes from feeding back into an
      // observer loop.
      if (Math.abs(height - bodyHeight) < 2) return;
      bodyHeight = height;
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

/** How close to the viewport a heavy scene is built (BRIEF §7). */
const NEAR_MARGIN = '400px 0px';

/**
 * Runs `build` once, as soon as `element` gets within `NEAR_MARGIN` of the
 * viewport — BRIEF §7 ("initialise heavy sections near the viewport with their
 * height reserved"). Building every scene inside the hydration commit is what
 * made that one task ~440ms on a throttled phone.
 *
 * Callers keep whatever reserves their height (a pin spacer, a `min-h-*` box)
 * outside `build`, so nothing moves when it finally runs and CLS stays 0.
 */
export function whenNear(element: Element, build: () => void): () => void {
  if (!isBrowser || typeof IntersectionObserver === 'undefined') {
    build();
    return () => {};
  }

  let built = false;
  const observer = new IntersectionObserver(
    (entries) => {
      if (built || !entries.some((entry) => entry.isIntersecting)) return;
      built = true;
      observer.disconnect();
      build();
    },
    { rootMargin: NEAR_MARGIN }
  );
  observer.observe(element);

  return () => observer.disconnect();
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
