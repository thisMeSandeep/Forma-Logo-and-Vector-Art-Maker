import type { Shape, Point } from '../types';
import { EXPORT_PADDING, EXPORT_PNG_SCALE } from '../config/constants';

// Converts one ring of points to an SVG path data segment
function ringToD(ring: Point[]): string {
  if (ring.length < 2) return '';
  return (
    `M${ring[0].x},${ring[0].y} ` +
    ring.slice(1).map((p) => `L${p.x},${p.y}`).join(' ') +
    ' Z'
  );
}

// Computes the axis-aligned bounding box over all rings of all shapes
function getBoundingBox(shapes: Shape[]): { x: number; y: number; w: number; h: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const shape of shapes) {
    for (const ring of shape.points) {
      for (const pt of ring) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
    }
  }
  return {
    x: minX - EXPORT_PADDING,
    y: minY - EXPORT_PADDING,
    w: maxX - minX + EXPORT_PADDING * 2,
    h: maxY - minY + EXPORT_PADDING * 2,
  };
}

// Builds a standalone SVG string containing only the shapes (no grid)
function buildShapesSVG(shapes: Shape[]): string {
  const { x, y, w, h } = getBoundingBox(shapes);

  const pathMarkup = shapes
    .map((shape) => {
      const d = shape.points.map(ringToD).join(' ');
      return `  <path d="${d}" fill-rule="evenodd" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" />`;
    })
    .join('\n');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">`,
    pathMarkup,
    `</svg>`,
  ].join('\n');
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export function exportSVG(shapes: Shape[]): void {
  if (shapes.length === 0) return;
  const svgString = buildShapesSVG(shapes);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, 'forma-export.svg');
  URL.revokeObjectURL(url);
}

export function exportPNG(shapes: Shape[]): void {
  if (shapes.length === 0) return;
  const svgString = buildShapesSVG(shapes);
  const { w, h } = getBoundingBox(shapes);

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
