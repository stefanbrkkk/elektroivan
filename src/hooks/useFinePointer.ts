import { useMediaQuery } from './useMediaQuery';

/**
 * True only for a fine, hover-capable pointer (mouse/trackpad). SSR-safe:
 * defaults to `false` (treat as touch/coarse) until confirmed on the client.
 */
export function useFinePointer(): boolean {
  const isFine = useMediaQuery('(pointer: fine)');
  const noHover = useMediaQuery('(hover: none)');
  return isFine && !noHover;
}
