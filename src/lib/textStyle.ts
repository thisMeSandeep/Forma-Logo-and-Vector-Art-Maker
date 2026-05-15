import type { TextItem } from '../types';
import { gradientEndpoints } from './shapeStyle';

const LINEAR_PREFIX = 'text-gradient-';
const RADIAL_PREFIX = 'text-radial-';
const PATTERN_PREFIX = 'text-pattern-';

export function textLinearId(text: TextItem)  { return `${LINEAR_PREFIX}${text.id}`; }
export function textRadialId(text: TextItem)  { return `${RADIAL_PREFIX}${text.id}`; }
export function textPatternId(text: TextItem) { return `${PATTERN_PREFIX}${text.id}`; }

export function textFillKind(text: TextItem) {
  return text.fillKind ?? 'solid';
}

// Resolves the SVG `fill` attribute value (either a color or a `url(#id)` ref).
export function textFillRef(text: TextItem): string {
  switch (textFillKind(text)) {
    case 'linear': return text.fillGradient ? `url(#${textLinearId(text)})`  : text.fill;
    case 'radial': return text.fillRadial   ? `url(#${textRadialId(text)})`  : text.fill;
    case 'image':  return text.fillImage    ? `url(#${textPatternId(text)})` : text.fill;
    case 'solid':
    default:       return text.fill;
  }
}

// Markup pieces for export and React-side rendering.
export type TextDefPiece = { id: string; markup: string };

export function textDefsMarkup(text: TextItem): TextDefPiece[] {
  const pieces: TextDefPiece[] = [];
  const kind = textFillKind(text);

  if (kind === 'linear' && text.fillGradient) {
    const { from, to, angle } = text.fillGradient;
    const { x1, y1, x2, y2 } = gradientEndpoints(angle);
    const id = textLinearId(text);
    pieces.push({
      id,
      markup:
        `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
        `<stop offset="0%" stop-color="${from}" />` +
        `<stop offset="100%" stop-color="${to}" />` +
        `</linearGradient>`,
    });
  }
  if (kind === 'radial' && text.fillRadial) {
    const { from, to } = text.fillRadial;
    const id = textRadialId(text);
    pieces.push({
      id,
      markup:
        `<radialGradient id="${id}" cx="0.5" cy="0.5" r="0.5">` +
        `<stop offset="0%" stop-color="${from}" />` +
        `<stop offset="100%" stop-color="${to}" />` +
        `</radialGradient>`,
    });
  }
  if (kind === 'image' && text.fillImage) {
    // objectBoundingBox + slice fits the image into the text's bbox without distortion.
    const id = textPatternId(text);
    pieces.push({
      id,
      markup:
        `<pattern id="${id}" patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" width="1" height="1">` +
        `<image href="${text.fillImage.dataUrl}" x="0" y="0" width="1" height="1" preserveAspectRatio="xMidYMid slice" />` +
        `</pattern>`,
    });
  }
  return pieces;
}
