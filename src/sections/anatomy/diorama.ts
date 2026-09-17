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
 * the end of the pin). `ex/ey/rot/sc` is the per-part explosion axis; the
 * leader lines and part numbers are *computed* from those axes and the part
 * body sizes by `placeLabels()` below — hand-placed anchors collided with the
 * parts and with each other as soon as the composition moved.
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
  /** Drawn body size in user units (already scaled), for label avoidance. */
  bw: number;
  bh: number;
  /**
   * A large, flat, dark body (the enclosure and its door) that a callout may
   * sit on top of — arc text reads perfectly against the hatched cavity, and
   * treating them as hard obstacles walls off a third of the drawing.
   */
  soft?: boolean;
  /** Static draw scale (devices) / width (rail, bars) / orientation (cable). */
  draw?: number;
  width?: number;
  orient?: number;
}

export interface DioramaLayout {
  vertical: boolean;
  viewBox: string;
  /** viewBox width/height, parsed once. */
  vw: number;
  vh: number;
  /** The conductor run every part hangs off. */
  path: string;
  parts: DioramaPart[];
  /** Part focused by each of the five story steps. */
  focus: Record<AnatomyStep['id'], string>;
  /** How far the current has travelled after each step's flow beat. */
  flow: [number, number, number, number, number];
  /** Font size for the leader labels, in user units. */
  labelSize: number;
  /** Leader labels show the part name as well as its number. */
  labelNames: boolean;
  /**
   * Parts that get a callout at all. Phones only label the five the story is
   * about — fourteen bare numbers beside a 326px drawing carry no meaning
   * (review-3 minor 4).
   */
  labelIds?: string[];
}

const FOCUS: Record<AnatomyStep['id'], string> = {
  breaker: 'mcb',
  rcd: 'rcd',
  cable: 'cable',
  socket: 'socket-insert',
  lamp: 'bulb',
};

/* --------------------------------------------------------------- desktop --
 * viewBox 764 × 474 hugs the *assembled* installation (it fills ~90 % of the
 * width and ~82 % of the height), so the drawing renders as large as the stage
 * column allows, with a thin ring left over for the callouts. Every exploded position below is checked to stay inside that
 * same box — the stage SVG clips at its viewport, and letting parts spill would
 * push the page wider than the viewport on small screens. */
const DESKTOP: DioramaPart[] = [
  { id: 'box', no: 1, name: 'Kutija', x: 185, y: 180, ex: -40, ey: -10, rot: -2, sc: 1, bw: 280, bh: 300, soft: true },
  { id: 'rail', no: 2, name: 'DIN šina', x: 185, y: 140, ex: -28, ey: 106, rot: 0, sc: 1, width: 240, bw: 240, bh: 26 },
  { id: 'mcb', no: 3, name: 'Osigurač', x: 122, y: 96, ex: -54, ey: -36, rot: -6, sc: 1, draw: 0.6, bw: 43, bh: 114 },
  { id: 'rcd', no: 4, name: 'FID sklopka', x: 202, y: 96, ex: 56, ey: -38, rot: 5, sc: 1, draw: 0.6, bw: 86, bh: 114 },
  { id: 'nbar', no: 5, name: 'N letva', x: 185, y: 220, ex: 184, ey: -58, rot: -3, sc: 1, width: 205, bw: 205, bh: 30 },
  { id: 'pebar', no: 6, name: 'PE letva', x: 185, y: 260, ex: 214, ey: -14, rot: 3, sc: 1, width: 205, bw: 205, bh: 30 },
  { id: 'door', no: 7, name: 'Vrata', x: 185, y: 180, ex: -105, ey: 200, rot: -16, sc: 0.5, bw: 290, bh: 310, soft: true },
  { id: 'cable', no: 8, name: 'Kabl', x: 420, y: 368, ex: 0, ey: -78, rot: -4, sc: 1, bw: 170, bh: 26 },
  { id: 'socket-frame', no: 9, name: 'Ram', x: 570, y: 368, ex: 8, ey: 36, rot: 0, sc: 1, bw: 100, bh: 100 },
  { id: 'socket-insert', no: 10, name: 'Mehanizam', x: 570, y: 368, ex: 96, ey: -34, rot: 6, sc: 1, bw: 94, bh: 66 },
  { id: 'socket-cover', no: 11, name: 'Maska', x: 570, y: 368, ex: -12, ey: -92, rot: -3, sc: 1.08, bw: 84, bh: 84 },
  { id: 'switch', no: 12, name: 'Prekidač', x: 690, y: 368, ex: 8, ey: 42, rot: 8, sc: 1, bw: 80, bh: 80 },
  { id: 'holder', no: 13, name: 'Grlo E27', x: 620, y: 86, ex: -70, ey: -30, rot: -8, sc: 1, bw: 44, bh: 70 },
  { id: 'bulb', no: 14, name: 'Sijalica', x: 620, y: 148, ex: 66, ey: 72, rot: 10, sc: 1, bw: 58, bh: 78 },
];

