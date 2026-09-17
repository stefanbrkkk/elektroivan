import { useEffect, useRef, useState } from 'react';
import { site } from '../config/site';
import { AnchorLink } from '../components/AnchorLink';
import { useLenis } from '../components/SmoothScroll';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { gsap, useGSAP } from '../motion/motion';

const DESKTOP_QUERY = '(min-width: 1024px)';
const HYSTERESIS = 12;
const TOP_OFFSET = 96;

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
 * Sticky glass header (docs/BRIEF.md §6.2): hides on scroll-down / shows on
 * scroll-up with hysteresis (transform only, never while focus is inside),
 * an IntersectionObserver-driven active-section indicator, and a full-screen
 * mobile panel below 1024px with a real focus trap, Escape-to-close,
 * focus-return to the toggle, scroll lock (Lenis + `<html>` overflow) and a
 * staggered link entrance that is instant under reduced motion.
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const reducedMotion = usePrefersReducedMotion();
  const lenis = useLenis();
  const showMobilePanel = open && !isDesktop;

  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // Hide on scroll-down, reveal on scroll-up; ignores sub-threshold jitter
  // and never hides while keyboard focus lives inside the header.
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    function evaluate() {
      ticking = false;
      const y = window.scrollY;
      const delta = y - lastY;
      const focusInside = headerRef.current?.contains(document.activeElement) ?? false;

      if (!focusInside && !open) {
        if (y <= TOP_OFFSET) {
          setHidden(false);
        } else if (delta > HYSTERESIS) {
          setHidden(true);
        } else if (delta < -HYSTERESIS) {
          setHidden(false);
        }
      }
      lastY = y;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(evaluate);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [open]);

  // Active-section indicator: whichever linked section is nearest the
  // vertical center of the viewport gets `aria-current`.
  useEffect(() => {
    const ids = site.nav.links.map((link) => sectionId(link.href));
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  // Mobile panel: scroll lock (Lenis + html overflow), Escape-to-close, and
  // a focus trap that keeps Tab cycling inside the dialog.
  useEffect(() => {
    if (!showMobilePanel) return undefined;

    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    lenis?.stop();

    const panel = menuRef.current;
    const focusables = () =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')) : [];
    focusables()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      html.style.overflow = previousOverflow;
      lenis?.start();
    };
  }, [showMobilePanel, lenis]);

  // Return focus to the toggle whenever the panel transitions from open to closed.
  useEffect(() => {
    if (wasOpenRef.current && !showMobilePanel && !isDesktop) {
      toggleRef.current?.focus();
    }
    wasOpenRef.current = showMobilePanel;
  }, [showMobilePanel, isDesktop]);

  // Staggered link entrance; instant (no animation) under reduced motion.
  useGSAP(
    () => {
      if (!showMobilePanel || reducedMotion) return;
      const items = menuRef.current?.querySelectorAll<HTMLElement>('a, button');
      if (!items || items.length === 0) return;
      gsap.fromTo(
        items,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out', stagger: 0.05 }
      );
    },
    { dependencies: [showMobilePanel, reducedMotion], scope: menuRef }
  );

  const closeMenu = () => setOpen(false);

  // The header must never visually hide while the mobile panel is open, even
  // if a scroll-down happened right before it opened.
  const visuallyHidden = hidden && !open;

  const menuClassName = showMobilePanel
    ? 'glass fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col gap-1 overflow-y-auto p-4'
    : 'hidden gap-6 lg:flex lg:flex-row lg:items-center';

  return (
    <header
      ref={headerRef}
      id="navigacija"
      data-testid="section-nav"
      className={`fixed inset-x-0 top-0 z-50 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${visuallyHidden ? '-translate-y-full' : 'translate-y-0'}`}
    >
      <div className="glass mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <AnchorLink
          href="#pocetak"
          className="focus-ring flex items-center gap-1.5 rounded-md font-display text-lg font-bold text-text"
        >
          <BoltMark />
          {site.wordmark}
        </AnchorLink>

        <nav
          ref={menuRef}
          id="nav-menu"
          data-testid="nav-menu"
          aria-label={site.ui.menuLabel}
          role={showMobilePanel ? 'dialog' : undefined}
          aria-modal={showMobilePanel ? true : undefined}
          className={menuClassName}
        >
          {site.nav.links.map((link) => {
            const id = sectionId(link.href);
            const isActive = id === activeId;
            return (
              <AnchorLink
                key={link.href}
                href={link.href}
                data-testid={`nav-link-${id}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={closeMenu}
                className={`focus-ring rounded-md px-3 py-3 text-base transition-colors lg:px-1 lg:py-1 lg:text-sm ${isActive ? 'text-text' : 'text-muted hover:text-text'}`}
              >
                {link.label}
              </AnchorLink>
            );
          })}
          <AnchorLink
            href="#kontakt"
            data-testid="nav-cta"
            data-magnetic
            onClick={closeMenu}
            className="focus-ring mt-2 rounded-md bg-volt px-4 py-3 text-center text-base font-semibold text-bg lg:mt-0 lg:py-2 lg:text-sm"
          >
            {site.nav.cta}
          </AnchorLink>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          data-testid="nav-toggle"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? site.nav.menuClose : site.nav.menuOpen}
          className="focus-ring flex h-11 w-11 items-center justify-center rounded-md text-text lg:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          <MenuIcon open={open} />
        </button>
      </div>
    </header>
  );
}
