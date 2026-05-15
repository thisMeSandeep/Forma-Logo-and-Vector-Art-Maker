import type { Shape, ViewBox } from '../types';
import { bakedShapeControls, bakedShapeRings, bboxOfRingsWithControls, type BBox } from './geometry';

// A single guide line. `pos` is the world coordinate along the perpendicular
// axis; `span` is the extent along the parallel axis (used so the line stops
// at the union of the two aligned shapes' bboxes, like Figma).
export type Guide = {
  axis: 'x' | 'y';
  pos: number;
  span: [number, number];
};

// Visual (post-transform) AABB of a shape, in world coordinates.
export function visualBBox(shape: Shape): BBox {
  return bboxOfRingsWithControls(
    bakedShapeRings(shape),
    bakedShapeControls(shape),
    shape.closed !== false,
  );
}

function xCandidates(b: BBox): [number, number, number] {
  return [b.x, b.x + b.w / 2, b.x + b.w];
}

function yCandidates(b: BBox): [number, number, number] {
  return [b.y, b.y + b.h / 2, b.y + b.h];
}

// Treat the canvas as a virtual "other shape" so dragging snaps to canvas
// edges + center as well as to other shapes.
function canvasAsBBox(canvas: ViewBox): BBox {
  return { x: 0, y: 0, w: canvas.w, h: canvas.h };
}

// Given a shape's start bbox and proposed (cursor-driven) delta, find the
// snap-corrected delta and the guide lines that should render.
//
// Snapping is independent per axis: the smallest correction within `threshold`
// wins on each axis. Once snapped, guides are emitted for every (drag candidate
// = other candidate) pair, so corner-to-corner snaps display two lines.
export function findAlignmentSnap(
  startBox: BBox,
  others: BBox[],
  proposedDx: number,
  proposedDy: number,
  threshold: number,
  canvas: ViewBox | null,
): { dx: number; dy: number; guides: Guide[] } {
  const targets = canvas ? [...others, canvasAsBBox(canvas)] : others;

  const targetBox: BBox = {
    x: startBox.x + proposedDx,
    y: startBox.y + proposedDy,
    w: startBox.w,
    h: startBox.h,
  };

  const targetXs = xCandidates(targetBox);
  const targetYs = yCandidates(targetBox);

  let bestXCorr = 0;
  let bestXDist = threshold + 1;
  let bestYCorr = 0;
  let bestYDist = threshold + 1;

  for (const o of targets) {
    for (const ox of xCandidates(o)) {
      for (const tx of targetXs) {
        const d = ox - tx;
        if (Math.abs(d) < bestXDist) {
          bestXDist = Math.abs(d);
          bestXCorr = d;
        }
      }
    }
    for (const oy of yCandidates(o)) {
      for (const ty of targetYs) {
        const d = oy - ty;
        if (Math.abs(d) < bestYDist) {
          bestYDist = Math.abs(d);
          bestYCorr = d;
        }
      }
    }
  }

  const dx = bestXDist <= threshold ? proposedDx + bestXCorr : proposedDx;
  const dy = bestYDist <= threshold ? proposedDy + bestYCorr : proposedDy;

  // Collect guides for the snapped position
  const finalBox: BBox = { x: startBox.x + dx, y: startBox.y + dy, w: startBox.w, h: startBox.h };
  const finalXs = xCandidates(finalBox);
  const finalYs = yCandidates(finalBox);
  const EPS = 0.01;

  const guides: Guide[] = [];
  for (const o of targets) {
    for (const ox of xCandidates(o)) {
      for (const tx of finalXs) {
        if (Math.abs(ox - tx) < EPS) {
          guides.push({
            axis: 'x',
            pos: ox,
            span: [Math.min(finalBox.y, o.y), Math.max(finalBox.y + finalBox.h, o.y + o.h)],
          });
        }
      }
    }
    for (const oy of yCandidates(o)) {
      for (const ty of finalYs) {
        if (Math.abs(oy - ty) < EPS) {
          guides.push({
            axis: 'y',
            pos: oy,
            span: [Math.min(finalBox.x, o.x), Math.max(finalBox.x + finalBox.w, o.x + o.w)],
          });
        }
      }
    }
  }
  return { dx, dy, guides };
}

export type AlignDirection = 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom';

// Returns the (dx, dy) needed to align `box` to the canvas extents per direction.
export function alignToCanvasDelta(
  box: BBox,
  canvas: ViewBox,
  direction: AlignDirection,
): { dx: number; dy: number } {
  switch (direction) {
    case 'left':    return { dx: -box.x, dy: 0 };
    case 'centerX': return { dx: (canvas.w - box.w) / 2 - box.x, dy: 0 };
    case 'right':   return { dx: canvas.w - box.w - box.x, dy: 0 };
    case 'top':     return { dx: 0, dy: -box.y };
    case 'centerY': return { dx: 0, dy: (canvas.h - box.h) / 2 - box.y };
    case 'bottom':  return { dx: 0, dy: canvas.h - box.h - box.y };
  }
}
