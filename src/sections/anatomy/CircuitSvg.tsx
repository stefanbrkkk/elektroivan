import { useId, type ReactNode, type RefObject } from 'react';
import { CurrentPath } from '../../motion/CurrentPath';
import { Sparks } from '../../motion/Sparks';
import type { CurrentPathHandle, SparksHandle } from '../../motion/types';
import type { CircuitLayout, CircuitNode } from './layout';

export interface CircuitSparkRefs {
  breaker: RefObject<SparksHandle | null>;
  cable: RefObject<SparksHandle | null>;
  socket: RefObject<SparksHandle | null>;
}

const HALO_ID = 'jv-halo-gradient';

interface CircuitSvgProps {
  layout: CircuitLayout;
  /** Static end state: everything repaired, circuit energized, bulb on. */
  lit: boolean;
  sparks: CircuitSparkRefs;
  current: RefObject<CurrentPathHandle | null>;
  label: string;
}

const DIM = 0.5;

function Panel({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g data-node="panel" transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect
        x="-52"
        y="-74"
        width="104"
        height="148"
        rx="8"
        fill="var(--color-surface)"
        stroke="var(--color-line)"
        strokeWidth="2"
      />
      <rect x="-38" y="-56" width="76" height="6" rx="3" fill="var(--color-line)" />
      {[-30, -8, 14].map((offset) => (
        <g key={offset} transform={`translate(0 ${offset + 8})`}>
          <rect
            x="-34"
            y="-9"
            width="68"
            height="18"
            rx="3"
            fill="var(--color-bg)"
            stroke="var(--color-line)"
            strokeWidth="1.5"
          />
          <rect x="-6" y="-6" width="12" height="12" rx="2" fill="var(--color-line)" />
        </g>
      ))}
      <rect x="-38" y="52" width="76" height="6" rx="3" fill="var(--color-line)" />
    </g>
  );
}

function Breaker({ sparks }: { sparks: RefObject<SparksHandle | null> }) {
  return (
    <>
      <ellipse data-part="halo" rx="58" ry="58" fill={`url(#${HALO_ID})`} opacity="0" />
      <rect
        x="-24"
        y="-40"
        width="48"
        height="80"
        rx="5"
        fill="var(--color-surface)"
        stroke="var(--color-line)"
        strokeWidth="2"
      />
      <rect x="-16" y="16" width="32" height="4" rx="2" fill="var(--color-line)" />
      <rect
        data-part="lever"
        x="-9"
        y="-32"
        width="18"
        height="28"
        rx="3"
        fill="var(--color-line)"
        stroke="var(--color-muted)"
        strokeWidth="1.5"
      />
      <circle data-part="indicator" cx="0" cy="28" r="4.5" fill="var(--color-arc)" opacity="0" />
      <rect
        data-part="flash"
        x="-24"
        y="-40"
        width="48"
        height="80"
        rx="5"
        fill="var(--color-volt-hi)"
        opacity="0"
      />
      <Sparks ref={sparks} as="g" count={10} spread={22} transform="translate(0 -26)" />
    </>
  );
}

function Rcd() {
  return (
    <>
      <ellipse data-part="halo" rx="62" ry="62" fill={`url(#${HALO_ID})`} opacity="0" />
      <rect
        x="-28"
        y="-44"
        width="56"
        height="88"
        rx="5"
        fill="var(--color-surface)"
        stroke="var(--color-line)"
        strokeWidth="2"
      />
      <rect
        data-part="lever"
        x="-10"
        y="-36"
        width="20"
        height="30"
        rx="3"
        fill="var(--color-line)"
        stroke="var(--color-muted)"
        strokeWidth="1.5"
      />
      <circle
        data-part="test"
        cx="0"
        cy="8"
        r="8"
        fill="var(--color-bg)"
        stroke="var(--color-muted)"
        strokeWidth="1.5"
      />
      <rect
        data-part="indicator"
        x="-13"
        y="26"
        width="26"
        height="7"
        rx="3.5"
        fill="var(--color-fault)"
        opacity="0"
      />
      <rect
        data-part="ok"
        x="-13"
        y="26"
        width="26"
        height="7"
        rx="3.5"
        fill="var(--color-arc)"
        opacity="0"
      />
    </>
  );
}

