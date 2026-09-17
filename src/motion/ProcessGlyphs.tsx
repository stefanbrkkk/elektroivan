import { Materials } from '../components/svg/Materials';
import { PART_OUTLINE } from '../components/svg/part-style';
import { Screw } from './parts';

const O = PART_OUTLINE;

/**
 * Four dimensional glyphs for "Kako radim" (docs/DESIGN.md §3.7) — message,
 * multimeter, screwdriver and a protected bulb. Same technique as every other
 * part on the page: material gradient, near-black outline, top-left highlight,
 * bottom-right shade, real screw heads. Decorative only.
 */
/**
 * The gradients the four glyphs share. SVG `url(#id)` references resolve
 * document-wide, so one copy per section is enough — rendering `<Materials />`
 * inside every glyph would put the same 20 defs in the DOM four times over.
 */
export function ProcessGlyphDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <Materials />
    </svg>
  );
}

export function ProcessGlyph({ index, className }: { index: number; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      {index === 0 ? <Message /> : null}
      {index === 1 ? <Multimeter /> : null}
      {index === 2 ? <Screwdriver /> : null}
      {index === 3 ? <Guarantee /> : null}
    </svg>
  );
}

function Message() {
  return (
    <g>
      <rect x="14" y="26" width="92" height="62" rx="8" fill="url(#m-polymer-dark)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={O.strokeWidth} />
      <path d="M 20 30 H 100 M 17 32 V 82" fill="none" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1.2} strokeLinecap="round" />
      <path d="M 103 32 V 82 M 20 85 H 100" fill="none" stroke="#000000" strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" />
      <path d="M 18 30 L 60 60 L 102 30" fill="none" stroke="#8FD8FF" strokeOpacity={0.7} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M 54 88 L 44 104 L 70 90 Z" fill="url(#m-polymer-dark)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={1} />
      <path d="M 62 44 l -9 14 h 8 l -5 12 13 -16 h -8 l 6 -10 z" fill="url(#m-copper)" stroke="#0A0B10" strokeOpacity={0.5} strokeWidth={1} />
      <Screw cx={24} cy={80} r={4} angle={24} />
      <Screw cx={96} cy={80} r={4} angle={-30} />
    </g>
  );
}

function Multimeter() {
  return (
    <g>
      <rect x="22" y="14" width="76" height="92" rx="9" fill="url(#m-polymer-dark)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={O.strokeWidth} />
      <path d="M 28 17 H 92 M 25 20 V 100" fill="none" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1.2} strokeLinecap="round" />
      <path d="M 95 20 V 100 M 28 103 H 92" fill="none" stroke="#000000" strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" />
      {/* display */}
      <rect x="32" y="24" width="56" height="26" rx="3" fill="#0A1A18" stroke="#0A0B10" strokeOpacity={0.6} strokeWidth={1} />
      <text x="82" y="44" className="font-mono" fontSize="16" textAnchor="end" fill="#8FD8FF">
        230
      </text>
      <text x="36" y="44" className="font-mono" fontSize="10" fill="#3FA34D">
        V~
      </text>
      {/* rotary dial */}
      <circle cx="60" cy="74" r="18" fill="url(#m-steel)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={1} />
      <circle cx="60" cy="74" r="12" fill="#22262F" />
      <path d="M 60 74 L 70 66" stroke="#FFB92B" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="74" r="3" fill="#8A8F9C" />
      {/* probe sockets */}
      <circle cx="38" cy="97" r="4.5" fill="#07080C" stroke="#8A8F9C" strokeWidth="1.2" />
      <circle cx="82" cy="97" r="4.5" fill="#07080C" stroke="#8A8F9C" strokeWidth="1.2" />
      <path d="M 38 101 C 30 112 18 108 12 100" fill="none" stroke="#FF6A3D" strokeWidth="3" strokeLinecap="round" />
      <path d="M 82 101 C 92 112 104 108 110 100" fill="none" stroke="#2A2F3D" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function Screwdriver() {
  return (
    <g transform="rotate(-38 60 60)">
      {/* handle */}
      <rect x="40" y="10" width="40" height="46" rx="12" fill="url(#m-polymer-dark)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth={O.strokeWidth} />
      <path d="M 46 14 V 52" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth="2" strokeLinecap="round" />
      <path d="M 74 14 V 52" stroke="#000000" strokeOpacity={0.4} strokeWidth="3" strokeLinecap="round" />
      <path d="M 56 12 V 54 M 64 12 V 54" stroke="#0A0B10" strokeOpacity={0.35} strokeWidth="1.4" />
      {/* collar */}
      <rect x="44" y="56" width="32" height="10" rx="3" fill="url(#m-brass)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth="1" />
      {/* shaft */}
      <rect x="52" y="66" width="16" height="36" rx="2" fill="url(#m-steel)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth="1" />
      <path d="M 55 68 V 100" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 52 102 h 16 l -3 8 h -10 z" fill="url(#m-steel)" stroke={O.stroke} strokeOpacity={O.strokeOpacity} strokeWidth="1" />
    </g>
  );
}

function Guarantee() {
  return (
    <g>
      <path
        d="M 60 10 L 100 24 V 60 c 0 24 -18 40 -40 50 c -22 -10 -40 -26 -40 -50 V 24 Z"
        fill="url(#m-polymer-dark)"
        stroke={O.stroke}
        strokeOpacity={O.strokeOpacity}
        strokeWidth={O.strokeWidth}
      />
      <path d="M 60 14 L 96 27 V 59" fill="none" stroke="#FFFFFF" strokeOpacity={0.28} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 24 59 V 27 L 60 14" fill="none" stroke="#000000" strokeOpacity={0.4} strokeWidth="3" strokeLinecap="round" />
      <path d="M 24 60 c 0 22 16 36 36 45" fill="none" stroke="#000000" strokeOpacity={0.35} strokeWidth="3" strokeLinecap="round" />
      {/* bulb inside the shield */}
      <path d="M 50 62 a 10 10 0 1 1 20 0 c 0 4 -2 6 -3 8 v 4 h -14 v -4 c -1 -2 -3 -4 -3 -8 Z" fill="none" stroke="#8FD8FF" strokeOpacity={0.7} strokeWidth="2" />
      <path d="M 54 78 h 12 M 55 82 h 10" stroke="#8FD8FF" strokeOpacity={0.7} strokeWidth="2" strokeLinecap="round" />
      <path d="M 56 66 c 0 -4 2 -5 2 -7 s -1 -3 2 -3 s 2 2 2 3 s 2 3 2 7" fill="none" stroke="#FFD36A" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="60" cy="63" r="11" fill="url(#m-glow-volt)" opacity="0.8" />
      <Screw cx={36} cy={34} r={4} angle={20} />
      <Screw cx={84} cy={34} r={4} angle={-26} />
    </g>
  );
}
