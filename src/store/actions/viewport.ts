import type { ViewBox } from '../../types';
import { ZOOM_MIN, ZOOM_MAX } from '../../config/constants';

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Zoom around the viewBox center by `factor` (>1 zooms in).
export function zoomedViewBoxCenter(
  vb: ViewBox,
  initial: ViewBox | null,
  factor: number,
): ViewBox {
  const baseW = initial?.w ?? vb.w;
  const newW = clamp(vb.w / factor, baseW / ZOOM_MAX, baseW / ZOOM_MIN);
  const scale = newW / vb.w;
  const newH = vb.h * scale;
  const cx = vb.x + vb.w / 2;
  const cy = vb.y + vb.h / 2;
  return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
}
