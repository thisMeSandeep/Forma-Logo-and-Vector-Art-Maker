import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { applyShapeMatrix, type BBox } from '../../lib/geometry';
import { textBBox, textMatrix } from '../../lib/textGeometry';
import { IDENTITY_TRANSFORM } from '../../types';
import { screenToWorld } from '../../hooks/useViewBox';

type CornerRole = 'nw' | 'ne' | 'se' | 'sw';

function cornerLocal(role: CornerRole, bbox: BBox) {
  switch (role) {
    case 'nw': return { x: bbox.x,            y: bbox.y };
    case 'ne': return { x: bbox.x + bbox.w,   y: bbox.y };
    case 'se': return { x: bbox.x + bbox.w,   y: bbox.y + bbox.h };
    case 'sw': return { x: bbox.x,            y: bbox.y + bbox.h };
  }
}

type ScaleDrag = {
  kind: 'scale';
  textId: string;
  svg: SVGSVGElement;
  role: CornerRole;
  localCorner: { x: number; y: number };
  pivot: { x: number; y: number };
  rotationRad: number;
};

type RotateDrag = {
  kind: 'rotate';
  textId: string;
  svg: SVGSVGElement;
  pivot: { x: number; y: number };
  angleOffset: number;
};

type Drag = ScaleDrag | RotateDrag;

export function TextSelectionHandles() {
  const activeTool        = useAppStore((s) => s.activeTool);
  const text              = useAppStore((s) =>
    s.selectedTextId ? s.texts.find((t) => t.id === s.selectedTextId) ?? null : null,
  );
  const editingTextId     = useAppStore((s) => s.editingTextId);
  const viewBox           = useAppStore((s) => s.viewBox);
  const initialViewBox    = useAppStore((s) => s.initialViewBox);
  const setTextTransform  = useAppStore((s) => s.setTextTransform);
  const commitHistory     = useAppStore((s) => s.commitHistory);

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
        const normalized = ((rotation + 180) % 360 + 360) % 360 - 180;
        setTextTransform(drag.textId, { rotation: normalized });
        return;
      }

      // Scale anchored at bbox center — same math as shape SelectionHandles.
      const ux = cursor.x - drag.pivot.x;
      const uy = cursor.y - drag.pivot.y;
      const cosR = Math.cos(-drag.rotationRad);
      const sinR = Math.sin(-drag.rotationRad);
      const localX =  cosR * ux - sinR * uy;
      const localY =  sinR * ux + cosR * uy;
      const vx = drag.localCorner.x;
      const vy = drag.localCorner.y;
      const safeX = Math.abs(vx) < 0.5 ? Math.sign(vx) * 0.5 || 0.5 : vx;
      const safeY = Math.abs(vy) < 0.5 ? Math.sign(vy) * 0.5 || 0.5 : vy;
      const scaleX = localX / safeX;
      const scaleY = localY / safeY;
      setTextTransform(drag.textId, { scaleX, scaleY });
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
  }, [setTextTransform, commitHistory]);

  // Hide handles while editing the text so they don't block the input
  if (!text || activeTool !== 'select' || !initialViewBox || editingTextId === text.id) {
    return null;
  }

  const worldPerPx = viewBox.w / initialViewBox.w;
  const HANDLE_R   = 5 * worldPerPx;
  const STROKE     = 1.25 * worldPerPx;
  const ROT_OFFSET = 22 * worldPerPx;

  const bbox = textBBox(text);
  const m = textMatrix(text);
  const cornerRoles: CornerRole[] = ['nw', 'ne', 'se', 'sw'];
  const cornersWorld = cornerRoles.map((role) => ({ role, world: applyShapeMatrix(m, cornerLocal(role, bbox)) }));

  const topMidLocal = { x: bbox.x + bbox.w / 2, y: bbox.y };
  const topMidWorld = applyShapeMatrix(m, topMidLocal);
  const t = text.transform ?? IDENTITY_TRANSFORM;
  const rotationRad = (t.rotation * Math.PI) / 180;
  const upX = Math.sin(rotationRad);
  const upY = -Math.cos(rotationRad);
  const rotHandleWorld = {
    x: topMidWorld.x + upX * ROT_OFFSET,
    y: topMidWorld.y + upY * ROT_OFFSET,
  };

  function startScale(e: React.PointerEvent<SVGRectElement>, role: CornerRole) {
    if (e.button !== 0 || !text) return;
    e.stopPropagation();
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const local = cornerLocal(role, bbox);
    dragRef.current = {
      kind: 'scale',
      textId: text.id,
      svg,
      role,
      localCorner: { x: local.x - m.cx, y: local.y - m.cy },
      pivot: { x: m.cx, y: m.cy },
      rotationRad,
    };
    movedRef.current = false;
  }

  function startRotate(e: React.PointerEvent<SVGCircleElement>) {
    if (e.button !== 0 || !text) return;
    e.stopPropagation();
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const vb = useAppStore.getState().viewBox;
    const cursor = screenToWorld(e.clientX, e.clientY, rect, vb);
    const cursorAngle = Math.atan2(cursor.y - m.cy, cursor.x - m.cx);
    dragRef.current = {
      kind: 'rotate',
      textId: text.id,
      svg,
      pivot: { x: m.cx, y: m.cy },
      angleOffset: cursorAngle - rotationRad,
    };
    movedRef.current = false;
  }

  return (
    // data-text-interaction defers the canvas's bare-canvas pointerdown so the
    // handle's React onPointerDown can run instead of clearing the selection.
    <g id="text-selection-handles" data-text-interaction="true">
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

function cornerCursor(role: CornerRole, rotationRad: number): string {
  const baseAngle = role === 'nw' || role === 'se' ? -Math.PI / 4 : Math.PI / 4;
  const total = baseAngle + rotationRad;
  const reduced = ((total % Math.PI) + Math.PI) % Math.PI;
  return reduced < Math.PI / 2 ? 'nwse-resize' : 'nesw-resize';
}
