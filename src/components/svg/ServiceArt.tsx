import type { Service } from '../../config/site';
import { Materials } from './Materials';
import { PART_HIGHLIGHT, PART_OUTLINE } from './part-style';

/**
 * Large dimensional watermark illustrations for the services bento
 * (docs/DESIGN.md §3.6). Every part is a shaded, outlined, highlighted solid —
 * never a thin-line icon. Each drawing has one moving group whose class is
 * animated from `src/styles/global.css` on card hover/focus (fine pointer,
 * full motion only): `.art-lever`, `.art-door`, `.art-drum`, `.art-bulb`,
 * `.art-plug`, `.art-needle`, plus `.art-spark` accents.
 *
 * All markup is static, so it prerenders and hydrates identically.
 */

/** Screw head: brass disc, slot, top-left highlight. */
function Screw({ x, y, r = 5 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="url(#m-brass)" {...PART_OUTLINE} />
      <path d={`M${x - r * 0.6} ${y} H${x + r * 0.6}`} stroke="#5E4A12" strokeWidth={1.4} strokeLinecap="round" />
      <path d={`M${x - r * 0.55} ${y - r * 0.45} A ${r} ${r} 0 0 1 ${x + r * 0.2} ${y - r * 0.9}`} fill="none" {...PART_HIGHLIGHT} />
    </g>
  );
}

/** Steel DIN rail seen from the front, with its slotted web. */
function DinRail({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={20} rx={2} fill="url(#m-steel)" {...PART_OUTLINE} />
      <rect x={x} y={y + 5} width={w} height={10} fill="#0A0B10" opacity={0.22} />
      {Array.from({ length: Math.floor(w / 22) }).map((_, i) => (
        <rect key={i} x={x + 8 + i * 22} y={y + 7} width={10} height={6} rx={2} fill="#0A0B10" opacity={0.5} />
      ))}
      <path d={`M${x} ${y + 1.5} H${x + w}`} {...PART_HIGHLIGHT} />
    </g>
  );
}

/** Copper conductor stub with visible strands at the cut end. */
function CopperStub({ x, y, w = 26 }: { x: number; y: number; w?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={7} rx={3.5} fill="url(#m-copper)" {...PART_OUTLINE} />
      <path d={`M${x + 2} ${y + 2} H${x + w - 4}`} {...PART_HIGHLIGHT} />
    </g>
  );
}

/** 1: MCB on a DIN rail — the lever flips up on hover. */
function BreakerArt() {
  return (
    <>
      <DinRail x={28} y={148} w={144} />
      <g filter="url(#m-soft-shadow)">
        <rect x={62} y={44} width={76} height={110} rx={5} fill="url(#m-polymer-dark)" {...PART_OUTLINE} />
      </g>
      {/* front face step */}
      <path d="M62 78 H138" stroke="#0A0B10" strokeOpacity={0.45} strokeWidth={1.25} />
      <rect x={70} y={82} width={60} height={36} rx={3} fill="#0A0B10" fillOpacity={0.55} />
      {/* lever window + white lever */}
      <g className="art-lever">
        <rect x={86} y={86} width={28} height={30} rx={4} fill="url(#m-polymer-light)" {...PART_OUTLINE} />
        <path d="M90 90 H110" {...PART_HIGHLIGHT} />
        <path d="M92 110 H108" stroke="#9A988F" strokeWidth={2} strokeLinecap="round" />
      </g>
      {/* terminals */}
      <rect x={70} y={48} width={60} height={22} rx={3} fill="#0A0B10" fillOpacity={0.5} />
      <CopperStub x={74} y={55} />
      <Screw x={122} y={59} />
      <rect x={70} y={126} width={60} height={22} rx={3} fill="#0A0B10" fillOpacity={0.5} />
      <CopperStub x={74} y={133} />
      <Screw x={122} y={137} />
      {/* rating label */}
      <text x={100} y={128} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={11} fill="#C9C7BE">
        B16
      </text>
      <path d="M64 46 V152" {...PART_HIGHLIGHT} />
      <path d="M136 50 V152" stroke="#000" strokeOpacity={0.4} strokeWidth={2} />
      <circle className="art-spark" cx={100} cy={40} r={9} fill="url(#m-glow-volt)" />
    </>
  );
}

