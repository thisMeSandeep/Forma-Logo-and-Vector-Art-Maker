// All magic numbers and defaults live here — never hardcode these in components

export const GRID_SIZE_DEFAULT = 40;
export const GRID_SIZE_MIN = 10;
export const GRID_SIZE_MAX = 100;

export const GRID_LINE_COLOR = '#ffffff';
export const GRID_LINE_OPACITY = 0.07;
export const GRID_LINE_STROKE_WIDTH = 1;

// Isometric grid angle in degrees (standard 30° from horizontal)
export const ISO_ANGLE_DEG = 30;

export const FILL_COLOR_DEFAULT = '#4f86f7';
export const STROKE_COLOR_DEFAULT = '#ffffff';
export const STROKE_WIDTH_DEFAULT = 1.5;
export const STROKE_WIDTH_MIN = 0;
export const STROKE_WIDTH_MAX = 10;

// Pixel radius within which clicking snaps to/closes on the first point
export const CLOSE_SNAP_RADIUS = 12;

export const MAX_HISTORY = 50;

// Dot drawn at snapped cursor position while drawing
export const CURSOR_DOT_RADIUS = 4;
export const CURSOR_DOT_COLOR = '#ffffff';

// First-point highlight when polygon is about to close
export const CLOSE_INDICATOR_RADIUS = 8;
export const CLOSE_INDICATOR_COLOR = '#facc15'; // yellow-400

// Preview line style (in-progress polygon edges)
export const PREVIEW_LINE_COLOR = '#ffffff';
export const PREVIEW_LINE_OPACITY = 0.5;
export const PREVIEW_LINE_STROKE_WIDTH = 1.5;

// Canvas background color (zinc-900 tone)
export const CANVAS_BG_COLOR = '#18181b';
