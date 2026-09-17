import { site } from '../config/site';
import { useLenis } from '../components/SmoothScroll';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { scrollToHash } from '../lib/scroll';

export function Footer() {
  const lenis = useLenis();
  const reducedMotion = usePrefersReducedMotion();
  const year = new Date().getFullYear();

  function handleBackToTop() {
    scrollToHash('#pocetak', lenis, reducedMotion);
  }

  return (
    <footer id="podnozje" data-testid="section-footer" className="border-t border-line py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center md:flex-row md:justify-between md:px-6 md:text-left">
        <p className="text-sm text-muted">
          © {year} {site.name}. {site.footer.rights}
        </p>
        <button
          type="button"
          data-testid="back-to-top"
          onClick={handleBackToTop}
          className="focus-ring rounded-md border border-line px-4 py-2 text-sm text-text"
        >
          {site.footer.backToTop}
        </button>
      </div>
    </footer>
  );
}
