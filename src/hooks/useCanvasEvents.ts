import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { snapToSquare, snapToIsometric, distance } from '../lib/geometry';
import { CLOSE_SNAP_RADIUS } from '../config/constants';
import type { Shape } from '../types';

export function useCanvasEvents(
  svgRef: React.RefObject<SVGSVGElement | null>,
  crosshairRef: React.RefObject<SVGGElement | null>,
) {
  const setCursorPoint = useAppStore((s) => s.setCursorPoint);

  // Refs so pointer handlers never go stale without re-attaching
  const gridSizeRef = useRef(useAppStore.getState().gridSize);
  const gridModeRef = useRef(useAppStore.getState().gridMode);

  useEffect(() =>
    useAppStore.subscribe((s) => {
      gridSizeRef.current = s.gridSize;
      gridModeRef.current = s.gridMode;
    }),
  []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function getRawPoint(e: PointerEvent) {
      const rect = svg!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onPointerMove(e: PointerEvent) {
      const raw = getRawPoint(e);
      const snap = gridModeRef.current === 'square' ? snapToSquare : snapToIsometric;
      const snapped = snap(raw, gridSizeRef.current);

      // Move crosshair directly — bypasses React, no re-render on every frame
      if (crosshairRef.current) {
        crosshairRef.current.style.display = '';
        crosshairRef.current.setAttribute('transform', `translate(${raw.x},${raw.y})`);
      }

      // Snapped point drives rubber-band line and close indicator via React
      setCursorPoint(snapped);
    }

    function onPointerLeave() {
      if (crosshairRef.current) crosshairRef.current.style.display = 'none';
      setCursorPoint(null);
    }

    function onPointerDown(e: PointerEvent) {
      // Only respond to primary button (left click)
      if (e.button !== 0) return;

      const raw = getRawPoint(e);
      const snap = gridModeRef.current === 'square' ? snapToSquare : snapToIsometric;
      const snapped = snap(raw, gridSizeRef.current);
      const {
        previewPoints,
        activeTool,
        fillColor,
        strokeColor,
        strokeWidth,
        addShape,
        setPreviewPoints,
      } = useAppStore.getState();

      // Close polygon when clicking near the first point (min 3 points for valid polygon)
      if (
        previewPoints.length >= 3 &&
        distance(snapped, previewPoints[0]) < CLOSE_SNAP_RADIUS
      ) {
        const shape: Shape = {
          id: crypto.randomUUID(),
          points: previewPoints,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          type: activeTool === 'cutout' ? 'cutout' : 'draw',
        };
        addShape(shape);
        setPreviewPoints([]);
        return;
      }

      // Otherwise extend the in-progress polygon
      setPreviewPoints([...previewPoints, snapped]);
    }

    svg.addEventListener('pointermove', onPointerMove);
    svg.addEventListener('pointerleave', onPointerLeave);
    svg.addEventListener('pointerdown', onPointerDown);
    return () => {
      svg.removeEventListener('pointermove', onPointerMove);
      svg.removeEventListener('pointerleave', onPointerLeave);
      svg.removeEventListener('pointerdown', onPointerDown);
    };
  }, [svgRef, crosshairRef, setCursorPoint]);
}
