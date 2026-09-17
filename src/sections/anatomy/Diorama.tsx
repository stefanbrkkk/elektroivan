import { useId, type ReactNode, type RefObject } from 'react';
import { Materials } from '../../components/svg/Materials';
import { PART_OUTLINE } from '../../components/svg/part-style';
import { CurrentPath } from '../../motion/CurrentPath';
import { Sparks } from '../../motion/Sparks';
import { DinRail, Mcb, Rcd, Screw, Terminal, TerminalBar } from '../../motion/parts';
import type { CurrentPathHandle, SparksHandle } from '../../motion/types';
import type { DioramaLayout, DioramaPart } from './diorama';

export interface DioramaSparkRefs {
  breaker: RefObject<SparksHandle | null>;
  cable: RefObject<SparksHandle | null>;
  socket: RefObject<SparksHandle | null>;
}

interface DioramaProps {
  layout: DioramaLayout;
  /** Static end state: assembled, energized, bulb on. */
  lit: boolean;
  sparks: DioramaSparkRefs;
  current: RefObject<CurrentPathHandle | null>;
  label: string;
}

const O = PART_OUTLINE;
const BOX_W = 280;
const BOX_H = 300;

/** Soft amber halo behind the part the current story step is about. */
function Halo({ rx = 90, ry = 90 }: { rx?: number; ry?: number }) {
  return <ellipse data-part="halo" rx={rx} ry={ry} fill="url(#m-glow-volt)" opacity={0} />;
}

/* -------------------------------------------------------------- enclosure */

function Enclosure() {
  return (
    <g>
      <rect x={-BOX_W / 2} y={-BOX_H / 2} width={BOX_W} height={BOX_H} rx={9} fill="url(#m-polymer-dark)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={O.strokeWidth} />
      {/* cut-away cavity */}
      <rect x={-BOX_W / 2 + 13} y={-BOX_H / 2 + 13} width={BOX_W - 26} height={BOX_H - 26} rx={5} fill="#07080C" />
      <rect x={-BOX_W / 2 + 13} y={-BOX_H / 2 + 13} width={BOX_W - 26} height={BOX_H - 26} fill="url(#m-hatch)" opacity={0.35} />
      {/* wall of the cavity catching light on the top-left */}
      <path d={`M ${-BOX_W / 2 + 13} ${BOX_H / 2 - 13} V ${-BOX_H / 2 + 13} H ${BOX_W / 2 - 13}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={1.5} />
      <path d={`M ${-BOX_W / 2 + 1} ${-BOX_H / 2 + 6} V ${BOX_H / 2 - 6} M ${-BOX_W / 2 + 6} ${-BOX_H / 2 + 1} H ${BOX_W / 2 - 6}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1} strokeLinecap="round" />
      <path d={`M ${BOX_W / 2 - 3} ${-BOX_H / 2 + 8} V ${BOX_H / 2 - 8} M ${-BOX_W / 2 + 8} ${BOX_H / 2 - 2} H ${BOX_W / 2 - 8}`} fill="none" stroke="#000000" strokeOpacity={0.45} strokeWidth={3.5} strokeLinecap="round" />
      {/* cable knockouts */}
      {[-70, 0, 70].map((offset) => (
        <g key={offset}>
          <circle cx={offset} cy={BOX_H / 2 - 6} r={9} fill="#0A0B10" stroke="#3A3F4E" strokeWidth={1.2} />
          <circle cx={offset} cy={BOX_H / 2 - 6} r={5} fill="#13151E" />
        </g>
      ))}
      <Screw cx={-BOX_W / 2 + 8} cy={-BOX_H / 2 + 8} r={5} angle={22} />
      <Screw cx={BOX_W / 2 - 8} cy={-BOX_H / 2 + 8} r={5} angle={-38} />
      <Screw cx={-BOX_W / 2 + 8} cy={BOX_H / 2 - 8} r={5} angle={54} />
      <Screw cx={BOX_W / 2 - 8} cy={BOX_H / 2 - 8} r={5} angle={-12} />
    </g>
  );
}

