import type { AnatomyStep } from '../../config/site';

/**
 * Geometry for the exploded installation (docs/DESIGN.md §3.5).
 *
 * One cutaway diorama: distribution enclosure (body + door + DIN rail + MCB +
 * RCD + N/PE bars), a 3-conductor cable run, a Schuko socket in three parts,
 * a wall switch and an E27 lamp holder with its bulb — fourteen parts.
 *
 * Every part is placed with a *static* `translate()` wrapper and animated on
 * an inner group that starts with no transform at all, so "assembled" is
 * literally the identity matrix (that is what `e2e/motion.spec.ts` asserts at
 * the end of the pin). `ex/ey/rot/sc` is the per-part explosion axis, `lx/ly`
 * where its leader line and part number land.
 */
export interface DioramaPart {
  id: string;
  /** 1-based part number printed on the leader label. */
  no: number;
  /** Serbian part name on the leader label (decorative SVG text). */
  name: string;
  /** Assembled centre, in user units. */
  x: number;
  y: number;
  /** Explosion delta along this part's own axis. */
  ex: number;
  ey: number;
  rot: number;
  sc: number;
  /** Leader label anchor point. */
  lx: number;
  ly: number;
  anchor: 'start' | 'end' | 'middle';
  /** Static draw scale (devices) / width (rail, bars) / orientation (cable). */
  draw?: number;
  width?: number;
  orient?: number;
}

export interface DioramaLayout {
  vertical: boolean;
  viewBox: string;
  /** The conductor run every part hangs off. */
  path: string;
  parts: DioramaPart[];
  /** Part focused by each of the five story steps. */
  focus: Record<AnatomyStep['id'], string>;
  /** How far the current has travelled after each step's flow beat. */
  flow: [number, number, number, number, number];
}

const FOCUS: Record<AnatomyStep['id'], string> = {
  breaker: 'mcb',
  rcd: 'rcd',
  cable: 'cable',
  socket: 'socket-insert',
  lamp: 'bulb',
};

const DESKTOP: DioramaPart[] = [
  { id: 'box', no: 1, name: 'Kutija', x: 200, y: 215, ex: -22, ey: 30, rot: -2, sc: 1, lx: 196, ly: 574, anchor: 'start' },
  { id: 'rail', no: 2, name: 'DIN šina', x: 200, y: 175, ex: -10, ey: 150, rot: 0, sc: 1, width: 240, lx: 322, ly: 300, anchor: 'start' },
  { id: 'mcb', no: 3, name: 'Osigurač', x: 137, y: 131, ex: -48, ey: -50, rot: -6, sc: 1, draw: 0.6, lx: 8, ly: 16, anchor: 'start' },
  { id: 'rcd', no: 4, name: 'FID sklopka', x: 217, y: 131, ex: 52, ey: -68, rot: 5, sc: 1, draw: 0.6, lx: 330, ly: 22, anchor: 'start' },
  { id: 'nbar', no: 5, name: 'N letva', x: 200, y: 255, ex: 156, ey: -70, rot: -3, sc: 1, width: 205, lx: 472, ly: 190, anchor: 'start' },
  { id: 'pebar', no: 6, name: 'PE letva', x: 200, y: 295, ex: 156, ey: -20, rot: 3, sc: 1, width: 205, lx: 472, ly: 250, anchor: 'start' },
  { id: 'door', no: 7, name: 'Vrata', x: 200, y: 215, ex: -108, ey: 230, rot: -16, sc: 0.6, lx: 12, ly: 574, anchor: 'start' },
  { id: 'cable', no: 8, name: 'Kabl', x: 430, y: 430, ex: 0, ey: -80, rot: -4, sc: 1, lx: 398, ly: 322, anchor: 'end' },
  { id: 'socket-frame', no: 9, name: 'Ram', x: 580, y: 430, ex: 12, ey: 86, rot: 0, sc: 1, lx: 556, ly: 596, anchor: 'start' },
  { id: 'socket-insert', no: 10, name: 'Mehanizam', x: 580, y: 430, ex: 86, ey: 10, rot: 6, sc: 1, lx: 752, ly: 396, anchor: 'end' },
  { id: 'socket-cover', no: 11, name: 'Maska', x: 580, y: 430, ex: -28, ey: -92, rot: -3, sc: 1.08, lx: 500, ly: 292, anchor: 'end' },
  { id: 'switch', no: 12, name: 'Prekidač', x: 690, y: 430, ex: 24, ey: 92, rot: 8, sc: 1, lx: 752, ly: 600, anchor: 'end' },
  { id: 'holder', no: 13, name: 'Grlo E27', x: 620, y: 120, ex: -62, ey: -44, rot: -8, sc: 1, lx: 600, ly: 26, anchor: 'end' },
  { id: 'bulb', no: 14, name: 'Sijalica', x: 620, y: 185, ex: 58, ey: 64, rot: 10, sc: 1, lx: 752, ly: 158, anchor: 'end' },
];

