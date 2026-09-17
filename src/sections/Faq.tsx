import { useRef, useState, type KeyboardEvent } from 'react';
import { site } from '../config/site';

/**
 * Accessible accordion (docs/BRIEF.md §6.10): real button/panel pairing,
 * first item open by default, one open at a time. The panel height animates
 * via a CSS grid-rows trick (0fr → 1fr) rather than a hard `hidden` toggle,
 * so it can transition smoothly — the global reduced-motion rule collapses
 * that transition to ~0ms automatically. ArrowUp/ArrowDown/Home/End move
 * focus between triggers; Enter/Space toggle via native `<button>` semantics.
 */
export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusTrigger(index: number) {
    triggerRefs.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = site.faq.items.length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusTrigger((index + 1) % count);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusTrigger((index - 1 + count) % count);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusTrigger(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusTrigger(count - 1);
    }
  }

  return (
    <section id="pitanja" data-testid="section-faq" className="section">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-arc">{site.faq.eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-text md:text-5xl">{site.faq.title}</h2>

        <div className="mt-8 flex flex-col divide-y divide-line border-y border-line">
          {site.faq.items.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const triggerId = `faq-trigger-${index}`;

            return (
              <div key={item.question}>
                <h3>
                  <button
                    ref={(el) => {
                      triggerRefs.current[index] = el;
                    }}
                    type="button"
                    id={triggerId}
                    data-testid="faq-trigger"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    className="focus-ring flex min-h-11 w-full items-center justify-between gap-4 py-5 text-left font-display text-lg font-semibold text-text"
                  >
                    {item.question}
                    <span aria-hidden="true" className="font-mono text-arc">
                      {isOpen ? '–' : '+'}
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  data-testid="faq-panel"
                  role="region"
                  aria-labelledby={triggerId}
                  aria-hidden={!isOpen}
                  className="grid"
                  style={{
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.3s var(--ease-out-quart)',
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 text-sm text-muted">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
