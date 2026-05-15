import type { TextItem } from '../types';

// Shared <canvas> 2D context for measuring glyph extents. measureText() with
// actualBoundingBox* attributes gives us pixel-accurate ascent/descent/width
// per font family + weight + size, which is what we need so the selection
// rect and export bbox match what the user actually sees on canvas.
let ctxRef: CanvasRenderingContext2D | null = null;
function getCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (ctxRef) return ctxRef;
  const canvas = document.createElement('canvas');
  ctxRef = canvas.getContext('2d');
  return ctxRef;
}

// Tiny LRU keyed on the inputs that affect metrics. Measurement is fast but
// runs on every render path, so caching keeps it negligible at scale.
const CACHE = new Map<string, TextMetricsResult>();
const CACHE_MAX = 256;

export type TextMetricsResult = {
  width: number;
  ascent: number;     // distance from baseline up to the top of the tallest glyph
  descent: number;    // distance from baseline down to the lowest descender
  // Convenience: total typographic height (ascent + descent).
  height: number;
};

function cacheKey(text: TextItem): string {
  return [
    text.content,
    text.fontFamily,
    text.fontSize,
    text.fontWeight,
    text.italic ? 1 : 0,
    text.letterSpacing ?? 0,
  ].join('|');
}

// Fallback used when canvas measurement isn't possible (SSR) or measureText
// returns degenerate values (fonts not loaded yet on first paint).
function rough(text: TextItem): TextMetricsResult {
  const tracking = text.letterSpacing ?? 0;
  const w = Math.max(
    text.fontSize * 2,
    text.content.length * text.fontSize * 0.62,
  ) + Math.max(0, text.content.length - 1) * tracking;
  return {
    width: w,
    // Roughly approximates typographic metrics for most fonts.
    ascent: text.fontSize * 0.85,
    descent: text.fontSize * 0.25,
    height: text.fontSize * 1.1,
  };
}

export function measureText(text: TextItem): TextMetricsResult {
  const key = cacheKey(text);
  const cached = CACHE.get(key);
  if (cached) {
    // Touch for LRU: re-insert at end
    CACHE.delete(key);
    CACHE.set(key, cached);
    return cached;
  }

  const ctx = getCtx();
  if (!ctx) return rough(text);

  // Canvas `font` is shorthand: style weight size family. textBaseline=alphabetic
  // matches SVG's default so y-coordinates from measureText line up with our
  // rendered <text>.
  const style = text.italic ? 'italic ' : '';
  ctx.font = `${style}${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`;
  ctx.textBaseline = 'alphabetic';
  // letterSpacing isn't part of the `font` shorthand. Use the ctx property
  // where supported; we manually add the tracking sum below regardless, since
  // not every browser/version honors ctx.letterSpacing.
  try {
    (ctx as unknown as { letterSpacing?: string }).letterSpacing = `${text.letterSpacing ?? 0}px`;
  } catch {
    // ignore — older browsers
  }

  const m = ctx.measureText(text.content);
  // Width: prefer the actual-bounding-box variant when both sides are present
  // (it accounts for italic overhang etc), otherwise fall back to m.width.
  const widthFromGlyphs = (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0);
  const baseWidth = widthFromGlyphs > 0 ? widthFromGlyphs : m.width;
  // Apply tracking manually so the result is consistent across browsers.
  const tracking = text.letterSpacing ?? 0;
  const width = baseWidth + Math.max(0, text.content.length - 1) * tracking;

  const ascent = m.actualBoundingBoxAscent || text.fontSize * 0.85;
  const descent = m.actualBoundingBoxDescent || text.fontSize * 0.25;

  // Empty string: still give the bbox a minimum footprint so handles render.
  if (text.content.length === 0) {
    const fallback = rough(text);
    CACHE.set(key, fallback);
    return fallback;
  }

  const result: TextMetricsResult = {
    width,
    ascent,
    descent,
    height: ascent + descent,
  };

  if (CACHE.size >= CACHE_MAX) {
    const firstKey = CACHE.keys().next().value as string | undefined;
    if (firstKey) CACHE.delete(firstKey);
  }
  CACHE.set(key, result);
  return result;
}

// Clears the cache. Called when web fonts finish loading so metrics get
// re-measured against the actual face instead of the system fallback.
export function clearTextMeasureCache() {
  CACHE.clear();
}