const PHONE: DioramaPart[] = [
  { id: 'box', no: 1, name: 'Kutija', x: 118, y: 116, ex: -14, ey: 18, rot: -2, sc: 1, bw: 174, bh: 186, soft: true },
  { id: 'rail', no: 2, name: 'DIN šina', x: 118, y: 100, ex: 4, ey: 46, rot: 0, sc: 1, width: 150, bw: 150, bh: 16 },
  { id: 'mcb', no: 3, name: 'Osigurač', x: 86, y: 72, ex: -26, ey: -26, rot: -6, sc: 1, draw: 0.38, bw: 27, bh: 72 },
  { id: 'rcd', no: 4, name: 'FID', x: 140, y: 72, ex: 26, ey: -28, rot: 5, sc: 1, draw: 0.38, bw: 55, bh: 72 },
  { id: 'nbar', no: 5, name: 'N letva', x: 118, y: 148, ex: -30, ey: 14, rot: -3, sc: 1, width: 138, bw: 138, bh: 19 },
  { id: 'pebar', no: 6, name: 'PE letva', x: 118, y: 174, ex: -22, ey: 42, rot: 3, sc: 1, width: 138, bw: 138, bh: 19 },
  { id: 'door', no: 7, name: 'Vrata', x: 118, y: 116, ex: -16, ey: -24, rot: -10, sc: 1, bw: 180, bh: 192, soft: true },
  { id: 'cable', no: 8, name: 'Kabl', x: 224, y: 262, ex: 0, ey: -46, rot: -4, sc: 1, bw: 105, bh: 16 },
  { id: 'socket-frame', no: 9, name: 'Ram', x: 258, y: 342, ex: 18, ey: 34, rot: 0, sc: 1, bw: 62, bh: 62 },
  { id: 'socket-insert', no: 10, name: 'Mehanizam', x: 258, y: 342, ex: 46, ey: -6, rot: 6, sc: 1, bw: 58, bh: 41 },
  { id: 'socket-cover', no: 11, name: 'Maska', x: 258, y: 342, ex: -38, ey: -30, rot: -3, sc: 1.08, bw: 52, bh: 52 },
  { id: 'switch', no: 12, name: 'Prekidač', x: 258, y: 420, ex: 26, ey: 18, rot: 8, sc: 1, bw: 50, bh: 50 },
  { id: 'holder', no: 13, name: 'Grlo', x: 90, y: 300, ex: -30, ey: -26, rot: -8, sc: 1, bw: 27, bh: 43 },
  { id: 'bulb', no: 14, name: 'Sijalica', x: 90, y: 358, ex: -22, ey: 36, rot: 10, sc: 1, bw: 36, bh: 48 },
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
      vw: 360,
      vh: 470,
      path: 'M 140 107 V 136 H 190 V 262 H 262 V 420 H 165 V 300 H 97',
      parts: PHONE,
      focus: FOCUS,
      flow: [0.08, 0.16, 0.4, 0.58, 0.86],
      labelSize: 11,
      labelNames: true,
      // the five parts the five steps are about
      labelIds: ['mcb', 'rcd', 'cable', 'socket-insert', 'bulb'],
    };
  }

  return {
    vertical: false,
    viewBox: '0 0 764 474',
    vw: 764,
    vh: 474,
    path: 'M 202 154 V 188 H 305 V 368 H 690 V 56 H 620 V 84',
    parts: DESKTOP,
    focus: FOCUS,
    flow: [0.08, 0.17, 0.42, 0.6, 0.86],
    labelSize: 14,
    labelNames: true,
  };
}

export const PART_COUNT = DESKTOP.length;

/* ------------------------------------------------------------- callouts -- */

export interface PlacedLabel {
  id: string;
  no: number;
  text: string;
  number: string;
  name: string;
  /** Text anchor point. */
  lx: number;
  ly: number;
  anchor: 'start' | 'end';
  /** Where the leader line touches the part. */
  sx: number;
  sy: number;
  /** Control point of the leader's arc. */
  cx: number;
  cy: number;
  /** Underline length (signed, in the reading direction). */
  rule: number;
  /** Rendered text width, for the backing tag. */
  width: number;
}

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Clearance a label keeps from any drawn part, in user units. */
const PART_CLEARANCE = 13;
/** Box height reserved per label — gives ≥20 units between two labels. */
const LABEL_BAND = 20;
/** Mono advance width as a fraction of the font size (JetBrains Mono ≈ 0.6). */
const MONO_ADVANCE = 0.6;

function overlaps(a: Rect, b: Rect): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

function inflate(rect: Rect, by: number): Rect {
  return { x0: rect.x0 - by, y0: rect.y0 - by, x1: rect.x1 + by, y1: rect.y1 + by };
}

/**
 * Greedy collision pass over the callouts.
 *
 * Each label is pushed **outward from the diorama's centre along its own part's
 * explode axis** and then walked further out (and sideways) until its box
 * clears every part body by `PART_CLEARANCE` and every already-placed label by
 * a full `LABEL_BAND`. The leader is then drawn from the label back to the
 * nearest point on that part's own box, so it always points at the part rather
 * than at its centre through other parts.
 *
 * Pure and deterministic — same result during prerender and after hydration,
 * and it costs no DOM reads (the body sizes are declared above).
 */
