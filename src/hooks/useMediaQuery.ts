import { useSyncExternalStore } from 'react';

function subscribe(query: string, onChange: () => void): () => void {
  const mediaQueryList = window.matchMedia(query);
  mediaQueryList.addEventListener('change', onChange);
  return () => mediaQueryList.removeEventListener('change', onChange);
}

function getSnapshot(query: string): boolean {
  return window.matchMedia(query).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * SSR-safe media query hook. Always reports `false` on the server and during
 * the first client render before hydration reconciles, then tracks live
 * changes via `matchMedia`.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => subscribe(query, onChange),
    () => getSnapshot(query),
    getServerSnapshot
  );
}
