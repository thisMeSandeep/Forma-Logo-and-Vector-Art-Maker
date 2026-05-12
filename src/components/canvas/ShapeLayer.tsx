import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CUTOUT_FILL_OPACITY } from '../../config/constants';
import { roundedRingToD, openRingToD } from '../../lib/svgPath';
import { bboxOfRings, shapeTransformString } from '../../lib/geometry';
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
  const dragRef = useRef<{
    id: string;
    svg: SVGSVGElement;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const rect = drag.svg.getBoundingClientRect();
      const vb = useAppStore.getState().viewBox;
      const world = screenToWorld(e.clientX, e.clientY, rect, vb);
      const dx = world.x - drag.lastX;
      const dy = world.y - drag.lastY;
      if (dx === 0 && dy === 0) return;
      drag.moved = true;
      drag.lastX = world.x;
      drag.lastY = world.y;
      moveShape(drag.id, dx, dy);
    }

    function onPointerUp() {
      const drag = dragRef.current;
      if (drag?.moved) commitHistory();
      dragRef.current = null;
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
    if (useAppStore.getState().activeTool !== 'select') return;
    e.stopPropagation();
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const vb = useAppStore.getState().viewBox;
    const world = screenToWorld(e.clientX, e.clientY, rect, vb);
    setSelectedShapeId(id);
    dragRef.current = { id, svg, lastX: world.x, lastY: world.y, moved: false };
  }

  return (
    <g id="shape-layer">
      {/* Arrowhead marker shared by all open paths with arrowEnd. Uses
          context-stroke so each arrow inherits the path's own stroke color. */}
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
        // fillRule="evenodd" makes inner rings render as transparent holes.
        // The selection rect lives inside the same transformed group so it tracks
        // rotation/scale/skew without needing a separate visual-bbox calculation.
        return (
          <g key={shape.id} transform={transform || undefined}>
            <path
              data-shape-id={shape.id}
              d={d}
              fillRule="evenodd"
              fill={closed ? shape.fill : 'none'}
              fillOpacity={closed ? fillOpacity : undefined}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              strokeLinejoin="round"
              strokeLinecap={closed ? undefined : 'round'}
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
