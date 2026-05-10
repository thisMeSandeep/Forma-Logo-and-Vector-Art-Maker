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
import type {
  AppState,
  Shape,
  Tool,
  GridMode,
  Point,
  ViewBox,
  TextItem,
  TextAnchor,
  FontWeight,
  CanvasSnapshot,
} from '../types';

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
            selectedTextId: tool === 'text' ? get().selectedTextId : null,
            editingTextId: tool === 'text' ? get().editingTextId : null,
          }),
        setGridMode: (mode: GridMode) => set({ gridMode: mode }),
        setGridSize: (size: number) => set({ gridSize: size }),
        toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

        setFillColor: (color: string) =>
          set((s) => ({ fillColor: color, shapes: s.shapes.map((sh) => ({ ...sh, fill: color })) })),
        setStrokeColor: (color: string) =>
          set((s) => ({ strokeColor: color, shapes: s.shapes.map((sh) => ({ ...sh, stroke: color })) })),
        setStrokeWidth: (width: number) =>
          set((s) => ({ strokeWidth: width, shapes: s.shapes.map((sh) => ({ ...sh, strokeWidth: width })) })),
        setCornerRadius: (r: number) =>
          set((s) => ({ cornerRadius: r, shapes: s.shapes.map((sh) => ({ ...sh, cornerRadius: r })) })),
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
