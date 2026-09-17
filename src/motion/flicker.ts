import { gsap } from './motion';
import type { FlickerFaultOptions, FlickerOptions } from './types';

/**
 * "Flicker then settle": exactly three brightness changes inside ≤0.6s,
 * ending at full opacity (and full glow), per the photosensitivity rule in
 * docs/BRIEF.md §4. Used by the hero words, the intro filament, the anatomy
 * lamp and the finale bulb.
 */
export function flickerOn(target: gsap.TweenTarget, options: FlickerOptions = {}): gsap.core.Timeline {
  const { intensity = 1, glow, duration = 0.5 } = options;
  const capped = Math.min(Math.max(duration, 0.2), 0.6);
  const step = capped / 3;
  const dim = 0.18 * intensity;

  const timeline = gsap.timeline();
  timeline
    .set(target, { opacity: dim })
    // change 1 — spark up
    .to(target, { opacity: 1, duration: step * 0.4, ease: 'power1.out' })
    // change 2 — drop back
    .to(target, { opacity: 0.28 * intensity, duration: step * 0.35, ease: 'power1.in' })
    // change 3 — settle at full brightness, and stay there
    .to(target, { opacity: 1, duration: step * 1.4, ease: 'expo.out' });

  if (glow) {
    timeline.fromTo(
      glow,
      { opacity: 0 },
      { opacity: 1, duration: step * 1.4, ease: 'expo.out' },
      '<'
    );
  }

  return timeline;
}

/**
 * The "faulty lamp" loop (anatomy step 5, fault beat): a single short dip
 * every `interval` seconds. Two brightness changes per cycle and never less
 * than 0.4s apart, so the element stays under 3 changes per second
 * (docs/BRIEF.md §4). Callers pause/kill it outside the fault beat, and never
 * create it at all under reduced motion.
 */
export function flickerFault(
  target: gsap.TweenTarget,
  options: FlickerFaultOptions = {}
): gsap.core.Timeline {
  const { dip = 0.42, interval = 1.1, glow } = options;
  const cycle = Math.max(0.8, interval);
  const down = 0.16;
  const up = 0.22;

  const timeline = gsap.timeline({ repeat: -1, defaults: { ease: 'none' } });
  timeline
    .set(target, { opacity: 1 })
    .to(target, { opacity: dip, duration: down })
    .to(target, { opacity: 1, duration: up })
    .to({}, { duration: Math.max(0.42, cycle - down - up) });

  if (glow) {
    timeline.to(glow, { opacity: dip, duration: down }, 0).to(glow, { opacity: 1, duration: up }, down);
  }

  return timeline;
}
