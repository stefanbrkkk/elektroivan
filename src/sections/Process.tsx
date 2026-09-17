import { site } from '../config/site';
import { CurrentPath } from '../motion/CurrentPath';

/**
 * Static, always-vertical baseline. The pinned horizontal scroll on desktop
 * (with the cable energizing per step) is motion-engineer's phase 2 work on
 * this file (docs/BRIEF.md §6.7); content and order are identical either way.
 */
export function Process() {
  const steps = site.process.steps;

  return (
    <section id="kako-radim" data-testid="section-process" className="section">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-arc">{site.process.eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-text md:text-5xl">{site.process.title}</h2>

        <div className="relative mt-12">
          <svg
            data-testid="process-track"
            viewBox="0 0 400 20"
            preserveAspectRatio="none"
            className="pointer-events-none absolute left-0 right-0 top-6 hidden h-0.5 w-full md:block"
            aria-hidden="true"
          >
            <CurrentPath d="M0 10 H400" strokeWidth={2} coreWidth={2} />
          </svg>

          <ol className="relative grid grid-cols-1 gap-8 md:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} data-testid="process-step" className="relative">
                <div className="glass flex h-12 w-12 items-center justify-center rounded-full font-mono text-sm text-volt">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-text">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