export function placeLabels(layout: DioramaLayout): PlacedLabel[] {
  const { parts, vw, vh, labelSize: size, labelNames, labelIds } = layout;

  const boxes: Rect[] = parts.map((p) => {
    const hw = (p.bw * p.sc) / 2 + 4;
    const hh = (p.bh * p.sc) / 2 + 4;
    const cx = p.x + p.ex;
    const cy = p.y + p.ey;
    return { x0: cx - hw, y0: cy - hh, x1: cx + hw, y1: cy + hh };
  });

  const centre = {
    x: parts.reduce((sum, p) => sum + p.x, 0) / parts.length,
    y: parts.reduce((sum, p) => sum + p.y, 0) / parts.length,
  };

  const placed: Rect[] = [];
  const out: PlacedLabel[] = [];

  // Sixteen directions, so a callout can slip into the gap *between* two
  // exploded parts instead of only straight outward.
  const DIRECTIONS = 16;
  const DISTANCES = [14, 28, 44, 62, 82, 104, 130];

  parts.forEach((p, index) => {
    if (labelIds && !labelIds.includes(p.id)) return;
    const number = String(p.no).padStart(2, '0');
    const name = labelNames ? p.name : '';
    const text = labelNames ? `${number} ${name}` : number;
    const textW = text.length * size * MONO_ADVANCE + 4;

    const box = boxes[index];
    const cx = (box.x0 + box.x1) / 2;
    const cy = (box.y0 + box.y1) / 2;

    let ox = cx - centre.x;
    let oy = cy - centre.y;
    if (Math.abs(ox) < 1 && Math.abs(oy) < 1) {
      ox = p.ex;
      oy = p.ey;
    }
    const outward = Math.atan2(oy, ox) || 0;

    const hw = (box.x1 - box.x0) / 2;
    const hh = (box.y1 - box.y0) / 2;

    const rectFor = (ax: number, ay: number, anchor: 'start' | 'end'): Rect => ({
      x0: anchor === 'start' ? ax : ax - textW,
      y0: ay - size * 0.82,
      x1: anchor === 'start' ? ax + textW : ax,
      y1: ay - size * 0.82 + LABEL_BAND,
    });

    // Candidates ordered by distance first, then by how far the direction has
    // swung away from "straight out from the middle of the diorama".
    const candidates: { x: number; y: number; anchor: 'start' | 'end'; rank: number }[] = [];
    DISTANCES.forEach((gap, distanceIndex) => {
      for (let step = 0; step < DIRECTIONS; step += 1) {
        const swing = Math.ceil(step / 2) * (step % 2 === 1 ? 1 : -1);
        const angle = outward + (swing * 2 * Math.PI) / DIRECTIONS;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        const reach = Math.min(
          Math.abs(dx) < 1e-3 ? Number.POSITIVE_INFINITY : hw / Math.abs(dx),
          Math.abs(dy) < 1e-3 ? Number.POSITIVE_INFINITY : hh / Math.abs(dy)
        );
        const anchor: 'start' | 'end' = dx >= -0.15 ? 'start' : 'end';
        const ax = cx + dx * (reach + gap);
        const ay = cy + dy * (reach + gap);
        candidates.push({
          x: Math.min(
            Math.max(ax, anchor === 'start' ? 5 : 5 + textW),
            anchor === 'start' ? vw - 5 - textW : vw - 5
          ),
          y: Math.min(Math.max(ay, size + 4), vh - 8),
          anchor,
          rank: distanceIndex * 100 + Math.abs(swing),
        });
      }
    });
    candidates.sort((a, b) => a.rank - b.rank);

    let best = candidates[0];
    let bestCost = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
      const rect = rectFor(candidate.x, candidate.y, candidate.anchor);
      let cost = 0;
      boxes.forEach((other, otherIndex) => {
        if (parts[otherIndex].soft) return;
        if (overlaps(rect, inflate(other, PART_CLEARANCE))) {
          cost += otherIndex === index ? 40 : 100;
        }
      });
      for (const other of placed) {
        if (overlaps(rect, other)) cost += 200;
      }
      if (cost === 0) {
        best = candidate;
        break;
      }
      if (cost < bestCost) {
        bestCost = cost;
        best = candidate;
      }
    }

    const rect = rectFor(best.x, best.y, best.anchor);
    placed.push(rect);

    // Leader anchor on the part: the point of its own box nearest the label.
    const sx = Math.min(Math.max(best.x, box.x0), box.x1);
    const sy = Math.min(Math.max(best.y, box.y0), box.y1);

    const midX = (sx + best.x) / 2;
    const midY = (sy + best.y) / 2;

    out.push({
      id: p.id,
      no: p.no,
      text,
      number,
      name,
      lx: best.x,
      ly: best.y,
      anchor: best.anchor,
      sx,
      sy,
      // a small bow, perpendicular to the leader, so parallel leaders separate
      cx: midX + (best.y - sy) * 0.12,
      cy: midY - (best.x - sx) * 0.12,
      rule: (best.anchor === 'start' ? 1 : -1) * Math.min(textW, size * 3.2),
      width: textW,
    });
  });

  return out;
}