function Door() {
  const w = BOX_W + 10;
  const h = BOX_H + 10;
  return (
    <g>
      <path
        d={`M ${-w / 2} ${-h / 2} H ${w / 2} V ${h / 2} H ${-w / 2} Z M -105 -108 H 105 V 100 H -105 Z`}
        fillRule="evenodd"
        fill="url(#m-polymer-dark)"
        stroke={O.stroke}
        strokeOpacity={O.strokeOpacity}
        strokeWidth={O.strokeWidth}
      />
      <path d={`M ${-w / 2 + 5} ${-h / 2 + 1.5} H ${w / 2 - 5} M ${-w / 2 + 1.5} ${-h / 2 + 5} V ${h / 2 - 5}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.32} strokeWidth={1} strokeLinecap="round" />
      <path d={`M ${w / 2 - 3} ${-h / 2 + 6} V ${h / 2 - 6} M ${-w / 2 + 6} ${h / 2 - 2} H ${w / 2 - 6}`} fill="none" stroke="#000000" strokeOpacity={0.45} strokeWidth={3.5} strokeLinecap="round" />
      {/* opening bevel */}
      <rect x={-105} y={-108} width={210} height={208} fill="none" stroke="#FFFFFF" strokeOpacity={0.14} strokeWidth={1.5} />
      {/* hinges */}
      {[-96, 96].map((cy) => (
        <g key={cy}>
          <rect x={-w / 2 - 6} y={cy - 14} width={14} height={28} rx={4} fill="url(#m-steel)" stroke={O.stroke} strokeOpacity={0.6} strokeWidth={1} />
          <circle cx={-w / 2 + 1} cy={cy} r={3.2} fill="#22262F" />
        </g>
      ))}
      {/* latch */}
      <rect x={w / 2 - 22} y={-12} width={16} height={24} rx={3} fill="url(#m-steel)" stroke={O.stroke} strokeOpacity={0.6} strokeWidth={1} />
      <path d={`M ${w / 2 - 18} 0 h 8`} stroke="#0A0B10" strokeOpacity={0.8} strokeWidth={2.4} strokeLinecap="round" />
      {/* label field */}
      <rect x={-64} y={-142} width={128} height={24} rx={3} fill="#0F121B" stroke="#262B3B" strokeWidth={1} />
      <text x={0} y={-125} className="font-mono" fontSize={13} textAnchor="middle" fill="#8FD8FF">
        RT · 1F
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ cable */

function Cable({ sparks, lit, tapeId }: { sparks: RefObject<SparksHandle | null>; lit: boolean; tapeId: string }) {
  const half = 85;
  const gap = 20;
  return (
    <g>
      <Halo rx={128} ry={72} />
      <defs>
        <pattern id={`jv-tape-${tapeId}`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
          <rect width="9" height="9" fill="#2A2F3D" />
          <rect width="4.5" height="9" fill="#5C616D" />
        </pattern>
        <clipPath id={`jv-tape-clip-${tapeId}`}>
          <rect data-part="tape-clip" x={-32} y={-18} width={lit ? 64 : 0} height={36} />
        </clipPath>
      </defs>

      {/* two sheathed ends of the run, cut in the middle */}
      {[-1, 1].map((side) => (
        <g key={side} transform={side === 1 ? 'scale(-1 1)' : undefined}>
          <rect x={-half} y={-13} width={half - gap} height={26} rx={6} fill="url(#m-polymer-dark)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={O.strokeWidth} />
          <path d={`M ${-half + 5} -10 H ${-gap - 5}`} stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1.4} strokeLinecap="round" />
          <path d={`M ${-half + 5} 10 H ${-gap - 5}`} stroke="#000000" strokeOpacity={0.4} strokeWidth={2.4} strokeLinecap="round" />
          {/* the three conductors coming out of the cut */}
          <rect x={-gap - 2} y={-9.5} width={16} height={6} rx={3} fill="url(#m-ins-brown)" />
          <rect x={-gap - 2} y={-3} width={16} height={6} rx={3} fill="url(#m-ins-blue)" />
          <rect x={-gap - 2} y={3.5} width={16} height={6} rx={3} fill="url(#m-ins-ye-gn)" />
        </g>
      ))}

      {/* bare copper strands at the cut — only on the fault beat */}
      <g data-part="copper" opacity={0}>
        <path
          d="M -6 -7 l -7 -1.5 M -6 -6 l -7 1 M -6 -0.5 l -7 -1 M -6 0.5 l -7 1.5 M -6 6 l -7 -1 M -6 7 l -7 1.5 M 6 -7 l 7 -1.5 M 6 -6 l 7 1 M 6 -0.5 l 7 -1 M 6 0.5 l 7 1.5 M 6 6 l 7 -1 M 6 7 l 7 1.5"
          stroke="#F6C08B"
          strokeWidth={1.8}
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* The scrubbed master owns the group's autoAlpha; the live fault loop
          owns the polyline's opacity — one owner per property. */}
      <g data-testid="anatomy-arc" opacity="0" visibility="hidden">
        <polyline data-part="arc-flicker" points="-16,0 -9,-11 -2,7 4,-9 11,9 16,-1" fill="none" stroke="#8FD8FF" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </g>

      <g data-testid="anatomy-tape" opacity={lit ? 1 : 0} visibility={lit ? 'visible' : 'hidden'}>
        <g clipPath={`url(#jv-tape-clip-${tapeId})`}>
          <rect x={-32} y={-14} width={64} height={28} rx={6} fill={`url(#jv-tape-${tapeId})`} stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={1} />
          <path d="M -28 -11 H 28" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={1.2} strokeLinecap="round" />
        </g>
      </g>

      <Sparks ref={sparks} as="g" testId="anatomy-sparks" count={12} spread={26} transform="translate(0 0)" />
    </g>
  );
}

/* ----------------------------------------------------------------- socket */

function SocketCover({ sparks }: { sparks: RefObject<SparksHandle | null> }) {
  return (
    <g>
      <rect x={-42} y={-42} width={84} height={84} rx={8} fill="url(#m-polymer-light)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={O.strokeWidth} />
      <path d="M -36 -40 H 36 M -40 -36 V 36" fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1.4} strokeLinecap="round" />
      <path d="M 39 -34 V 34 M -34 39 H 34" fill="none" stroke="#000000" strokeOpacity={0.28} strokeWidth={3} strokeLinecap="round" />
      {/* Schuko recess */}
      <circle cx={0} cy={0} r={27} fill="#C9C7BE" stroke="#8A8F9C" strokeWidth={1.2} />
      <circle cx={0} cy={0} r={27} fill="none" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={1.4} strokeDasharray="30 90" strokeDashoffset="14" />
      <circle cx={-11} cy={0} r={5.5} fill="#07080C" />
      <circle cx={11} cy={0} r={5.5} fill="#07080C" />
      {/* earth clips */}
      <path d="M -9 -25.5 h 18 M -9 25.5 h 18" stroke="url(#m-steel)" strokeWidth={4.5} strokeLinecap="round" />
      <ellipse data-part="soot" cx={2} cy={-6} rx={26} ry={18} fill="#FF6A3D" opacity={0} />
      <rect data-part="sweep" x={-48} y={-42} width={14} height={84} fill="#FFFFFF" opacity={0} />
      <Sparks ref={sparks} as="g" count={10} spread={20} transform="translate(0 2)" />
    </g>
  );
}

function SocketFrame() {
  return (
    <g>
      <path
        d="M -50 -50 H 50 V 50 H -50 Z M -33 -33 H 33 V 33 H -33 Z"
        fillRule="evenodd"
        fill="url(#m-steel)"
        stroke={O.stroke}
        strokeOpacity={O.strokeOpacity}
        strokeWidth={O.strokeWidth}
      />
      <path d="M -46 -48 H 46 M -48 -46 V 46" fill="none" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.2} strokeLinecap="round" />
      <Screw cx={0} cy={-42} r={5} angle={18} />
      <Screw cx={0} cy={42} r={5} angle={-24} />
    </g>
  );
}

