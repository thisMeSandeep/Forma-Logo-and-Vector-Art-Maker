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
  const gridSizeRef    = useRef(useAppStore.getState().gridSize);
  const gridModeRef    = useRef(useAppStore.getState().gridMode);
  const fillColorRef   = useRef(useAppStore.getState().fillColor);
  const strokeColorRef = useRef(useAppStore.getState().strokeColor);
  const strokeWidthRef = useRef(useAppStore.getState().strokeWidth);
  const activeToolRef  = useRef(useAppStore.getState().activeTool);

  useEffect(() =>
    useAppStore.subscribe((s) => {
      gridSizeRef.current    = s.gridSize;
      gridModeRef.current    = s.gridMode;
      fillColorRef.current   = s.fillColor;
      strokeColorRef.current = s.strokeColor;
      strokeWidthRef.current = s.strokeWidth;
      activeToolRef.current  = s.activeTool;
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
      let snapped = snap(raw, gridSizeRef.current);

      // When near the first point, lock the snap target exactly onto it so the
      // close click always lands at distance 0 — no need for pixel-perfect aim
      const { previewPoints } = useAppStore.getState();
      if (previewPoints.length >= 3) {
        const first = previewPoints[0];
        if (distance(snapped, first) < CLOSE_SNAP_RADIUS) {
          snapped = first;
        }
      }

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
      // Read transient state fresh — actions are stable Zustand references
      const { previewPoints, addShape, setPreviewPoints } = useAppStore.getState();

      // Close polygon when clicking near the first point (min 3 points for valid polygon)
      if (
        previewPoints.length >= 3 &&
        distance(snapped, previewPoints[0]) < CLOSE_SNAP_RADIUS
      ) {
        if (activeToolRef.current === 'cutout') {
          // Boolean subtract: let the store find the target shape and diff it
          useAppStore.getState().cutoutShape(previewPoints);
        } else {
          const shape: Shape = {
            id: crypto.randomUUID(),
            points: [previewPoints],  // outer ring; inner rings added by cutout ops
            fill: fillColorRef.current,
            stroke: strokeColorRef.current,
            strokeWidth: strokeWidthRef.current,
            type: 'draw',
          };
          addShape(shape);
        }
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
