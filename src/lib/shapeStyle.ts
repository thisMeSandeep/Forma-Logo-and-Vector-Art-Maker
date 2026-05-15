import type { Shape } from '../types';
import { bboxOfRings } from './geometry';

const FILTER_PREFIX = 'shape-filter-';
const GRADIENT_PREFIX = 'shape-gradient-';
const PATTERN_PREFIX = 'shape-pattern-';

export function shapeFilterId(shape: Shape) {
  return `${FILTER_PREFIX}${shape.id}`;
}
export function shapeGradientId(shape: Shape) {
  return `${GRADIENT_PREFIX}${shape.id}`;
}
export function shapePatternId(shape: Shape) {
  return `${PATTERN_PREFIX}${shape.id}`;
}

export function shapeNeedsFilter(shape: Shape): boolean {
  return !!(shape.shadow && shape.shadow !== null) || (shape.blur ?? 0) > 0;
}
export function shapeUsesGradient(shape: Shape): boolean {
  return shape.fillKind === 'linear' && !!shape.fillGradient;
}
export function shapeUsesImage(shape: Shape): boolean {
  return shape.fillKind === 'image' && !!shape.fillImage;
}

// Resolves the SVG `fill` attribute value for a closed shape. Open shapes
// always render fill=none and never reach here.
export function shapeFillRef(shape: Shape): string {
  if (shape.fillKind === 'none') return 'none';
  if (shapeUsesGradient(shape)) return `url(#${shapeGradientId(shape)})`;
  if (shapeUsesImage(shape))    return `url(#${shapePatternId(shape)})`;
  return shape.fill;
}

// stroke-dasharray scales with strokeWidth so dotted/dashed look the same
// across thin and thick strokes.
export function strokeDashArray(shape: Shape): string | undefined {
  const w = Math.max(0.5, shape.strokeWidth);
  switch (shape.strokeStyle) {
    case 'dashed': return `${w * 4} ${w * 3}`;
    case 'dotted': return `${w * 0.1} ${w * 2}`;
    case 'solid':
    case undefined:
    default:       return undefined;
  }
}

// stroke-linecap=round makes the dotted-style dashes render as actual dots
// (a 0-length dash needs round caps to be visible at all).
export function strokeLinecap(shape: Shape): 'round' | undefined {
  if (shape.strokeStyle === 'dotted') return 'round';
  return shape.closed === false ? 'round' : undefined;
}

// Linear gradient endpoints in objectBoundingBox space (0–1 along each axis),
// computed from the gradient's angle in degrees.
export function gradientEndpoints(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  // Project a unit vector onto the bbox; clip to the [0,1] square via a centered
  // formulation so the gradient runs corner-to-corner regardless of aspect.
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const x1 = 0.5 - cos / 2;
  const y1 = 0.5 - sin / 2;
  const x2 = 0.5 + cos / 2;
  const y2 = 0.5 + sin / 2;
  return { x1, y1, x2, y2 };
}

// SVG attributes (camelCase for React JSX) — what to spread on the <path>.
export function shapeStylingAttrs(shape: Shape, baseFillOpacity?: number) {
  const closed = shape.closed ?? true;
  const fillColor = closed ? shapeFillRef(shape) : 'none';
  return {
    fill: fillColor,
    fillOpacity: closed ? baseFillOpacity : undefined,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    strokeDasharray: strokeDashArray(shape),
    strokeLinejoin: 'round' as const,
    strokeLinecap: strokeLinecap(shape),
    opacity: shape.opacity,
    filter: shapeNeedsFilter(shape) ? `url(#${shapeFilterId(shape)})` : undefined,
  };
}

// Returns a string of SVG defs markup (for export) and an array of React-shaped
// defs definitions (for in-app rendering). For in-app we render React directly
// below, so this helper is shared by both.
type FilterPiece = { id: string; markup: string };

export function shapeDefsMarkup(shape: Shape): FilterPiece[] {
  const pieces: FilterPiece[] = [];

  if (shapeNeedsFilter(shape)) {
    const shadow = shape.shadow;
    const blur = shape.blur ?? 0;
    const parts: string[] = [];
    if (shadow) {
      // feDropShadow renders the shadow underneath; subsequent merge stacks the
      // original graphic on top via the default SourceGraphic.
      parts.push(
        `<feDropShadow dx="${shadow.x}" dy="${shadow.y}" stdDeviation="${shadow.blur / 2}" flood-color="${shadow.color}" />`,
      );
    }
    if (blur > 0) {
      parts.push(`<feGaussianBlur stdDeviation="${blur}" />`);
    }
    // Widen the filter region so shadows aren't clipped.
    const region = ' x="-50%" y="-50%" width="200%" height="200%"';
    pieces.push({
      id: shapeFilterId(shape),
      markup: `<filter id="${shapeFilterId(shape)}"${region}>${parts.join('')}</filter>`,
    });
  }

  if (shapeUsesGradient(shape) && shape.fillGradient) {
    const { from, to, angle } = shape.fillGradient;
    const { x1, y1, x2, y2 } = gradientEndpoints(angle);
    // objectBoundingBox is the default for linearGradient.
    pieces.push({
      id: shapeGradientId(shape),
      markup:
        `<linearGradient id="${shapeGradientId(shape)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
        `<stop offset="0%" stop-color="${from}" />` +
        `<stop offset="100%" stop-color="${to}" />` +
        `</linearGradient>`,
    });
  }
  if (shapeUsesImage(shape) && shape.fillImage) {
    // objectBoundingBox + slice fits the image into the shape's bbox without
    // distortion. Mirrors textPattern rendering.
    pieces.push({
      id: shapePatternId(shape),
      markup:
        `<pattern id="${shapePatternId(shape)}" patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" width="1" height="1">` +
        `<image href="${shape.fillImage.dataUrl}" x="0" y="0" width="1" height="1" preserveAspectRatio="xMidYMid slice" />` +
        `</pattern>`,
    });
  }
  return pieces;
}

// For per-shape gradient computation that needs the shape's bbox in user space
// (e.g., to override gradientUnits if we ever switch). Currently we use
// objectBoundingBox so this isn't needed at render time — kept for parity.
export function shapeWorldBBox(shape: Shape) {
  return bboxOfRings(shape.points);
}