function SocketInsert({ lit }: { lit: boolean }) {
  const body = (tone: string, claw: string) => (
    <>
      <rect x={-33} y={-33} width={66} height={66} rx={5} fill={tone} stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={O.strokeWidth} />
      <path d="M -29 -31 H 29" stroke="#FFFFFF" strokeOpacity={0.28} strokeWidth={1.2} strokeLinecap="round" />
      {/* brass contacts */}
      <rect x={-19} y={-9} width={11} height={18} rx={3} fill="url(#m-brass)" stroke="#0A0B10" strokeOpacity={0.5} strokeWidth={1} />
      <rect x={8} y={-9} width={11} height={18} rx={3} fill="url(#m-brass)" stroke="#0A0B10" strokeOpacity={0.5} strokeWidth={1} />
      <path d="M -17 -6 v 12 M 10 -6 v 12" stroke="#F2D98A" strokeWidth={1.2} strokeLinecap="round" />
      {/* expanding claws */}
      <path d={`M -33 -18 l -14 -7 v 14 Z M 33 -18 l 14 -7 v 14 Z`} fill={claw} stroke="#0A0B10" strokeOpacity={0.5} strokeWidth={1} />
      {/* two fixing screws */}
      <Screw cx={-24} cy={24} r={5} angle={34} />
      <Screw cx={24} cy={24} r={5} angle={-16} />
      <Terminal cx={0} cy={-26} w={26} h={13} screw={false} />
    </>
  );
  return (
    <g>
      <Halo rx={92} ry={92} />
      <g data-part="old-socket" opacity={lit ? 0 : 1}>{body('#2A2F3D', '#5C616D')}</g>
      <g data-part="new-socket" opacity={lit ? 1 : 0}>{body('url(#m-polymer-dark)', 'url(#m-steel)')}</g>
    </g>
  );
}

