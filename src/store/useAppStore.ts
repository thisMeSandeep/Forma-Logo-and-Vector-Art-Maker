import { create } from 'zustand';
import {
  FILL_COLOR_DEFAULT,
  STROKE_COLOR_DEFAULT,
  STROKE_WIDTH_DEFAULT,
  GRID_SIZE_DEFAULT,
  MAX_HISTORY,
} from '../config/constants';
import { shapesOverlap, subtractFromShape } from '../lib/booleanOps';
import type { AppState, Shape, Tool, GridMode, Point } from '../types';

const initialShapes: Shape[] = [];

export const useAppStore = create<AppState>((set, get) => ({
  shapes: initialShapes,
  activeTool: 'draw',
  gridMode: 'square',
  gridSize: GRID_SIZE_DEFAULT,
  showGrid: true,
  strokeColor: STROKE_COLOR_DEFAULT,
  fillColor: FILL_COLOR_DEFAULT,
  strokeWidth: STROKE_WIDTH_DEFAULT,
  history: [],
  future: [],
  previewPoints: [],
  cursorPoint: null,

  addShape: (shape: Shape) => {
    const { shapes, history } = get();
    const trimmed = history.slice(-MAX_HISTORY);
    set({
      shapes: [...shapes, shape],
      history: [...trimmed, shapes],
      future: [],
    });
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
}));
