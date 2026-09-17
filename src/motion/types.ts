// Shared prop/handle types for the motion toolkit (src/motion/*).
// Owned by motion-engineer in phase 2; builder provides typed stubs here so
// the rest of the app compiles against a stable contract.
//
// `gsap.*` types (TweenTarget, TweenVars, core.Timeline, ...) come from
// gsap's global ambient namespace declaration — no import needed, see
// docs/DECISIONS.md.

export interface SparksProps {
  active?: boolean;
  count?: number;
  className?: string;
}

export interface SparksHandle {
  burst(n?: number): void;
  start(): void;
  stop(): void;
}

export interface FlickerOptions {
  intensity?: number;
  glow?: gsap.TweenTarget;
  /** Total duration in seconds; kept short for photosensitivity safety (≤0.6). */
  duration?: number;
}

export interface CurrentPathProps {
  d: string;
  strokeWidth?: number;
  coreWidth?: number;
  pulse?: boolean;
}

export interface CurrentPathHandle {
  setProgress(progress: number): void;
  timeline(from: number, to: number, vars?: gsap.TweenVars): gsap.core.Timeline;
  startPulse(): void;
  stopPulse(): void;
}
