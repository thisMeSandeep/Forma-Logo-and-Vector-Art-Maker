import type { Point } from '../types';

const ELLIPSE_SEGMENTS = 64;

// All generators take an axis-aligned bbox (two corners) and emit a closed
// polygon ring. The two corners may be in any order — we normalize to (min, max).
function normalize(a: Point, b: Point) {
  return {
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
  };
}

export function rectanglePoints(a: Point, b: Point): Point[] {
  const { minX, minY, maxX, maxY } = normalize(a, b);
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
}

export function ellipsePoints(a: Point, b: Point, segments = ELLIPSE_SEGMENTS): Point[] {
  const { minX, minY, maxX, maxY } = normalize(a, b);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = (maxX - minX) / 2;
  const ry = (maxY - minY) / 2;
  const points: Point[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
  }
  return points;
}

// Regular N-gon inscribed in the bbox (radius = min half-extent so it always
// fits inside the drag rectangle). First vertex points up.
export function regularPolygonPoints(a: Point, b: Point, sides: number): Point[] {
  const { minX, minY, maxX, maxY } = normalize(a, b);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const r = Math.min(maxX - minX, maxY - minY) / 2;
  const safeSides = Math.max(3, Math.floor(sides));
  const points: Point[] = [];
  for (let i = 0; i < safeSides; i++) {
    // -π/2 rotates the first vertex to the top of the circle
    const angle = -Math.PI / 2 + (i / safeSides) * Math.PI * 2;
    points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  return points;
}

// Star with `points` outer points; inner radius = outer * innerRatio.
export function starPoints(
  a: Point,
  b: Point,
  points: number,
  innerRatio: number,
): Point[] {
  const { minX, minY, maxX, maxY } = normalize(a, b);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const outer = Math.min(maxX - minX, maxY - minY) / 2;
  const inner = outer * innerRatio;
  const safePoints = Math.max(3, Math.floor(points));
  const ring: Point[] = [];
  // 2 vertices per star point (outer, then inner)
  for (let i = 0; i < safePoints * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i / (safePoints * 2)) * Math.PI * 2;
    ring.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  return ring;
}

// Open path with two endpoints. Used by Line and Arrow tools.
export function linePoints(a: Point, b: Point): Point[] {
  return [{ x: a.x, y: a.y }, { x: b.x, y: b.y }];
}

// Snap a drag end-point so the resulting bbox is a square (used for Shift-constrain).
// Picks the smaller axis so the square stays inside the drag distance.
export function squareConstrain(start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const size = Math.min(Math.abs(dx), Math.abs(dy));
  return {
    x: start.x + Math.sign(dx) * size,
    y: start.y + Math.sign(dy) * size,
  };
}
