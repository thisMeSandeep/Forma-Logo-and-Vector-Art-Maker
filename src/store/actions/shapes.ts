import type { Point, Shape, ShapeTransform } from '../../types';
import { IDENTITY_TRANSFORM } from '../../types';
import { bboxOfRings, flipRings, translateRings } from '../../lib/geometry';
import { shapesOverlap, subtractFromShape } from '../../lib/booleanOps';

// Apply a style patch to the selected shape only. When nothing is selected,
// the array is returned unchanged so the caller can keep using the result.
export function patchSelectedShape<K extends keyof Shape>(
  shapes: Shape[],
  selectedId: string | null,
  key: K,
  value: Shape[K],
): Shape[] {
  if (!selectedId) return shapes;
  return shapes.map((sh) => (sh.id === selectedId ? { ...sh, [key]: value } : sh));
}

export function duplicatedShape(source: Shape, gridSize: number): Shape {
  const offset = gridSize * 2;
  return {
    ...source,
    id: crypto.randomUUID(),
    points: translateRings(source.points, offset, offset),
  };
}

export function flippedShape(shape: Shape, axis: 'horizontal' | 'vertical'): Shape {
  const bbox = bboxOfRings(shape.points);
  const center = { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h / 2 };
  return { ...shape, points: flipRings(shape.points, axis, center) };
}

export function translatedShape(shape: Shape, dx: number, dy: number): Shape {
  return { ...shape, points: translateRings(shape.points, dx, dy) };
}

export function reorderedShapes(
  shapes: Shape[],
  id: string,
  direction: 'front' | 'back' | 'forward' | 'backward',
): Shape[] {
  const idx = shapes.findIndex((sh) => sh.id === id);
  if (idx === -1) return shapes;
  const next = shapes.slice();
  const [item] = next.splice(idx, 1);
  let targetIdx: number;
  switch (direction) {
    case 'front':    targetIdx = next.length; break;
    case 'back':     targetIdx = 0; break;
    case 'forward':  targetIdx = Math.min(next.length, idx + 1); break;
    case 'backward': targetIdx = Math.max(0, idx - 1); break;
  }
  next.splice(targetIdx, 0, item);
  return next;
}

export function withTransformPatch(shape: Shape, patch: Partial<ShapeTransform>): Shape {
  return { ...shape, transform: { ...(shape.transform ?? IDENTITY_TRANSFORM), ...patch } };
}

export function withRotationDelta(shape: Shape, deltaDegrees: number): Shape {
  const current = shape.transform ?? IDENTITY_TRANSFORM;
  const rotation = ((current.rotation + deltaDegrees) % 360 + 360) % 360;
  return { ...shape, transform: { ...current, rotation } };
}

// Returns null when the cutter doesn't overlap any shape, so callers can skip
// the history push instead of recording a no-op edit.
export function applyCutout(shapes: Shape[], cutterPoints: Point[]): Shape[] | null {
  let targetIndex = -1;
  for (let i = shapes.length - 1; i >= 0; i--) {
    // Open paths (lines/arrows) have no interior to subtract from — skip them.
    if (shapes[i].closed === false) continue;
    if (shapesOverlap(shapes[i], cutterPoints)) {
      targetIndex = i;
      break;
    }
  }
  if (targetIndex === -1) return null;
  const resultShapes = subtractFromShape(shapes[targetIndex], cutterPoints);
  return [
    ...shapes.slice(0, targetIndex),
    ...resultShapes,
    ...shapes.slice(targetIndex + 1),
  ];
}
