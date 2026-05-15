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

// Perpendicular unit vector to an edge, oriented 90° CCW (math convention).
// Used both for rendering bulges and for drag-to-set computations so the sign
// stays consistent end-to-end.
export function edgePerpendicular(p0: Point, p1: Point): Point {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return { x: 0, y: 0 };
  return { x: -dy / len, y: dx / len };
}

// Quadratic-Bezier control point that yields the requested bulge: the curve's
// apex (at t=0.5) sits at midpoint + bulge * perpendicular, since the control
// point is twice that offset from the midpoint.
export function bezierControlForBulge(p0: Point, p1: Point, bulge: number): Point {
  const mx = (p0.x + p1.x) / 2;
  const my = (p0.y + p1.y) / 2;
  const perp = edgePerpendicular(p0, p1);
  return { x: mx + perp.x * 2 * bulge, y: my + perp.y * 2 * bulge };
}

// Resolves the controls-per-edge array used by path emission and bbox math.
// Entry i is the quadratic control for edge i (point i → point (i+1) mod n),
// or null when that edge is straight.
export function edgeControls(ring: Point[], bulges: number[] | undefined): (Point | null)[] {
  const n = ring.length;
  const out: (Point | null)[] = new Array(n).fill(null);
  if (!bulges) return out;
  for (let i = 0; i < n; i++) {
    const b = bulges[i];
    if (!b) continue;
    out[i] = bezierControlForBulge(ring[i], ring[(i + 1) % n], b);
  }
  return out;
}

// Extreme values of a quadratic Bezier per axis. The component is monotonic
// (no interior extreme) when (P0 - 2C + P1) is near zero, which is the case
// when the control lies on the chord midpoint perpendicular nicely; we still
// guard the divide.
function bezierAxisExtreme(p0: number, c: number, p1: number): number | null {
  const denom = p0 - 2 * c + p1;
  if (Math.abs(denom) < 1e-9) return null;
  const t = (p0 - c) / denom;
  if (t <= 0 || t >= 1) return null;
  const oneMinusT = 1 - t;
  return oneMinusT * oneMinusT * p0 + 2 * oneMinusT * t * c + t * t * p1;
}

// Bounding box that includes curve extremes for any edges with a non-null
// control point. Falls back to point-only when all edges are straight.
export function bboxOfRingsWithControls(
  rings: Point[][],
  controls: (Point | null)[][],
  closed = true,
): BBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let r = 0; r < rings.length; r++) {
    const ring = rings[r];
    const ringControls = controls[r] ?? [];
    for (const p of ring) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const lastEdge = closed ? ring.length : ring.length - 1;
    for (let i = 0; i < lastEdge; i++) {
      const c = ringControls[i];
      if (!c) continue;
      const p0 = ring[i];
      const p1 = ring[(i + 1) % ring.length];
      const exX = bezierAxisExtreme(p0.x, c.x, p1.x);
      const exY = bezierAxisExtreme(p0.y, c.y, p1.y);
      if (exX != null) { if (exX < minX) minX = exX; if (exX > maxX) maxX = exX; }
      if (exY != null) { if (exY < minY) minY = exY; if (exY > maxY) maxY = exY; }
    }
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// Curve-aware bbox in shape-local space.
export function bboxOfShape(shape: Shape): BBox {
  const controls = shape.points.map((ring, r) =>
    edgeControls(ring, shape.edgeBulges?.[r]),
  );
  return bboxOfRingsWithControls(shape.points, controls, shape.closed !== false);
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

// Bakes a shape's per-edge controls into world space alongside the points.
// Returns one (Point|null)[] per ring; entries are null where the edge is
// straight. Skew/rotate/non-uniform scale all preserve the curve through the
// baked control, so we get the right shape after the transform is absorbed.
export function bakedShapeControls(shape: Shape): (Point | null)[][] {
  const localControls = shape.points.map((ring, r) =>
    edgeControls(ring, shape.edgeBulges?.[r]),
  );
  const t = shape.transform;
  const isIdentity =
    !t ||
    (t.rotation === 0 && t.scaleX === 1 && t.scaleY === 1 && t.skewX === 0 && t.skewY === 0);
  if (isIdentity) return localControls;
  const m = shapeMatrix(shape);
  return localControls.map((ring) => ring.map((c) => (c ? applyShapeMatrix(m, c) : null)));
}
