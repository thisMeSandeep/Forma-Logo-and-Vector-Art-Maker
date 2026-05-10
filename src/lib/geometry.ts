import { ISO_ANGLE_DEG } from '../config/constants';
import type { Point } from '../types';

export function snapToSquare(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

// TODO: Step 7 — implement proper isometric snapping
export function snapToIsometric(point: Point, gridSize: number): Point {
  const angleRad = (ISO_ANGLE_DEG * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  // Transform to isometric basis, round, transform back
  const u = (point.x * cos + point.y * sin) / gridSize;
  const v = (-point.x * sin + point.y * cos) / gridSize;
  const ru = Math.round(u);
  const rv = Math.round(v);

  return {
    x: (ru * cos - rv * sin) * gridSize,
    y: (ru * sin + rv * cos) * gridSize,
  };
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
