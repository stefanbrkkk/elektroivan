// Shared prop/handle types for the motion toolkit (src/motion/*).
// The shapes required by docs/CONTRACT.md are kept intact; phase 2 only adds
// optional props and extra handle methods on top of them.
//
// `gsap.*` types (TweenTarget, TweenVars, core.Timeline, ...) come from
// gsap's global ambient namespace declaration — no import needed, see
// docs/DECISIONS.md.

export interface SparksProps {
  active?: boolean;
  count?: number;
  className?: string;
  /** `svg` (default) for HTML contexts, `g` to live inside an existing <svg>. */
  as?: 'svg' | 'g';
  /** Only for `as="g"`: placement inside the parent SVG's user space. */
  transform?: string;
  /** Particle travel distance, in px (as="svg") or user units (as="g"). */
  spread?: number;
  /** Box size in px for the standalone `svg` variant. */
  size?: number;
  /**
   * Reduced motion only: draw the small static arc glyph that stands in for
   * the burst. Opt in *only* where the still frame illustrates a fault — never
   * beside a button or on a circuit that is already repaired.
   */
  faultGlyph?: boolean;
  testId?: string;
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

export interface FlickerFaultOptions {
  /** Opacity the target dips to; stays well above black so it reads as a fault. */
  dip?: number;
  /** Seconds between two dips — never below 0.4 (≤3 brightness changes/s). */
  interval?: number;
  glow?: gsap.TweenTarget;
}

export interface CurrentPathProps {
  d: string;
  strokeWidth?: number;
  coreWidth?: number;
  pulse?: boolean;
  className?: string;
  /** Initial energized fraction (0–1). */
  progress?: number;
  /** Seconds for one pulse pass along the energized part. */
  pulseDuration?: number;
  /** Keeps stroke widths constant when the parent SVG is stretched. */
  nonScalingStroke?: boolean;
  testId?: string;
}

export interface CurrentPathHandle {
  setProgress(progress: number): void;
  timeline(from: number, to: number, vars?: gsap.TweenVars): gsap.core.Timeline;
  startPulse(): void;
  stopPulse(): void;
  /** One single pass of the pulse, then it parks invisible. */
  pulseOnce(): void;
}
