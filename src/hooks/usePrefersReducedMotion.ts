import { useMediaQuery } from './useMediaQuery';

/** SSR-safe: defaults to `false` (full motion) until the client confirms otherwise. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
