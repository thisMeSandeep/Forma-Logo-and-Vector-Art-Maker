import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { snapToSquare, snapToIsometric, distance } from '../lib/geometry';
import { CLOSE_SNAP_RADIUS, ZOOM_WHEEL_FACTOR } from '../config/constants';
import { screenToWorld } from './useViewBox';
import type { Shape, TextItem } from '../types';

export function useCanvasEvents(
  svgRef: React.RefObject<SVGSVGElement | null>,
  crosshairRef: React.RefObject<SVGGElement | null>,
  zoomAt: (worldX: number, worldY: number, factor: number) => void,
  panBy: (dScreenX: number, dScreenY: number) => void,
) {
  const setCursorPoint = useAppStore((s) => s.setCursorPoint);

  // Stable refs so pointer handlers never go stale without re-attaching
  const gridSizeRef    = useRef(useAppStore.getState().gridSize);
  const gridModeRef    = useRef(useAppStore.getState().gridMode);
  const fillColorRef   = useRef(useAppStore.getState().fillColor);
  const strokeColorRef = useRef(useAppStore.getState().strokeColor);
  const strokeWidthRef = useRef(useAppStore.getState().strokeWidth);
  const cornerRadiusRef = useRef(useAppStore.getState().cornerRadius);
  const textFontFamilyRef = useRef(useAppStore.getState().textFontFamily);
  const textFontSizeRef = useRef(useAppStore.getState().textFontSize);
  const textFontWeightRef = useRef(useAppStore.getState().textFontWeight);
  const textFillRef = useRef(useAppStore.getState().textFill);
  const textAnchorRef = useRef(useAppStore.getState().textAnchor);
  const activeToolRef  = useRef(useAppStore.getState().activeTool);

  // Refs for stable callbacks (these don't change identity after mount)
  const zoomAtRef = useRef(zoomAt);
  const panByRef  = useRef(panBy);
  useEffect(() => { zoomAtRef.current = zoomAt; }, [zoomAt]);
  useEffect(() => { panByRef.current  = panBy; }, [panBy]);

  // Middle-mouse pan state
  const isPanningRef    = useRef(false);
  const lastPanPosRef   = useRef({ x: 0, y: 0 });

  useEffect(() =>
    useAppStore.subscribe((s) => {
      gridSizeRef.current    = s.gridSize;
      gridModeRef.current    = s.gridMode;
      fillColorRef.current   = s.fillColor;
      strokeColorRef.current = s.strokeColor;
      strokeWidthRef.current = s.strokeWidth;
      cornerRadiusRef.current = s.cornerRadius;
      textFontFamilyRef.current = s.textFontFamily;
      textFontSizeRef.current = s.textFontSize;
      textFontWeightRef.current = s.textFontWeight;
      textFillRef.current = s.textFill;
      textAnchorRef.current = s.textAnchor;
      activeToolRef.current  = s.activeTool;
    }),
  []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Map a client-space pointer position to SVG world coordinates
    function getWorldPoint(e: { clientX: number; clientY: number }) {
      const rect = svg!.getBoundingClientRect();
      const vb = useAppStore.getState().viewBox;
      return screenToWorld(e.clientX, e.clientY, rect, vb);
    }

    function isTextInteraction(e: PointerEvent) {
      return e.target instanceof Element && e.target.closest('[data-text-interaction="true"]');
    }

    function isShapeInteraction(e: PointerEvent) {
      return e.target instanceof Element && e.target.closest('[data-shape-interaction="true"]');
    }

    function onPointerMove(e: PointerEvent) {
      // --- Pan continuation (middle-mouse held) ---
      if (isPanningRef.current) {
        const dx = e.clientX - lastPanPosRef.current.x;
        const dy = e.clientY - lastPanPosRef.current.y;
        panByRef.current(dx, dy);
        lastPanPosRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      const world = getWorldPoint(e);
      const snap  = gridModeRef.current === 'square' ? snapToSquare : snapToIsometric;
      let snapped = snap(world, gridSizeRef.current);

      // Lock snap onto first point when near it so closing is pixel-perfect
      const { previewPoints } = useAppStore.getState();
      if (previewPoints.length >= 3) {
        const first = previewPoints[0];
        if (distance(snapped, first) < CLOSE_SNAP_RADIUS) snapped = first;
      }

      // Move crosshair in world space, scaled so arms stay a fixed pixel size
      if (crosshairRef.current) {
        if (activeToolRef.current === 'draw' || activeToolRef.current === 'cutout') {
          const rect = svg!.getBoundingClientRect();
          const vb   = useAppStore.getState().viewBox;
          // scale factor: 1 local unit = 1 screen pixel at any zoom level
          const s = vb.w / rect.width;
          crosshairRef.current.style.display = '';
          crosshairRef.current.setAttribute(
            'transform',
            `translate(${world.x},${world.y}) scale(${s})`,
          );
        } else {
          crosshairRef.current.style.display = 'none';
        }
      }

      setCursorPoint(snapped);
    }

    function onPointerLeave() {
      if (crosshairRef.current) crosshairRef.current.style.display = 'none';
      setCursorPoint(null);
    }

    function onPointerDown(e: PointerEvent) {
      // Middle mouse → start pan
      if (e.button === 1) {
        e.preventDefault();
        isPanningRef.current  = true;
        lastPanPosRef.current = { x: e.clientX, y: e.clientY };
        svg!.setPointerCapture(e.pointerId);
        return;
      }

      // Only primary button handles drawing
      if (e.button !== 0) return;

      if (isTextInteraction(e)) return;
      if (isShapeInteraction(e)) return;

      const world   = getWorldPoint(e);

      if (activeToolRef.current === 'text') {
        const text: TextItem = {
          id: crypto.randomUUID(),
          x: world.x,
          y: world.y,
          content: 'Text',
          fontSize: textFontSizeRef.current,
          fontFamily: textFontFamilyRef.current,
          fontWeight: textFontWeightRef.current,
          fill: textFillRef.current,
          anchor: textAnchorRef.current,
        };
        useAppStore.getState().addText(text);
        setCursorPoint(null);
        return;
      }

      if (activeToolRef.current === 'select') {
        // Click on bare canvas → clear both selections. Clicks that land on a
        // shape or text never reach here because those layers stopPropagation.
        useAppStore.getState().setSelectedTextId(null);
        useAppStore.getState().setSelectedShapeId(null);
        return;
      }

      const snap    = gridModeRef.current === 'square' ? snapToSquare : snapToIsometric;
      const snapped = snap(world, gridSizeRef.current);
      const { previewPoints, addShape, setPreviewPoints } = useAppStore.getState();

      // Close polygon when clicking near the first point (min 3 points)
      if (
        previewPoints.length >= 3 &&
        distance(snapped, previewPoints[0]) < CLOSE_SNAP_RADIUS
      ) {
        if (activeToolRef.current === 'cutout') {
          useAppStore.getState().cutoutShape(previewPoints);
        } else {
          const shape: Shape = {
            id: crypto.randomUUID(),
            points: [previewPoints],
            fill:        fillColorRef.current,
            stroke:      strokeColorRef.current,
            strokeWidth: strokeWidthRef.current,
            cornerRadius: cornerRadiusRef.current,
            type: 'draw',
          };
          addShape(shape);
        }
        setPreviewPoints([]);
        return;
      }

      setPreviewPoints([...previewPoints, snapped]);
    }

    function onPointerUp(e: PointerEvent) {
      if (e.button === 1 && isPanningRef.current) {
        isPanningRef.current = false;
        svg!.releasePointerCapture(e.pointerId);
      }
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const world  = getWorldPoint(e);
      const factor = e.deltaY < 0 ? ZOOM_WHEEL_FACTOR : 1 / ZOOM_WHEEL_FACTOR;
      zoomAtRef.current(world.x, world.y, factor);
    }

    svg.addEventListener('pointermove',  onPointerMove);
    svg.addEventListener('pointerleave', onPointerLeave);
    svg.addEventListener('pointerdown',  onPointerDown);
    svg.addEventListener('pointerup',    onPointerUp);
    // passive:false so we can preventDefault and suppress browser scroll/zoom
    svg.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      svg.removeEventListener('pointermove',  onPointerMove);
      svg.removeEventListener('pointerleave', onPointerLeave);
      svg.removeEventListener('pointerdown',  onPointerDown);
      svg.removeEventListener('pointerup',    onPointerUp);
      svg.removeEventListener('wheel', onWheel);
    };
  }, [svgRef, crosshairRef, setCursorPoint]);
}
