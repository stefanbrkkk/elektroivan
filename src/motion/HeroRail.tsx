import { forwardRef } from 'react';
import { Materials } from '../components/svg/Materials';
import { CurrentPath } from './CurrentPath';
import { DinRail, Mcb, Rcd, Screw } from './parts';
import type { CurrentPathHandle } from './types';

/**
 * The hero's big illustration detail (docs/DESIGN.md §3.3): a dimensional
 * DIN-rail group — a B16 miniature circuit breaker next to a 30 mA RCD on a
 * steel top-hat rail, screwed to a hatched back plate, with copper screw
 * terminals, corner marks and a dimension line under it.
 *
 * Drawn 520 user units tall so it renders ~520px at 1440 and scales down
 * with its column on phones. Animated hooks:
 * `[data-part="lever"]` (the MCB toggle, OFF = 26 units down),
 * `[data-part="indicator"]`, `[data-hero-glow]` (the amber wash once ON) and
 * the `CurrentPath` cable leaving the bottom terminal.
 */

/** Cable leaving the MCB's bottom terminal and running off to the left. */
export const HERO_CABLE = 'M 119 398 V 462 Q 119 492 89 492 H 8';

export const HeroRail = forwardRef<CurrentPathHandle, { className?: string }>(function HeroRail(
  { className },
  cableRef
) {
  return (
    <svg
      viewBox="0 0 420 520"
      data-hero-rail=""
      className={className}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <Materials />

      {/* amber wash once the breaker is ON */}
      <ellipse data-hero-glow="" cx="215" cy="255" rx="215" ry="215" fill="url(#m-glow-volt)" opacity="0" />

      {/* back plate: hatched wall of the enclosure */}
      <g opacity="0.85">
        <rect x="26" y="96" width="368" height="300" rx="6" fill="#13151E" stroke="#262B3B" strokeWidth="1.5" />
        <rect x="26" y="96" width="368" height="300" fill="url(#m-hatch)" opacity="0.5" />
        <path d="M 26 97 H 394" stroke="#FFFFFF" strokeOpacity="0.14" strokeWidth="1" />
        <Screw cx={40} cy={110} r={5} angle={18} />
        <Screw cx={380} cy={110} r={5} angle={-32} />
        <Screw cx={40} cy={382} r={5} angle={48} />
        <Screw cx={380} cy={382} r={5} angle={-8} />
      </g>

      {/* corner marks around the mounted group */}
      <g stroke="#8FD8FF" strokeOpacity="0.45" strokeWidth="1.2" fill="none" strokeLinecap="round">
        <path d="M 46 128 v -14 h 14" />
        <path d="M 374 128 v -14 h -14" />
        <path d="M 46 366 v 14 h 14" />
        <path d="M 374 366 v 14 h -14" />
      </g>

      {/* steel rail behind the modules — wide enough to read on both sides */}
      <g transform="translate(210 380)">
        <DinRail width={362} height={28} />
      </g>

      {/* the two modules */}
      <g transform="translate(119 250)">
        {/* own group so the "klak" scale pulse never fights the static scale */}
        <g data-hero-mcb="">
          <g transform="scale(1.35)">
            <Mcb print="B16" />
          </g>
        </g>
      </g>
      <g transform="translate(264 250) scale(1.35)">
        <Rcd print="30 mA" />
      </g>

      {/* dimension line under the group: ticks + rule + mono value */}
      <g stroke="#8FD8FF" strokeOpacity="0.5" strokeWidth="1" fill="none">
        <path d="M 70 398 V 452" />
        <path d="M 361 398 V 452" />
        <path d="M 70 444 H 150 M 281 444 H 361" />
        <path d="M 66 440 l 8 8 M 357 440 l 8 8" />
      </g>
      <text x="215" y="448" className="font-mono" fontSize="13" textAnchor="middle" fill="#8FD8FF">
        2 modula · 36 mm
      </text>

      {/* the cable that carries the first pulse out of the breaker */}
      <CurrentPath ref={cableRef} d={HERO_CABLE} strokeWidth={10} coreWidth={3.2} />
      <g transform="translate(119 398)">
        <rect x="-13" y="-8" width="26" height="16" rx="3" fill="#1B1F2B" stroke="#0A0B10" strokeOpacity="0.6" strokeWidth="1" />
        <Screw cx={0} cy={0} r={4} angle={26} />
      </g>
    </svg>
  );
});
