import { useState } from 'react';
import { site } from '../config/site';

/**
 * Accessible accordion: real button/panel pairing, first item open by
 * default so content is visible without any interaction. Entrance stagger
 * and open/close easing are cosmetic additions builder may polish later;
 * none of it is required for the panels to work correctly.
 */
export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
                    type="button"
                    id={triggerId}
                    data-testid="faq-trigger"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="focus-ring flex w-full items-center justify-between gap-4 py-5 text-left font-display text-lg font-semibold text-text"
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
                  hidden={!isOpen}
                  className="pb-5 text-sm text-muted"
                >
                  {item.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
