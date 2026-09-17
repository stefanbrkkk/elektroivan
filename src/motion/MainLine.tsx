import { useRef } from 'react';
import { ScrollTrigger, gsap, installMotionWatchers, useGSAP } from './motion';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Bend offsets as a fraction of the available gutter — irregular on purpose. */
const BEND_PATTERN = [1, -0.4, 0.75, -0.25, 0.6, -0.5, 0.9, -0.3, 0.7];
/** How far the travelling pulse runs before it reaches the energized tip (px). */
const PULSE_TRAVEL = 260;
/**
 * Where `[data-mainline-end]` must sit, as a fraction of the viewport height,
 * for the cable to be fully energized (docs/BRIEF.md §6.11 beat 1: the current
 * reaches the switch *before* it flips). The finale itself starts at `top 60%`
 * of the switch, so the arrival always lands first — see `src/sections/
 * Contact.tsx` and docs/reports/review-1.md M5.
 */
const ARRIVAL_VIEWPORT_FRACTION = 0.75;

/**
 * Scroll distance from the top of the document at which the energized part has
 * to reach the switch. Recomputed by ScrollTrigger on every refresh, so pin
 * spacers, fonts and resizes are all accounted for.
 */
function arrivalScroll(): number {
  const maxScroll = Math.max(
    1,
    document.documentElement.scrollHeight - window.innerHeight
  );
  const end = document.querySelector<HTMLElement>('[data-mainline-end]');
  if (!end) return maxScroll;
  const documentY = end.getBoundingClientRect().top + window.scrollY;
  return gsap.utils.clamp(
    1,
    maxScroll,
    documentY - window.innerHeight * ARRIVAL_VIEWPORT_FRACTION
  );
}

interface Point {
  x: number;
  y: number;
}

