import type { TextItem } from '../types';
import {
  type BBox,
  type ShapeMatrix,
  transformToMatrix,
  transformToString,
} from './geometry';

// Width estimate matches TextLayer/exportUtils so handles, drag bbox and export
// agree on the text's footprint. Keep the multipliers in sync if any of these
// change.
export function estimateTextWidth(text: TextItem): number {
  const tracking = text.letterSpacing ?? 0;
  const base = Math.max(text.fontSize * 2, text.content.length * text.fontSize * 0.62);
  return base + Math.max(0, text.content.length - 1) * tracking;
}

export function textAnchorOffset(anchor: TextItem['anchor'], width: number): number {
  if (anchor === 'middle') return -width / 2;
  if (anchor === 'end') return -width;
  return 0;
}

// Local (un-transformed) bbox in world coordinates.
export function textBBox(text: TextItem): BBox {
  const w = estimateTextWidth(text);
  const x = text.x + textAnchorOffset(text.anchor, w);
  const y = text.y - text.fontSize;
  return { x, y, w, h: text.fontSize * 1.4 };
}

export function textPivot(text: TextItem): { cx: number; cy: number } {
  const b = textBBox(text);
  return { cx: b.x + b.w / 2, cy: b.y + b.h / 2 };
}

export function textTransformString(text: TextItem): string {
  const { cx, cy } = textPivot(text);
  return transformToString(text.transform, cx, cy);
}

export function textMatrix(text: TextItem): ShapeMatrix {
  const { cx, cy } = textPivot(text);
  return transformToMatrix(text.transform, cx, cy);
}