/** 2: distribution board — the door swings open on hover. */
function BoardArt() {
  return (
    <>
      <g filter="url(#m-soft-shadow)">
        <rect x={26} y={34} width={148} height={132} rx={7} fill="url(#m-polymer-light)" {...PART_OUTLINE} />
      </g>
      <rect x={34} y={42} width={132} height={116} rx={4} fill="#151823" />
      <DinRail x={40} y={70} w={120} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={44 + i * 23} y={44} width={18} height={30} rx={2.5} fill="url(#m-polymer-dark)" {...PART_OUTLINE} />
          <rect x={48 + i * 23} y={52} width={10} height={12} rx={2} fill="url(#m-polymer-light)" />
          <path d={`M${45 + i * 23} 46 V72`} {...PART_HIGHLIGHT} />
        </g>
      ))}
      <DinRail x={40} y={126} w={120} />
      <rect x={44} y={100} width={42} height={26} rx={2.5} fill="url(#m-polymer-dark)" {...PART_OUTLINE} />
      <rect x={52} y={106} width={12} height={14} rx={2} fill="#FF6A3D" fillOpacity={0.8} />
      <rect x={92} y={100} width={64} height={26} rx={2.5} fill="url(#m-polymer-dark)" {...PART_OUTLINE} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Screw key={i} x={100 + i * 10} y={113} r={3.4} />
      ))}
      {/* door: swings open around its left hinge */}
      <g className="art-door">
        <rect x={26} y={34} width={148} height={132} rx={7} fill="url(#m-polymer-light)" fillOpacity={0.96} {...PART_OUTLINE} />
        <rect x={38} y={46} width={124} height={108} rx={4} fill="none" stroke="#9A988F" strokeWidth={1.25} />
        <path d="M30 38 H170" {...PART_HIGHLIGHT} />
        <circle cx={162} cy={100} r={4} fill="url(#m-steel)" {...PART_OUTLINE} />
      </g>
    </>
  );
}

/** 3: cable drum — unwinds a length of cable with a spark on hover. */
function DrumArt() {
  return (
    <>
      <g className="art-drum">
        <circle cx={92} cy={96} r={58} fill="url(#m-polymer-dark)" {...PART_OUTLINE} />
        <circle cx={92} cy={96} r={58} fill="none" stroke="#3A3F4E" strokeWidth={2} />
        <circle cx={92} cy={96} r={26} fill="url(#m-steel)" {...PART_OUTLINE} />
        <circle cx={92} cy={96} r={9} fill="#0A0B10" {...PART_OUTLINE} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i * Math.PI) / 3;
          return (
            <path
              key={i}
              d={`M${92 + Math.cos(a) * 12} ${96 + Math.sin(a) * 12} L${92 + Math.cos(a) * 24} ${96 + Math.sin(a) * 24}`}
              stroke="#5C616D"
              strokeWidth={4}
              strokeLinecap="round"
            />
          );
        })}
        {[34, 40, 46, 52].map((r, i) => (
          <circle
            key={r}
            cx={92}
            cy={96}
            r={r}
            fill="none"
            stroke={i % 2 === 0 ? '#3A3F4E' : '#2A2F3D'}
            strokeWidth={5}
          />
        ))}
        <path d="M92 38 A58 58 0 0 1 143 68" {...PART_HIGHLIGHT} strokeWidth={2} />
        {[0, 1, 2, 3].map((i) => (
          <Screw key={i} x={92 + Math.cos((i * Math.PI) / 2 + 0.7) * 44} y={96 + Math.sin((i * Math.PI) / 2 + 0.7) * 44} r={4} />
        ))}
      </g>
      {/* unwound conductor with a stripped, sparking end */}
      <path d="M148 84 C168 84 176 104 176 126" stroke="url(#m-ins-blue)" strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d="M150 81 C166 82 172 98 173 118" {...PART_HIGHLIGHT} fill="none" />
      <rect x={171} y={126} width={7} height={20} rx={3} fill="url(#m-copper)" {...PART_OUTLINE} />
      <circle className="art-spark" cx={174} cy={150} r={12} fill="url(#m-glow-volt)" />
    </>
  );
}

