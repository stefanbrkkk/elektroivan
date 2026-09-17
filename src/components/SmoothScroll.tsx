import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../motion/motion';
import { useFinePointer } from '../hooks/useFinePointer';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance, or `null` on touch devices / reduced motion / SSR. */
// eslint-disable-next-line react-refresh/only-export-components -- CONTRACT requires useLenis() alongside <SmoothScroll> in this file.
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

interface SmoothScrollProps {
  children: ReactNode;
}

/**
 * Owns the single coordinated scroll loop: Lenis driven by GSAP's ticker,
 * with ScrollTrigger kept in sync (docs/BRIEF.md §5.2). Only mounts Lenis
 * for a fine pointer without reduced motion — touch devices and
 * reduced-motion users get native scrolling.
 */
export function SmoothScroll({ children }: SmoothScrollProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const finePointer = useFinePointer();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!finePointer || reducedMotion) {
      return undefined;
    }

    const instance = new Lenis({ autoRaf: false, lerp: 0.1 });
    const tick = (time: number) => instance.raf(time * 1000);

    instance.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- bridging a newly created external Lenis instance into React state, the documented pattern for external systems.
    setLenis(instance);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, [finePointer, reducedMotion]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
