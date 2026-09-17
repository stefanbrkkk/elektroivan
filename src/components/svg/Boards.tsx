import { Materials } from './Materials';
import { PART_HIGHLIGHT, PART_OUTLINE } from './part-style';

/**
 * The two dimensional distribution boards compared by the before/after slider
 * (docs/DESIGN.md §3.8). Both share one 900×540 drawing space so the wall,
 * the conduit entry and the enclosure sit at the same place on each side of
 * the wipe. Original illustration, never a photo (docs/BRIEF.md §6.8).
 */

const VIEW = { w: 900, h: 540 } as const;

/** Hatched wall the enclosure is mounted on, identical in both drawings. */
function Wall() {
  return (
    <>
      <rect width={VIEW.w} height={VIEW.h} fill="#0F111A" />
      <rect width={VIEW.w} height={VIEW.h} fill="url(#m-hatch)" opacity={0.28} />
      <rect x={0} y={0} width={VIEW.w} height={VIEW.h} fill="none" stroke="#262B3B" strokeWidth={2} />
    </>
  );
}

/** Screw head: brass disc, slot, top-left highlight. */
function Screw({ x, y, r = 6 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="url(#m-brass)" {...PART_OUTLINE} />
      <path d={`M${x - r * 0.6} ${y} H${x + r * 0.6}`} stroke="#5E4A12" strokeWidth={1.6} strokeLinecap="round" />
      <path d={`M${x - r * 0.5} ${y - r * 0.5} A ${r} ${r} 0 0 1 ${x + r * 0.2} ${y - r * 0.9}`} fill="none" {...PART_HIGHLIGHT} />
    </g>
  );
}

/** Old board: rusted steel box, ceramic screw fuses, cloth wiring, soot. */
export function OldBoard() {
  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <Materials />
      <defs>
        <linearGradient id="ba-rust" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#8C6A4A" />
          <stop offset="0.45" stopColor="#5A4230" />
          <stop offset="1" stopColor="#33251A" />
        </linearGradient>
        <linearGradient id="ba-porcelain" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#F5EFE2" />
          <stop offset="0.55" stopColor="#D8CDB6" />
          <stop offset="1" stopColor="#9C8F76" />
        </linearGradient>
        <linearGradient id="ba-cloth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6E6552" />
          <stop offset="1" stopColor="#3B342A" />
        </linearGradient>
        <radialGradient id="ba-soot" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000000" stopOpacity="0.85" />
          <stop offset="0.6" stopColor="#1A1008" stopOpacity="0.5" />
          <stop offset="1" stopColor="#1A1008" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Wall />

      {/* rusted steel enclosure */}
      <g filter="url(#m-soft-shadow)">
        <rect x={110} y={70} width={680} height={400} rx={6} fill="url(#ba-rust)" {...PART_OUTLINE} />
      </g>
      <rect x={140} y={100} width={620} height={340} rx={4} fill="#1B1309" stroke="#2A1D12" strokeWidth={3} />
      <path d="M112 74 H788" {...PART_HIGHLIGHT} strokeOpacity={0.2} />
      <path d="M118 456 H782" stroke="#000" strokeOpacity={0.5} strokeWidth={4} />
      {/* rust blooms */}
      <ellipse cx={200} cy={430} rx={60} ry={22} fill="#7A4A22" opacity={0.35} />
      <ellipse cx={706} cy={122} rx={44} ry={26} fill="#7A4A22" opacity={0.3} />
      {[
        [136, 96],
        [764, 96],
        [136, 444],
        [764, 444],
      ].map(([x, y]) => (
        <Screw key={`${x}-${y}`} x={x} y={y} r={8} />
      ))}

      {/* ceramic screw (diazed) fuses, three of them */}
      {[248, 448, 648].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={190} r={56} fill="url(#ba-porcelain)" {...PART_OUTLINE} />
          <circle cx={cx} cy={190} r={56} fill="none" stroke="#6E6252" strokeWidth={2} />
          <circle cx={cx} cy={190} r={38} fill="none" stroke="#9C8F76" strokeWidth={5} />
          <circle cx={cx} cy={190} r={20} fill="url(#m-brass)" {...PART_OUTLINE} />
          <circle cx={cx} cy={190} r={8} fill="#B03A1E" {...PART_OUTLINE} />
          {/* glaze highlight */}
          <path d={`M${cx - 40} ${190 - 22} A46 46 0 0 1 ${cx - 4} ${190 - 50}`} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d={`M${cx + 26} ${190 + 38} A46 46 0 0 0 ${cx + 46} ${190 + 8}`} stroke="#000000" strokeOpacity={0.35} strokeWidth={8} fill="none" strokeLinecap="round" />
        </g>
      ))}

      {/* tangled cloth-covered wires */}
      {[
        'M170 300 C260 380 300 262 392 348 S548 274 600 366 700 320 742 388',
        'M170 356 C272 300 318 410 420 362 S556 420 626 350 720 402 742 336',
        'M186 412 C268 452 332 366 430 420 S574 470 660 414 726 448 748 422',
      ].map((d, i) => (
        <g key={d}>
          <path d={d} stroke="#000" strokeOpacity={0.5} strokeWidth={16} fill="none" strokeLinecap="round" />
          <path d={d} stroke="url(#ba-cloth)" strokeWidth={13} fill="none" strokeLinecap="round" />
          <path d={d} stroke="#9A8E75" strokeOpacity={0.35} strokeWidth={2} fill="none" strokeDasharray="6 7" strokeLinecap="round" transform={`translate(0 ${-3 - i * 0})`} />
        </g>
      ))}

      {/* soot smudge from an old fault */}
      <ellipse cx={392} cy={348} rx={120} ry={86} fill="url(#ba-soot)" />
      <ellipse cx={392} cy={342} rx={40} ry={30} fill="#000" opacity={0.7} />

      {/* hand-written label taped to the door */}
      <g transform="rotate(-4 560 132)">
        <rect x={488} y={104} width={150} height={56} rx={2} fill="#D8CDB6" opacity={0.9} {...PART_OUTLINE} />
        <path d="M502 128 c14 -8 22 6 34 -2 s20 8 32 -2 18 6 30 -2" stroke="#4A3B26" strokeWidth={3} fill="none" strokeLinecap="round" />
        <path d="M502 144 c18 -6 28 4 46 -2" stroke="#4A3B26" strokeWidth={3} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

