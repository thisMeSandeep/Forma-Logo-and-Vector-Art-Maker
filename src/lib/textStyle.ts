import type { TextEffect, TextItem } from '../types';
import { gradientEndpoints } from './shapeStyle';

const LINEAR_PREFIX = 'text-gradient-';
const RADIAL_PREFIX = 'text-radial-';
const PATTERN_PREFIX = 'text-pattern-';
const FILTER_PREFIX = 'text-filter-';

export function textLinearId(text: TextItem)  { return `${LINEAR_PREFIX}${text.id}`; }
export function textRadialId(text: TextItem)  { return `${RADIAL_PREFIX}${text.id}`; }
export function textPatternId(text: TextItem) { return `${PATTERN_PREFIX}${text.id}`; }
export function textFilterId(text: TextItem)  { return `${FILTER_PREFIX}${text.id}`; }

export function textNeedsFilter(text: TextItem): boolean {
  const e = text.effect;
  return !!e && e.kind !== 'none';
}

// Steps for stacked-offset effects. Cap stepping to a sane upper bound so
// extreme slider values don't bloat the filter graph.
const LONG_SHADOW_MAX_STEPS = 40;
const EXTRUDE_MAX_STEPS = 30;

// Builds the inner markup (children of <filter>) for the given effect.
// Used in both export (string) and render (via dangerouslySetInnerHTML) paths.
export function textEffectFilterInner(effect: TextEffect): string {
  switch (effect.kind) {
    case 'shadow':
      return `<feDropShadow dx="${effect.x}" dy="${effect.y}" stdDeviation="${effect.blur / 2}" flood-color="${effect.color}" />`;
    case 'blur':
      return `<feGaussianBlur stdDeviation="${effect.radius}" />`;
    case 'glow': {
      // Two stacked colored shadows at the origin — a tighter inner halo plus
      // a wider outer one — read as neon at most sizes.
      const r = Math.max(0.1, effect.radius);
      return (
        `<feDropShadow dx="0" dy="0" stdDeviation="${r}" flood-color="${effect.color}" />` +
        `<feDropShadow dx="0" dy="0" stdDeviation="${r / 2}" flood-color="${effect.color}" />`
      );
    }
    case 'long-shadow':
    case 'extrude': {
      const cap = effect.kind === 'long-shadow' ? LONG_SHADOW_MAX_STEPS : EXTRUDE_MAX_STEPS;
      const sliderVal = effect.kind === 'long-shadow' ? effect.length : effect.depth;
      const steps = Math.max(1, Math.min(cap, Math.round(sliderVal)));
      const rad = (effect.angle * Math.PI) / 180;
      const ux = Math.cos(rad);
      const uy = Math.sin(rad);
      let s = `<feFlood flood-color="${effect.color}" result="color" />`;
      const nodes: string[] = [];
      // Walk from far → near so nearer copies layer over farther ones, then
      // SourceGraphic sits on top of the entire stack.
      for (let i = steps; i >= 1; i--) {
        s += `<feOffset in="SourceAlpha" dx="${(ux * i).toFixed(3)}" dy="${(uy * i).toFixed(3)}" result="o${i}" />`;
        s += `<feComposite in="color" in2="o${i}" operator="in" result="c${i}" />`;
        nodes.push(`<feMergeNode in="c${i}"/>`);
      }
      s += `<feMerge>${nodes.join('')}<feMergeNode in="SourceGraphic"/></feMerge>`;
      return s;
    }
    case 'none':
    default:
      return '';
  }
}

export function textFillKind(text: TextItem) {
  return text.fillKind ?? 'solid';
}

// Dash pattern scales with stroke width so dashed/dotted look the same at any
// thickness. Mirrors strokeDashArray() in shapeStyle.ts.
export function textStrokeDashArray(text: TextItem): string | undefined {
  if (!text.strokeWidth || text.strokeWidth <= 0) return undefined;
  const w = Math.max(0.5, text.strokeWidth);
  switch (text.strokeStyle) {
    case 'dashed': return `${w * 4} ${w * 3}`;
    case 'dotted': return `${w * 0.1} ${w * 2}`;
    default:       return undefined;
  }
}

// Dotted needs round caps to be visible (a 0-length dash with butt caps draws nothing).
export function textStrokeLinecap(text: TextItem): 'round' | undefined {
  return text.strokeStyle === 'dotted' ? 'round' : undefined;
}

// Resolves the SVG `fill` attribute value (either a color, "none", or a `url(#id)` ref).
export function textFillRef(text: TextItem): string {
  switch (textFillKind(text)) {
    case 'none':   return 'none';
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
  if (textNeedsFilter(text) && text.effect) {
    const id = textFilterId(text);
    pieces.push({
      id,
      markup:
        `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">` +
        textEffectFilterInner(text.effect) +
        `</filter>`,
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
