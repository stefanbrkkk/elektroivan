import type { AnatomyStep } from '../../config/site';

export interface CircuitNode {
  id: AnatomyStep['id'];
  x: number;
  y: number;
  /**
   * Extra rotation for a component that has to follow the line direction (the
   * desktop cable sits on the vertical run). Applied as a static inner
   * transform in `CircuitSvg`, never through the timeline — see the note
   * there.
   */
  rotate: number;
}

export interface CircuitLayout {
  vertical: boolean;
  viewBox: string;
  path: string;
  nodes: CircuitNode[];
  panel: { x: number; y: number; scale: number };
  bulb: { x: number; y: number };
  /** Offset the active component lifts by, perpendicular to the line. */
  lift: { x: number; y: number };
}

/**
 * Anchor geometry for the "anatomy of a fault" circuit (docs/BRIEF.md §6.5):
 * one continuous line — panel → breaker → RCD → cable → socket → switch and
 * bulb.
 *
 * Desktop runs it across ~60% of the width with one drop between the
 * protection devices and the load side. Phones get a serpentine
 * that still flows downward but folds into three rows, so the components stay
 * large enough to read inside the ~30svh the drawing may occupy at 360×640
 * (a single 5-component column would shrink them to a few pixels).
 *
 * Node positions along the path are measured from the rendered path at
 * runtime, so changing this geometry needs no other edit.
 */
export function getCircuitLayout(vertical: boolean): CircuitLayout {
  if (vertical) {
    return {
      vertical: true,
      viewBox: '0 0 470 360',
      path: 'M 84 78 H 410 Q 440 78 440 108 V 160 Q 440 190 410 190 H 60 Q 30 190 30 220 V 272 Q 30 302 60 302 H 400',
      panel: { x: 54, y: 78, scale: 0.52 },
      bulb: { x: 400, y: 298 },
      lift: { x: 0, y: -20 },
      nodes: [
        { id: 'breaker', x: 190, y: 78, rotate: 0 },
        { id: 'rcd', x: 330, y: 78, rotate: 0 },
        { id: 'cable', x: 300, y: 190, rotate: 0 },
        { id: 'socket', x: 150, y: 190, rotate: 0 },
        { id: 'lamp', x: 150, y: 302, rotate: 0 },
      ],
    };
  }

  // Desktop: the supply side runs across the top (panel → breaker → RCD), the
  // damaged cable drops down the wall (rotated onto the vertical run — that is
  // what `CircuitNode.rotate` is for) and the load side sits at the bottom,
  // socket then switch, with the pendant bulb hanging above the switch.
  //
  // The old `M 140 220 H 900 V 112` inside a `14 44 950 268` viewBox was a
  // dead-straight 3.5:1 strip that used ~200 of the stage's 487 px
  // (docs/reports/review-1.md minor 15). Hugging the drawing with a 1.5:1
  // viewBox instead fills ~90% of that height *and* renders every component a
  // third larger, because `.jv-stage-svg` is `width: 100%; height: auto` — the
  // viewBox's own aspect ratio is what sizes the box.
  return {
    vertical: false,
    viewBox: '0 0 720 480',
    path: 'M 122 90 H 390 Q 440 90 440 140 V 380 Q 440 430 490 430 H 650 V 300',
    panel: { x: 66, y: 90, scale: 1 },
    bulb: { x: 650, y: 296 },
    lift: { x: 0, y: -20 },
    nodes: [
      { id: 'breaker', x: 200, y: 90, rotate: 0 },
      { id: 'rcd', x: 310, y: 90, rotate: 0 },
      { id: 'cable', x: 440, y: 260, rotate: 90 },
      { id: 'socket', x: 550, y: 430, rotate: 0 },
      { id: 'lamp', x: 630, y: 430, rotate: 0 },
    ],
  };
}
