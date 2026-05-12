import type { Shape, TextItem } from '../types';
import { EXPORT_PADDING, EXPORT_PNG_SCALE } from '../config/constants';
import { roundedRingToD } from './svgPath';
import { bakedShapeRings } from './geometry';

function textWidth(text: TextItem) {
  return Math.max(text.fontSize * 2, text.content.length * text.fontSize * 0.62);
}

function textAnchorOffset(text: TextItem, width: number) {
  if (text.anchor === 'middle') return -width / 2;
  if (text.anchor === 'end') return -width;
  return 0;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Computes the axis-aligned bounding box over all canvas content
function getBoundingBox(
  shapes: Shape[],
  texts: TextItem[],
): { x: number; y: number; w: number; h: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const shape of shapes) {
    for (const ring of bakedShapeRings(shape)) {
      for (const pt of ring) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
    }
  }

  for (const text of texts) {
    const width = textWidth(text);
    const x = text.x + textAnchorOffset(text, width);
    const y = text.y - text.fontSize;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + text.fontSize * 1.4);
  }

  if (!Number.isFinite(minX)) {
    return { x: 0, y: 0, w: 1, h: 1 };
  }

  return {
    x: minX - EXPORT_PADDING,
    y: minY - EXPORT_PADDING,
    w: maxX - minX + EXPORT_PADDING * 2,
    h: maxY - minY + EXPORT_PADDING * 2,
  };
}

// Builds a standalone SVG string containing only the shapes (no grid)
function buildShapesSVG(shapes: Shape[], texts: TextItem[]): string {
  const { x, y, w, h } = getBoundingBox(shapes, texts);

  const pathMarkup = shapes
    .map((shape) => {
      const r = shape.cornerRadius ?? 0;
      // Bake the transform into world-space points so the export is a plain
      // path with no transform attribute — simpler for downstream consumers.
      const d = bakedShapeRings(shape).map((ring) => roundedRingToD(ring, r)).join(' ');
      return `  <path d="${d}" fill-rule="evenodd" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" stroke-linejoin="round" />`;
    })
    .join('\n');

  const textMarkup = texts
    .map((text) =>
      `  <text x="${text.x}" y="${text.y}" text-anchor="${text.anchor}" font-family="${escapeXml(text.fontFamily)}" font-size="${text.fontSize}" font-weight="${text.fontWeight}" fill="${escapeXml(text.fill)}">${escapeXml(text.content)}</text>`,
    )
    .join('\n');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">`,
    pathMarkup,
    textMarkup,
    `</svg>`,
  ].join('\n');
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export function exportSVG(shapes: Shape[], texts: TextItem[]): void {
  if (shapes.length === 0 && texts.length === 0) return;
  const svgString = buildShapesSVG(shapes, texts);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, 'forma-export.svg');
  URL.revokeObjectURL(url);
}

export function exportPNG(shapes: Shape[], texts: TextItem[]): void {
  if (shapes.length === 0 && texts.length === 0) return;
  const svgString = buildShapesSVG(shapes, texts);
  const { w, h } = getBoundingBox(shapes, texts);

  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    // Scale up so the PNG is crisp at display sizes
    canvas.width = w * EXPORT_PNG_SCALE;
    canvas.height = h * EXPORT_PNG_SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(EXPORT_PNG_SCALE, EXPORT_PNG_SCALE);
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    triggerDownload(canvas.toDataURL('image/png'), 'forma-export.png');
  };
  img.src = url;
}
