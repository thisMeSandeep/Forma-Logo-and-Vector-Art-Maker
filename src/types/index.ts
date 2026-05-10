export type Point = {
  x: number;
  y: number;
};

export type ViewBox = { x: number; y: number; w: number; h: number };

export type ShapeType = 'draw' | 'cutout';

export type Shape = {
  id: string;
  points: Point[][];  // first ring = outer boundary; subsequent rings = holes
  fill: string;
  stroke: string;
  strokeWidth: number;
  type: ShapeType;
};

export type Tool = 'draw' | 'cutout' | 'select';

export type GridMode = 'square' | 'isometric';

export type AppState = {
  shapes: Shape[];
  activeTool: Tool;
  gridMode: GridMode;
  gridSize: number;
  showGrid: boolean;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  history: Shape[][];
  future: Shape[][];
  previewPoints: Point[];
  cursorPoint: Point | null;
  viewBox: ViewBox;
  initialViewBox: ViewBox | null;

  // Actions
  addShape: (shape: Shape) => void;
  setActiveTool: (tool: Tool) => void;
  setGridMode: (mode: GridMode) => void;
  setGridSize: (size: number) => void;
  toggleGrid: () => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setPreviewPoints: (points: Point[]) => void;
  setCursorPoint: (point: Point | null) => void;
  setViewBox: (vb: ViewBox) => void;
  setInitialViewBox: (vb: ViewBox) => void;
  zoomViewport: (factor: number) => void;
  resetViewport: () => void;
  undo: () => void;
  redo: () => void;
  resetCanvas: () => void;
  cutoutShape: (cutterPoints: Point[]) => void;
};
