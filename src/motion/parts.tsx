import type { ReactNode, SVGProps } from 'react';
import { PART_HIGHLIGHT, PART_OUTLINE } from '../components/svg/part-style';

/**
 * Dimensional electrical parts, drawn once and shared by the hero DIN-rail
 * group, the anatomy diorama and the finale (docs/DESIGN.md §2/§3).
 *
 * Technique (the same one Mile's copper elbow uses): a material gradient from
 * `Materials` for the body, a 1.25px near-black outline, a 1px top-left
 * highlight at 35% white, a bottom-right shade band, and real screw heads.
 * Nothing here is a plain flat rectangle.
 *
 * Every part is drawn around its own origin `(0, 0)` so a caller can place it
 * with a static `translate()` wrapper and animate the inner group from zero —
 * that is what lets the anatomy assert "all transforms back to identity".
 *
 * All text is a printed marking on a component (`B16`, `30 mA`, `I`/`0`), not
 * site copy: the SVGs are `aria-hidden`, and `src/config/site.ts` is frozen.
 */

const OUTLINE = PART_OUTLINE;
const HIGHLIGHT = PART_HIGHLIGHT;

/** Slotted steel screw head with a rim highlight. */
export function Screw({ cx = 0, cy = 0, r = 4.5, angle = 22 }: { cx?: number; cy?: number; r?: number; angle?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${angle})`}>
      <circle r={r} fill="url(#m-steel)" stroke={OUTLINE.stroke} strokeOpacity={OUTLINE.strokeOpacity} strokeWidth={1} />
      <path
        d={`M ${-r * 0.62} 0 H ${r * 0.62}`}
        stroke="#0A0B10"
        strokeOpacity={0.8}
        strokeWidth={Math.max(1, r * 0.34)}
        strokeLinecap="round"
      />
      <path
        d={`M ${-r * 0.7} ${-r * 0.35} A ${r * 0.82} ${r * 0.82} 0 0 1 ${r * 0.1} ${-r * 0.8}`}
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.45}
        strokeWidth={0.9}
        strokeLinecap="round"
      />
    </g>
  );
}

/** Recessed copper screw terminal: dark cavity, copper clamp, screw on top. */
export function Terminal({
  cx = 0,
  cy = 0,
  w = 30,
  h = 24,
  screw = true,
}: {
  cx?: number;
  cy?: number;
  w?: number;
  h?: number;
  screw?: boolean;
}) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={2} fill="#07080C" />
      <rect x={-w / 2 + 3} y={-h / 2 + 3} width={w - 6} height={h - 6} rx={1.5} fill="url(#m-copper)" />
      <path
        d={`M ${-w / 2 + 3} ${-h / 2 + 3.6} h ${w - 6}`}
        stroke="#FFFFFF"
        strokeOpacity={0.4}
        strokeWidth={1}
        strokeLinecap="round"
      />
      {screw ? <Screw cx={0} cy={0} r={Math.min(h, w) * 0.3} /> : null}
    </g>
  );
}

/** Top-left light edge + bottom-right shade band for a rounded body. */
function BodyShading({ x, y, w, h, r = 4 }: { x: number; y: number; w: number; h: number; r?: number }) {
  return (
    <g pointerEvents="none">
      <path
        d={`M ${x + r} ${y + 0.8} H ${x + w - r} M ${x + 0.8} ${y + r} V ${y + h - r}`}
        fill="none"
        stroke={HIGHLIGHT.stroke}
        strokeOpacity={HIGHLIGHT.strokeOpacity}
        strokeWidth={HIGHLIGHT.strokeWidth}
        strokeLinecap="round"
      />
      <path
        d={`M ${x + w - 3} ${y + r} V ${y + h - r} M ${x + r} ${y + h - 2} H ${x + w - r}`}
        fill="none"
        stroke="#000000"
        strokeOpacity={0.4}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </g>
  );
}

interface DeviceProps {
  /** Scale applied around the part origin. */
  scale?: number;
  children?: ReactNode;
}

/**
 * Miniature circuit breaker, 1 module. Canonical box: 72 × 190 around (0,0).
 * `data-part="lever"` is the white toggle (OFF = pushed down by 26 units),
 * `data-part="flash"` the short-circuit flash, `data-part="indicator"` the
 * small ON window.
 */
export function Mcb({ scale = 1, print = 'B16' }: DeviceProps & { print?: string }) {
  const w = 72;
  const h = 190;
  return (
    <g transform={scale === 1 ? undefined : `scale(${scale})`}>
      {/* rail clip behind the body */}
      <rect x={-30} y={h / 2 - 16} width={60} height={22} rx={3} fill="#1B1F2B" stroke={OUTLINE.stroke} strokeOpacity={0.5} strokeWidth={1} />

      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={5} fill="url(#m-polymer-dark)" stroke={OUTLINE.stroke} strokeOpacity={OUTLINE.strokeOpacity} strokeWidth={OUTLINE.strokeWidth} />
      {/* stepped front face */}
      <rect x={-w / 2 + 6} y={-58} width={w - 12} height={116} rx={3} fill="#333A4C" />
      <rect x={-w / 2 + 6} y={-58} width={w - 12} height={116} rx={3} fill="none" stroke="#0A0B10" strokeOpacity={0.45} strokeWidth={1} />
      <BodyShading x={-w / 2} y={-h / 2} w={w} h={h} r={5} />

      {/* terminals */}
      <Terminal cx={0} cy={-h / 2 + 15} w={40} h={26} />
      <Terminal cx={0} cy={h / 2 - 15} w={40} h={26} />

      {/* lever slot + white lever */}
      <rect x={-13} y={-50} width={26} height={52} rx={3} fill="#07080C" />
      <g data-part="lever">
        <rect x={-10} y={-46} width={20} height={38} rx={3} fill="url(#m-polymer-light)" stroke={OUTLINE.stroke} strokeOpacity={OUTLINE.strokeOpacity} strokeWidth={1} />
        <path d="M -6 -40 h 12 M -6 -34 h 12" stroke="#8A8F9C" strokeOpacity={0.8} strokeWidth={1.4} strokeLinecap="round" />
        <path d="M -8.5 -44 v 30" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.2} strokeLinecap="round" />
      </g>
      <text x={20} y={-42} className="font-mono" fontSize={11} fill="#9AA0B4">
        I
      </text>
      <text x={20} y={0} className="font-mono" fontSize={11} fill="#9AA0B4">
        0
      </text>

      {/* printed rating */}
      <text x={0} y={22} className="font-mono" fontSize={15} fontWeight={600} textAnchor="middle" fill="#E6E4DC">
        {print}
      </text>
      <path d="M -22 32 h 44" stroke="#8FD8FF" strokeOpacity={0.3} strokeWidth={1} />
      <text x={0} y={46} className="font-mono" fontSize={9} textAnchor="middle" fill="#9AA0B4">
        6kA
      </text>

      {/* ON window */}
      <rect data-part="indicator" x={-9} y={52} width={18} height={7} rx={3.5} fill="#FFB92B" opacity={0} />
      <rect x={-9} y={52} width={18} height={7} rx={3.5} fill="none" stroke="#0A0B10" strokeOpacity={0.6} strokeWidth={1} />

      <rect data-part="flash" x={-w / 2} y={-h / 2} width={w} height={h} rx={5} fill="#FFD36A" opacity={0} />
    </g>
  );
}

/**
 * Residual-current device, 2 modules. Canonical box: 144 × 190 around (0,0).
 * `data-part="lever"`, `data-part="test"` (the test button), and two status
 * windows: `data-part="indicator"` (tripped, fault colour) and
 * `data-part="ok"`.
 */
export function Rcd({ scale = 1, print = '30 mA' }: DeviceProps & { print?: string }) {
  const w = 144;
  const h = 190;
  return (
    <g transform={scale === 1 ? undefined : `scale(${scale})`}>
      <rect x={-60} y={h / 2 - 16} width={120} height={22} rx={3} fill="#1B1F2B" stroke={OUTLINE.stroke} strokeOpacity={0.5} strokeWidth={1} />

      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={5} fill="url(#m-polymer-dark)" stroke={OUTLINE.stroke} strokeOpacity={OUTLINE.strokeOpacity} strokeWidth={OUTLINE.strokeWidth} />
      <rect x={-w / 2 + 6} y={-58} width={w - 12} height={116} rx={3} fill="#333A4C" />
      <rect x={-w / 2 + 6} y={-58} width={w - 12} height={116} rx={3} fill="none" stroke="#0A0B10" strokeOpacity={0.45} strokeWidth={1} />
      {/* module seam */}
      <path d={`M 0 ${-h / 2 + 4} V ${h / 2 - 4}`} stroke="#0A0B10" strokeOpacity={0.5} strokeWidth={1.4} />
      <BodyShading x={-w / 2} y={-h / 2} w={w} h={h} r={5} />

      <Terminal cx={-36} cy={-h / 2 + 15} w={40} h={26} />
      <Terminal cx={36} cy={-h / 2 + 15} w={40} h={26} />
      <Terminal cx={-36} cy={h / 2 - 15} w={40} h={26} />
      <Terminal cx={36} cy={h / 2 - 15} w={40} h={26} />

      <rect x={-49} y={-50} width={26} height={52} rx={3} fill="#07080C" />
      <g data-part="lever">
        <rect x={-46} y={-46} width={20} height={38} rx={3} fill="url(#m-polymer-light)" stroke={OUTLINE.stroke} strokeOpacity={OUTLINE.strokeOpacity} strokeWidth={1} />
        <path d="M -42 -40 h 12 M -42 -34 h 12" stroke="#8A8F9C" strokeOpacity={0.8} strokeWidth={1.4} strokeLinecap="round" />
        <path d="M -44.5 -44 v 30" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.2} strokeLinecap="round" />
      </g>

      {/* test button */}
      <circle cx={30} cy={-28} r={17} fill="#07080C" />
      <g data-part="test">
        <circle cx={30} cy={-28} r={14} fill="url(#m-polymer-light)" stroke={OUTLINE.stroke} strokeOpacity={OUTLINE.strokeOpacity} strokeWidth={1} />
        <path d="M 20 -36 A 14 14 0 0 1 32 -41" fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1.4} strokeLinecap="round" />
        <text x={30} y={-23} className="font-mono" fontSize={13} fontWeight={700} textAnchor="middle" fill="#3A3F4E">
          T
        </text>
      </g>

      <text x={0} y={22} className="font-mono" fontSize={16} fontWeight={600} textAnchor="middle" fill="#E6E4DC">
        {print}
      </text>
      <path d="M -34 32 h 68" stroke="#8FD8FF" strokeOpacity={0.3} strokeWidth={1} />
      <text x={0} y={46} className="font-mono" fontSize={9} textAnchor="middle" fill="#9AA0B4">
        FID 40A
      </text>

      <rect data-part="indicator" x={-11} y={52} width={22} height={8} rx={4} fill="#FF6A3D" opacity={0} />
      <rect data-part="ok" x={-11} y={52} width={22} height={8} rx={4} fill="#8FD8FF" opacity={0} />
      <rect x={-11} y={52} width={22} height={8} rx={4} fill="none" stroke="#0A0B10" strokeOpacity={0.6} strokeWidth={1} />
    </g>
  );
}

/**
 * Steel top-hat DIN rail, drawn horizontally around (0,0): a slotted web with
 * two folded lips catching the light on their upper edge.
 */
export function DinRail({ width = 300, height = 26 }: { width?: number; height?: number }) {
  const hw = width / 2;
  const hh = height / 2;
  const slots = Math.max(2, Math.floor(width / 42));
  return (
    <g>
      <rect x={-hw} y={-hh} width={width} height={height} rx={2} fill="url(#m-steel)" stroke={OUTLINE.stroke} strokeOpacity={OUTLINE.strokeOpacity} strokeWidth={OUTLINE.strokeWidth} />
      {/* recessed web between the two lips */}
      <rect x={-hw + 2} y={-hh + 6} width={width - 4} height={height - 12} fill="#5C616D" />
      <path d={`M ${-hw} ${-hh + 1} H ${hw}`} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={1.4} />
      <path d={`M ${-hw} ${hh - 1.2} H ${hw}`} stroke="#000000" strokeOpacity={0.45} strokeWidth={2} />
      {Array.from({ length: slots }, (_, index) => {
        const x = -hw + 21 + (index * (width - 42)) / Math.max(1, slots - 1);
        return <rect key={index} x={x - 7} y={-2.5} width={14} height={5} rx={2.5} fill="#22262F" />;
      })}
    </g>
  );
}

/**
 * N or PE terminal bar: a polymer body with a row of copper screw terminals.
 * `tone` picks the conductor colour band (blue for N, yellow/green for PE).
 */
export function TerminalBar({
  width = 220,
  tone = 'n',
}: {
  width?: number;
  tone?: 'n' | 'pe';
}) {
  const hw = width / 2;
  const ports = Math.max(3, Math.floor(width / 34));
  return (
    <g>
      <rect x={-hw} y={-15} width={width} height={30} rx={4} fill="url(#m-polymer-dark)" stroke={OUTLINE.stroke} strokeOpacity={OUTLINE.strokeOpacity} strokeWidth={OUTLINE.strokeWidth} />
      <rect
        x={-hw + 3}
        y={-12}
        width={width - 6}
        height={7}
        rx={3}
        fill={tone === 'n' ? 'url(#m-ins-blue)' : 'url(#m-ins-ye-gn)'}
      />
      <BodyShading x={-hw} y={-15} w={width} h={30} r={4} />
      {Array.from({ length: ports }, (_, index) => {
        const x = -hw + 17 + (index * (width - 34)) / Math.max(1, ports - 1);
        return (
          <g key={index}>
            <rect x={x - 9} y={-2} width={18} height={15} rx={2} fill="#07080C" />
            <rect x={x - 6} y={1} width={12} height={9} rx={1.5} fill="url(#m-copper)" />
            <Screw cx={x} cy={5.5} r={4} angle={index % 2 ? 30 : -18} />
          </g>
        );
      })}
    </g>
  );
}

/**
 * Cable clip (obujmica) with a fixing screw — used at every bend of the main
 * line and along the diorama's cable run.
 */
export function CableClip({ width = 22, height = 13 }: { width?: number; height?: number }) {
  return (
    <g>
      <rect x={-width / 2} y={-height / 2} width={width} height={height} rx={3} fill="url(#m-polymer-dark)" stroke={OUTLINE.stroke} strokeOpacity={OUTLINE.strokeOpacity} strokeWidth={1} />
      <path d={`M ${-width / 2 + 2} ${-height / 2 + 1.2} H ${width / 2 - 2}`} stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1} strokeLinecap="round" />
      <Screw cx={0} cy={0} r={3.4} angle={35} />
    </g>
  );
}

/** Leader line + part number, drawn in with DrawSVG on the explode beat. */
export function Leader({
  d,
  label,
  number,
  x,
  y,
  anchor = 'start',
  ...rest
}: {
  d: string;
  label: string;
  number: string;
  x: number;
  y: number;
  anchor?: 'start' | 'end' | 'middle';
} & SVGProps<SVGGElement>) {
  return (
    <g {...rest}>
      <path
        data-leader-line=""
        d={d}
        fill="none"
        stroke="#8FD8FF"
        strokeOpacity={0.55}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <g data-leader-label="" opacity={0}>
        <text x={x} y={y} className="font-mono" fontSize={12} fontWeight={600} textAnchor={anchor} fill="#8FD8FF">
          {number}
        </text>
        <text x={anchor === 'end' ? x - 20 : x + 20} y={y} className="font-mono" fontSize={11} textAnchor={anchor} fill="#9AA0B4">
          {label}
        </text>
      </g>
    </g>
  );
}
