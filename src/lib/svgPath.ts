import type { Point } from '../types';

// Converts a ring of points to a sharp-cornered SVG path
export function ringToD(ring: Point[]): string {
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
  // polygon-clipping returns closed rings (first point repeated at the end).
  // Strip the trailing duplicate so neighbouring-edge math is correct at the seam.
  if (
    ring.length >= 2 &&
    ring[0].x === ring[ring.length - 1].x &&
    ring[0].y === ring[ring.length - 1].y
  ) {
    ring = ring.slice(0, -1);
  }

  if (ring.length < 3 || radius <= 0) return ringToD(ring);

  const n = ring.length;
  const corners = ring.map((v, i) => {
    const prev = ring[(i - 1 + n) % n];
    const next = ring[(i + 1) % n];
    const inX = v.x - prev.x, inY = v.y - prev.y;
    const outX = next.x - v.x, outY = next.y - v.y;
    const lIn = Math.hypot(inX, inY);
    const lOut = Math.hypot(outX, outY);
    // Clamp so the curve stays within each edge
    const r = Math.min(radius, lIn / 2, lOut / 2);
    const tIn = lIn === 0 ? 0 : r / lIn;
    const tOut = lOut === 0 ? 0 : r / lOut;
    return {
      v,
      start: { x: v.x - inX * tIn,  y: v.y - inY * tIn  },
      end:   { x: v.x + outX * tOut, y: v.y + outY * tOut },
    };
  });

  // Begin on the exit of corner 0, then for each subsequent corner: line to
  // its entry, then quadratic curve through the vertex to its exit.
  let d = `M${corners[0].end.x},${corners[0].end.y} `;
  for (let i = 1; i <= n; i++) {
    const c = corners[i % n];
    d += `L${c.start.x},${c.start.y} Q${c.v.x},${c.v.y} ${c.end.x},${c.end.y} `;
  }
  return d + 'Z';
}