function Cable({ sparks, lit }: { sparks: RefObject<SparksHandle | null>; lit: boolean }) {
  const stripes = useId().replace(/[^a-zA-Z0-9-]/g, '');
  return (
    <>
      <ellipse data-part="halo" rx="86" ry="52" fill={`url(#${HALO_ID})`} opacity="0" />
      <defs>
        <pattern
          id={`jv-tape-${stripes}`}
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(38)"
        >
          <rect width="8" height="8" fill="var(--color-line)" />
          <rect width="4" height="8" fill="var(--color-muted)" opacity="0.5" />
        </pattern>
        <clipPath id={`jv-tape-clip-${stripes}`}>
          <rect data-part="tape-clip" x="-26" y="-13" width={lit ? 52 : 0} height="26" />
        </clipPath>
      </defs>

      <path
        d="M -74 0 H -16"
        stroke="var(--color-line)"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 16 0 H 74"
        stroke="var(--color-line)"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
      {/* Bare strands, shown by the timeline on the fault beat only. */}
      <g data-part="copper" opacity={0}>
        <path
          d="M -16 -3 l 10 -2 M -16 0 l 11 1 M -16 3 l 9 3 M 16 -3 l -9 -3 M 16 0 l -11 1 M 16 3 l -10 2"
          stroke="var(--color-volt-lo)"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* The scrubbed master owns the group's autoAlpha; the live fault loop
          owns the polyline's opacity. Two elements, two owners — scrubbing
          through the beat can no longer strand a value the other one wrote
          (docs/reports/review-1.md minor 17). */}
      <g data-testid="anatomy-arc" opacity="0" visibility="hidden">
        <polyline
          data-part="arc-flicker"
          points="-15,0 -9,-8 -3,5 3,-6 9,7 15,0"
          fill="none"
          stroke="var(--color-arc)"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      </g>

      <g data-testid="anatomy-tape" opacity={lit ? 1 : 0} visibility={lit ? 'visible' : 'hidden'}>
        <g clipPath={`url(#jv-tape-clip-${stripes})`}>
          <rect
            x="-26"
            y="-8.5"
            width="52"
            height="17"
            rx="4"
            fill={`url(#jv-tape-${stripes})`}
            stroke="var(--color-line)"
            strokeWidth="1"
          />
        </g>
      </g>

      <Sparks
        ref={sparks}
        as="g"
        testId="anatomy-sparks"
        count={12}
        spread={24}
        transform="translate(0 0)"
      />
    </>
  );
}

/**
 * Schuko face: a recessed circle, the two pin holes, the earth clips top and
 * bottom and a fixing screw. Every detail is a *stroke*, never a `--color-bg`
 * fill — at the DIM opacity the unlit components sit at, a background-coloured
 * hole on a dark stage is invisible and the socket reads as a blank box
 * (docs/reports/review-1.md minor 16).
 */
function SocketFace({ stroke }: { stroke: string }) {
  return (
    <g fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="0" cy="0" r="20" />
      <circle cx="-10" cy="0" r="4.5" fill="var(--color-bg)" />
      <circle cx="10" cy="0" r="4.5" fill="var(--color-bg)" />
      <path d="M -7 -19 h 14 M -7 19 h 14" strokeWidth="2.5" />
      <circle cx="0" cy="-24" r="2.5" />
    </g>
  );
}

function Socket({ sparks, lit }: { sparks: RefObject<SparksHandle | null>; lit: boolean }) {
  return (
    <>
      <ellipse data-part="halo" rx="62" ry="62" fill={`url(#${HALO_ID})`} opacity="0" />
      <g data-part="old-socket" opacity={lit ? 0 : 1}>
        <rect
          x="-30"
          y="-30"
          width="60"
          height="60"
          rx="9"
          fill="var(--color-surface)"
          stroke="var(--color-line)"
          strokeWidth="2"
        />
        <SocketFace stroke="var(--color-line)" />
        <ellipse data-part="soot" cx="2" cy="-8" rx="20" ry="13" fill="var(--color-fault)" opacity="0" />
      </g>
      <g data-part="new-socket" opacity={lit ? 1 : 0}>
        <rect
          x="-30"
          y="-30"
          width="60"
          height="60"
          rx="9"
          fill="var(--color-surface)"
          stroke="var(--color-muted)"
          strokeWidth="2"
        />
        <SocketFace stroke="var(--color-muted)" />
        <rect
          data-part="sweep"
          x="-34"
          y="-30"
          width="12"
          height="60"
          fill="var(--color-text)"
          opacity="0"
        />
      </g>
      <Sparks ref={sparks} as="g" count={8} spread={16} transform="translate(0 2)" />
    </>
  );
}

