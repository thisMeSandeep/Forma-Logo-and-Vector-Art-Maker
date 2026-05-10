import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FILL_COLOR_DEFAULT,
  STROKE_COLOR_DEFAULT,
  STROKE_WIDTH_DEFAULT,
  GRID_SIZE_DEFAULT,
  MAX_HISTORY,
  ZOOM_MIN,
  ZOOM_MAX,
} from '../config/constants';
import { shapesOverlap, subtractFromShape } from '../lib/booleanOps';
import type { AppState, Shape, Tool, GridMode, Point, ViewBox } from '../types';

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Placeholder until useViewBox sets the real value on mount
const DEFAULT_VIEWBOX: ViewBox = { x: 0, y: 0, w: 1200, h: 800 };

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      shapes: [],
      activeTool: 'draw' as Tool,
      gridMode: 'square' as GridMode,
      gridSize: GRID_SIZE_DEFAULT,
      showGrid: true,
      strokeColor: STROKE_COLOR_DEFAULT,
      fillColor: FILL_COLOR_DEFAULT,
      strokeWidth: STROKE_WIDTH_DEFAULT,
      history: [] as Shape[][],
      future: [] as Shape[][],
      previewPoints: [] as Point[],
      cursorPoint: null,
      viewBox: DEFAULT_VIEWBOX,
      initialViewBox: null,

      addShape: (shape: Shape) => {
        const { shapes, history } = get();
        const trimmed = history.slice(-MAX_HISTORY);
        set({
          shapes: [...shapes, shape],
          history: [...trimmed, shapes],
          future: [],
        });
      },

      setViewBox: (vb: ViewBox) => set({ viewBox: vb }),
      setInitialViewBox: (vb: ViewBox) => set({ initialViewBox: vb }),

      // Zoom centered on current viewport centre — no SVG element reference needed
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

      setActiveTool: (tool: Tool) => set({ activeTool: tool }),
      setGridMode: (mode: GridMode) => set({ gridMode: mode }),
      setGridSize: (size: number) => set({ gridSize: size }),
      toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

      // Style setters update all existing shapes immediately so the canvas always
      // reflects what the sidebar shows. Not pushed to history — undo/redo is
      // scoped to shape additions only, avoiding sidebar/canvas colour desync.
      setFillColor: (color: string) =>
        set((s) => ({ fillColor: color, shapes: s.shapes.map((sh) => ({ ...sh, fill: color })) })),
      setStrokeColor: (color: string) =>
        set((s) => ({ strokeColor: color, shapes: s.shapes.map((sh) => ({ ...sh, stroke: color })) })),
      setStrokeWidth: (width: number) =>
        set((s) => ({ strokeWidth: width, shapes: s.shapes.map((sh) => ({ ...sh, strokeWidth: width })) })),
      setPreviewPoints: (points: Point[]) => set({ previewPoints: points }),
      setCursorPoint: (point: Point | null) => set({ cursorPoint: point }),

      undo: () => {
        const { history, shapes, future, previewPoints } = get();
        // While drawing, undo removes the last placed point one at a time
        if (previewPoints.length > 0) {
          set({ previewPoints: previewPoints.slice(0, -1) });
          return;
        }
        if (history.length === 0) return;
        const previous = history[history.length - 1];
        set({
          shapes: previous,
          history: history.slice(0, -1),
          future: [shapes, ...future],
        });
      },

      redo: () => {
        const { future, shapes, history } = get();
        if (future.length === 0) return;
        const next = future[0];
        set({
          shapes: next,
          history: [...history, shapes],
          future: future.slice(1),
        });
      },

      resetCanvas: () =>
        set({
          shapes: [],
          history: [],
          future: [],
          previewPoints: [],
          cursorPoint: null,
        }),

      cutoutShape: (cutterPoints: Point[]) => {
        const { shapes, history } = get();
        // Find the topmost shape that overlaps with the cutter (search from end = top)
        let targetIndex = -1;
        for (let i = shapes.length - 1; i >= 0; i--) {
          if (shapesOverlap(shapes[i], cutterPoints)) {
            targetIndex = i;
            break;
          }
        }
        // No overlapping shape — discard the cutter silently
        if (targetIndex === -1) {
          set({ previewPoints: [] });
          return;
        }
        const resultShapes = subtractFromShape(shapes[targetIndex], cutterPoints);
        const trimmed = history.slice(-MAX_HISTORY);
        set({
          shapes: [
            ...shapes.slice(0, targetIndex),
            ...resultShapes,
            ...shapes.slice(targetIndex + 1),
          ],
          history: [...trimmed, shapes],
          future: [],
          previewPoints: [],
        });
      },
    }),
    {
      name: 'forma-canvas',
      // Only persist the user's work and preferences — not transient UI state
      partialize: (state) => ({
        shapes:      state.shapes,
        fillColor:   state.fillColor,
        strokeColor: state.strokeColor,
        strokeWidth: state.strokeWidth,
        gridSize:    state.gridSize,
        gridMode:    state.gridMode,
        showGrid:    state.showGrid,
        activeTool:  state.activeTool,
      }),
    },
  ),
);
