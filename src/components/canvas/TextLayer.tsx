import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { TextItem } from '../../types';
import { screenToWorld } from '../../hooks/useViewBox';
import { gradientEndpoints } from '../../lib/shapeStyle';
import {
  textEffectFilterInner,
  textFillKind,
  textFillRef,
  textFilterId,
  textLinearId,
  textNeedsFilter,
  textPatternId,
  textRadialId,
  textStrokeDashArray,
  textStrokeLinecap,
} from '../../lib/textStyle';
import { textBBox, textTransformString } from '../../lib/textGeometry';

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
      <defs>
        {texts.map((text) => {
          const kind = textFillKind(text);
          if (kind === 'linear' && text.fillGradient) {
            const { from, to, angle } = text.fillGradient;
            const { x1, y1, x2, y2 } = gradientEndpoints(angle);
            return (
              <linearGradient key={`l-${text.id}`} id={textLinearId(text)} x1={x1} y1={y1} x2={x2} y2={y2}>
                <stop offset="0%" stopColor={from} />
                <stop offset="100%" stopColor={to} />
              </linearGradient>
            );
          }
          if (kind === 'radial' && text.fillRadial) {
            const { from, to } = text.fillRadial;
            return (
              <radialGradient key={`r-${text.id}`} id={textRadialId(text)} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={from} />
                <stop offset="100%" stopColor={to} />
              </radialGradient>
            );
          }
          if (kind === 'image' && text.fillImage) {
            return (
              <pattern
                key={`p-${text.id}`}
                id={textPatternId(text)}
                patternUnits="objectBoundingBox"
                patternContentUnits="objectBoundingBox"
                width="1"
                height="1"
              >
                <image
                  href={text.fillImage.dataUrl}
                  x={0}
                  y={0}
                  width={1}
                  height={1}
                  preserveAspectRatio="xMidYMid slice"
                />
              </pattern>
            );
          }
          return null;
        })}
        {texts.map((text) => {
          if (!textNeedsFilter(text) || !text.effect) return null;
          // The filter graph for long-shadow/extrude has a dynamic step count,
          // so we serialize it once and inject as HTML rather than building
          // each <fe*> element as JSX.
          return (
            <filter
              key={`fx-${text.id}`}
              id={textFilterId(text)}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
              dangerouslySetInnerHTML={{ __html: textEffectFilterInner(text.effect) }}
            />
          );
        })}
      </defs>
      {texts.map((text) => {
        const selected = text.id === selectedTextId;
        const editing = text.id === editingTextId;
        // Use the canvas-measured bbox so the selection rect and edit input
        // fully contain the rendered glyphs regardless of font face or size.
        const box = textBBox(text);
        const x = box.x;
        const y = box.y;
        const width = box.w;
        const height = box.h;
        const transform = textTransformString(text);

        return (
          <g key={text.id} transform={transform || undefined}>
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
                vectorEffect="non-scaling-stroke"
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
                    fontStyle: text.italic ? 'italic' : undefined,
                    textDecoration: text.decoration && text.decoration !== 'none' ? text.decoration : undefined,
                    letterSpacing: text.letterSpacing ? `${text.letterSpacing}px` : undefined,
                    lineHeight: text.lineHeight ?? undefined,
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
                fontStyle={text.italic ? 'italic' : undefined}
                textDecoration={text.decoration && text.decoration !== 'none' ? text.decoration : undefined}
                letterSpacing={text.letterSpacing ? text.letterSpacing : undefined}
                fill={textFillRef(text)}
                stroke={text.strokeWidth && text.strokeWidth > 0 ? text.stroke : undefined}
                strokeWidth={text.strokeWidth && text.strokeWidth > 0 ? text.strokeWidth : undefined}
                strokeDasharray={textStrokeDashArray(text)}
                strokeLinecap={textStrokeLinecap(text)}
                strokeLinejoin="round"
                paintOrder="stroke fill"
                opacity={text.opacity != null && text.opacity !== 1 ? text.opacity : undefined}
                filter={textNeedsFilter(text) ? `url(#${textFilterId(text)})` : undefined}
                dominantBaseline={text.baseline ?? 'alphabetic'}
                className="select-none"
                style={{ cursor: 'move' }}
                onPointerDown={(e) => startDrag(e, text)}
                onContextMenu={() => setSelectedTextId(text.id)}
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
