import type Lenis from 'lenis';

/**
 * Scrolls to an in-page hash target, preferring Lenis (when mounted) over
 * the native scrollIntoView fallback, then syncs the URL and moves focus to
 * the target for keyboard/screen-reader users.
 */
export function scrollToHash(hash: string, lenis: Lenis | null, reduced: boolean): void {
  if (typeof document === 'undefined') return;

  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return;

  if (lenis) {
    lenis.scrollTo(target, { immediate: reduced, offset: -72 });
  } else {
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  history.replaceState(null, '', hash);

  target.tabIndex = -1;
  target.focus({ preventScroll: true });
}
