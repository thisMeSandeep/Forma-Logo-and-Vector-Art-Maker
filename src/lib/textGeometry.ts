import type { TextItem } from '../types';
import {
  type BBox,
  type ShapeMatrix,
  transformToMatrix,
  transformToString,
} from './geometry';
import { measureText } from './textMeasure';

// Re-exported for callers that need just the width (TextLayer's edit input
// sizing, etc). Uses the canvas-measured value so dropping a 200px display
// face no longer overflows the selection rect.
export function estimateTextWidth(text: TextItem): number {
  return measureText(text).width;
}

export function textAnchorOffset(anchor: TextItem['anchor'], width: number): number {
  if (anchor === 'middle') return -width / 2;
  if (anchor === 'end') return -width;
  return 0;
}

// Vertical extent relative to `text.y` for a given dominant-baseline. SVG's
// baseline keywords change what `y` *means* (alphabetic = baseline, hanging =
// top edge, middle = vertical center, ideographic ≈ bottom), so the bbox top
// has to adjust accordingly. Returns the offset from `text.y` to the bbox top.
function topOffsetForBaseline(
  baseline: TextItem['baseline'],
  ascent: number,
  descent: number,
): number {
  switch (baseline) {
    case 'hanging':     return 0;
    case 'middle':      return -(ascent + descent) / 2;
    case 'ideographic': return -(ascent + descent);
    case 'alphabetic':
    default:            return -ascent;
  }
}

// Local (un-transformed) bbox in world coordinates. Pixel-accurate via canvas
// measureText, so the selection rect and export bbox both fully contain the
// rendered glyphs regardless of font face or size.
export function textBBox(text: TextItem): BBox {
  const { width, ascent, descent, height } = measureText(text);
  const x = text.x + textAnchorOffset(text.anchor, width);
  const top = text.y + topOffsetForBaseline(text.baseline, ascent, descent);
  // Small horizontal padding to keep italic flourishes and slight stroke
  // overshoot from clipping at the bbox edge during export.
  const pad = Math.max(1, text.fontSize * 0.05);
  // If a stroke is applied, half its width sticks out past the glyph outline.
  const strokeBleed = (text.strokeWidth ?? 0) > 0 ? (text.strokeWidth ?? 0) / 2 : 0;
  const xPad = pad + strokeBleed;
  const yPad = strokeBleed;
  return {
    x: x - xPad,
    y: top - yPad,
    w: width + xPad * 2,
    h: height + yPad * 2,
  };
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
