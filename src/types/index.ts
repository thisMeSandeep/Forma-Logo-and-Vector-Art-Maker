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
  cornerRadius: number;
  type: ShapeType;
};

export type TextAnchor = 'start' | 'middle' | 'end';
export type FontWeight = 400 | 500 | 600 | 700;

export type TextItem = {
  id: string;
  x: number;
  y: number;
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  fill: string;
  anchor: TextAnchor;
};

export type Tool = 'draw' | 'cutout' | 'text' | 'select';

export type GridMode = 'square' | 'isometric';

// Snapshot used for undo/redo so text and shape edits both participate in history
export type CanvasSnapshot = {
  shapes: Shape[];
  texts: TextItem[];
};

export type AppState = {
  shapes: Shape[];
  texts: TextItem[];
  activeTool: Tool;
  gridMode: GridMode;
  gridSize: number;
  showGrid: boolean;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  cornerRadius: number;
  // Defaults for newly placed text — also used as the "global" editing state
  // when a text is selected (mirrors how shape style works).
  textFontFamily: string;
  textFontSize: number;
  textFontWeight: FontWeight;
  textFill: string;
  textAnchor: TextAnchor;
  selectedTextId: string | null;
  editingTextId: string | null;
  history: CanvasSnapshot[];
  future: CanvasSnapshot[];
  previewPoints: Point[];
  cursorPoint: Point | null;
  viewBox: ViewBox;
  initialViewBox: ViewBox | null;

  // Shape actions
  addShape: (shape: Shape) => void;
  setActiveTool: (tool: Tool) => void;
  setGridMode: (mode: GridMode) => void;
  setGridSize: (size: number) => void;
  toggleGrid: () => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setCornerRadius: (r: number) => void;
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

  // Text actions
  addText: (text: TextItem) => void;
  updateText: (id: string, patch: Partial<TextItem>) => void;
  deleteText: (id: string) => void;
  setSelectedTextId: (id: string | null) => void;
  setEditingTextId: (id: string | null) => void;
  setTextFontFamily: (f: string) => void;
  setTextFontSize: (s: number) => void;
  setTextFontWeight: (w: FontWeight) => void;
  setTextFill: (c: string) => void;
  setTextAnchor: (a: TextAnchor) => void;
};
