import { useState } from 'react';
import { mailtoHref, site } from '../config/site';

/**
 * Static/reduced-motion baseline: the light is already on and the card is
 * already visible — the finale sequence (switch flip, bulb flicker, light
 * cone reveal) is motion-engineer's phase 2 work on this file
 * (docs/BRIEF.md §6.11). Copy-to-clipboard and the accessible toast are
 * fully wired here since they don't depend on any animation.
 */
export function Contact() {
  const [toast, setToast] = useState('');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(site.email);
      setToast(site.contact.copied);
    } catch {
      setToast(site.contact.copyFailed);
    }
  }

  return (
    <section id="kontakt" data-testid="section-contact" className="dot-grid section">
      <div className="mx-auto max-w-2xl px-4 md:px-6">
        <div aria-hidden="true" className="mb-8 flex flex-col items-center gap-3">
          <span data-testid="contact-bulb" data-lit="true" className="glow-amber h-6 w-6 rounded-full bg-volt-hi" />
          <div data-testid="contact-switch" data-on="true" data-mainline-end="true" className="glass h-8 w-14 rounded-full" />
        </div>

        <div data-testid="contact-card" className="glass p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-arc">{site.contact.eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-text md:text-4xl">{site.contact.title}</h2>
          <p className="mt-3 text-muted">{site.contact.lead}</p>

          <a
            href={mailtoHref}
            data-testid="contact-email"
            style={{ overflowWrap: 'anywhere' }}
            className="focus-ring mt-6 block font-display text-2xl font-semibold text-volt md:text-3xl"
          >
            {site.email}
          </a>

          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              type="button"
              data-testid="contact-copy"
              onClick={handleCopy}
              className="focus-ring rounded-md border border-line px-4 py-2 text-sm text-text"
            >
              {site.contact.copy}
            </button>
            <p data-testid="contact-toast" aria-live="polite" className="min-h-5 text-sm text-arc">
              {toast}
            </p>
          </div>

          <p data-testid="contact-hours" className="mt-6 font-mono text-sm text-muted">
            {site.contact.hoursLabel}: {site.hours}
          </p>

          {site.phone ? (
            <a
              href={`tel:${site.phone}`}
              data-testid="contact-phone"
              className="focus-ring mt-4 inline-block rounded-md bg-volt px-4 py-2 text-sm font-semibold text-bg"
            >
              {site.contact.call}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
