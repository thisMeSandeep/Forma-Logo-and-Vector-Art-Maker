import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { bboxOfRings, shapeMatrix, applyShapeMatrix } from '../../lib/geometry';
import { IDENTITY_TRANSFORM } from '../../types';
import { screenToWorld } from '../../hooks/useViewBox';

type CornerRole = 'nw' | 'ne' | 'se' | 'sw';

// Local-space (un-transformed) corner positions for a shape's bbox.
function cornerLocal(role: CornerRole, bbox: { x: number; y: number; w: number; h: number }) {
  switch (role) {
    case 'nw': return { x: bbox.x,            y: bbox.y };
    case 'ne': return { x: bbox.x + bbox.w,   y: bbox.y };
    case 'se': return { x: bbox.x + bbox.w,   y: bbox.y + bbox.h };
    case 'sw': return { x: bbox.x,            y: bbox.y + bbox.h };
  }
}

type ScaleDrag = {
  kind: 'scale';
  shapeId: string;
  svg: SVGSVGElement;
  role: CornerRole;
  localCorner: { x: number; y: number };  // relative to bbox center, un-transformed
  pivot: { x: number; y: number };        // bbox-of-baked-points center, world
  rotationRad: number;                    // current rotation, captured at drag start
};

type RotateDrag = {
  kind: 'rotate';
  shapeId: string;
  svg: SVGSVGElement;
  pivot: { x: number; y: number };
  // Offset between cursor angle and rotation at the moment drag started,
  // so the handle stays glued to the cursor instead of snapping to 0°.
  angleOffset: number;
};

type Drag = ScaleDrag | RotateDrag;

