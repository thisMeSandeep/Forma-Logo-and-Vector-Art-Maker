import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { TextItem } from '../../types';
import { screenToWorld } from '../../hooks/useViewBox';

function estimateTextWidth(text: TextItem) {
  return Math.max(text.fontSize * 2, text.content.length * text.fontSize * 0.62);
}

function anchorOffset(anchor: TextItem['anchor'], width: number) {
  if (anchor === 'middle') return -width / 2;
  if (anchor === 'end') return -width;
  return 0;
}

function editBackgroundFor(fill: string) {
  const hex = fill.replace('#', '');
  if (hex.length !== 3 && hex.length !== 6) return 'var(--background)';
  const expanded = hex.length === 3
    ? hex.split('').map((char) => char + char).join('')
    : hex;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? '#111827' : '#ffffff';
}

function eventToWorld(e: PointerEvent | React.PointerEvent, svg: SVGSVGElement) {
  const rect = svg.getBoundingClientRect();
  const vb = useAppStore.getState().viewBox;
  return screenToWorld(e.clientX, e.clientY, rect, vb);
}

export function TextLayer() {
  const texts = useAppStore((s) => s.texts);
  const activeTool = useAppStore((s) => s.activeTool);
  const selectedTextId = useAppStore((s) => s.selectedTextId);
  const editingTextId = useAppStore((s) => s.editingTextId);
  const setSelectedTextId = useAppStore((s) => s.setSelectedTextId);
  const setEditingTextId = useAppStore((s) => s.setEditingTextId);
  const updateText = useAppStore((s) => s.updateText);
  const deleteText = useAppStore((s) => s.deleteText);
  const [draft, setDraft] = useState<{ id: string; value: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{
    id: string;
    svg: SVGSVGElement;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const editingText = useMemo(
    () => texts.find((text) => text.id === editingTextId) ?? null,
    [texts, editingTextId],
  );

  useEffect(() => {
    if (!editingText) return;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [editingText]);

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const world = eventToWorld(e, drag.svg);
      updateText(drag.id, { x: world.x - drag.offsetX, y: world.y - drag.offsetY });
    }

    function onPointerUp() {
      dragRef.current = null;
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [updateText]);

  function getDraftValue(text: TextItem) {
    return draft?.id === text.id ? draft.value : text.content;
  }

  function commitEdit(text: TextItem, value = getDraftValue(text)) {
    const content = value.trim();
    if (content.length === 0) {
      deleteText(text.id);
    } else {
      updateText(text.id, { content });
    }
    setEditingTextId(null);
    setDraft(null);
  }

  function startDrag(e: React.PointerEvent<SVGTextElement>, text: TextItem) {
    if (editingTextId === text.id || e.button !== 0) return;
    if (activeTool !== 'text' && activeTool !== 'select') return;
    e.preventDefault();
    e.stopPropagation();
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const world = eventToWorld(e, svg);
    setSelectedTextId(text.id);
    dragRef.current = {
      id: text.id,
      svg,
      offsetX: world.x - text.x,
      offsetY: world.y - text.y,
    };
  }

  return (
    <g
      id="text-layer"
      data-text-interaction="true"
      style={{ pointerEvents: activeTool === 'text' || activeTool === 'select' ? 'auto' : 'none' }}
    >
      {texts.map((text) => {
        const selected = text.id === selectedTextId;
        const editing = text.id === editingTextId;
        const width = estimateTextWidth(text);
        const x = text.x + anchorOffset(text.anchor, width);
        const y = text.y - text.fontSize;
        const height = text.fontSize * 1.4;

        return (
          <g key={text.id}>
            {selected && !editing && (
              <rect
                x={x - 4}
                y={y - 4}
                width={width + 8}
                height={height + 8}
                fill="none"
                stroke="var(--cursor-dot-fill)"
                strokeWidth={1}
                strokeDasharray="4 3"
                pointerEvents="none"
              />
            )}

            {editing ? (
              <foreignObject
                data-text-interaction="true"
                x={x - 4}
                y={y - 6}
                width={Math.max(width + 32, 120)}
                height={height + 16}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <input
                  ref={inputRef}
                  value={getDraftValue(text)}
                  onChange={(e) => setDraft({ id: text.id, value: e.target.value })}
                  onBlur={() => commitEdit(text)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitEdit(text);
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      commitEdit(text);
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    fontFamily: text.fontFamily,
                    fontSize: text.fontSize,
                    fontWeight: text.fontWeight,
                    color: text.fill,
                    backgroundColor: editBackgroundFor(text.fill),
                  }}
                  className="border bg-background/95 px-1 outline-none"
                />
              </foreignObject>
            ) : (
              <text
                data-text-interaction="true"
                x={text.x}
                y={text.y}
                textAnchor={text.anchor}
                fontFamily={text.fontFamily}
                fontSize={text.fontSize}
                fontWeight={text.fontWeight}
                fill={text.fill}
                dominantBaseline="alphabetic"
                className="select-none"
                style={{ cursor: 'move' }}
                onPointerDown={(e) => startDrag(e, text)}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingTextId(text.id);
                }}
              >
                {text.content}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
