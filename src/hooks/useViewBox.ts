import { useLayoutEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ZOOM_MIN, ZOOM_MAX, PAN_SPEED } from '../config/constants';
import type { ViewBox } from '../types';

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Converts a screen-space client position to SVG world coordinates
export function screenToWorld(
  clientX: number,
  clientY: number,
  svgRect: DOMRect,
  vb: ViewBox,
): { x: number; y: number } {
  return {
    x: vb.x + ((clientX - svgRect.left) / svgRect.width) * vb.w,
    y: vb.y + ((clientY - svgRect.top) / svgRect.height) * vb.h,
  };
}

export function useViewBox(svgRef: React.RefObject<SVGSVGElement | null>) {
  const vb = useAppStore((s) => s.viewBox);
  const initialViewBox = useAppStore((s) => s.initialViewBox);
  const setViewBox = useAppStore((s) => s.setViewBox);
  const setInitialViewBox = useAppStore((s) => s.setInitialViewBox);

  // Set real viewBox dimensions once the SVG has painted
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    if (width > 0 && height > 0) {
      const initial: ViewBox = { x: 0, y: 0, w: width, h: height };
      setInitialViewBox(initial);
      setViewBox(initial);
    }
  }, [svgRef, setViewBox, setInitialViewBox]);

  // Zoom centered on an arbitrary world point (used by wheel events)
  const zoomAt = useCallback(
    (worldX: number, worldY: number, factor: number) => {
      const prev = useAppStore.getState().viewBox;
      const base = useAppStore.getState().initialViewBox;
      const baseW = base?.w ?? prev.w;
      const newW = clamp(prev.w / factor, baseW / ZOOM_MAX, baseW / ZOOM_MIN);
      const scale = newW / prev.w;
      const newH = prev.h * scale;
      setViewBox({
        x: worldX - (worldX - prev.x) * scale,
        y: worldY - (worldY - prev.y) * scale,
        w: newW,
        h: newH,
      });
    },
    [setViewBox],
  );

  // Pan by a screen-pixel delta (used by middle-mouse drag)
  const panBy = useCallback(
    (dScreenX: number, dScreenY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const prev = useAppStore.getState().viewBox;
      const rect = svg.getBoundingClientRect();
      setViewBox({
        ...prev,
        x: prev.x - dScreenX * PAN_SPEED * (prev.w / rect.width),
        y: prev.y - dScreenY * PAN_SPEED * (prev.h / rect.height),
      });
    },
    [svgRef, setViewBox],
  );

  const zoom = initialViewBox ? initialViewBox.w / vb.w : 1;
  const viewBoxStr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;
  const isInitialized = initialViewBox !== null;

  return { vb, viewBoxStr, isInitialized, zoom, zoomAt, panBy };
}
