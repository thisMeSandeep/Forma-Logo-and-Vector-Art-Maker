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
  style: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    cornerRadius: number;
    opacity: number;
    strokeStyle: import('../types').StrokeStyle;
  },
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
  // Reject near-zero-size drags so a single click on the canvas doesn't
  // create an invisible shape that auto-selects and shows handles only.
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  if (closed && Math.max(dx, dy) < 1) return null;
  if (!closed && dx + dy < 1) return null;
  return {
    id: crypto.randomUUID(),
    points: [ring],
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    cornerRadius: style.cornerRadius,
    opacity: style.opacity,
    strokeStyle: style.strokeStyle,
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
  const opacityRef = useRef(useAppStore.getState().opacity);
  const strokeStyleRef = useRef(useAppStore.getState().strokeStyle);
  const textFontFamilyRef = useRef(useAppStore.getState().textFontFamily);
  const textFontSizeRef = useRef(useAppStore.getState().textFontSize);
  const textFontWeightRef = useRef(useAppStore.getState().textFontWeight);
  const textFillRef = useRef(useAppStore.getState().textFill);
  const textAnchorRef = useRef(useAppStore.getState().textAnchor);
  const textItalicRef = useRef(useAppStore.getState().textItalic);
  const textDecorationRef = useRef(useAppStore.getState().textDecoration);
  const textLetterSpacingRef = useRef(useAppStore.getState().textLetterSpacing);
  const textLineHeightRef = useRef(useAppStore.getState().textLineHeight);
  const textBaselineRef = useRef(useAppStore.getState().textBaseline);
  const textOpacityRef = useRef(useAppStore.getState().textOpacity);
  const textStrokeRef = useRef(useAppStore.getState().textStroke);
  const textStrokeWidthRef = useRef(useAppStore.getState().textStrokeWidth);
  const textStrokeStyleRef = useRef(useAppStore.getState().textStrokeStyle);
  const activeToolRef  = useRef(useAppStore.getState().activeTool);

  // Refs for stable callbacks (these don't change identity after mount)
  const zoomAtRef = useRef(zoomAt);
  const panByRef  = useRef(panBy);
  useEffect(() => { zoomAtRef.current = zoomAt; }, [zoomAt]);
  useEffect(() => { panByRef.current  = panBy; }, [panBy]);

  // Middle-mouse pan state
  const isPanningRef    = useRef(false);
  const lastPanPosRef   = useRef({ x: 0, y: 0 });

  // Multi-touch pinch state
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{
    centroid: { x: number; y: number };
    distance: number;
    worldAtCentroid: { x: number; y: number };
  } | null>(null);

  useEffect(() =>
    useAppStore.subscribe((s) => {
      gridSizeRef.current    = s.gridSize;
      gridModeRef.current    = s.gridMode;
      fillColorRef.current   = s.fillColor;
      strokeColorRef.current = s.strokeColor;
      strokeWidthRef.current = s.strokeWidth;
      cornerRadiusRef.current = s.cornerRadius;
      opacityRef.current = s.opacity;
      strokeStyleRef.current = s.strokeStyle;
      textFontFamilyRef.current = s.textFontFamily;
      textFontSizeRef.current = s.textFontSize;
      textFontWeightRef.current = s.textFontWeight;
      textFillRef.current = s.textFill;
      textAnchorRef.current = s.textAnchor;
      textItalicRef.current = s.textItalic;
      textDecorationRef.current = s.textDecoration;
      textLetterSpacingRef.current = s.textLetterSpacing;
      textLineHeightRef.current = s.textLineHeight;
      textBaselineRef.current = s.textBaseline;
      textOpacityRef.current = s.textOpacity;
      textStrokeRef.current = s.textStroke;
      textStrokeWidthRef.current = s.textStrokeWidth;
      textStrokeStyleRef.current = s.textStrokeStyle;
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
      // --- Multi-touch pinch (two fingers) ---
      if (e.pointerType !== 'mouse' && activePointersRef.current.has(e.pointerId)) {
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (pinchRef.current && activePointersRef.current.size >= 2) {
        const pts = Array.from(activePointersRef.current.values()).slice(0, 2);
        const centroid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        const distance = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        // Two-finger pan: translate by centroid delta
        const dCx = centroid.x - pinchRef.current.centroid.x;
        const dCy = centroid.y - pinchRef.current.centroid.y;
        if (dCx !== 0 || dCy !== 0) panByRef.current(dCx, dCy);
        // Pinch zoom: scale by distance ratio, centered on the original world point
        const ratio = distance / pinchRef.current.distance;
        if (Math.abs(ratio - 1) > 0.005) {
          zoomAtRef.current(
            pinchRef.current.worldAtCentroid.x,
            pinchRef.current.worldAtCentroid.y,
            ratio,
          );
          pinchRef.current.distance = distance;
        }
        pinchRef.current.centroid = centroid;
        return;
      }

      // --- Pan continuation (middle-mouse held) ---
      if (isPanningRef.current) {
        const dx = e.clientX - lastPanPosRef.current.x;
        const dy = e.clientY - lastPanPosRef.current.y;
        panByRef.current(dx, dy);
        lastPanPosRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      const world = getWorldPoint(e);
      const snap  = gridModeRef.current === 'isometric' ? snapToIsometric : snapToSquare;
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
      // Track touch/pen pointers for multi-touch pinch detection. Mouse is
      // single-pointer and never triggers pinch.
      if (e.pointerType !== 'mouse') {
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activePointersRef.current.size >= 2) {
          // Entering pinch mode — cancel anything in progress so the gesture
          // doesn't leave a half-drawn shape behind.
          const store = useAppStore.getState();
          store.setPreviewPoints([]);
          store.setDragStart(null);
          isPanningRef.current = false;
          const pts = Array.from(activePointersRef.current.values()).slice(0, 2);
          const centroid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
          const distance = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
          const rect = svg!.getBoundingClientRect();
          const worldAtCentroid = screenToWorld(centroid.x, centroid.y, rect, store.viewBox);
          pinchRef.current = { centroid, distance, worldAtCentroid };
          return;
        }
      }

      // Middle mouse OR Space+left OR pan-tool+left → start pan
      const isSpacePan = e.button === 0 && useAppStore.getState().spaceDown;
      const isToolPan  = e.button === 0 && activeToolRef.current === 'pan';
      if (e.button === 1 || isSpacePan || isToolPan) {
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
          italic: textItalicRef.current,
          decoration: textDecorationRef.current,
          letterSpacing: textLetterSpacingRef.current,
          lineHeight: textLineHeightRef.current,
          baseline: textBaselineRef.current,
          opacity: textOpacityRef.current,
          stroke: textStrokeRef.current,
          strokeWidth: textStrokeWidthRef.current,
          strokeStyle: textStrokeStyleRef.current,
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

      const snap    = gridModeRef.current === 'isometric' ? snapToIsometric : snapToSquare;
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
            opacity:     opacityRef.current,
            strokeStyle: strokeStyleRef.current,
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
      // Remove from active touch set; exit pinch when count drops below 2
      if (activePointersRef.current.has(e.pointerId)) {
        activePointersRef.current.delete(e.pointerId);
        if (activePointersRef.current.size < 2) pinchRef.current = null;
        // Inside a pinch we already short-circuited drawing logic, so skip
        // primitive commit / drag-end branches below for this pointer.
        if (e.pointerType !== 'mouse' && activePointersRef.current.size >= 1) return;
      }

      // End pan regardless of which button started it (middle or space+left)
      if (isPanningRef.current && (e.button === 1 || e.button === 0)) {
        isPanningRef.current = false;
        try { svg!.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
        if (e.button === 1) return; // middle-mouse only ever does pan
        // For space+left, fall through to other handlers? Actually no — we
        // already consumed this click as a pan, so don't trigger drawing logic.
        return;
      }

      // Primitive-tool drag end → commit shape
      const store = useAppStore.getState();
      const tool = activeToolRef.current;
      if (e.button === 0 && store.dragStart && isPrimitiveTool(tool)) {
        const world = getWorldPoint(e);
        const snap  = gridModeRef.current === 'isometric' ? snapToIsometric : snapToSquare;
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
            opacity: opacityRef.current,
            strokeStyle: strokeStyleRef.current,
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

    function onSpaceKey(e: KeyboardEvent) {
      if (e.code !== 'Space') return;
      // Ignore Space when typing in inputs so it doesn't hijack text entry
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const isDown = e.type === 'keydown';
      // Prevent page scroll while Space is held for panning
      if (isDown) e.preventDefault();
      if (useAppStore.getState().spaceDown !== isDown) {
        useAppStore.getState().setSpaceDown(isDown);
      }
    }

    function onPointerCancel(e: PointerEvent) {
      activePointersRef.current.delete(e.pointerId);
      if (activePointersRef.current.size < 2) pinchRef.current = null;
    }

    svg.addEventListener('pointermove',   onPointerMove);
    svg.addEventListener('pointerleave',  onPointerLeave);
    svg.addEventListener('pointerdown',   onPointerDown);
    svg.addEventListener('pointerup',     onPointerUp);
    svg.addEventListener('pointercancel', onPointerCancel);
    // passive:false so we can preventDefault and suppress browser scroll/zoom
    svg.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('keydown', onSpaceKey);
    window.addEventListener('keyup', onSpaceKey);

    return () => {
      svg.removeEventListener('pointermove',   onPointerMove);
      svg.removeEventListener('pointerleave',  onPointerLeave);
      svg.removeEventListener('pointerdown',   onPointerDown);
      svg.removeEventListener('pointerup',     onPointerUp);
      svg.removeEventListener('pointercancel', onPointerCancel);
      svg.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('keydown', onSpaceKey);
      window.removeEventListener('keyup', onSpaceKey);
    };
  }, [svgRef, crosshairRef, setCursorPoint]);
}
