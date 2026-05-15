import type { Point } from '../types';

const EPSILON = 0.001;

function samePoint(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y) < EPSILON;
}

function triangleArea(a: Point, b: Point, c: Point) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

// Drops duplicate / co-linear vertices while also dropping the matching entries
// in a parallel `controls` array (one entry per ring point, representing the
// quadratic control for the edge starting at that point). When two vertices
// merge or a co-linear point is removed, we drop the corresponding edge entry
// — this keeps the output indices aligned with the surviving points.
function normalizeRing(
  ring: Point[],
  controls?: (Point | null)[],
): { ring: Point[]; controls: (Point | null)[] } {
  const c = controls ?? new Array(ring.length).fill(null);
  const dedupedR: Point[] = [];
  const dedupedC: (Point | null)[] = [];
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    if (dedupedR.length === 0 || !samePoint(dedupedR[dedupedR.length - 1], p)) {
      dedupedR.push(p);
      dedupedC.push(c[i] ?? null);
    }
  }
  if (dedupedR.length >= 2 && samePoint(dedupedR[0], dedupedR[dedupedR.length - 1])) {
    dedupedR.pop();
    dedupedC.pop();
  }
  if (dedupedR.length < 3) return { ring: dedupedR, controls: dedupedC };

  // Filter co-linear vertices, but only when the adjacent edges are straight.
  // A curved edge meeting a straight one still needs the corner vertex.
  const keep: boolean[] = dedupedR.map((p, idx) => {
    const prev = dedupedR[(idx - 1 + dedupedR.length) % dedupedR.length];
    const next = dedupedR[(idx + 1) % dedupedR.length];
    const colinear = Math.abs(triangleArea(prev, p, next)) <= EPSILON;
    if (!colinear) return true;
    const incoming = dedupedC[(idx - 1 + dedupedC.length) % dedupedC.length];
    const outgoing = dedupedC[idx];
    return !!incoming || !!outgoing;
  });
  const outR: Point[] = [];
  const outC: (Point | null)[] = [];
  for (let i = 0; i < dedupedR.length; i++) {
    if (keep[i]) {
      outR.push(dedupedR[i]);
      outC.push(dedupedC[i]);
    }
  }
  return { ring: outR, controls: outC };
}

// Converts a ring of points to a sharp-cornered SVG path
export function ringToD(ring: Point[]): string {
  const { ring: normalized } = normalizeRing(ring);
  if (normalized.length < 2) return '';
  return (
    `M${normalized[0].x},${normalized[0].y} ` +
    normalized.slice(1).map((p) => `L${p.x},${p.y}`).join(' ') +
    ' Z'
  );
}

// Open-path version: no Z terminator. Used for Line/Arrow shapes.
// Doesn't dedupe (`normalizeRing` closes loops which is wrong for open paths).
export function openRingToD(ring: Point[]): string {
  if (ring.length < 2) return '';
  return (
    `M${ring[0].x},${ring[0].y} ` +
    ring.slice(1).map((p) => `L${p.x},${p.y}`).join(' ')
  );
}

// Linearly interpolate a quadratic-Bezier control point onto the segment
// running from `start` to `end` (both lying on the original chord). Used to
// rebuild the control after corner rounding has trimmed the chord at both
// ends: the new control sits along the same perpendicular at the new midpoint,
// scaled proportionally so the visible curvature stays close to what the user
// drew before the corners got rounded.
function reframedControl(
  origP0: Point,
  origP1: Point,
  origC: Point,
  newP0: Point,
  newP1: Point,
): Point {
  // The original control's perpendicular component relative to the chord
  // direction defines the curvature. Project the new chord's midpoint plus
  // the same perpendicular offset.
  const dxOrig = origP1.x - origP0.x;
  const dyOrig = origP1.y - origP0.y;
  const lenOrig = Math.hypot(dxOrig, dyOrig);
  if (lenOrig < EPSILON) return { x: newP0.x, y: newP0.y };
  const perpX = -dyOrig / lenOrig;
  const perpY = dxOrig / lenOrig;
  // Perpendicular offset of the original control from its midpoint:
  const omx = (origP0.x + origP1.x) / 2;
  const omy = (origP0.y + origP1.y) / 2;
  const perpOffset = (origC.x - omx) * perpX + (origC.y - omy) * perpY;
  // Trim ratio — how much of the original chord remains. Curvature visually
  // scales with chord length, so shrink the offset by the same factor.
  const newLen = Math.hypot(newP1.x - newP0.x, newP1.y - newP0.y);
  const scaled = perpOffset * (newLen / lenOrig);
  const nmx = (newP0.x + newP1.x) / 2;
  const nmy = (newP0.y + newP1.y) / 2;
  return { x: nmx + perpX * scaled, y: nmy + perpY * scaled };
}

