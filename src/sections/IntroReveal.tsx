import { site } from '../config/site';

/**
 * Once-per-session loader overlay (docs/BRIEF.md §6.1). Stays mounted after
 * finishing (inert + hidden) so section order stays deterministic for tests.
 * Phase 1 ships the static "already finished" state; motion-engineer wires
 * up the flicker-reveal timeline and session-storage flag in phase 2.
 * CSS in src/styles/global.css also force-hides this when
 * `html[data-intro="skip"]` is set (reduced motion / already seen).
 */
export function IntroReveal() {
  return (
    <div
      id="intro"
      data-testid="section-intro"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg"
      role="status"
      aria-label={site.ui.loaderLabel}
      hidden
      inert
    >
      <span className="font-mono text-sm uppercase tracking-widest text-volt">
        {site.ui.loaderLabel}
      </span>
    </div>
  );
}
