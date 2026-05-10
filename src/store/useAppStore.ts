import { create } from 'zustand';
import {
  FILL_COLOR_DEFAULT,
  STROKE_COLOR_DEFAULT,
  STROKE_WIDTH_DEFAULT,
  GRID_SIZE_DEFAULT,
  MAX_HISTORY,
} from '../config/constants';
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
  setStrokeColor: (color: string) => set({ strokeColor: color }),
  setFillColor: (color: string) => set({ fillColor: color }),
  setStrokeWidth: (width: number) => set({ strokeWidth: width }),
  setPreviewPoints: (points: Point[]) => set({ previewPoints: points }),
  setCursorPoint: (point: Point | null) => set({ cursorPoint: point }),

  undo: () => {
    const { history, shapes, future } = get();
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
}));
