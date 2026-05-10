import { difference, intersection } from 'polygon-clipping';
import type { Polygon } from 'polygon-clipping';
import type { Shape, Point } from '../types';

function toPolygon(points: Point[][]): Polygon {
  return points.map((ring) => ring.map((p): [number, number] => [p.x, p.y]));
}

function fromPolygon(poly: Polygon): Point[][] {
  return poly.map((ring) => ring.map(([x, y]) => ({ x, y })));
}

// Returns true if `base` has any overlapping area with `cutterPoints`.
export function shapesOverlap(base: Shape, cutterPoints: Point[]): boolean {
  const cutterPoly: Polygon = [cutterPoints.map((p): [number, number] => [p.x, p.y])];
  return intersection(toPolygon(base.points), cutterPoly).length > 0;
}

// Subtracts `cutterPoints` from `base`. Returns the resulting shapes — may be
// zero shapes (cutter covered all of base), or 2+ (cutter split the base).
export function subtractFromShape(base: Shape, cutterPoints: Point[]): Shape[] {
  const cutterPoly: Polygon = [cutterPoints.map((p): [number, number] => [p.x, p.y])];
  const result = difference(toPolygon(base.points), cutterPoly);
  return result.map((poly, i) => ({
    ...base,
    id: i === 0 ? base.id : `${base.id}-part${i}`,
    points: fromPolygon(poly),
    type: 'draw' as const,
  }));
}
