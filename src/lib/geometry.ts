import type { Point } from '../types';

export function snapToSquare(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

// Snaps to the nearest vertex of the triangular lattice defined by the three
// line families at 0°, 60°, 120°. Lattice basis: b1=(g,0), b2=(g/2, g√3/2).
// We express the point in oblique (n, m) coordinates, round both, then
// reconstruct — this finds the nearest vertex in one pass with no iteration.
export function snapToIsometric(point: Point, gridSize: number): Point {
  const h = (gridSize * Math.sqrt(3)) / 2; // row height = g * √3/2
  const m = point.y / h;
  const n = point.x / gridSize - m / 2;
  const rm = Math.round(m);
  const rn = Math.round(n);
  return {
    x: rn * gridSize + rm * gridSize / 2,
    y: rm * h,
  };
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
