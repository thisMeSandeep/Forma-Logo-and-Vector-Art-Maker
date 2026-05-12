import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { snapToSquare, snapToIsometric, distance } from '../lib/geometry';
import {
  rectanglePoints,
  ellipsePoints,
  regularPolygonPoints,
  starPoints,
  linePoints,
  squareConstrain,
} from '../lib/primitives';
import { CLOSE_SNAP_RADIUS, ZOOM_WHEEL_FACTOR } from '../config/constants';
import { screenToWorld } from './useViewBox';
import { isPrimitiveTool } from '../types';
import type { Point, Shape, TextItem, Tool } from '../types';

function buildPrimitiveShape(
  tool: Tool,
  start: Point,
  end: Point,
  style: { fill: string; stroke: string; strokeWidth: number; cornerRadius: number },
  options: { polygonSides: number; starPointCount: number; starInnerRatio: number },
): Shape | null {
  let ring: Point[];
  let closed = true;
  let arrowEnd = false;
  switch (tool) {
    case 'rectangle': ring = rectanglePoints(start, end); break;
    case 'ellipse':   ring = ellipsePoints(start, end); break;
    case 'polygon':   ring = regularPolygonPoints(start, end, options.polygonSides); break;
    case 'star':      ring = starPoints(start, end, options.starPointCount, options.starInnerRatio); break;
    case 'line':      ring = linePoints(start, end); closed = false; break;
    case 'arrow':     ring = linePoints(start, end); closed = false; arrowEnd = true; break;
    default: return null;
  }
  // Closed shapes need at least 3 points; open paths need 2.
  const minPoints = closed ? 3 : 2;
  if (ring.length < minPoints) return null;
  // Reject zero-length drags so a single click on the canvas is a no-op.
  if (!closed && ring[0].x === ring[1].x && ring[0].y === ring[1].y) return null;
  return {
    id: crypto.randomUUID(),
    points: [ring],
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    cornerRadius: style.cornerRadius,
    type: 'draw',
    closed,
    arrowEnd,
  };
}

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

    function shapeIdAt(e: PointerEvent): string | null {
      if (!(e.target instanceof Element)) return null;
      const el = e.target.closest('[data-shape-id]');
      return el?.getAttribute('data-shape-id') ?? null;
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
        const tool = activeToolRef.current;
        if (tool === 'draw' || tool === 'cutout' || isPrimitiveTool(tool)) {
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

      // Cmd/Ctrl+click on a shape selects it from any tool. Switches to select
      // so subsequent drags/edits work without a tool change.
      const shapeId = shapeIdAt(e);
      if (shapeId && (e.metaKey || e.ctrlKey) && e.button === 0) {
        e.preventDefault();
        const s = useAppStore.getState();
        s.setActiveTool('select');
        s.setSelectedShapeId(shapeId);
        return;
      }
      // In select mode, ShapeLayer's own React handler runs the drag-and-select.
      if (shapeId && activeToolRef.current === 'select') return;

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
        const s = useAppStore.getState();
        s.addText(text);
        s.setActiveTool('select');
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

      // Primitive tools: capture drag start. Drag end (pointerup) commits.
      if (isPrimitiveTool(activeToolRef.current)) {
        useAppStore.getState().setDragStart(snapped);
        svg!.setPointerCapture(e.pointerId);
        return;
      }
      const { previewPoints, addShape, setPreviewPoints } = useAppStore.getState();

      // Close polygon when clicking near the first point (min 3 points)
      if (
        previewPoints.length >= 3 &&
        distance(snapped, previewPoints[0]) < CLOSE_SNAP_RADIUS
      ) {
        if (activeToolRef.current === 'cutout') {
          // Cutout intentionally stays active — common to chain multiple cuts.
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
          useAppStore.getState().setActiveTool('select');
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
        return;
      }

      // Primitive-tool drag end → commit shape
      const store = useAppStore.getState();
      const tool = activeToolRef.current;
      if (e.button === 0 && store.dragStart && isPrimitiveTool(tool)) {
        const world = getWorldPoint(e);
        const snap  = gridModeRef.current === 'square' ? snapToSquare : snapToIsometric;
        let snapped = snap(world, gridSizeRef.current);
        // Shift on rect/ellipse: constrain to square/circle
        if (store.shiftConstrain && (tool === 'rectangle' || tool === 'ellipse')) {
          snapped = snap(squareConstrain(store.dragStart, snapped), gridSizeRef.current);
        }
        const shape = buildPrimitiveShape(
          tool,
          store.dragStart,
          snapped,
          {
            fill: fillColorRef.current,
            stroke: strokeColorRef.current,
            strokeWidth: strokeWidthRef.current,
            cornerRadius: cornerRadiusRef.current,
          },
          {
            polygonSides:   store.polygonSides,
            starPointCount: store.starPointCount,
            starInnerRatio: store.starInnerRatio,
          },
        );
        if (shape) {
          store.addShape(shape);
          store.setActiveTool('select');
          store.setSelectedShapeId(shape.id);
        }
        store.setDragStart(null);
        try { svg!.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
      }
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const world  = getWorldPoint(e);
      const factor = e.deltaY < 0 ? ZOOM_WHEEL_FACTOR : 1 / ZOOM_WHEEL_FACTOR;
      zoomAtRef.current(world.x, world.y, factor);
    }

    function onKey(e: KeyboardEvent) {
      const on = e.shiftKey;
      if (useAppStore.getState().shiftConstrain !== on) {
        useAppStore.getState().setShiftConstrain(on);
      }
    }

    svg.addEventListener('pointermove',  onPointerMove);
    svg.addEventListener('pointerleave', onPointerLeave);
    svg.addEventListener('pointerdown',  onPointerDown);
    svg.addEventListener('pointerup',    onPointerUp);
    // passive:false so we can preventDefault and suppress browser scroll/zoom
    svg.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    return () => {
      svg.removeEventListener('pointermove',  onPointerMove);
      svg.removeEventListener('pointerleave', onPointerLeave);
      svg.removeEventListener('pointerdown',  onPointerDown);
      svg.removeEventListener('pointerup',    onPointerUp);
      svg.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [svgRef, crosshairRef, setCursorPoint]);
}