function roundedRoute(points: Point[]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const point = points[i];
    if (Math.abs(point.x - previous.x) < 0.5) {
      d += ` L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      continue;
    }
    const radius = Math.min(26, Math.max(8, (point.y - previous.y) * 0.18));
    d += ` L ${previous.x.toFixed(1)} ${(point.y - radius).toFixed(1)}`;
    d += ` C ${previous.x.toFixed(1)} ${point.y.toFixed(1)} ${point.x.toFixed(1)} ${point.y.toFixed(1)} ${point.x.toFixed(1)} ${(point.y + radius).toFixed(1)}`;
  }

  return d;
}

/**
 * The site-wide "main line" (docs/BRIEF.md §5.1).
 *
 * ≥1024px: a full-document-height SVG pinned to the left gutter, routed from
 * real DOM measurements — it starts under the hero, bends toward every
 * `<main>` section (clamp rings at each bend) and ends exactly where the
 * contact stub takes over (`[data-mainline-end]`). The energized part scrubs
 * its `stroke-dashoffset` with scroll and a short pulse rides the energized
 * tip, paused whenever that tip is off screen.
 *
 * <1024px: the SVG is not rendered at all and the same progress drives a 2px
 * top bar instead (transform only).
 *
 * Geometry is rebuilt on every `refreshInit`, so pin spacers, fonts and
 * resizes are all accounted for. Under reduced motion there is no trigger at
 * all: the line is drawn energized once (BRIEF §5.2 — no scrub).
 */
export function MainLine() {
  const reduced = usePrefersReducedMotion();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const layerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const sheathRef = useRef<SVGPathElement>(null);
  const energizedRef = useRef<SVGPathElement>(null);
  const edgeRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const strippedRef = useRef<SVGGElement>(null);
  const ringsRef = useRef<SVGGElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const disposeWatchers = installMotionWatchers();
      const fill = fillRef.current;
      const setFill = fill ? gsap.quickSetter(fill, 'scaleX') : null;
      const energized = energizedRef.current;
      const dot = dotRef.current;

      let length = 0;

      const build = () => {
        const layer = layerRef.current;
        const svg = svgRef.current;
        const sheath = sheathRef.current;
        const rings = ringsRef.current;
        if (!layer || !svg || !sheath || !energized || !rings || !desktop) return;

        // Collapse first: a stale overlay height would otherwise keep the
        // document taller than its content after a section shrinks.
        layer.style.height = '0px';

        const viewportWidth = document.documentElement.clientWidth;
        const documentHeight = Math.max(
          document.documentElement.scrollHeight,
          window.innerHeight
        );
        const offsetY = window.scrollY;
        const offsetX = window.scrollX;

        const main = document.getElementById('sadrzaj');
        const hero = document.querySelector<HTMLElement>('[data-testid="section-hero"]');
        const endElement = document.querySelector<HTMLElement>('[data-mainline-end]');
        if (!main || !hero || !endElement) return;

        const contentWidth = Math.min(1152, viewportWidth - 48);
        const gutter = Math.max(0, (viewportWidth - contentWidth) / 2);
        const baseX = gsap.utils.clamp(14, 54, gutter * 0.42);
        const amplitude = gsap.utils.clamp(6, 40, gutter * 0.26);

        // One batched read pass — no interleaved writes, no layout thrash.
        const heroRect = hero.getBoundingClientRect();
        const endRect = endElement.getBoundingClientRect();
        const sections = Array.from(main.children).filter(
          (node): node is HTMLElement => node instanceof HTMLElement && node.tagName === 'SECTION'
        );
        const sectionRects = sections.map((section) => ({
          id: section.id,
          rect: section.getBoundingClientRect(),
        }));

        // Stop exactly on the contact stub's left edge. The stub is an `<svg>`,
        // so its own viewport clips both of its round caps flat at that same x,
        // and it paints above this layer (z-10 vs z-5): this cable's core runs
        // up to the cut, the stub's core starts at it, and neither sheath cap
        // punches a dark notch into the other's amber core.
        const endX = endRect.left + offsetX;
        const endY = endRect.top + endRect.height / 2 + offsetY;

        const points: Point[] = [{ x: baseX, y: heroRect.bottom + offsetY - 48 }];
        let bendIndex = 0;
        for (const { id, rect } of sectionRects) {
          if (id === 'pocetak' || id === 'kontakt') continue;
          const y = rect.top + offsetY + rect.height * 0.5;
          if (y <= points[points.length - 1].y + 80) continue;
          const offset = BEND_PATTERN[bendIndex % BEND_PATTERN.length] * amplitude;
          bendIndex += 1;
          points.push({ x: Math.max(6, baseX + offset), y });
        }

        const last = points[points.length - 1];
        const approachY = Math.max(last.y + 120, endY - 200);
        points.push({ x: last.x, y: approachY });

        let d = roundedRoute(points);
        // Final sweep out of the gutter and into the wall switch.
        d += ` C ${last.x.toFixed(1)} ${(endY - 40).toFixed(1)} ${(endX - 90).toFixed(1)} ${endY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;

        layer.style.width = `${viewportWidth}px`;
        layer.style.height = `${documentHeight}px`;
        svg.setAttribute('width', String(viewportWidth));
        svg.setAttribute('height', String(documentHeight));
        svg.setAttribute('viewBox', `0 0 ${viewportWidth} ${documentHeight}`);
        sheath.setAttribute('d', d);
        energized.setAttribute('d', d);
        edgeRef.current?.setAttribute('d', d);
        glowRef.current?.setAttribute('d', d);

        // Cable clips (obujmice) with a fixing screw at every bend — the
        // cable is fastened to the wall, not floating (docs/DESIGN.md §2).
        rings.replaceChildren();
        for (let i = 1; i < points.length - 1; i += 1) {
          const clip = document.createElementNS(SVG_NS, 'g');
          clip.setAttribute('transform', `translate(${points[i].x} ${points[i].y})`);

          const body = document.createElementNS(SVG_NS, 'rect');
          body.setAttribute('x', '-11');
          body.setAttribute('y', '-8');
          body.setAttribute('width', '22');
          body.setAttribute('height', '16');
          body.setAttribute('rx', '4');
          body.setAttribute('fill', '#2A2F3D');
          body.setAttribute('stroke', '#0A0B10');
          body.setAttribute('stroke-opacity', '0.6');
          body.setAttribute('stroke-width', '1.25');
          clip.appendChild(body);

          const lit = document.createElementNS(SVG_NS, 'path');
          lit.setAttribute('d', 'M -8 -6.5 H 8');
          lit.setAttribute('stroke', '#FFFFFF');
          lit.setAttribute('stroke-opacity', '0.3');
          lit.setAttribute('stroke-width', '1');
          lit.setAttribute('stroke-linecap', 'round');
          clip.appendChild(lit);

          const head = document.createElementNS(SVG_NS, 'circle');
          head.setAttribute('r', '3.6');
          head.setAttribute('fill', '#8A8F9C');
          head.setAttribute('stroke', '#0A0B10');
          head.setAttribute('stroke-opacity', '0.6');
          head.setAttribute('stroke-width', '1');
          clip.appendChild(head);

          const slot = document.createElementNS(SVG_NS, 'path');
          slot.setAttribute('d', 'M -2.4 -1 L 2.4 1');
          slot.setAttribute('stroke', '#0A0B10');
          slot.setAttribute('stroke-width', '1.4');
          slot.setAttribute('stroke-linecap', 'round');
          clip.appendChild(slot);

          rings.appendChild(clip);
        }

        // The stripped end: the sheath stops short of the switch and three
        // copper strands run the last few millimetres into it.
        const stripped = strippedRef.current;
        if (stripped) {
          stripped.setAttribute('transform', `translate(${endX.toFixed(1)} ${endY.toFixed(1)})`);
        }

        length = energized.getTotalLength();
        for (const path of [energized, glowRef.current]) {
          if (!path) continue;
          path.style.strokeDasharray = `${length}`;
          // Reduced motion has no scrub trigger at all (BRIEF §5.2), so the
          // line is simply drawn in its end state — energized all the way.
          path.style.strokeDashoffset = reduced ? '0' : `${length}`;
        }
      };

      build();

      // Reduced motion: set the end state once and own no trigger. Geometry
      // still rebuilds on refresh, which is a pure re-measure, not a scrub.
      if (reduced) {
        setFill?.(1);
        ScrollTrigger.addEventListener('refreshInit', build);
        ScrollTrigger.addEventListener('refresh', build);
        return () => {
          ScrollTrigger.removeEventListener('refreshInit', build);
          ScrollTrigger.removeEventListener('refresh', build);
          disposeWatchers();
        };
      }

      let progress = 0;
      let pulseVisible = false;
      let pulse: gsap.core.Tween | null = null;

      if (dot && desktop) {
        const state = { t: 0 };
        const setX = gsap.quickSetter(dot, 'x', 'px');
        const setY = gsap.quickSetter(dot, 'y', 'px');
        pulse = gsap.to(state, {
          t: 1,
          duration: 1.5,
          repeat: -1,
          ease: 'none',
          paused: true,
          onUpdate: () => {
            if (!energized || length === 0) return;
            const tip = length * progress;
            const at = Math.max(0, tip - PULSE_TRAVEL * (1 - state.t));
            const point = energized.getPointAtLength(at);
            setX(point.x);
            setY(point.y);
          },
        });
      }

      const onUpdate = (self: ScrollTrigger) => {
        progress = self.progress;

        if (!pulse || !dot || !energized || length === 0) return;
        const tip = energized.getPointAtLength(length * progress);
        const visible =
          progress > 0.01 &&
          tip.y > window.scrollY - 60 &&
          tip.y < window.scrollY + window.innerHeight + 60;
        if (visible === pulseVisible) return;
        pulseVisible = visible;
        if (visible) {
          gsap.set(dot, { opacity: 1 });
          pulse.play();
        } else {
          pulse.pause();
          gsap.set(dot, { opacity: 0 });
        }
      };

      const scrollTriggerVars: ScrollTrigger.Vars = {
        trigger: document.body,
        start: 'top top',
        // NOT `bottom bottom`: that only completes the line once the page is
        // scrolled past the footer, with the switch long gone off screen, so
        // the finale used to fire over a cable that was still ~200px short of
        // it (docs/reports/review-1.md M5). The whole-document scroll still
        // drives the growth — it just finishes at the switch.
        end: () => `+=${arrivalScroll()}`,
        scrub: 0.4,
        invalidateOnRefresh: true,
        // ScrollTrigger only sorts triggers when at least one declares a
        // refreshPriority — without it they refresh in creation order and
        // everything below a pin measures a document that has not been
        // re-spaced yet. Declaring it here both enables the position sort for
        // the whole page and makes this trigger refresh last, so `end` reads a
        // document whose pin spacers are already in place.
        refreshPriority: -999,
        onUpdate,
      };

      let tween: gsap.core.Tween | null = null;
      let trigger: ScrollTrigger | null = null;

      if (energized) {
        tween = gsap.fromTo(
          glowRef.current ? [energized, glowRef.current] : energized,
          { strokeDashoffset: () => length },
          { strokeDashoffset: 0, ease: 'none', scrollTrigger: scrollTriggerVars }
        );
      } else {
        trigger = ScrollTrigger.create(scrollTriggerVars);
      }

      // `refreshInit` fires before the triggers re-measure, so a resize that
      // changes the pin distances leaves the path built against stale
      // spacers. Rebuild once more when the cycle completes and re-apply the
      // scrub progress against the new length.
      const rebuildAfterRefresh = () => {
        build();
        const st = tween?.scrollTrigger ?? trigger;
        if (tween && st) {
          tween.invalidate().progress(st.progress);
          progress = st.progress;
        } else if (st) {
          onUpdate(st);
        }
      };

      // The phone progress bar tracks the whole page (top → bottom), not the
      // cable's arrival at the switch, so it only fills up at the very end.
      const barTrigger = setFill
        ? ScrollTrigger.create({
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: (self) => setFill(self.progress),
          })
        : null;

      ScrollTrigger.addEventListener('refreshInit', build);
      ScrollTrigger.addEventListener('refresh', rebuildAfterRefresh);

      return () => {
        ScrollTrigger.removeEventListener('refreshInit', build);
        ScrollTrigger.removeEventListener('refresh', rebuildAfterRefresh);
        pulse?.kill();
        tween?.scrollTrigger?.kill();
        tween?.kill();
        trigger?.kill();
        barTrigger?.kill();
        disposeWatchers();
      };
    },
    { dependencies: [reduced, desktop], revertOnUpdate: true }
  );

  return (
    <>
      {/* The cable exists on ≥1024px only (BRIEF §7 keeps the phone path
          light): below that the same progress drives the 2px bar and the SVG
          would be `display: none` dead weight in the layout tree. */}
      <div ref={layerRef} className="jv-mainline-layer" aria-hidden="true">
        {desktop ? (
        <svg ref={svgRef} data-testid="mainline" className="jv-mainline" aria-hidden="true">
          <defs>
            <filter id="jv-mainline-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          {/* 10px PVC sheath */}
          <path
            ref={sheathRef}
            d="M 0 0"
            fill="none"
            stroke="#3A3F4E"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* lighter top edge of the sheath, offset to the light side */}
          <g transform="translate(-2.6 0)">
            <path
              ref={edgeRef}
              d="M 0 0"
              fill="none"
              stroke="#565E70"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <g ref={ringsRef} />
          {/* copper core, visible only where the cable is energized */}
          <g className="jv-glow-lg">
            <path
              ref={glowRef}
              d="M 0 0"
              fill="none"
              stroke="var(--color-volt-hi)"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.45"
              filter="url(#jv-mainline-glow)"
            />
          </g>
          <path
            ref={energizedRef}
            data-testid="mainline-energized"
            d="M 0 0"
            fill="none"
            stroke="var(--color-volt)"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* stripped end at the switch: bare copper strands */}
          <g ref={strippedRef}>
            <path
              d="M -14 -3.2 h 14 M -14 0 h 15 M -14 3.2 h 14"
              fill="none"
              stroke="#F6C08B"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <rect x="-20" y="-7" width="8" height="14" rx="2" fill="#2A2F3D" stroke="#0A0B10" strokeOpacity="0.6" strokeWidth="1" />
          </g>
          <circle ref={dotRef} r="4.5" cx="0" cy="0" fill="var(--color-volt-hi)" opacity="0" />
        </svg>
        ) : null}
      </div>
      <div data-testid="progress-bar" className="jv-progress" aria-hidden="true">
        <div ref={fillRef} className="jv-progress-fill" />
      </div>
    </>
  );
}
