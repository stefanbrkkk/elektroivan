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
    <footer id="podnozje" data-testid="section-footer" className="border-t border-line py-12">
      <div className="container-x flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <p className="sheet-label m-0 justify-center md:justify-start">
            <span className="sheet-label__word">List</span>
            <span className="sheet-label__num">10</span>
            <span className="sheet-label__sep">/</span>
            <span className="sheet-label__total">10</span>
            <span aria-hidden="true" className="sheet-label__rule" />
          </p>
          <p className="mt-2 text-sm text-muted">
            © {year} {site.name}. {site.footer.rights}
          </p>
        </div>
        <button
          type="button"
          data-testid="back-to-top"
          onClick={handleBackToTop}
          className="btn btn-outline focus-ring"
        >
          {site.footer.backToTop}
        </button>
      </div>
    </footer>
  );
}
