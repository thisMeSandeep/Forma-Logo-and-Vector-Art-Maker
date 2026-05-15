import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  applyShapeMatrix,
  bboxOfShape,
  bezierControlForBulge,
  edgePerpendicular,
  shapeMatrix,
  transformToMatrix,
} from '../../lib/geometry';
import { IDENTITY_TRANSFORM } from '../../types';
import type { Point } from '../../types';
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

type BulgeDrag = {
  kind: 'bulge';
  shapeId: string;
  svg: SVGSVGElement;
  ringIdx: number;
  edgeIdx: number;
  // Local-space midpoint of the edge and its perpendicular unit vector. The
  // new bulge = perp · (cursor_local − midpoint), so we capture both once at
  // drag start.
  midpointLocal: Point;
  perpLocal: Point;
  // Inverse 2x2 of the shape's transform, used to pull cursor world → local.
  inv: { a: number; b: number; c: number; d: number; cx: number; cy: number };
};

type Drag = ScaleDrag | RotateDrag | BulgeDrag;

export function SelectionHandles() {
  const activeTool          = useAppStore((s) => s.activeTool);
  const shape               = useAppStore((s) =>
    s.selectedShapeId ? s.shapes.find((sh) => sh.id === s.selectedShapeId) ?? null : null,
  );
  const viewBox             = useAppStore((s) => s.viewBox);
  const initialViewBox      = useAppStore((s) => s.initialViewBox);
  const setShapeTransform   = useAppStore((s) => s.setShapeTransform);
  const updateShape         = useAppStore((s) => s.updateShape);
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

      if (drag.kind === 'bulge') {
        // Project the cursor back into shape-local space, then read off the
        // signed perpendicular distance from the edge midpoint.
        const dx = cursor.x - drag.inv.cx;
        const dy = cursor.y - drag.inv.cy;
        const localX = drag.inv.a * dx + drag.inv.c * dy + drag.inv.cx;
        const localY = drag.inv.b * dx + drag.inv.d * dy + drag.inv.cy;
        const px = localX - drag.midpointLocal.x;
        const py = localY - drag.midpointLocal.y;
        const bulge = drag.perpLocal.x * px + drag.perpLocal.y * py;
        const shapeNow = useAppStore.getState().shapes.find((sh) => sh.id === drag.shapeId);
        if (!shapeNow) return;
        const newBulges = (shapeNow.edgeBulges ?? shapeNow.points.map((r) => new Array(r.length).fill(0))).map((row, idx) =>
          idx === drag.ringIdx
            ? row.map((v, i) => (i === drag.edgeIdx ? bulge : v))
            : row.slice(),
        );
        updateShape(drag.shapeId, { edgeBulges: newBulges });
        return;
      }

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
  }, [setShapeTransform, updateShape, commitHistory]);

  if (!shape || activeTool !== 'select' || !initialViewBox) return null;

  // World units per screen pixel — keeps handles a fixed visual size at any zoom
  const worldPerPx = viewBox.w / initialViewBox.w;
  const HANDLE_R   = 5 * worldPerPx;
  const STROKE     = 1.25 * worldPerPx;
  const ROT_OFFSET = 22 * worldPerPx;

  const bbox = bboxOfShape(shape);
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

  // Inverse of the shape's transform — needed to map cursor (world) back to
  // the shape's local frame while dragging bulge handles. Composed from the
  // negated transform attrs at the same pivot.
  function inverseShapeMatrix() {
    if (!shape) return null;
    const t = shape.transform ?? IDENTITY_TRANSFORM;
    const inv = {
      rotation: -t.rotation,
      scaleX: 1 / (t.scaleX || 1),
      scaleY: 1 / (t.scaleY || 1),
      skewX: -t.skewX,
      skewY: -t.skewY,
    };
    return transformToMatrix(inv, m.cx, m.cy);
  }

  function startBulgeDrag(
    e: React.PointerEvent<SVGCircleElement>,
    ringIdx: number,
    edgeIdx: number,
  ) {
    if (e.button !== 0) return;
    e.stopPropagation();
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg || !shape) return;
    const ring = shape.points[ringIdx];
    const p0 = ring[edgeIdx];
    const p1 = ring[(edgeIdx + 1) % ring.length];
    const midpointLocal = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    const perpLocal = edgePerpendicular(p0, p1);
    const inv = inverseShapeMatrix();
    if (!inv) return;
    dragRef.current = {
      kind: 'bulge',
      shapeId: shape.id,
      svg,
      ringIdx,
      edgeIdx,
      midpointLocal,
      perpLocal,
      inv,
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

  // Per-edge bulge handles, only on closed shapes. Each handle sits at the
  // edge's apex (midpoint + bulge * perpendicular) in local space, then is
  // projected to world via the shape's matrix. Dragging adjusts the bulge.
  // Hide handles when the bbox is degenerate (single line, etc).
  const showBulgeHandles = shape.closed !== false && bbox.w > 0 && bbox.h > 0;
  const bulgeHandles: { ring: number; edge: number; world: Point }[] = [];
  if (showBulgeHandles) {
    for (let r = 0; r < shape.points.length; r++) {
      const ring = shape.points[r];
      for (let i = 0; i < ring.length; i++) {
        const p0 = ring[i];
        const p1 = ring[(i + 1) % ring.length];
        const b = shape.edgeBulges?.[r]?.[i] ?? 0;
        const apex = b !== 0
          ? bezierControlForBulge(p0, p1, b / 2)  // apex = midpoint + bulge*perp; control = midpoint + 2*bulge*perp
          : { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
        bulgeHandles.push({ ring: r, edge: i, world: applyShapeMatrix(m, apex) });
      }
    }
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

      {bulgeHandles.map(({ ring, edge, world }) => (
        <circle
          key={`bulge-${ring}-${edge}`}
          cx={world.x}
          cy={world.y}
          r={HANDLE_R * 0.75}
          fill="var(--canvas-bg)"
          stroke="var(--cursor-dot-fill)"
          strokeWidth={STROKE}
          style={{ cursor: 'crosshair' }}
          onPointerDown={(e) => startBulgeDrag(e, ring, edge)}
        >
          <title>Drag to curve this edge</title>
        </circle>
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
