import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FILL_COLOR_DEFAULT,
  STROKE_COLOR_DEFAULT,
  STROKE_WIDTH_DEFAULT,
  CORNER_RADIUS_DEFAULT,
  GRID_SIZE_DEFAULT,
  MAX_HISTORY,
  TEXT_FONT_FAMILY_DEFAULT,
  TEXT_FONT_SIZE_DEFAULT,
  TEXT_FONT_WEIGHT_DEFAULT,
  TEXT_FILL_DEFAULT,
  TEXT_ANCHOR_DEFAULT,
} from '../config/constants';
import { translateRings } from '../lib/geometry';
import {
  applyCutout,
  duplicatedShape,
  flippedShape,
  patchSelectedShape,
  reorderedShapes,
  withRotationDelta,
  withTransformPatch,
} from './actions/shapes';
import { patchSelectedText } from './actions/text';
import { zoomedViewBoxCenter } from './actions/viewport';
import type {
  AppState,
  Tool,
  GridMode,
  Point,
  ViewBox,
  TextAnchor,
  FontWeight,
  CanvasSnapshot,
} from '../types';

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

        addShape: (shape) =>
          set((s) => ({ shapes: [...s.shapes, shape], history: pushHistory(), future: [] })),

        setViewBox: (vb) => set({ viewBox: vb }),
        setInitialViewBox: (vb) => set({ initialViewBox: vb }),
        zoomViewport: (factor) =>
          set((s) => ({ viewBox: zoomedViewBoxCenter(s.viewBox, s.initialViewBox, factor) })),
        resetViewport: () => {
          const { initialViewBox } = get();
          if (initialViewBox) set({ viewBox: initialViewBox });
        },

        setActiveTool: (tool) =>
          set((s) => ({
            activeTool: tool,
            selectedTextId: tool === 'text' || tool === 'select' ? s.selectedTextId : null,
            editingTextId:  tool === 'text' || tool === 'select' ? s.editingTextId  : null,
            selectedShapeId: tool === 'select' ? s.selectedShapeId : null,
          })),
        setGridMode: (mode) => set({ gridMode: mode }),
        setGridSize: (size) => set({ gridSize: size }),
        toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

        // Style setters update the selected shape when one is selected (live edit)
        // and always update the global default that future shapes inherit.
        setFillColor: (color) =>
          set((s) => ({ fillColor: color, shapes: patchSelectedShape(s.shapes, s.selectedShapeId, 'fill', color) })),
        setStrokeColor: (color) =>
          set((s) => ({ strokeColor: color, shapes: patchSelectedShape(s.shapes, s.selectedShapeId, 'stroke', color) })),
        setStrokeWidth: (width) =>
          set((s) => ({ strokeWidth: width, shapes: patchSelectedShape(s.shapes, s.selectedShapeId, 'strokeWidth', width) })),
        setCornerRadius: (r) =>
          set((s) => ({ cornerRadius: r, shapes: patchSelectedShape(s.shapes, s.selectedShapeId, 'cornerRadius', r) })),

        setPreviewPoints: (points) => set({ previewPoints: points }),
        setCursorPoint: (point) => set({ cursorPoint: point }),

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
            shapes: [], texts: [],
            selectedShapeId: null, selectedTextId: null, editingTextId: null,
            history: [], future: [],
            previewPoints: [], cursorPoint: null,
          }),

        cutoutShape: (cutterPoints) => {
          const next = applyCutout(get().shapes, cutterPoints);
          if (next === null) {
            set({ previewPoints: [] });
            return;
          }
          set({ shapes: next, history: pushHistory(), future: [], previewPoints: [] });
        },

        // Selecting a shape pulls its style into the global slots so the sidebar
        // can act as a live editor for it. Shape and text selections are mutually
        // exclusive.
        setSelectedShapeId: (id) =>
          set((s) => {
            const shape = id ? s.shapes.find((sh) => sh.id === id) : null;
            return {
              selectedShapeId: id,
              selectedTextId: id ? null : s.selectedTextId,
              editingTextId:  id ? null : s.editingTextId,
              fillColor:    shape?.fill         ?? s.fillColor,
              strokeColor:  shape?.stroke       ?? s.strokeColor,
              strokeWidth:  shape?.strokeWidth  ?? s.strokeWidth,
              cornerRadius: shape?.cornerRadius ?? s.cornerRadius,
            };
          }),

        updateShape: (id, patch) =>
          set((s) => ({ shapes: s.shapes.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)) })),

        // moveShape is called from drag (many times per second) so it deliberately
        // skips history. Callers that want a discrete undo entry (arrow-nudge,
        // drag-end) should call commitHistory() afterwards.
        moveShape: (id, dx, dy) =>
          set((s) => ({
            shapes: s.shapes.map((sh) =>
              sh.id === id ? { ...sh, points: translateRings(sh.points, dx, dy) } : sh,
            ),
          })),
        commitHistory: () => set({ history: pushHistory(), future: [] }),

        duplicateShape: (id) => {
          const { shapes, gridSize } = get();
          const source = shapes.find((sh) => sh.id === id);
          if (!source) return;
          const copy = duplicatedShape(source, gridSize);
          set({
            shapes: [...shapes, copy],
            selectedShapeId: copy.id,
            history: pushHistory(),
            future: [],
          });
        },

        flipShape: (id, axis) =>
          set((s) => ({
            shapes: s.shapes.map((sh) => (sh.id === id ? flippedShape(sh, axis) : sh)),
            history: pushHistory(),
            future: [],
          })),

        deleteShape: (id) =>
          set((s) => ({
            shapes: s.shapes.filter((sh) => sh.id !== id),
            selectedShapeId: s.selectedShapeId === id ? null : s.selectedShapeId,
            history: pushHistory(),
            future: [],
          })),

        reorderShape: (id, direction) =>
          set((s) => ({
            shapes: reorderedShapes(s.shapes, id, direction),
            history: pushHistory(),
            future: [],
          })),

        setShapeTransform: (id, patch) =>
          set((s) => ({
            shapes: s.shapes.map((sh) => (sh.id === id ? withTransformPatch(sh, patch) : sh)),
          })),

        rotateShape: (id, deltaDegrees) =>
          set((s) => ({
            shapes: s.shapes.map((sh) => (sh.id === id ? withRotationDelta(sh, deltaDegrees) : sh)),
            history: pushHistory(),
            future: [],
          })),

        resetShapeTransform: (id) =>
          set((s) => ({
            shapes: s.shapes.map((sh) => (sh.id === id ? { ...sh, transform: undefined } : sh)),
            history: pushHistory(),
            future: [],
          })),

        // Text actions
        addText: (text) =>
          set((s) => ({
            texts: [...s.texts, text],
            selectedTextId: text.id,
            editingTextId: text.id,
            textFontFamily: text.fontFamily,
            textFontSize: text.fontSize,
            textFontWeight: text.fontWeight,
            textFill: text.fill,
            textAnchor: text.anchor,
            history: pushHistory(),
            future: [],
          })),

        // Style edits to existing text don't push history (matches shape style behaviour).
        // Position drags and content edits also stay out of history for now —
        // simplest model: only creation/deletion are undoable.
        updateText: (id, patch) =>
          set((s) => ({ texts: s.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

        deleteText: (id) =>
          set((s) => ({
            texts: s.texts.filter((t) => t.id !== id),
            selectedTextId: null,
            editingTextId: null,
            history: pushHistory(),
            future: [],
          })),

        setSelectedTextId: (id) =>
          set((s) => {
            const text = id ? s.texts.find((t) => t.id === id) : null;
            return {
              selectedTextId: id,
              selectedShapeId: id ? null : s.selectedShapeId,
              textFontFamily: text?.fontFamily ?? s.textFontFamily,
              textFontSize:   text?.fontSize   ?? s.textFontSize,
              textFontWeight: text?.fontWeight ?? s.textFontWeight,
              textFill:       text?.fill       ?? s.textFill,
              textAnchor:     text?.anchor     ?? s.textAnchor,
            };
          }),

        setEditingTextId: (id) =>
          set((s) => ({ editingTextId: id, selectedTextId: id ?? s.selectedTextId })),

        setTextFontFamily: (f: string) =>
          set((s) => ({ textFontFamily: f, texts: patchSelectedText(s.texts, s.selectedTextId, 'fontFamily', f) })),
        setTextFontSize: (size: number) =>
          set((s) => ({ textFontSize: size, texts: patchSelectedText(s.texts, s.selectedTextId, 'fontSize', size) })),
        setTextFontWeight: (w: FontWeight) =>
          set((s) => ({ textFontWeight: w, texts: patchSelectedText(s.texts, s.selectedTextId, 'fontWeight', w) })),
        setTextFill: (c: string) =>
          set((s) => ({ textFill: c, texts: patchSelectedText(s.texts, s.selectedTextId, 'fill', c) })),
        setTextAnchor: (a: TextAnchor) =>
          set((s) => ({ textAnchor: a, texts: patchSelectedText(s.texts, s.selectedTextId, 'anchor', a) })),
      } satisfies AppState;
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