/** 4: E27 bulb — the filament lights on hover. */
function BulbArt() {
  return (
    <>
      <circle className="art-bulb-glow" cx={100} cy={82} r={62} fill="url(#m-glow-volt)" />
      <path
        d="M100 22c-26 0-46 20-46 45 0 17 9 27 15 35 5 7 7 11 7 16h48c0-5 2-9 7-16 6-8 15-18 15-35 0-25-20-45-46-45Z"
        fill="#1B2330"
        fillOpacity={0.9}
        stroke="#8FD8FF"
        strokeOpacity={0.35}
        strokeWidth={2}
      />
      <path d="M72 44 A38 38 0 0 1 100 30" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* filament */}
      <g className="art-bulb">
        <path d="M86 108 V84 M114 108 V84" stroke="#C9C7BE" strokeWidth={2.5} strokeLinecap="round" />
        <path
          className="art-bulb-wire"
          d="M86 84c0 -8 6 -12 7 -4s7 4 7 -4 6 -12 7 -4 7 4 7 -4"
          fill="none"
          stroke="#FFB92B"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>
      {/* E27 screw cap */}
      <rect x={78} y={118} width={44} height={12} rx={3} fill="url(#m-steel)" {...PART_OUTLINE} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M80 ${134 + i * 9} h40`} stroke="url(#m-brass)" strokeWidth={7} strokeLinecap="round" />
      ))}
      <rect x={78} y={128} width={44} height={40} rx={3} fill="none" {...PART_OUTLINE} />
      <path d="M80 120 V166" {...PART_HIGHLIGHT} />
      <circle cx={100} cy={174} r={7} fill="#0A0B10" stroke="#5C616D" strokeWidth={2} />
    </>
  );
}

/** 5: boiler + Schuko plug — the plug slides into the socket on hover. */
function ApplianceArt() {
  return (
    <>
      <g filter="url(#m-soft-shadow)">
        <rect x={22} y={32} width={84} height={136} rx={30} fill="url(#m-polymer-light)" {...PART_OUTLINE} />
      </g>
      <path d="M28 52 A28 28 0 0 1 56 36" {...PART_HIGHLIGHT} strokeWidth={2} fill="none" />
      <rect x={96} y={30} width={12} height={140} rx={4} fill="#000" fillOpacity={0.25} />
      <circle cx={64} cy={104} r={20} fill="url(#m-polymer-dark)" {...PART_OUTLINE} />
      <circle cx={64} cy={104} r={13} fill="#0A0B10" />
      <path d="M64 104 L74 96" stroke="#FFB92B" strokeWidth={3} strokeLinecap="round" />
      <Screw x={40} y={60} r={4} />
      <Screw x={88} y={60} r={4} />
      <rect x={44} y={140} width={40} height={10} rx={3} fill="#C9C7BE" stroke="#9A988F" strokeWidth={1} />
      {/* wall socket */}
      <circle cx={150} cy={100} r={30} fill="url(#m-polymer-light)" {...PART_OUTLINE} />
      <circle cx={150} cy={100} r={21} fill="#0A0B10" fillOpacity={0.75} />
      <circle cx={142} cy={100} r={4.5} fill="#0A0B10" stroke="#5C616D" strokeWidth={1.5} />
      <circle cx={158} cy={100} r={4.5} fill="#0A0B10" stroke="#5C616D" strokeWidth={1.5} />
      <path d="M130 86 A30 30 0 0 1 150 70" {...PART_HIGHLIGHT} strokeWidth={2} fill="none" />
      {/* plug on its cable */}
      <g className="art-plug">
        <path d="M186 150 C186 130 178 124 178 114" stroke="#3A3F4E" strokeWidth={9} fill="none" strokeLinecap="round" />
        <rect x={166} y={82} width={26} height={34} rx={7} fill="url(#m-polymer-dark)" {...PART_OUTLINE} />
        <path d="M168 86 V112" {...PART_HIGHLIGHT} />
        <rect x={158} y={90} width={10} height={6} rx={3} fill="url(#m-brass)" {...PART_OUTLINE} />
        <rect x={158} y={102} width={10} height={6} rx={3} fill="url(#m-brass)" {...PART_OUTLINE} />
      </g>
    </>
  );
}

/** 6: multimeter — the needle swings across the scale on hover. */
function MeterArt() {
  return (
    <>
      <g filter="url(#m-soft-shadow)">
        <rect x={30} y={30} width={140} height={140} rx={12} fill="url(#m-polymer-dark)" {...PART_OUTLINE} />
      </g>
      <path d="M32 34 H168" {...PART_HIGHLIGHT} />
      <rect x={42} y={42} width={116} height={62} rx={6} fill="#C9C7BE" {...PART_OUTLINE} />
      <rect x={42} y={42} width={116} height={20} rx={6} fill="#FFFFFF" fillOpacity={0.45} />
      <path d="M58 94 A42 42 0 0 1 142 94" fill="none" stroke="#5C616D" strokeWidth={1.5} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = Math.PI + (i * Math.PI) / 6;
        return (
          <path
            key={i}
            d={`M${100 + Math.cos(a) * 38} ${94 + Math.sin(a) * 38} L${100 + Math.cos(a) * 32} ${94 + Math.sin(a) * 32}`}
            stroke="#5C616D"
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}
      <g className="art-needle">
        <path d="M100 94 L68 74" stroke="#FF6A3D" strokeWidth={3} strokeLinecap="round" />
      </g>
      <circle cx={100} cy={94} r={5} fill="url(#m-steel)" {...PART_OUTLINE} />
      {/* rotary selector */}
      <circle cx={100} cy={134} r={22} fill="url(#m-steel)" {...PART_OUTLINE} />
      <circle cx={100} cy={134} r={14} fill="#2A2F3D" />
      <path d="M100 134 V122" stroke="#FFB92B" strokeWidth={3} strokeLinecap="round" />
      <path d="M82 124 A22 22 0 0 1 100 112" {...PART_HIGHLIGHT} strokeWidth={2} fill="none" />
      {/* probe jacks with leads */}
      <circle cx={52} cy={140} r={8} fill="#0A0B10" stroke="#5C616D" strokeWidth={2} />
      <circle cx={148} cy={140} r={8} fill="#0A0B10" stroke="#5C616D" strokeWidth={2} />
      <path d="M52 148 C52 170 30 168 26 182" stroke="#1B1E28" strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M148 148 C148 170 170 168 174 182" stroke="#5E1E12" strokeWidth={6} fill="none" strokeLinecap="round" />
      <Screw x={44} y={54} r={4} />
      <Screw x={156} y={54} r={4} />
    </>
  );
}

const ART: Record<Service['id'], () => React.JSX.Element> = {
  emergency: BreakerArt,
  panel: BoardArt,
  wiring: DrumArt,
  lighting: BulbArt,
  appliances: ApplianceArt,
  diagnostics: MeterArt,
};

export interface ServiceArtProps {
  id: Service['id'];
  className?: string;
}

/** Renders one service's dimensional watermark drawing in a 200×200 box. */
export function ServiceArt({ id, className = '' }: ServiceArtProps) {
  const Art = ART[id];
  return (
    <svg
      viewBox="0 0 200 200"
      className={`service-art ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
    >
      <Materials />
      <Art />
    </svg>
  );
}