function Lamp() {
  return (
    <>
      <ellipse data-part="halo" rx="56" ry="56" fill={`url(#${HALO_ID})`} opacity="0" />
      <rect
        x="-22"
        y="-22"
        width="44"
        height="44"
        rx="6"
        fill="var(--color-surface)"
        stroke="var(--color-line)"
        strokeWidth="2"
      />
      {/* Two fixing screws in the plate, so the switch reads as a switch even
          while it is dimmed (docs/reports/review-1.md minor 16). */}
      <g fill="none" stroke="var(--color-line)" strokeWidth="1.5">
        <circle cx="-16" cy="0" r="2.5" />
        <circle cx="16" cy="0" r="2.5" />
      </g>
      <g data-part="rocker">
        <rect
          x="-12"
          y="-13"
          width="24"
          height="26"
          rx="3"
          fill="var(--color-line)"
          stroke="var(--color-muted)"
          strokeWidth="1.2"
        />
        {/* The rocker's lit edge and its pivot line. */}
        <path
          d="M -9 -10 h 18"
          stroke="var(--color-muted)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path d="M -12 1 h 24" stroke="var(--color-bg)" strokeWidth="1.5" opacity="0.8" />
      </g>
    </>
  );
}

/**
 * The circuit drawing itself: one continuous current path with the five
 * components sitting on it. Everything is addressed by `data-node` /
 * `data-part` so the scrubbed timeline in Anatomy.tsx can drive it without a
 * single React re-render.
 */
export function CircuitSvg({ layout, lit, sparks, current, label }: CircuitSvgProps) {
  const gradientId = `jv-bulb-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;

  // Only the translation goes on the node group: that group is what the
  // scrubbed timeline drives (x/y/scale), and GSAP resolves a percentage
  // `transformOrigin` against `getBBox()` — which is not the component's own
  // (0, 0) once sparks and halos widen it, so letting GSAP own the rotation
  // slid the rotated component clean off the path. The orientation is a
  // static inner `<g>` instead; nothing animated ever touches it.
  const placement = (node: CircuitNode) => `translate(${node.x} ${node.y})`;

  const oriented = (node: CircuitNode, children: ReactNode) =>
    node.rotate ? <g transform={`rotate(${node.rotate})`}>{children}</g> : children;

  return (
    <svg
      className="jv-stage-svg"
      viewBox={layout.viewBox}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id={HALO_ID}>
          <stop offset="0%" stopColor="var(--color-volt)" stopOpacity="0.9" />
          <stop offset="55%" stopColor="var(--color-volt)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-volt)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor="var(--color-volt-hi)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-volt)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <CurrentPath
        ref={current}
        d={layout.path}
        strokeWidth={7}
        coreWidth={3}
        progress={lit ? 1 : 0}
      />

      <Panel x={layout.panel.x} y={layout.panel.y} scale={layout.panel.scale} />

      {layout.nodes.map((node) => (
        <g
          key={node.id}
          data-node={node.id}
          transform={placement(node)}
          opacity={lit ? 1 : DIM}
        >
          {oriented(
            node,
            <>
              {node.id === 'breaker' ? <Breaker sparks={sparks.breaker} /> : null}
              {node.id === 'rcd' ? <Rcd /> : null}
              {node.id === 'cable' ? <Cable sparks={sparks.cable} lit={lit} /> : null}
              {node.id === 'socket' ? <Socket sparks={sparks.socket} lit={lit} /> : null}
              {node.id === 'lamp' ? <Lamp /> : null}
            </>
          )}
        </g>
      ))}

      <g data-node="bulb" transform={`translate(${layout.bulb.x} ${layout.bulb.y})`} opacity={lit ? 1 : DIM}>
        <circle data-part="bulb-glow" r="52" fill={`url(#${gradientId})`} opacity={lit ? 1 : 0} />
        <path
          d="M -16 6 a 16 16 0 1 1 32 0 c 0 6 -3 9 -5 12 l 0 6 l -22 0 l 0 -6 c -2 -3 -5 -6 -5 -12 Z"
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="2"
        />
        <path d="M -9 26 h 18 M -7 31 h 14" stroke="var(--color-line)" strokeWidth="2" strokeLinecap="round" />
        <path
          data-part="filament"
          d="M -6 12 c 0 -5 3 -6 3 -9 s -2 -4 3 -4 s 3 3 3 4 s 3 4 3 9"
          fill="none"
          stroke="var(--color-volt-hi)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={lit ? 1 : 0.15}
        />
        <circle
          data-testid="anatomy-bulb"
          data-lit={lit ? 'true' : 'false'}
          r="17"
          cy="4"
          fill="var(--color-volt-hi)"
          opacity={lit ? 0.85 : 0.08}
        />
        {/* Owned by the live fault loop alone — the master never tweens it, so
            a scrub through step 5's fault beat cannot strand the bulb at a
            half-dimmed value (docs/reports/review-1.md minor 17). */}
        <circle data-part="bulb-flicker" r="17" cy="4" fill="var(--color-volt-hi)" opacity="0" />
      </g>
    </svg>
  );
}
