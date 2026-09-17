import { CurrentPath } from './CurrentPath';

// Placeholder vertical run; motion-engineer replaces this with the real
// routed path (bends toward each section, ending at [data-mainline-end]).
const CABLE_PATH = 'M40 0 V4000';

/**
 * Fixed overlay for the site-wide "main line": on ≥1024px a left-edge cable
 * (CurrentPath) that tracks scroll progress; below that breakpoint a top
 * progress bar instead. Both markups stay mounted; visibility is CSS-driven
 * so there is no layout shift when crossing the breakpoint.
 */
export function MainLine() {
  return (
    <>
      <svg
        data-testid="mainline"
        aria-hidden="true"
        className="pointer-events-none fixed inset-y-0 left-0 z-40 hidden h-full w-16 lg:block"
        viewBox="0 0 80 4000"
        preserveAspectRatio="none"
      >
        <CurrentPath d={CABLE_PATH} />
        <path
          data-testid="mainline-energized"
          d={CABLE_PATH}
          stroke="var(--color-volt)"
          strokeWidth={2}
          fill="none"
        />
      </svg>
      <div
        data-testid="progress-bar"
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-40 h-1 bg-line lg:hidden"
      >
        <div className="h-full w-0 bg-volt" />
      </div>
    </>
  );
}
