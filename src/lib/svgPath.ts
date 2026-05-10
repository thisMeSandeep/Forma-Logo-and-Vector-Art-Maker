import type { Point } from '../types';

const EPSILON = 0.001;

function samePoint(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y) < EPSILON;
}

function triangleArea(a: Point, b: Point, c: Point) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function normalizeRing(ring: Point[]): Point[] {
  const deduped: Point[] = [];
  for (const point of ring) {
    if (deduped.length === 0 || !samePoint(deduped[deduped.length - 1], point)) {
      deduped.push(point);
    }
  }

  if (deduped.length >= 2 && samePoint(deduped[0], deduped[deduped.length - 1])) {
    deduped.pop();
  }

  if (deduped.length < 3) return deduped;

  return deduped.filter((point, index) => {
    const prev = deduped[(index - 1 + deduped.length) % deduped.length];
    const next = deduped[(index + 1) % deduped.length];
    return Math.abs(triangleArea(prev, point, next)) > EPSILON;
  });
}

// Converts a ring of points to a sharp-cornered SVG path
export function ringToD(ring: Point[]): string {
  ring = normalizeRing(ring);
  if (ring.length < 2) return '';
  return (
    `M${ring[0].x},${ring[0].y} ` +
    ring.slice(1).map((p) => `L${p.x},${p.y}`).join(' ') +
    ' Z'
  );
}

// Converts a ring to an SVG path with rounded corners.
// At each vertex, replace the sharp corner with a quadratic bezier whose
// control point is the vertex itself, entering and exiting `r` units along
// the adjacent edges. The radius is clamped so it never exceeds half of
// either neighbouring edge length.
export function roundedRingToD(ring: Point[], radius: number): string {
  ring = normalizeRing(ring);

  if (ring.length < 3 || radius <= 0) return ringToD(ring);

  const n = ring.length;
  const corners = ring.map((vertex, i) => {
    const prev = ring[(i - 1 + n) % n];
    const next = ring[(i + 1) % n];
    const inX = vertex.x - prev.x, inY = vertex.y - prev.y;
    const outX = next.x - vertex.x, outY = next.y - vertex.y;
    const lIn = Math.hypot(inX, inY);
    const lOut = Math.hypot(outX, outY);

    if (lIn < EPSILON || lOut < EPSILON) {
      return { vertex, start: vertex, end: vertex, rounded: false };
    }

    const r = Math.min(radius, lIn / 2, lOut / 2);
    if (r < EPSILON) {
      return { vertex, start: vertex, end: vertex, rounded: false };
    }

    const tIn = r / lIn;
    const tOut = r / lOut;
    return {
      vertex,
      start: { x: vertex.x - inX * tIn,  y: vertex.y - inY * tIn  },
      end:   { x: vertex.x + outX * tOut, y: vertex.y + outY * tOut },
      rounded: true,
    };
  });

  // Begin on the exit of corner 0, then for each subsequent corner: line to
  // its entry, then quadratic curve through the vertex to its exit.
  let d = `M${corners[0].end.x},${corners[0].end.y} `;
  for (let i = 1; i <= n; i++) {
    const c = corners[i % n];
    d += `L${c.start.x},${c.start.y} `;
    d += c.rounded
      ? `Q${c.vertex.x},${c.vertex.y} ${c.end.x},${c.end.y} `
      : `L${c.end.x},${c.end.y} `;
  }
  return d + 'Z';
}