/* ---------------------------------------------------------- switch & lamp */

function WallSwitch() {
  return (
    <g>
      <rect x={-40} y={-40} width={80} height={80} rx={8} fill="url(#m-polymer-light)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={O.strokeWidth} />
      <path d="M -34 -38 H 34 M -38 -34 V 34" fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1.4} strokeLinecap="round" />
      <path d="M 37 -32 V 32 M -32 37 H 32" fill="none" stroke="#000000" strokeOpacity={0.28} strokeWidth={3} strokeLinecap="round" />
      <rect x={-24} y={-26} width={48} height={52} rx={4} fill="#C9C7BE" />
      <g data-part="rocker">
        <rect x={-21} y={-23} width={42} height={46} rx={4} fill="url(#m-polymer-light)" stroke={O.stroke} strokeOpacity={0.5} strokeWidth={1} />
        <path d="M -17 -19 H 17" stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={2.4} strokeLinecap="round" />
        <path d="M -21 1 H 21" stroke="#8A8F9C" strokeWidth={1.4} />
        <path d="M -17 19 H 17" stroke="#000000" strokeOpacity={0.25} strokeWidth={2.4} strokeLinecap="round" />
      </g>
      <Screw cx={0} cy={-33} r={4} angle={22} />
      <Screw cx={0} cy={33} r={4} angle={-30} />
    </g>
  );
}

function LampHolder() {
  return (
    <g>
      {/* ceiling rose / cable entry */}
      <rect x={-9} y={-42} width={18} height={20} rx={4} fill="url(#m-polymer-dark)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={1} />
      {/* polymer skirt */}
      <path d="M -22 -22 H 22 L 18 6 H -18 Z" fill="url(#m-polymer-dark)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={O.strokeWidth} />
      <path d="M -19 -19 L -16 3" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1.4} strokeLinecap="round" />
      {/* E27 brass thread */}
      <rect x={-15} y={6} width={30} height={22} rx={2} fill="url(#m-brass)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={1} />
      <path d="M -15 11 H 15 M -15 17 H 15 M -15 23 H 15" stroke="#7A5C13" strokeOpacity={0.7} strokeWidth={1.6} />
      <path d="M -13 8 H 13" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.2} strokeLinecap="round" />
    </g>
  );
}

function Bulb({ lit, gradientId }: { lit: boolean; gradientId: string }) {
  return (
    <g>
      <Halo rx={108} ry={108} />
      <circle cy={9} data-part="bulb-glow" r={76} fill={`url(#${gradientId})`} opacity={lit ? 1 : 0} />
      {/* E27 brass cap */}
      <rect x={-15} y={-40} width={30} height={22} rx={2} fill="url(#m-brass)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={1} />
      <path d="M -15 -35 H 15 M -15 -29 H 15 M -15 -23 H 15" stroke="#7A5C13" strokeOpacity={0.7} strokeWidth={1.6} />
      <path d="M -13 -37 H 13" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.2} strokeLinecap="round" />
      {/* glass envelope: narrow neck flaring into the sphere */}
      <path
        d="M -7 -18 c 0 7 -20 11 -20 27 a 26 26 0 1 0 54 0 c 0 -16 -20 -20 -20 -27 Z"
        fill="#11141D"
        fillOpacity={0.62}
        stroke="#6A717F"
        strokeWidth={1.8}
      />
      <path d="M -19 18 a 24 24 0 0 1 9 -17" fill="none" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={2.2} strokeLinecap="round" />
      <circle data-testid="anatomy-bulb" data-lit={lit ? 'true' : 'false'} cy={9} r={24} fill="#FFD36A" opacity={lit ? 0.85 : 0.07} />
      <circle data-part="bulb-flicker" cy={9} r={24} fill="#FFD36A" opacity={0} />
      {/* stem and filament */}
      <path d="M -5 2 v -14 M 5 2 v -14" stroke="#8A8F9C" strokeWidth={1.6} strokeLinecap="round" />
      <path
        data-part="filament"
        d="M -8 4 c 0 -7 5 -8 5 -13 s -3 -5 3 -5 s 3 4 3 5 s 5 6 5 13"
        fill="none"
        stroke="#FFE9B0"
        strokeWidth={2.6}
        strokeLinecap="round"
        opacity={lit ? 1 : 0.16}
      />
    </g>
  );
}

/* ------------------------------------------------------------------ chrome */