const MCB_LABELS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'];

/** New board: white polymer enclosure, DIN rail, MCBs + RCD, N/PE bars. */
export function NewBoard() {
  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <Materials />
      <Wall />

      {/* white polymer enclosure */}
      <g filter="url(#m-soft-shadow)">
        <rect x={110} y={70} width={680} height={400} rx={14} fill="url(#m-polymer-light)" {...PART_OUTLINE} />
      </g>
      <rect x={134} y={94} width={632} height={352} rx={8} fill="#11131C" stroke="#9A988F" strokeWidth={2} />
      <path d="M114 76 H786" {...PART_HIGHLIGHT} strokeWidth={2} />
      <path d="M118 462 H782" stroke="#000" strokeOpacity={0.35} strokeWidth={5} />
      {[
        [130, 90],
        [770, 90],
        [130, 450],
        [770, 450],
      ].map(([x, y]) => (
        <Screw key={`${x}-${y}`} x={x} y={y} r={8} />
      ))}

      {/* upper DIN rail with eight MCBs */}
      <rect x={152} y={188} width={596} height={26} rx={3} fill="url(#m-steel)" {...PART_OUTLINE} />
      <rect x={152} y={195} width={596} height={12} fill="#0A0B10" opacity={0.25} />
      <path d="M152 190 H748" {...PART_HIGHLIGHT} />
      {MCB_LABELS.map((label, i) => {
        const x = 168 + i * 48;
        return (
          <g key={label}>
            <rect x={x} y={124} width={38} height={90} rx={4} fill="url(#m-polymer-dark)" {...PART_OUTLINE} />
            <path d={`M${x + 1.5} 126 V212`} {...PART_HIGHLIGHT} />
            <path d={`M${x + 36} 130 V212`} stroke="#000" strokeOpacity={0.45} strokeWidth={2.5} />
            <rect x={x + 10} y={146} width={18} height={26} rx={3} fill="url(#m-polymer-light)" {...PART_OUTLINE} />
            <path d={`M${x + 13} 150 H${x + 25}`} {...PART_HIGHLIGHT} />
            <rect x={x + 6} y={128} width={26} height={12} rx={2} fill="#0A0B10" fillOpacity={0.55} />
            <text x={x + 19} y={186} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={11} fill="#C9C7BE">
              16A
            </text>
            {/* printed circuit label under the rail */}
            <rect x={x + 2} y={222} width={34} height={18} rx={2} fill="#F3F1EA" opacity={0.92} />
            <text x={x + 19} y={235} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={11} fill="#151823">
              {label}
            </text>
          </g>
        );
      })}

      {/* lower DIN rail: RCD + N/PE bars */}
      <rect x={152} y={334} width={596} height={26} rx={3} fill="url(#m-steel)" {...PART_OUTLINE} />
      <path d="M152 336 H748" {...PART_HIGHLIGHT} />
      <g>
        <rect x={168} y={272} width={150} height={88} rx={4} fill="url(#m-polymer-dark)" {...PART_OUTLINE} />
        <path d="M169.5 274 V358" {...PART_HIGHLIGHT} />
        <rect x={188} y={294} width={22} height={30} rx={3} fill="url(#m-polymer-light)" {...PART_OUTLINE} />
        <rect x={236} y={294} width={30} height={20} rx={4} fill="#FF6A3D" {...PART_OUTLINE} />
        <text x={251} y={309} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={12} fill="#2A1008">
          T
        </text>
        <text x={251} y={344} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={13} fill="#C9C7BE">
          30 mA
        </text>
        <rect x={172} y={368} width={142} height={18} rx={2} fill="#F3F1EA" opacity={0.92} />
        <text x={243} y={381} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={11} fill="#151823">
          FID 30 mA
        </text>
      </g>
      {/* N and PE terminal bars */}
      {[
        { x: 352, y: 286, color: 'url(#m-ins-blue)', tag: 'N' },
        { x: 352, y: 320, color: 'url(#m-ins-ye-gn)', tag: 'PE' },
      ].map((bar) => (
        <g key={bar.tag}>
          <rect x={bar.x} y={bar.y} width={252} height={24} rx={4} fill={bar.color} {...PART_OUTLINE} />
          <path d={`M${bar.x + 4} ${bar.y + 3} H${bar.x + 246}`} {...PART_HIGHLIGHT} />
          {Array.from({ length: 9 }).map((_, i) => (
            <Screw key={i} x={bar.x + 18 + i * 28} y={bar.y + 12} r={6} />
          ))}
          <text x={bar.x + 232} y={bar.y + 17} fontFamily="var(--font-mono)" fontSize={12} fill="#0A0B10">
            {bar.tag}
          </text>
        </g>
      ))}

      {/* tidy conduits leaving the board */}
      {[0, 1, 2].map((i) => {
        const x = 634 + i * 40;
        return (
          <g key={x}>
            <rect x={x} y={272} width={26} height={120} rx={8} fill="#2A2F3D" {...PART_OUTLINE} />
            <path d={`M${x + 3} 276 V388`} {...PART_HIGHLIGHT} />
            {Array.from({ length: 6 }).map((_, k) => (
              <path key={k} d={`M${x} ${284 + k * 18} h26`} stroke="#0A0B10" strokeOpacity={0.4} strokeWidth={2} />
            ))}
          </g>
        );
      })}

      {/* neat conductor bundle from the RCD to the rail above */}
      <path d="M243 272 V244" stroke="url(#m-ins-brown)" strokeWidth={10} strokeLinecap="round" />
      <path d="M278 272 V252" stroke="url(#m-ins-blue)" strokeWidth={10} strokeLinecap="round" />
    </svg>
  );
}
