import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { useLenis } from './SmoothScroll';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { scrollToHash } from '../lib/scroll';

interface AnchorLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: `#${string}`;
}

/**
 * In-page anchor link that scrolls via Lenis (or the native fallback) and
 * moves focus to the target, while keeping a real `href` so the link still
 * works before hydration and with JavaScript disabled.
 */
export function AnchorLink({ href, onClick, children, ...rest }: AnchorLinkProps) {
  const lenis = useLenis();
  const reducedMotion = usePrefersReducedMotion();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    scrollToHash(href, lenis, reducedMotion);
  }

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
