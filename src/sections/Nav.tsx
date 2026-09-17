import { useEffect, useState } from 'react';
import { site } from '../config/site';
import { AnchorLink } from '../components/AnchorLink';
import { useMediaQuery } from '../hooks/useMediaQuery';

function sectionId(href: string): string {
  return href.replace(/^#/, '');
}

function BoltMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M17.6 4L9 18h5.6l-1.4 10L23 14h-5.6l0.2-10z" fill="var(--color-volt)" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Sticky navigation. The mobile toggle already shows/hides a real panel and
 * traps the Escape key + background scroll; the richer scroll-hide, active
 * section indicator, and staggered link entrance are motion-engineer's
 * phase 2 polish (docs/BRIEF.md §6.2).
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const showMobilePanel = open && !isDesktop;

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  // Desktop always shows the plain horizontal bar; only the mobile,
  // JS-driven panel gets the full-screen glass treatment. Deciding this from
  // a (SSR-safe, default-false) media query avoids fighting Tailwind's
  // cascade layers with override utilities.
  const menuClassName = showMobilePanel
    ? 'glass fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col gap-1 overflow-y-auto p-4'
    : 'hidden gap-6 md:flex md:flex-row md:items-center';

  return (
    <header id="navigacija" data-testid="section-nav" className="fixed inset-x-0 top-0 z-50">
      <div className="glass mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <AnchorLink
          href="#pocetak"
          className="focus-ring flex items-center gap-1.5 rounded-md font-display text-lg font-bold text-text"
        >
          <BoltMark />
          {site.wordmark}
        </AnchorLink>

        <nav id="nav-menu" data-testid="nav-menu" aria-label={site.ui.menuLabel} className={menuClassName}>
          {site.nav.links.map((link) => (
            <AnchorLink
              key={link.href}
              href={link.href}
              data-testid={`nav-link-${sectionId(link.href)}`}
              onClick={closeMenu}
              className="focus-ring rounded-md px-3 py-3 text-base text-muted transition-colors hover:text-text md:px-1 md:py-1 md:text-sm"
            >
              {link.label}
            </AnchorLink>
          ))}
          <AnchorLink
            href="#kontakt"
            data-testid="nav-cta"
            onClick={closeMenu}
            className="focus-ring mt-2 rounded-md bg-volt px-4 py-3 text-center text-base font-semibold text-bg md:mt-0 md:py-2 md:text-sm"
          >
            {site.nav.cta}
          </AnchorLink>
        </nav>

        <button
          type="button"
          data-testid="nav-toggle"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? site.nav.menuClose : site.nav.menuOpen}
          className="focus-ring flex h-11 w-11 items-center justify-center rounded-md text-text md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          <MenuIcon open={open} />
        </button>
      </div>
    </header>
  );
}