export function SelectionHandles() {
  const activeTool          = useAppStore((s) => s.activeTool);
  const shape               = useAppStore((s) =>
    s.selectedShapeId ? s.shapes.find((sh) => sh.id === s.selectedShapeId) ?? null : null,
  );
  const viewBox             = useAppStore((s) => s.viewBox);
  const initialViewBox      = useAppStore((s) => s.initialViewBox);
  const setShapeTransform   = useAppStore((s) => s.setShapeTransform);
  const commitHistory       = useAppStore((s) => s.commitHistory);

  const dragRef = useRef<Drag | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const rect = drag.svg.getBoundingClientRect();
      const vb = useAppStore.getState().viewBox;
      const cursor = screenToWorld(e.clientX, e.clientY, rect, vb);
      movedRef.current = true;

      if (drag.kind === 'rotate') {
        const angle = Math.atan2(cursor.y - drag.pivot.y, cursor.x - drag.pivot.x);
        const rotation = ((angle - drag.angleOffset) * 180) / Math.PI;
        // Normalize to (-180, 180]
        const normalized = ((rotation + 180) % 360 + 360) % 360 - 180;
        setShapeTransform(drag.shapeId, { rotation: normalized });
        return;
      }

      // Scale: anchored at the bbox center. Project cursor into the shape's
      // un-rotated frame and read off the scale factors.
      const ux = cursor.x - drag.pivot.x;
      const uy = cursor.y - drag.pivot.y;
      const cosR = Math.cos(-drag.rotationRad);
      const sinR = Math.sin(-drag.rotationRad);
      const localX =  cosR * ux - sinR * uy;
      const localY =  sinR * ux + cosR * uy;
      const vx = drag.localCorner.x;
      const vy = drag.localCorner.y;
      // Guard tiny bboxes so we don't divide by zero on degenerate shapes
      const safeX = Math.abs(vx) < 0.5 ? Math.sign(vx) * 0.5 || 0.5 : vx;
      const safeY = Math.abs(vy) < 0.5 ? Math.sign(vy) * 0.5 || 0.5 : vy;
      const scaleX = localX / safeX;
      const scaleY = localY / safeY;
      setShapeTransform(drag.shapeId, { scaleX, scaleY });
    }

    function onPointerUp() {
      if (dragRef.current && movedRef.current) commitHistory();
      dragRef.current = null;
      movedRef.current = false;
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [setShapeTransform, commitHistory]);

  if (!shape || activeTool !== 'select' || !initialViewBox) return null;

  // World units per screen pixel — keeps handles a fixed visual size at any zoom
  const worldPerPx = viewBox.w / initialViewBox.w;
  const HANDLE_R   = 5 * worldPerPx;
  const STROKE     = 1.25 * worldPerPx;
  const ROT_OFFSET = 22 * worldPerPx;

  const bbox = bboxOfRings(shape.points);
  const m = shapeMatrix(shape);
  const cornerRoles: CornerRole[] = ['nw', 'ne', 'se', 'sw'];
  const cornersWorld = cornerRoles.map((role) => ({ role, world: applyShapeMatrix(m, cornerLocal(role, bbox)) }));

  // Rotation handle: above the top edge of the local bbox, transformed to world.
  // Use the local "up" direction (after rotation) so it follows the shape.
  const topMidLocal = { x: bbox.x + bbox.w / 2, y: bbox.y };
  const topMidWorld = applyShapeMatrix(m, topMidLocal);
  const t = shape.transform ?? IDENTITY_TRANSFORM;
  const rotationRad = (t.rotation * Math.PI) / 180;
  const upX = Math.sin(rotationRad);   // local (0,-1) rotated by θ → (sin θ, -cos θ)
  const upY = -Math.cos(rotationRad);
  const rotHandleWorld = {
    x: topMidWorld.x + upX * ROT_OFFSET,
    y: topMidWorld.y + upY * ROT_OFFSET,
  };

  function startScale(e: React.PointerEvent<SVGRectElement>, role: CornerRole) {
    if (e.button !== 0) return;
    e.stopPropagation();
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg || !shape) return;
    const local = cornerLocal(role, bbox);
    dragRef.current = {
      kind: 'scale',
      shapeId: shape.id,
      svg,
      role,
      localCorner: { x: local.x - m.cx, y: local.y - m.cy },
      pivot: { x: m.cx, y: m.cy },
      rotationRad,
    };
    movedRef.current = false;
  }

  function startRotate(e: React.PointerEvent<SVGCircleElement>) {
    if (e.button !== 0) return;
    e.stopPropagation();
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg || !shape) return;
    const rect = svg.getBoundingClientRect();
    const vb = useAppStore.getState().viewBox;
    const cursor = screenToWorld(e.clientX, e.clientY, rect, vb);
    const cursorAngle = Math.atan2(cursor.y - m.cy, cursor.x - m.cx);
    dragRef.current = {
      kind: 'rotate',
      shapeId: shape.id,
      svg,
      pivot: { x: m.cx, y: m.cy },
      angleOffset: cursorAngle - rotationRad,
    };
    movedRef.current = false;
  }

  return (
    // data-shape-id makes the canvas's select-mode pointerdown defer to React
    // handlers here, instead of treating a handle click as bare-canvas (which
    // would clear the selection and prevent the drag from starting).
    <g id="selection-handles" data-shape-id={shape.id}>
      {/* Tether line from top-mid to rotation handle */}
      <line
        x1={topMidWorld.x}
        y1={topMidWorld.y}
        x2={rotHandleWorld.x}
        y2={rotHandleWorld.y}
        stroke="var(--cursor-dot-fill)"
        strokeWidth={STROKE}
        pointerEvents="none"
      />

      <circle
        cx={rotHandleWorld.x}
        cy={rotHandleWorld.y}
        r={HANDLE_R}
        fill="var(--canvas-bg)"
        stroke="var(--cursor-dot-fill)"
        strokeWidth={STROKE}
        style={{ cursor: 'grab' }}
        onPointerDown={startRotate}
      />

      {cornersWorld.map(({ role, world }) => (
        <rect
          key={role}
          x={world.x - HANDLE_R}
          y={world.y - HANDLE_R}
          width={HANDLE_R * 2}
          height={HANDLE_R * 2}
          fill="var(--canvas-bg)"
          stroke="var(--cursor-dot-fill)"
          strokeWidth={STROKE}
          style={{ cursor: cornerCursor(role, rotationRad) }}
          onPointerDown={(e) => startScale(e, role)}
        />
      ))}
    </g>
  );
}

// Pick a resize cursor that roughly matches the corner's screen-space direction
// after the shape's rotation.
function cornerCursor(role: CornerRole, rotationRad: number): string {
  const baseAngle = role === 'nw' || role === 'se' ? -Math.PI / 4 : Math.PI / 4;
  const total = baseAngle + rotationRad;
  // Reduce to 0..π
  const reduced = ((total % Math.PI) + Math.PI) % Math.PI;
  // Bucket into nwse-resize vs nesw-resize. Threshold at π/2.
  return reduced < Math.PI / 2 ? 'nwse-resize' : 'nesw-resize';
}
