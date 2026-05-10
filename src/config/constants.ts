// All JS logic constants live here. Visual values (colors, opacities) live in
// index.css as CSS custom properties so theming is a single-file change.

export const GRID_SIZE_DEFAULT = 40;
export const GRID_SIZE_MIN = 10;
export const GRID_SIZE_MAX = 100;

export const FILL_COLOR_DEFAULT = '#4f86f7';
export const STROKE_COLOR_DEFAULT = '#ffffff';
export const STROKE_WIDTH_DEFAULT = 1.5;
export const STROKE_WIDTH_MIN = 0;
export const STROKE_WIDTH_MAX = 10;

// Pixel radius within which clicking snaps/closes on the first point
export const CLOSE_SNAP_RADIUS = 12;

export const MAX_HISTORY = 50;

// Isometric grid angle in degrees (standard 30° from horizontal)
export const ISO_ANGLE_DEG = 30;

// Half-length of each arm of the crosshair cursor
export const CROSSHAIR_ARM = 8;

// Radius of the small dot drawn at the snapped grid position
export const SNAP_DOT_RADIUS = 3;

// First-point highlight ring when polygon is about to close
export const CLOSE_INDICATOR_RADIUS = 8;

// Preview line style (in-progress polygon edges)
export const PREVIEW_LINE_STROKE_WIDTH = 1.5;

// Dash pattern for the rubber-band segment (live preview line to cursor)
export const PREVIEW_DASH_ARRAY = '4 4';

// Zoom limits (multiplier relative to initial 100% view)
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 20;
// Factor applied per mouse-wheel tick (>1 = zoom in)
export const ZOOM_WHEEL_FACTOR = 1.07;
// Factor applied per +/− button click
export const ZOOM_BUTTON_FACTOR = 1.25;
// Fraction of the raw screen delta applied per pan frame (0–1, lower = slower)
export const PAN_SPEED = 0.6;

// Whitespace around shapes in exported SVG/PNG (in SVG user units)
export const EXPORT_PADDING = 16;

// Pixel scale multiplier for PNG export (higher = sharper output)
export const EXPORT_PNG_SCALE = 2;