function Leader({ part, k }: { part: DioramaPart; k: number }) {
  const sx = (part.x + part.ex) * 1;
  const sy = (part.y + part.ey) * 1;
  const { lx, ly, anchor } = part;
  const cx = (sx + lx) / 2 + (ly - sy) * 0.12;
  const cy = (sy + ly) / 2 + (sx - lx) * 0.12;
  const tick = anchor === 'end' ? -1 : 1;
  const size = k < 1 ? 11 : 14;
  return (
    <g data-leader="">
      <path data-leader-line="" d={`M ${sx} ${sy} Q ${cx} ${cy} ${lx} ${ly}`} fill="none" stroke="#8FD8FF" strokeOpacity={0.5} strokeWidth={1.2} strokeLinecap="round" />
      <g data-leader-label="" opacity={0}>
        <circle cx={sx} cy={sy} r={2.6} fill="#8FD8FF" />
        <path d={`M ${lx} ${ly + 4} h ${tick * size * (k < 1 ? 1.4 : 2.2)}`} stroke="#8FD8FF" strokeOpacity={0.45} strokeWidth={1} />
        <text x={lx} y={ly} className="font-mono" fontSize={size} textAnchor={anchor === 'end' ? 'end' : 'start'}>
          <tspan fill="#8FD8FF" fontWeight={600}>
            {String(part.no).padStart(2, '0')}
          </tspan>
          {/* the names only fit on the wide drawing; phones get the numbers */}
          {k < 1 ? null : <tspan fill="#9AA0B4"> {part.name}</tspan>}
        </text>
      </g>
    </g>
  );
}

/**
 * The cutaway diorama itself. Every part is addressed by `data-part-id` (the
 * animated inner group, no transform when assembled) and `data-part` (details
 * inside it), so the scrubbed timeline in Anatomy.tsx drives the whole scene
 * without a single React re-render.
 */
export function Diorama({ layout, lit, sparks, current, label }: DioramaProps) {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const bulbGradient = `jv-bulbglow-${uid}`;
  const k = layout.vertical ? 0.62 : 1;

  const draw = (part: DioramaPart): ReactNode => {
    switch (part.id) {
      case 'box':
        return <Enclosure />;
      case 'door':
        return <Door />;
      case 'rail':
        return <DinRail width={(part.width ?? 240) / k} height={26} />;
      case 'mcb':
        return (
          <g transform={`scale(${(part.draw ?? 1) / k})`}>
            <Halo rx={130} ry={150} />
            <Mcb print="B16" />
            <Sparks ref={sparks.breaker} as="g" count={10} spread={38} transform="translate(0 -64)" />
          </g>
        );
      case 'rcd':
        return (
          <g transform={`scale(${(part.draw ?? 1) / k})`}>
            <Halo rx={160} ry={150} />
            <Rcd print="30 mA" />
          </g>
        );
      case 'nbar':
        return <TerminalBar width={(part.width ?? 200) / k} tone="n" />;
      case 'pebar':
        return <TerminalBar width={(part.width ?? 200) / k} tone="pe" />;
      case 'cable':
        return <Cable sparks={sparks.cable} lit={lit} tapeId={uid} />;
      case 'socket-cover':
        return <SocketCover sparks={sparks.socket} />;
      case 'socket-frame':
        return <SocketFrame />;
      case 'socket-insert':
        return <SocketInsert lit={lit} />;
      case 'switch':
        return <WallSwitch />;
      case 'holder':
        return <LampHolder />;
      case 'bulb':
        return <Bulb lit={lit} gradientId={bulbGradient} />;
      default:
        return null;
    }
  };

  return (
    <svg
      className="jv-stage-svg"
      viewBox={layout.viewBox}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      <Materials />
      <defs>
        <radialGradient id={bulbGradient}>
          <stop offset="0%" stopColor="#FFD36A" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#FFB92B" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FFB92B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* leader lines sit under the parts so a part never hides behind text */}
      <g data-leaders="" opacity={0}>
        {layout.parts.map((part) => (
          <Leader key={part.id} part={part} k={k} />
        ))}
      </g>

      <CurrentPath ref={current} d={layout.path} strokeWidth={11} coreWidth={3.4} progress={lit ? 1 : 0} />

      {layout.parts.map((part) => (
        <g key={part.id} transform={`translate(${part.x} ${part.y})`}>
          <g data-part-id={part.id} data-part-no={part.no} opacity={1}>
            <g transform={part.orient ? `scale(${k}) rotate(${part.orient})` : `scale(${k})`}>{draw(part)}</g>
          </g>
        </g>
      ))}

    </svg>
  );
}
