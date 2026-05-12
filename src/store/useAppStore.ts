import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FILL_COLOR_DEFAULT,
  STROKE_COLOR_DEFAULT,
  STROKE_WIDTH_DEFAULT,
  CORNER_RADIUS_DEFAULT,
  GRID_SIZE_DEFAULT,
  MAX_HISTORY,
  ZOOM_MIN,
  ZOOM_MAX,
  TEXT_FONT_FAMILY_DEFAULT,
  TEXT_FONT_SIZE_DEFAULT,
  TEXT_FONT_WEIGHT_DEFAULT,
  TEXT_FILL_DEFAULT,
  TEXT_ANCHOR_DEFAULT,
} from '../config/constants';
import { shapesOverlap, subtractFromShape } from '../lib/booleanOps';
import { bboxOfRings, translateRings, flipRings } from '../lib/geometry';
import type {
  AppState,
  Shape,
  ShapeTransform,
  Tool,
  GridMode,
  Point,
  ViewBox,
  TextItem,
  TextAnchor,
  FontWeight,
  CanvasSnapshot,
} from '../types';
import { IDENTITY_TRANSFORM } from '../types';

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Placeholder until useViewBox sets the real value on mount
const DEFAULT_VIEWBOX: ViewBox = { x: 0, y: 0, w: 1200, h: 800 };

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      // Captures shapes + texts together so undo/redo treats both as one timeline
      function snapshot(): CanvasSnapshot {
        const { shapes, texts } = get();
        return { shapes, texts };
      }
      function pushHistory() {
        const { history } = get();
        return [...history.slice(-MAX_HISTORY), snapshot()];
      }

      return {
        shapes: [],
        texts: [],
        activeTool: 'draw' as Tool,
        gridMode: 'square' as GridMode,
        gridSize: GRID_SIZE_DEFAULT,
        showGrid: true,
        strokeColor: STROKE_COLOR_DEFAULT,
        fillColor: FILL_COLOR_DEFAULT,
        strokeWidth: STROKE_WIDTH_DEFAULT,
        cornerRadius: CORNER_RADIUS_DEFAULT,
        textFontFamily: TEXT_FONT_FAMILY_DEFAULT,
        textFontSize: TEXT_FONT_SIZE_DEFAULT,
        textFontWeight: TEXT_FONT_WEIGHT_DEFAULT,
        textFill: TEXT_FILL_DEFAULT,
        textAnchor: TEXT_ANCHOR_DEFAULT,
        selectedShapeId: null,
        selectedTextId: null,
        editingTextId: null,
        history: [] as CanvasSnapshot[],
        future: [] as CanvasSnapshot[],
        previewPoints: [] as Point[],
        cursorPoint: null,
        viewBox: DEFAULT_VIEWBOX,
        initialViewBox: null,

        addShape: (shape: Shape) => {
          set({
            shapes: [...get().shapes, shape],
            history: pushHistory(),
            future: [],
          });
        },

        setViewBox: (vb: ViewBox) => set({ viewBox: vb }),
        setInitialViewBox: (vb: ViewBox) => set({ initialViewBox: vb }),

        zoomViewport: (factor: number) => {
          const { viewBox, initialViewBox } = get();
          const baseW = initialViewBox?.w ?? viewBox.w;
          const newW = clamp(viewBox.w / factor, baseW / ZOOM_MAX, baseW / ZOOM_MIN);
          const scale = newW / viewBox.w;
          const newH = viewBox.h * scale;
          const cx = viewBox.x + viewBox.w / 2;
          const cy = viewBox.y + viewBox.h / 2;
          set({ viewBox: { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH } });
        },

        resetViewport: () => {
          const { initialViewBox } = get();
          if (initialViewBox) set({ viewBox: initialViewBox });
        },

        setActiveTool: (tool: Tool) =>
          set({
            activeTool: tool,
            selectedTextId: tool === 'text' || tool === 'select' ? get().selectedTextId : null,
            editingTextId: tool === 'text' || tool === 'select' ? get().editingTextId : null,
            selectedShapeId: tool === 'select' ? get().selectedShapeId : null,
          }),
        setGridMode: (mode: GridMode) => set({ gridMode: mode }),
        setGridSize: (size: number) => set({ gridSize: size }),
        toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

        // Style setters mirror the text pattern: edit a single shape when one is selected,
        // otherwise update the global default that future shapes inherit.
        setFillColor: (color: string) =>
          set((s) => ({
            fillColor: color,
            shapes: s.selectedShapeId
              ? s.shapes.map((sh) => (sh.id === s.selectedShapeId ? { ...sh, fill: color } : sh))
              : s.shapes,
          })),
        setStrokeColor: (color: string) =>
          set((s) => ({
            strokeColor: color,
            shapes: s.selectedShapeId
              ? s.shapes.map((sh) => (sh.id === s.selectedShapeId ? { ...sh, stroke: color } : sh))
              : s.shapes,
          })),
        setStrokeWidth: (width: number) =>
          set((s) => ({
            strokeWidth: width,
            shapes: s.selectedShapeId
              ? s.shapes.map((sh) => (sh.id === s.selectedShapeId ? { ...sh, strokeWidth: width } : sh))
              : s.shapes,
          })),
        setCornerRadius: (r: number) =>
          set((s) => ({
            cornerRadius: r,
            shapes: s.selectedShapeId
              ? s.shapes.map((sh) => (sh.id === s.selectedShapeId ? { ...sh, cornerRadius: r } : sh))
              : s.shapes,
          })),
        setPreviewPoints: (points: Point[]) => set({ previewPoints: points }),
        setCursorPoint: (point: Point | null) => set({ cursorPoint: point }),

        undo: () => {
          const { history, future, previewPoints } = get();
          if (previewPoints.length > 0) {
            set({ previewPoints: previewPoints.slice(0, -1) });
            return;
          }
          if (history.length === 0) return;
          const previous = history[history.length - 1];
          set({
            shapes: previous.shapes,
            texts: previous.texts,
            history: history.slice(0, -1),
            future: [snapshot(), ...future],
          });
        },

        redo: () => {
          const { future, history } = get();
          if (future.length === 0) return;
          const next = future[0];
          set({
            shapes: next.shapes,
            texts: next.texts,
            history: [...history, snapshot()],
            future: future.slice(1),
          });
        },

        resetCanvas: () =>
          set({
            shapes: [],
            texts: [],
            selectedShapeId: null,
            selectedTextId: null,
            editingTextId: null,
            history: [],
            future: [],
            previewPoints: [],
            cursorPoint: null,
          }),

        cutoutShape: (cutterPoints: Point[]) => {
          const { shapes } = get();
          let targetIndex = -1;
          for (let i = shapes.length - 1; i >= 0; i--) {
            if (shapesOverlap(shapes[i], cutterPoints)) {
              targetIndex = i;
              break;
            }
          }
          if (targetIndex === -1) {
            set({ previewPoints: [] });
            return;
          }
          const resultShapes = subtractFromShape(shapes[targetIndex], cutterPoints);
          set({
            shapes: [
              ...shapes.slice(0, targetIndex),
              ...resultShapes,
              ...shapes.slice(targetIndex + 1),
            ],
            history: pushHistory(),
            future: [],
            previewPoints: [],
          });
        },

        // Shape selection & manipulation
        // Selecting a shape pulls its style into the global style slots so the
        // sidebar shows the selected shape's values (same trick as setSelectedTextId).
        setSelectedShapeId: (id: string | null) =>
          set((s) => {
            const shape = id ? s.shapes.find((sh) => sh.id === id) : null;
            return {
              selectedShapeId: id,
              // Shape and text selections are mutually exclusive
              selectedTextId: id ? null : s.selectedTextId,
              editingTextId:  id ? null : s.editingTextId,
              fillColor:    shape?.fill         ?? s.fillColor,
              strokeColor:  shape?.stroke       ?? s.strokeColor,
              strokeWidth:  shape?.strokeWidth  ?? s.strokeWidth,
              cornerRadius: shape?.cornerRadius ?? s.cornerRadius,
            };
          }),

        updateShape: (id: string, patch: Partial<Shape>) =>
          set((s) => ({
            shapes: s.shapes.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)),
          })),

        // moveShape is called from drag (many times per second) so it deliberately
        // skips history. Callers that want a discrete undo entry (arrow-nudge,
        // drag-end) should call commitHistory() afterwards.
        moveShape: (id: string, dx: number, dy: number) =>
          set((s) => ({
            shapes: s.shapes.map((sh) =>
              sh.id === id ? { ...sh, points: translateRings(sh.points, dx, dy) } : sh,
            ),
          })),
        commitHistory: () => set({ history: pushHistory(), future: [] }),

        duplicateShape: (id: string) => {
          const { shapes, gridSize } = get();
          const source = shapes.find((sh) => sh.id === id);
          if (!source) return;
          const offset = gridSize * 2;
          const copy: Shape = {
            ...source,
            id: crypto.randomUUID(),
            points: translateRings(source.points, offset, offset),
          };
          set({
            shapes: [...shapes, copy],
            selectedShapeId: copy.id,
            history: pushHistory(),
            future: [],
          });
        },

        flipShape: (id: string, axis: 'horizontal' | 'vertical') => {
          const { shapes } = get();
          const target = shapes.find((sh) => sh.id === id);
          if (!target) return;
          const bbox = bboxOfRings(target.points);
          const center = { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h / 2 };
          set({
            shapes: shapes.map((sh) =>
              sh.id === id ? { ...sh, points: flipRings(sh.points, axis, center) } : sh,
            ),
            history: pushHistory(),
            future: [],
          });
        },

        deleteShape: (id: string) => {
          set((s) => ({
            shapes: s.shapes.filter((sh) => sh.id !== id),
            selectedShapeId: s.selectedShapeId === id ? null : s.selectedShapeId,
            history: pushHistory(),
            future: [],
          }));
        },

        // Free-form transform: rotation/scale/skew are stored as metadata so they
        // can be reset cleanly. setShapeTransform skips history (sliders/drag);
        // resetShapeTransform and rotateShape commit a single entry.
        setShapeTransform: (id: string, patch: Partial<ShapeTransform>) =>
          set((s) => ({
            shapes: s.shapes.map((sh) =>
              sh.id === id
                ? { ...sh, transform: { ...(sh.transform ?? IDENTITY_TRANSFORM), ...patch } }
                : sh,
            ),
          })),

        rotateShape: (id: string, deltaDegrees: number) =>
          set((s) => ({
            shapes: s.shapes.map((sh) => {
              if (sh.id !== id) return sh;
              const current = sh.transform ?? IDENTITY_TRANSFORM;
              const rotation = ((current.rotation + deltaDegrees) % 360 + 360) % 360;
              return { ...sh, transform: { ...current, rotation } };
            }),
            history: pushHistory(),
            future: [],
          })),

        resetShapeTransform: (id: string) =>
          set((s) => ({
            shapes: s.shapes.map((sh) => (sh.id === id ? { ...sh, transform: undefined } : sh)),
            history: pushHistory(),
            future: [],
          })),

        reorderShape: (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => {
          const { shapes } = get();
          const idx = shapes.findIndex((sh) => sh.id === id);
          if (idx === -1) return;
          const next = shapes.slice();
          const [item] = next.splice(idx, 1);
          let targetIdx: number;
          switch (direction) {
            case 'front':    targetIdx = next.length; break;
            case 'back':     targetIdx = 0; break;
            case 'forward':  targetIdx = Math.min(next.length, idx + 1); break;
            case 'backward': targetIdx = Math.max(0, idx - 1); break;
          }
          next.splice(targetIdx, 0, item);
          set({ shapes: next, history: pushHistory(), future: [] });
        },

        // Text actions
        addText: (text: TextItem) => {
          set({
            texts: [...get().texts, text],
            selectedTextId: text.id,
            editingTextId: text.id,
            textFontFamily: text.fontFamily,
            textFontSize: text.fontSize,
            textFontWeight: text.fontWeight,
            textFill: text.fill,
            textAnchor: text.anchor,
            history: pushHistory(),
            future: [],
          });
        },

        // Style edits to existing text don't push history (matches shape style behaviour).
        // Position drags and content edits also stay out of history for now —
        // simplest model: only creation/deletion are undoable.
        updateText: (id: string, patch: Partial<TextItem>) =>
          set((s) => ({
            texts: s.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          })),

        deleteText: (id: string) => {
          set({
            texts: get().texts.filter((t) => t.id !== id),
            selectedTextId: null,
            editingTextId: null,
            history: pushHistory(),
            future: [],
          });
        },

        setSelectedTextId: (id: string | null) =>
          set((s) => {
            const text = id ? s.texts.find((t) => t.id === id) : null;
            return {
              selectedTextId: id,
              selectedShapeId: id ? null : s.selectedShapeId,
              textFontFamily: text?.fontFamily ?? s.textFontFamily,
              textFontSize: text?.fontSize ?? s.textFontSize,
              textFontWeight: text?.fontWeight ?? s.textFontWeight,
              textFill: text?.fill ?? s.textFill,
              textAnchor: text?.anchor ?? s.textAnchor,
            };
          }),

        setEditingTextId: (id: string | null) =>
          set((s) => ({
            editingTextId: id,
            selectedTextId: id ?? s.selectedTextId,
          })),

        // Mirror the global-shape-style pattern: changing a default also rewrites
        // the currently-selected text so the sidebar is a live editor for it.
        setTextFontFamily: (f: string) =>
          set((s) => ({
            textFontFamily: f,
            texts: s.selectedTextId
              ? s.texts.map((t) => (t.id === s.selectedTextId ? { ...t, fontFamily: f } : t))
              : s.texts,
          })),
        setTextFontSize: (size: number) =>
          set((s) => ({
            textFontSize: size,
            texts: s.selectedTextId
              ? s.texts.map((t) => (t.id === s.selectedTextId ? { ...t, fontSize: size } : t))
              : s.texts,
          })),
        setTextFontWeight: (w: FontWeight) =>
          set((s) => ({
            textFontWeight: w,
            texts: s.selectedTextId
              ? s.texts.map((t) => (t.id === s.selectedTextId ? { ...t, fontWeight: w } : t))
              : s.texts,
          })),
        setTextFill: (c: string) =>
          set((s) => ({
            textFill: c,
            texts: s.selectedTextId
              ? s.texts.map((t) => (t.id === s.selectedTextId ? { ...t, fill: c } : t))
              : s.texts,
          })),
        setTextAnchor: (a: TextAnchor) =>
          set((s) => ({
            textAnchor: a,
            texts: s.selectedTextId
              ? s.texts.map((t) => (t.id === s.selectedTextId ? { ...t, anchor: a } : t))
              : s.texts,
          })),
      };
    },
    {
      name: 'forma-canvas',
      partialize: (state) => ({
        shapes:         state.shapes,
        texts:          state.texts,
        fillColor:      state.fillColor,
        strokeColor:    state.strokeColor,
        strokeWidth:    state.strokeWidth,
        cornerRadius:   state.cornerRadius,
        textFontFamily: state.textFontFamily,
        textFontSize:   state.textFontSize,
        textFontWeight: state.textFontWeight,
        textFill:       state.textFill,
        textAnchor:     state.textAnchor,
        gridSize:       state.gridSize,
        gridMode:       state.gridMode,
        showGrid:       state.showGrid,
        activeTool:     state.activeTool,
      }),
    },
  ),
);
