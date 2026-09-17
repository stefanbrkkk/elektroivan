import { gsap } from './motion';
import type { FlickerOptions } from './types';

/**
 * "Flicker then settle" timeline: at most three brightness changes inside
 * ≤0.6s total, per the photosensitivity rule in docs/BRIEF.md §4. Used by
 * hero words, the lamp step in Anatomy, and the finale bulb — all wired up
 * by motion-engineer in phase 2. This stub is a safe, spec-compliant default.
 */
export function flickerOn(target: gsap.TweenTarget, options: FlickerOptions = {}): gsap.core.Timeline {
  const { intensity = 1, glow, duration = 0.5 } = options;
  const capped = Math.min(duration, 0.6);
  const step = capped / 3;

  const timeline = gsap.timeline();
  timeline
    .set(target, { opacity: 0.15 * intensity })
    .to(target, { opacity: 1, duration: step * 0.4, ease: 'power1.out' })
    .to(target, { opacity: 0.25 * intensity, duration: step * 0.3, ease: 'power1.in' })
    .to(target, { opacity: 1, duration: step * 1.3, ease: 'expo.out' });

  if (glow) {
    timeline.to(glow, { opacity: 1, duration: step * 1.3, ease: 'expo.out' }, '<');
  }

  return timeline;
}
