import { difference, intersection } from 'polygon-clipping';
import type { Polygon } from 'polygon-clipping';
import type { Shape, Point } from '../types';
import { edgeControls } from './geometry';
import { flattenRing } from './svgPath';

// Curved edges are sampled to a polyline so polygon-clipping (which only
// understands straight edges) can subtract them. The output of a cutout
// inherits no bulges — the curve is baked into the resulting segments.
function flattenedShapeRings(shape: Shape): Point[][] {
  return shape.points.map((ring, idx) =>
    flattenRing(ring, edgeControls(ring, shape.edgeBulges?.[idx])),
  );
}

function toPolygon(points: Point[][]): Polygon {
  return points.map((ring) => ring.map((p): [number, number] => [p.x, p.y]));
}

function fromPolygon(poly: Polygon): Point[][] {
  return poly.map((ring) => ring.map(([x, y]) => ({ x, y })));
}

// Returns true if `base` has any overlapping area with `cutterPoints`.
export function shapesOverlap(base: Shape, cutterPoints: Point[]): boolean {
  const cutterPoly: Polygon = [cutterPoints.map((p): [number, number] => [p.x, p.y])];
  return intersection(toPolygon(flattenedShapeRings(base)), cutterPoly).length > 0;
}

// Subtracts `cutterPoints` from `base`. Returns the resulting shapes — may be
// zero shapes (cutter covered all of base), or 2+ (cutter split the base).
// Curves in `base` are flattened to line segments; the result is straight.
export function subtractFromShape(base: Shape, cutterPoints: Point[]): Shape[] {
  const cutterPoly: Polygon = [cutterPoints.map((p): [number, number] => [p.x, p.y])];
  const result = difference(toPolygon(flattenedShapeRings(base)), cutterPoly);
  return result.map((poly, i) => ({
    ...base,
    id: i === 0 ? base.id : `${base.id}-part${i}`,
    points: fromPolygon(poly),
    edgeBulges: undefined,
    type: 'draw' as const,
  }));
}