const PHONE: DioramaPart[] = [
  { id: 'box', no: 1, name: 'Kutija', x: 118, y: 116, ex: -14, ey: 18, rot: -2, sc: 1, lx: 10, ly: 274, anchor: 'start' },
  { id: 'rail', no: 2, name: 'DIN šina', x: 118, y: 100, ex: 4, ey: 46, rot: 0, sc: 1, width: 150, lx: 214, ly: 130, anchor: 'start' },
  { id: 'mcb', no: 3, name: 'Osigurač', x: 86, y: 72, ex: -26, ey: -26, rot: -6, sc: 1, draw: 0.38, lx: 8, ly: 16, anchor: 'start' },
  { id: 'rcd', no: 4, name: 'FID', x: 140, y: 72, ex: 26, ey: -28, rot: 5, sc: 1, draw: 0.38, lx: 196, ly: 22, anchor: 'start' },
  { id: 'nbar', no: 5, name: 'N letva', x: 118, y: 148, ex: -30, ey: 14, rot: -3, sc: 1, width: 138, lx: 214, ly: 162, anchor: 'start' },
  { id: 'pebar', no: 6, name: 'PE letva', x: 118, y: 174, ex: -22, ey: 42, rot: 3, sc: 1, width: 138, lx: 10, ly: 250, anchor: 'start' },
  { id: 'door', no: 7, name: 'Vrata', x: 118, y: 116, ex: -16, ey: -24, rot: -10, sc: 1, lx: 10, ly: 296, anchor: 'start' },
  { id: 'cable', no: 8, name: 'Kabl', x: 224, y: 262, ex: 0, ey: -46, rot: -4, sc: 1, lx: 300, ly: 246, anchor: 'end' },
  { id: 'socket-frame', no: 9, name: 'Ram', x: 258, y: 342, ex: 18, ey: 34, rot: 0, sc: 1, lx: 300, ly: 430, anchor: 'end' },
  { id: 'socket-insert', no: 10, name: 'Mehanizam', x: 258, y: 342, ex: 46, ey: -6, rot: 6, sc: 1, lx: 352, ly: 316, anchor: 'end' },
  { id: 'socket-cover', no: 11, name: 'Maska', x: 258, y: 342, ex: -38, ey: -30, rot: -3, sc: 1.08, lx: 150, ly: 300, anchor: 'end' },
  { id: 'switch', no: 12, name: 'Prekidač', x: 258, y: 420, ex: 26, ey: 18, rot: 8, sc: 1, lx: 352, ly: 466, anchor: 'end' },
  { id: 'holder', no: 13, name: 'Grlo', x: 90, y: 300, ex: -30, ey: -26, rot: -8, sc: 1, lx: 94, ly: 270, anchor: 'start' },
  { id: 'bulb', no: 14, name: 'Sijalica', x: 90, y: 358, ex: -22, ey: 36, rot: 10, sc: 1, lx: 10, ly: 440, anchor: 'start' },
];

/**
 * Desktop hangs the installation on a wall elevation (enclosure top-left,
 * cable run across, socket and switch on the right, pendant above); phones get
 * the same story folded into a portrait column so it still fits the shortened
 * pin at 360×640 without any internal scrolling.
 */
export function getDiorama(vertical: boolean): DioramaLayout {
  if (vertical) {
    return {
      vertical: true,
      viewBox: '0 0 360 470',
      path: 'M 140 107 V 136 H 190 V 262 H 262 V 420 H 165 V 300 H 97',
      parts: PHONE,
      focus: FOCUS,
      flow: [0.08, 0.16, 0.4, 0.58, 0.86],
    };
  }

  return {
    vertical: false,
    viewBox: '0 0 760 620',
    path: 'M 217 189 V 223 H 320 V 430 H 690 V 90 H 620 V 118',
    parts: DESKTOP,
    focus: FOCUS,
    flow: [0.08, 0.17, 0.42, 0.6, 0.86],
  };
}

export const PART_COUNT = DESKTOP.length;
