import type { Point, Shape, ShapeTransform } from '../types';
import { IDENTITY_TRANSFORM } from '../types';

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

export type BBox = { x: number; y: number; w: number; h: number };

// Bounding box across all rings (outer + holes). Holes never extend past the outer
// ring in practice, but folding them in keeps the helper total.
export function bboxOfRings(rings: Point[][]): BBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ring of rings) {
    for (const p of ring) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function translateRings(rings: Point[][], dx: number, dy: number): Point[][] {
  return rings.map((ring) => ring.map((p) => ({ x: p.x + dx, y: p.y + dy })));
}

// Mirror around an arbitrary axis (cx for vertical-axis flip = horizontal mirror,
// cy for horizontal-axis flip = vertical mirror). Reverses ring winding to keep
// the polygon non-self-intersecting after the flip.
export function flipRings(rings: Point[][], axis: 'horizontal' | 'vertical', center: Point): Point[][] {
  return rings.map((ring) => {
    const flipped = ring.map((p) =>
      axis === 'horizontal'
        ? { x: 2 * center.x - p.x, y: p.y }
        : { x: p.x, y: 2 * center.y - p.y },
    );
    return flipped.reverse();
  });
}

export function getShapeTransform(shape: Shape): ShapeTransform {
  return shape.transform ?? IDENTITY_TRANSFORM;
}

// 2x2 matrix + pivot describing a transform: world = pivot + M·(p - pivot).
export type ShapeMatrix = { a: number; b: number; c: number; d: number; cx: number; cy: number };
export const IDENTITY_MATRIX: ShapeMatrix = { a: 1, b: 0, c: 0, d: 1, cx: 0, cy: 0 };

function isIdentityTransform(t: ShapeTransform): boolean {
  return t.rotation === 0 && t.scaleX === 1 && t.scaleY === 1 && t.skewX === 0 && t.skewY === 0;
}

// Generic transform serializer — given a transform and the pivot to spin around,
// emits the SVG transform attribute. Empty when identity / undefined.
export function transformToString(t: ShapeTransform | undefined, cx: number, cy: number): string {
  if (!t || isIdentityTransform(t)) return '';
  // Order: translate to origin → skew/rotate/scale → translate back.
  // SVG applies transforms right-to-left, so the string order below is correct.
  return [
    `translate(${cx} ${cy})`,
    `rotate(${t.rotation})`,
    `skewX(${t.skewX})`,
    `skewY(${t.skewY})`,
    `scale(${t.scaleX} ${t.scaleY})`,
    `translate(${-cx} ${-cy})`,
  ].join(' ');
}

// Generic transform → 2x2 matrix + pivot. Used by anything that needs to project
// local-space points into world space (selection handles, hit-testing, etc).
export function transformToMatrix(t: ShapeTransform | undefined, cx: number, cy: number): ShapeMatrix {
  if (!t) return { ...IDENTITY_MATRIX, cx, cy };
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const cosR = Math.cos(rad(t.rotation));
  const sinR = Math.sin(rad(t.rotation));
  const tanKx = Math.tan(rad(t.skewX));
  const tanKy = Math.tan(rad(t.skewY));
  // M = R · SkewX · SkewY · Scale, matching the SVG attribute order
  // "rotate skewX skewY scale" (SVG applies transforms right-to-left, so a
  // point is first scaled, then skewed-Y, then skewed-X, then rotated).
  const a = t.scaleX * (cosR * (1 + tanKx * tanKy) - sinR * tanKy);
  const b = t.scaleX * (sinR * (1 + tanKx * tanKy) + cosR * tanKy);
  const c = t.scaleY * (cosR * tanKx - sinR);
  const d = t.scaleY * (sinR * tanKx + cosR);
  return { a, b, c, d, cx, cy };
}

// Returns the SVG transform attribute value for a shape, or empty when identity.
// The transform is applied around the bbox center of the baked points, so visual
// translation comes from editing points and rotation/scale/skew compose on top.
export function shapeTransformString(shape: Shape): string {
  const bbox = bboxOfRings(shape.points);
  return transformToString(shape.transform, bbox.x + bbox.w / 2, bbox.y + bbox.h / 2);
}

export function shapeMatrix(shape: Shape): ShapeMatrix {
  const bbox = bboxOfRings(shape.points);
  return transformToMatrix(shape.transform, bbox.x + bbox.w / 2, bbox.y + bbox.h / 2);
}

export function applyShapeMatrix(m: ShapeMatrix, p: Point): Point {
  const dx = p.x - m.cx;
  const dy = p.y - m.cy;
  return { x: m.a * dx + m.c * dy + m.cx, y: m.b * dx + m.d * dy + m.cy };
}

// Bakes the transform into the rings so the result lives entirely in world space.
// Used by export and by visual-bbox computations.
export function bakedShapeRings(shape: Shape): Point[][] {
  const t = shape.transform;
  if (!t) return shape.points;
  const isIdentity =
    t.rotation === 0 && t.scaleX === 1 && t.scaleY === 1 && t.skewX === 0 && t.skewY === 0;
  if (isIdentity) return shape.points;
  const m = shapeMatrix(shape);
  return shape.points.map((ring) => ring.map((p) => applyShapeMatrix(m, p)));
}
