import { site } from '../config/site';
import { CurrentPath } from '../motion/CurrentPath';

const CIRCUIT_PATH = 'M20 10 H180 V60 H20 V110 H180';

function scrollToCard(index: number) {
  if (typeof document === 'undefined') return;
  document.getElementById(`anatomija-korak-${index + 1}`)?.scrollIntoView({ block: 'center' });
}

/**
 * Static/reduced-motion baseline: all five fault steps listed and already
 * fixed, circuit fully lit, closing line visible. The pinned/scrubbed
 * fault→fix→flow choreography (arc, sparks, tape wrap) is motion-engineer's
 * phase 2 work on this same file (docs/BRIEF.md §6.5).
 */
export function Anatomy() {
  const total = site.anatomy.steps.length;
  const counter = `${String(total).padStart(2, '0')}/${String(total).padStart(2, '0')}`;

  return (
    <section
      id="anatomija"
      data-testid="section-anatomy"
      data-step={total}
      data-beat="final"
      className="section"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-arc">{site.anatomy.eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-text md:text-5xl">{site.anatomy.title}</h2>
        <p className="mt-4 max-w-2xl text-muted">{site.anatomy.intro}</p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div data-testid="anatomy-stage" className="glass dot-grid flex items-center justify-center p-8">
            <svg viewBox="0 0 200 120" className="w-full max-w-md" role="img" aria-label={site.anatomy.finalText}>
              <CurrentPath d={CIRCUIT_PATH} />
              <circle data-testid="anatomy-bulb" data-lit="true" cx="180" cy="110" r="8" fill="var(--color-volt-hi)" />
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p data-testid="anatomy-counter" className="font-mono text-sm text-muted">
                {counter}
              </p>
              <div className="flex gap-2">
                {site.anatomy.steps.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    data-testid={`anatomy-dot-${index + 1}`}
                    aria-label={step.name}
                    onClick={() => scrollToCard(index)}
                    className="focus-ring flex h-11 w-11 items-center justify-center rounded-full"
                  >
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-volt" />
                  </button>
                ))}
              </div>
            </div>

            <ol className="mt-6 flex flex-col gap-4">
              {site.anatomy.steps.map((step, index) => (
                <li key={step.id} id={`anatomija-korak-${index + 1}`} data-testid="anatomy-card" className="glass p-5">
                  <p className="font-mono text-xs text-muted">{String(index + 1).padStart(2, '0')}</p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-text">{step.name}</h3>
                  <dl className="mt-3 grid gap-2 text-sm">
                    <div>
                      <dt className="font-mono text-xs uppercase text-arc">{site.anatomy.labels.problem}</dt>
                      <dd className="text-muted">{step.problem}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-xs uppercase text-arc">{site.anatomy.labels.symptom}</dt>
                      <dd className="text-muted">{step.symptom}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-xs uppercase text-arc">{site.anatomy.labels.fix}</dt>
                      <dd className="text-text">{step.fix}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>

            <p
              data-testid="anatomy-final"
              className="glass glow-amber mt-6 p-4 text-center font-display text-xl font-semibold text-volt"
            >
              {site.anatomy.finalText}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
