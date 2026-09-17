import { useRef, useState, type KeyboardEvent } from 'react';
import { site } from '../config/site';
import { SectionHeader } from '../components/SectionHeader';

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
      <div className="container-x">
        <SectionHeader sheet={8} eyebrow={site.faq.eyebrow} title={site.faq.title} />

        <div className="mt-12 flex max-w-3xl flex-col divide-y divide-line border-y border-line">
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
                    className="focus-ring group flex min-h-11 w-full items-center gap-4 py-6 text-left font-display text-lg font-semibold text-text md:text-xl"
                  >
                    <span aria-hidden="true" className="font-mono text-xs tracking-[0.18em] text-arc">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1">{item.question}</span>
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line font-mono text-sm text-arc"
                    >
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
                    <p className="max-w-[60ch] pb-6 pl-9 text-[0.95rem] leading-relaxed text-muted">{item.answer}</p>
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
