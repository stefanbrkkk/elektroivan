import type { AnatomyStep } from '../../config/site';

export interface CircuitNode {
  id: AnatomyStep['id'];
  x: number;
  y: number;
  /** Extra rotation for components that must follow the line direction. */
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
 * Desktop runs it straight across ~60% of the width. Phones get a serpentine
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

  return {
    vertical: false,
    viewBox: '14 44 950 268',
    path: 'M 140 220 H 900 V 112',
    panel: { x: 78, y: 220, scale: 1 },
    bulb: { x: 900, y: 108 },
    lift: { x: 0, y: -20 },
    nodes: [
      { id: 'breaker', x: 268, y: 220, rotate: 0 },
      { id: 'rcd', x: 420, y: 220, rotate: 0 },
      { id: 'cable', x: 590, y: 220, rotate: 0 },
      { id: 'socket', x: 748, y: 220, rotate: 0 },
      { id: 'lamp', x: 856, y: 220, rotate: 0 },
    ],
  };
}
