import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CUTOUT_FILL_OPACITY, ALIGN_SNAP_PX } from '../../config/constants';
import { roundedRingToD, openRingToD } from '../../lib/svgPath';
import { bboxOfRings, shapeTransformString, type BBox } from '../../lib/geometry';
import { findAlignmentSnap, visualBBox } from '../../lib/alignment';
import {
  gradientEndpoints,
  shapeFillRef,
  shapeFilterId,
  shapeGradientId,
  shapeNeedsFilter,
  shapePatternId,
  shapeUsesGradient,
  shapeUsesImage,
  strokeDashArray,
  strokeLinecap,
} from '../../lib/shapeStyle';
import { screenToWorld } from '../../hooks/useViewBox';

export function ShapeLayer() {
  const shapes              = useAppStore((s) => s.shapes);
  const activeTool          = useAppStore((s) => s.activeTool);
  const selectedShapeId     = useAppStore((s) => s.selectedShapeId);
  const setSelectedShapeId  = useAppStore((s) => s.setSelectedShapeId);
  const moveShape           = useAppStore((s) => s.moveShape);
  const commitHistory       = useAppStore((s) => s.commitHistory);

  // Soften fills while cutting so grid intersections inside shapes are visible
  const fillOpacity = activeTool === 'cutout' ? CUTOUT_FILL_OPACITY : 1;
  // Bbox + drag cursor only show in select mode. Pointer events stay enabled in
  // every tool so Cmd/Ctrl+click can quick-select.
  const interactive = activeTool === 'select';

  // Drag state lives in a ref because pointermove fires off the window listener,
  // not React's tree (works while the cursor leaves the original <path>).
  //
  // We track start-relative positions (startCursor, startBox) so each frame we
  // can recompute the target position from absolute cursor delta and re-run the
  // snap. Using incremental deltas would let the cursor drift away from the
  // shape every time it sticks to a snap line.
  const dragRef = useRef<{
    id: string;
    svg: SVGSVGElement;
    startCursor: { x: number; y: number };
    startBox: BBox;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const rect = drag.svg.getBoundingClientRect();
      const state = useAppStore.getState();
      const vb = state.viewBox;
      const cursor = screenToWorld(e.clientX, e.clientY, rect, vb);

      const proposedDx = cursor.x - drag.startCursor.x;
      const proposedDy = cursor.y - drag.startCursor.y;

      const draggedShape = state.shapes.find((s) => s.id === drag.id);
      if (!draggedShape) return;
      const others = state.shapes.filter((s) => s.id !== drag.id).map(visualBBox);
      const zoom = state.initialViewBox ? state.initialViewBox.w / vb.w : 1;
      const threshold = ALIGN_SNAP_PX / zoom;

      const { dx, dy, guides } = findAlignmentSnap(
        drag.startBox, others, proposedDx, proposedDy, threshold, state.initialViewBox,
      );

      // Apply only the increment relative to the shape's current position
      const currentBox = visualBBox(draggedShape);
      const incrementDx = drag.startBox.x + dx - currentBox.x;
      const incrementDy = drag.startBox.y + dy - currentBox.y;
      if (incrementDx !== 0 || incrementDy !== 0) {
        drag.moved = true;
        moveShape(drag.id, incrementDx, incrementDy);
      }
      state.setActiveGuides(guides);
    }

    function onPointerUp() {
      const drag = dragRef.current;
      if (drag?.moved) commitHistory();
      dragRef.current = null;
      useAppStore.getState().setActiveGuides([]);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [moveShape, commitHistory]);

  function startDrag(e: React.PointerEvent<SVGPathElement>, id: string) {
    if (e.button !== 0) return;
    // Read tool live: a Cmd+click in another tool just synchronously switched
    // to 'select', and React state is one render behind that change.
    const state = useAppStore.getState();
    if (state.activeTool !== 'select') return;
    e.stopPropagation();
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const world = screenToWorld(e.clientX, e.clientY, rect, state.viewBox);
    setSelectedShapeId(id);
    const shape = state.shapes.find((s) => s.id === id);
    if (!shape) return;
    dragRef.current = {
      id,
      svg,
      startCursor: { x: world.x, y: world.y },
      startBox: visualBBox(shape),
      moved: false,
    };
  }

  return (
    <g id="shape-layer">
      {/* Shared arrowhead marker + per-shape filter and gradient defs.
          context-stroke makes each arrow inherit its path's stroke color. */}
      <defs>
        <marker
          id="arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerUnits="strokeWidth"
          markerWidth={5}
          markerHeight={5}
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
        </marker>
        {shapes.map((shape) => {
          const defs: React.ReactNode[] = [];
          if (shapeNeedsFilter(shape)) {
            const shadow = shape.shadow;
            const blur = shape.blur ?? 0;
            defs.push(
              <filter
                key={`f-${shape.id}`}
                id={shapeFilterId(shape)}
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                {shadow && (
                  <feDropShadow
                    dx={shadow.x}
                    dy={shadow.y}
                    stdDeviation={shadow.blur / 2}
                    floodColor={shadow.color}
                  />
                )}
                {blur > 0 && <feGaussianBlur stdDeviation={blur} />}
              </filter>,
            );
          }
          if (shapeUsesGradient(shape) && shape.fillGradient) {
            const { from, to, angle } = shape.fillGradient;
            const { x1, y1, x2, y2 } = gradientEndpoints(angle);
            defs.push(
              <linearGradient
                key={`g-${shape.id}`}
                id={shapeGradientId(shape)}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
              >
                <stop offset="0%" stopColor={from} />
                <stop offset="100%" stopColor={to} />
              </linearGradient>,
            );
          }
          if (shapeUsesImage(shape) && shape.fillImage) {
            defs.push(
              <pattern
                key={`p-${shape.id}`}
                id={shapePatternId(shape)}
                patternUnits="objectBoundingBox"
                patternContentUnits="objectBoundingBox"
                width={1}
                height={1}
              >
                <image
                  href={shape.fillImage.dataUrl}
                  x={0}
                  y={0}
                  width={1}
                  height={1}
                  preserveAspectRatio="xMidYMid slice"
                />
              </pattern>,
            );
          }
          return defs;
        })}
      </defs>
      {shapes.map((shape) => {
        const closed = shape.closed ?? true;
        // Older persisted shapes may not have cornerRadius — default to 0
        const r = shape.cornerRadius ?? 0;
        const transform = shapeTransformString(shape);
        const isSelected = interactive && shape.id === selectedShapeId;
        const bbox = isSelected ? bboxOfRings(shape.points) : null;
        const d = closed
          ? shape.points.map((ring) => roundedRingToD(ring, r)).join(' ')
          : openRingToD(shape.points[0]);
        const fillAttr = closed ? shapeFillRef(shape) : 'none';
        // fillRule="evenodd" makes inner rings render as transparent holes.
        // The selection rect lives inside the same transformed group so it tracks
        // rotation/scale/skew without needing a separate visual-bbox calculation.
        return (
          <g key={shape.id} transform={transform || undefined}>
            <path
              data-shape-id={shape.id}
              d={d}
              fillRule="evenodd"
              fill={fillAttr}
              fillOpacity={closed ? fillOpacity : undefined}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              strokeDasharray={strokeDashArray(shape)}
              strokeLinejoin="round"
              strokeLinecap={strokeLinecap(shape)}
              opacity={shape.opacity}
              filter={shapeNeedsFilter(shape) ? `url(#${shapeFilterId(shape)})` : undefined}
              markerEnd={shape.arrowEnd ? 'url(#arrowhead)' : undefined}
              style={{ cursor: interactive ? 'move' : 'inherit' }}
              onPointerDown={(e) => startDrag(e, shape.id)}
              onContextMenu={() => setSelectedShapeId(shape.id)}
            />
            {bbox && (
              <rect
                x={bbox.x - 4}
                y={bbox.y - 4}
                width={bbox.w + 8}
                height={bbox.h + 8}
                fill="none"
                stroke="var(--cursor-dot-fill)"
                strokeWidth={1}
                strokeDasharray="4 3"
                pointerEvents="none"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
