import { useEffect, useRef } from 'react';
import { gsap } from '../motion/motion';
import { useFinePointer } from '../hooks/useFinePointer';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], [role="slider"]';
const MAGNETIC_SELECTOR = '[data-magnetic]';
const MAGNETIC_PULL = 0.35;

/**
 * Custom cursor (dot + ring), fine pointer + full motion only
 * (docs/BRIEF.md §4). The ring grows over interactive elements and the
 * whole cursor is hidden on touch devices, under reduced motion, and
 * whenever the pointer leaves the window; the native cursor is left alone
 * on text-entry controls so typing never loses the caret.
 */
export function Cursor() {
  const finePointer = useFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  const active = finePointer && !reducedMotion;

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return undefined;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return undefined;

    const moveDotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
    const moveDotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
    const moveRingX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
    const moveRingY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });

    let hovering: Element | null = null;
    let magnetic: HTMLElement | null = null;

    function releaseMagnetic() {
      if (!magnetic) return;
      gsap.to(magnetic, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      magnetic = null;
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== 'mouse') return;
      show();
      const { clientX, clientY } = event;
      let targetX = clientX;
      let targetY = clientY;

      const target = event.target instanceof Element ? event.target : null;
      const magnetEl = target?.closest<HTMLElement>(MAGNETIC_SELECTOR) ?? null;

      if (magnetEl) {
        if (magnetEl !== magnetic) magnetic = magnetEl;
        const rect = magnetEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        targetX = cx + (clientX - cx) * (1 - MAGNETIC_PULL);
        targetY = cy + (clientY - cy) * (1 - MAGNETIC_PULL);
        gsap.to(magnetEl, {
          x: (clientX - cx) * 0.2,
          y: (clientY - cy) * 0.2,
          duration: 0.3,
          ease: 'power3.out',
        });
      } else if (magnetic) {
        releaseMagnetic();
      }

      moveDotX(targetX);
      moveDotY(targetY);
      moveRingX(targetX);
      moveRingY(targetY);

      const interactive = target?.closest(INTERACTIVE_SELECTOR) ?? null;
      if (interactive !== hovering) {
        hovering = interactive;
        ring!.dataset.hover = interactive ? 'true' : 'false';
      }
    }

    // The native cursor must be hidden only while the custom one is
    // actually visible — toggling `cursor-none` here (not once on mount)
    // keeps the two in lockstep, so a page that loads with the pointer
    // already inside the viewport never ends up with neither cursor shown.
    function show() {
      dot!.style.opacity = '1';
      ring!.style.opacity = '1';
      document.documentElement.classList.add('cursor-none');
    }

    function hide() {
      dot!.style.opacity = '0';
      ring!.style.opacity = '0';
      document.documentElement.classList.remove('cursor-none');
    }

    function handleWindowMouseOut(event: MouseEvent) {
      if (!event.relatedTarget) hide();
    }

    hide();
    window.addEventListener('pointermove', handlePointerMove);
    // `pointerover` bubbles (unlike `pointerenter`), so a listener on
    // `window` actually fires for pointer events dispatched at descendant
    // elements — belt-and-braces alongside the `show()` call in
    // `handlePointerMove` above, which is what covers the common case of a
    // page loading with the pointer already inside the viewport.
    const showForMouse = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') show();
    };
    window.addEventListener('pointerover', showForMouse);
    window.addEventListener('mouseout', handleWindowMouseOut);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerover', showForMouse);
      window.removeEventListener('mouseout', handleWindowMouseOut);
      document.documentElement.classList.remove('cursor-none');
      if (magnetic) gsap.set(magnetic, { x: 0, y: 0 });
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      <div ref={dotRef} aria-hidden="true" className="cursor-dot" />
      <div ref={ringRef} aria-hidden="true" className="cursor-ring" data-hover="false" />
    </>
  );
}
