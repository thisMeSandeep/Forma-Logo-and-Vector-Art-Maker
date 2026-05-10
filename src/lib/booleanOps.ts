// TODO: Step 8 — implement polygon boolean subtract using polygon-clipping
import type { Shape, Point } from '../types';

type Ring = [number, number][];
type Polygon = Ring[];

function toRing(points: Point[]): Ring {
  return points.map((p) => [p.x, p.y]);
}

function fromRing(ring: Ring): Point[] {
  return ring.map(([x, y]) => ({ x, y }));
}

// Returns the result of subtracting `cutter` from `base`, as a list of shapes.
// May return multiple shapes if the cut splits the base.
export async function subtractShape(
  base: Shape,
  cutter: Shape
): Promise<Shape[]> {
  const polygonClipping = await import('polygon-clipping');
  const difference = polygonClipping.default.difference;

  const basePolygon: Polygon = [toRing(base.points)];
  const cutterPolygon: Polygon = [toRing(cutter.points)];

  const result = difference(basePolygon, cutterPolygon);

  return result.map((multiPoly, i) => ({
    ...base,
    id: i === 0 ? base.id : `${base.id}-${i}`,
    points: fromRing(multiPoly[0]), // outer ring only
  }));
}
