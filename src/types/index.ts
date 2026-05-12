export type Point = {
  x: number;
  y: number;
};

export type ViewBox = { x: number; y: number; w: number; h: number };

export type ShapeType = 'draw' | 'cutout';

// Free-form transform applied around the shape's baked-points bbox center.
// Default (when transform is undefined) is the identity. Rotate/scale/skew live
// here so they can be tweaked or fully reset without rebaking the geometry.
export type ShapeTransform = {
  rotation: number;  // degrees
  scaleX: number;    // 1 = identity
  scaleY: number;
  skewX: number;     // degrees
  skewY: number;
};

export const IDENTITY_TRANSFORM: ShapeTransform = {
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  skewX: 0,
  skewY: 0,
};

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type FillKind = 'solid' | 'linear';

export type ShapeShadow = {
  x: number;
  y: number;
  blur: number;
  color: string;
};

export type LinearGradient = {
  from: string;
  to: string;
  angle: number;  // degrees, 0 = left→right, 90 = top→bottom
};

export type Shape = {
  id: string;
  points: Point[][];  // first ring = outer boundary; subsequent rings = holes
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  type: ShapeType;
  transform?: ShapeTransform;
  // Open vs closed path. Undefined = closed (default for existing data).
  // Open shapes render with no fill and no Z terminator, used by Line/Arrow.
  closed?: boolean;
  // When set, draws an arrowhead at the last point of the (first) ring.
  arrowEnd?: boolean;
  // Styling extensions. Undefined → use legacy defaults.
  opacity?: number;             // 0..1
  strokeStyle?: StrokeStyle;
  shadow?: ShapeShadow | null;  // null = explicitly disabled
  blur?: number;                // gaussian blur radius (0 = none)
  fillKind?: FillKind;          // 'solid' (default) or 'linear' (uses fillGradient)
  fillGradient?: LinearGradient;
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

export type Tool =
  | 'draw'
  | 'cutout'
  | 'text'
  | 'select'
  | 'rectangle'
  | 'ellipse'
  | 'polygon'
  | 'star'
  | 'line'
  | 'arrow';

export const PRIMITIVE_TOOLS = ['rectangle', 'ellipse', 'polygon', 'star', 'line', 'arrow'] as const;
export type PrimitiveTool = typeof PRIMITIVE_TOOLS[number];

export function isPrimitiveTool(tool: Tool): tool is PrimitiveTool {
  return (PRIMITIVE_TOOLS as readonly string[]).includes(tool);
}

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
  opacity: number;
  strokeStyle: StrokeStyle;
  // Defaults for newly placed text — also used as the "global" editing state
  // when a text is selected (mirrors how shape style works).
  textFontFamily: string;
  textFontSize: number;
  textFontWeight: FontWeight;
  textFill: string;
  textAnchor: TextAnchor;
  selectedShapeId: string | null;
  selectedTextId: string | null;
  editingTextId: string | null;
  history: CanvasSnapshot[];
  future: CanvasSnapshot[];
  previewPoints: Point[];
  // Drag-to-create state for primitive tools. cursorPoint provides the moving end.
  dragStart: Point | null;
  // Smart guides shown during shape drag. Transient — cleared on pointerup.
  activeGuides: import('../lib/alignment').Guide[];
  shiftConstrain: boolean;
  // Primitive-tool config
  polygonSides: number;
  starPointCount: number;
  starInnerRatio: number;
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
  setOpacity: (o: number) => void;
  setStrokeStyle: (s: StrokeStyle) => void;
  setPreviewPoints: (points: Point[]) => void;
  setDragStart: (point: Point | null) => void;
  setActiveGuides: (guides: import('../lib/alignment').Guide[]) => void;
  alignSelectedToCanvas: (direction: import('../lib/alignment').AlignDirection) => void;
  setShiftConstrain: (on: boolean) => void;
  setPolygonSides: (n: number) => void;
  setStarPointCount: (n: number) => void;
  setStarInnerRatio: (r: number) => void;
  setCursorPoint: (point: Point | null) => void;
  setViewBox: (vb: ViewBox) => void;
  setInitialViewBox: (vb: ViewBox) => void;
  zoomViewport: (factor: number) => void;
  resetViewport: () => void;
  undo: () => void;
  redo: () => void;
  resetCanvas: () => void;
  cutoutShape: (cutterPoints: Point[]) => void;

  // Shape selection & manipulation
  setSelectedShapeId: (id: string | null) => void;
  updateShape: (id: string, patch: Partial<Shape>) => void;
  moveShape: (id: string, dx: number, dy: number) => void;
  duplicateShape: (id: string) => void;
  flipShape: (id: string, axis: 'horizontal' | 'vertical') => void;
  deleteShape: (id: string) => void;
  reorderShape: (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => void;
  setShapeTransform: (id: string, patch: Partial<ShapeTransform>) => void;
  rotateShape: (id: string, deltaDegrees: number) => void;
  resetShapeTransform: (id: string) => void;
  commitHistory: () => void;

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