// Emit a path for a ring with optional per-edge quadratic controls AND optional
// rounded corners. Controls and corner rounding compose: each curved edge is
// emitted as a Q segment between the trimmed corner endpoints, with the
// control reframed onto the trimmed chord.
//
// `controls[i]` is the quadratic control for the edge starting at point i, or
// null/undefined when that edge is straight.
export function roundedRingWithControlsToD(
  ringInput: Point[],
  radius: number,
  controlsInput?: (Point | null)[],
): string {
  const { ring, controls } = normalizeRing(ringInput, controlsInput);

  if (ring.length < 3) return ringToD(ring);

  const n = ring.length;
  const hasAnyCurve = controls.some((c) => !!c);

  // Fast path: no curves, no radius → straight polygon
  if (radius <= 0 && !hasAnyCurve) return ringToD(ring);

  const r = Math.max(0, radius);
  type Corner = {
    vertex: Point;
    start: Point;  // entry point onto the corner (== vertex when not rounded)
    end: Point;    // exit point off the corner (== vertex when not rounded)
    rounded: boolean;
  };

  const corners: Corner[] = ring.map((vertex, i) => {
    const prev = ring[(i - 1 + n) % n];
    const next = ring[(i + 1) % n];
    const inX = vertex.x - prev.x, inY = vertex.y - prev.y;
    const outX = next.x - vertex.x, outY = next.y - vertex.y;
    const lIn = Math.hypot(inX, inY);
    const lOut = Math.hypot(outX, outY);
    if (r <= 0 || lIn < EPSILON || lOut < EPSILON) {
      return { vertex, start: vertex, end: vertex, rounded: false };
    }
    const cr = Math.min(r, lIn / 2, lOut / 2);
    if (cr < EPSILON) {
      return { vertex, start: vertex, end: vertex, rounded: false };
    }
    const tIn = cr / lIn;
    const tOut = cr / lOut;
    return {
      vertex,
      start: { x: vertex.x - inX * tIn, y: vertex.y - inY * tIn },
      end:   { x: vertex.x + outX * tOut, y: vertex.y + outY * tOut },
      rounded: true,
    };
  });

  // Begin at the exit of corner 0, then walk: edge i goes from corners[i].end
  // → corners[(i+1)%n].start, possibly as a quadratic; then the rounded corner
  // (a Q at the vertex) carries us to corners[(i+1)%n].end.
  let d = `M${corners[0].end.x},${corners[0].end.y} `;
  for (let i = 0; i < n; i++) {
    const fromCorner = corners[i];
    const toCorner = corners[(i + 1) % n];
    const ctrl = controls[i];
    if (ctrl) {
      // Curved edge — reframe the control onto the trimmed chord so the
      // curvature still feels right after corner rounding.
      const newCtrl = reframedControl(
        ring[i], ring[(i + 1) % n], ctrl,
        fromCorner.end, toCorner.start,
      );
      d += `Q${newCtrl.x},${newCtrl.y} ${toCorner.start.x},${toCorner.start.y} `;
    } else {
      d += `L${toCorner.start.x},${toCorner.start.y} `;
    }
    d += toCorner.rounded
      ? `Q${toCorner.vertex.x},${toCorner.vertex.y} ${toCorner.end.x},${toCorner.end.y} `
      : '';
  }
  return d + 'Z';
}

// Backwards-compatible wrapper for the prior rounded-only signature.
export function roundedRingToD(ring: Point[], radius: number): string {
  return roundedRingWithControlsToD(ring, radius, undefined);
}

// Open-path version with optional controls. Used by Line/Arrow if they ever
// adopt curves; for now they only ever pass undefined controls.
export function openRingWithControlsToD(ring: Point[], controls?: (Point | null)[]): string {
  if (ring.length < 2) return '';
  let d = `M${ring[0].x},${ring[0].y} `;
  for (let i = 0; i < ring.length - 1; i++) {
    const ctrl = controls?.[i];
    const next = ring[i + 1];
    if (ctrl) d += `Q${ctrl.x},${ctrl.y} ${next.x},${next.y} `;
    else      d += `L${next.x},${next.y} `;
  }
  return d.trimEnd();
}

// Flatten a curved ring to a polyline (one quadratic Bézier → N line segments)
// so polygon-clipping (which only understands straight edges) can subtract it.
// Returns the original ring untouched when no edge is curved.
export function flattenRing(
  ring: Point[],
  controls: (Point | null)[] | undefined,
  segmentsPerCurve = 16,
): Point[] {
  if (!controls || controls.every((c) => !c)) return ring;
  const out: Point[] = [];
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const p0 = ring[i];
    const p1 = ring[(i + 1) % n];
    const c = controls[i];
    out.push(p0);
    if (!c) continue;
    for (let s = 1; s < segmentsPerCurve; s++) {
      const t = s / segmentsPerCurve;
      const u = 1 - t;
      out.push({
        x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
        y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
      });
    }
  }
  return out;
}
