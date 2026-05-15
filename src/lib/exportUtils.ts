import type { Shape, TextItem } from '../types';
import { EXPORT_PADDING, EXPORT_PNG_SCALE } from '../config/constants';
import { roundedRingToD, openRingToD } from './svgPath';
import { bakedShapeRings } from './geometry';
import {
  shapeDefsMarkup,
  shapeFilterId,
  shapeGradientId,
  shapeNeedsFilter,
  shapeUsesGradient,
  strokeDashArray,
  strokeLinecap,
} from './shapeStyle';
import { textDefsMarkup, textFillRef } from './textStyle';
import { textBBox, textMatrix, textTransformString } from './textGeometry';
import { applyShapeMatrix } from './geometry';

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
    // Project the four corners of the local text bbox through its transform
    // so rotated/scaled text contributes its actual visual bounds.
    const b = textBBox(text);
    const m = textMatrix(text);
    const corners = [
      { x: b.x,         y: b.y },
      { x: b.x + b.w,   y: b.y },
      { x: b.x + b.w,   y: b.y + b.h },
      { x: b.x,         y: b.y + b.h },
    ].map((p) => applyShapeMatrix(m, p));
    for (const p of corners) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
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

  // Collect per-shape filter/gradient defs alongside the shared arrowhead marker.
  const hasArrow = shapes.some((s) => s.arrowEnd);
  const arrowMarker =
    '<marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke" /></marker>';
  const shapeDefs = shapes.flatMap((sh) => shapeDefsMarkup(sh)).map((p) => p.markup).join('');
  const textDefs  = texts.flatMap((t)  => textDefsMarkup(t)).map((p) => p.markup).join('');
  const defsInner = (hasArrow ? arrowMarker : '') + shapeDefs + textDefs;
  const defsBlock = defsInner ? `  <defs>${defsInner}</defs>` : '';

  const pathMarkup = shapes
    .map((shape) => {
      const closed = shape.closed ?? true;
      const r = shape.cornerRadius ?? 0;
      // Bake the transform into world-space points so the export is a plain
      // path with no transform attribute — simpler for downstream consumers.
      const baked = bakedShapeRings(shape);
      const d = closed
        ? baked.map((ring) => roundedRingToD(ring, r)).join(' ')
        : openRingToD(baked[0]);

      const useGradient = closed && shapeUsesGradient(shape);
      const fillValue = closed
        ? (useGradient ? `url(#${shapeGradientId(shape)})` : shape.fill)
        : 'none';
      const fillAttr = `fill="${fillValue}"`;

      const markerAttr = shape.arrowEnd ? ` marker-end="url(#arrowhead)"` : '';
      const dash = strokeDashArray(shape);
      const dashAttr = dash ? ` stroke-dasharray="${dash}"` : '';
      const cap = strokeLinecap(shape);
      const capAttr = cap ? ` stroke-linecap="${cap}"` : '';
      const opacityAttr = shape.opacity != null && shape.opacity !== 1 ? ` opacity="${shape.opacity}"` : '';
      const filterAttr = shapeNeedsFilter(shape) ? ` filter="url(#${shapeFilterId(shape)})"` : '';

      return `  <path d="${d}" fill-rule="evenodd" ${fillAttr} stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" stroke-linejoin="round"${dashAttr}${capAttr}${opacityAttr}${filterAttr}${markerAttr} />`;
    })
    .join('\n');

  const textMarkup = texts
    .map((text) => {
      const italicAttr     = text.italic ? ` font-style="italic"` : '';
      const decorationAttr = text.decoration && text.decoration !== 'none'
        ? ` text-decoration="${text.decoration}"` : '';
      const trackingAttr   = text.letterSpacing
        ? ` letter-spacing="${text.letterSpacing}"` : '';
      const baselineAttr   = text.baseline && text.baseline !== 'alphabetic'
        ? ` dominant-baseline="${text.baseline}"` : '';
      const opacityAttr    = text.opacity != null && text.opacity !== 1
        ? ` opacity="${text.opacity}"` : '';
      const fillVal = textFillRef(text);
      // Gradients/patterns return `url(#id)` already valid for the attribute;
      // only escape user-supplied solid colors.
      const fillAttr = fillVal.startsWith('url(') ? fillVal : escapeXml(fillVal);
      const transformStr = textTransformString(text);
      const transformAttr = transformStr ? ` transform="${transformStr}"` : '';
      return `  <text x="${text.x}" y="${text.y}" text-anchor="${text.anchor}" font-family="${escapeXml(text.fontFamily)}" font-size="${text.fontSize}" font-weight="${text.fontWeight}"${italicAttr}${decorationAttr}${trackingAttr}${baselineAttr}${opacityAttr}${transformAttr} fill="${fillAttr}">${escapeXml(text.content)}</text>`;
    })
    .join('\n');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">`,
    defsBlock,
    pathMarkup,
    textMarkup,
    `</svg>`,
  ].filter(Boolean).join('\n');
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

export function exportPNG(shapes: Shape[], texts: TextItem[], scale: number = EXPORT_PNG_SCALE): void {
  if (shapes.length === 0 && texts.length === 0) return;
  const svgString = buildShapesSVG(shapes, texts);
  const { w, h } = getBoundingBox(shapes, texts);

  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    // Scale up so the PNG is crisp at display sizes
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    triggerDownload(canvas.toDataURL('image/png'), `forma-export@${scale}x.png`);
  };
  img.src = url;
}
