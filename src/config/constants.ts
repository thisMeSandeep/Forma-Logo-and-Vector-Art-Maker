// All JS logic constants live here

export const GRID_SIZE_DEFAULT = 40;
export const GRID_SIZE_MIN = 10;
export const GRID_SIZE_MAX = 100;

export const FILL_COLOR_DEFAULT = '#2563eb';
export const STROKE_COLOR_DEFAULT = '#0f172a';
export const STROKE_WIDTH_DEFAULT = 1.5;
export const STROKE_WIDTH_MIN = 0;
export const STROKE_WIDTH_MAX = 10;

// Corner radius applied to polygon vertices (0 = sharp corners)
export const CORNER_RADIUS_DEFAULT = 0;
export const CORNER_RADIUS_MIN = 0;
// High ceiling — the renderer clamps each corner to half its shorter edge,
// so a value above the shape's side length just means "fully rounded"
export const CORNER_RADIUS_MAX = 500;

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
export const EXPORT_PADDING = 4;

// Pixel scale multiplier for PNG export (higher = sharper output)
export const EXPORT_PNG_SCALE = 3;

// Fill opacity applied to existing shapes while the cutout tool is active —
// lets the user see grid intersections inside shapes for snapping
export const CUTOUT_FILL_OPACITY = 0.55;

// Text defaults
export const TEXT_FONT_FAMILY_DEFAULT = 'Geist Variable, system-ui, sans-serif';
export const TEXT_FONT_SIZE_DEFAULT = 24;
export const TEXT_FONT_SIZE_MIN = 6;
export const TEXT_FONT_SIZE_MAX = 200;
export const TEXT_FONT_WEIGHT_DEFAULT = 600 as const;
export const TEXT_FILL_DEFAULT = '#ffffff';
export const TEXT_ANCHOR_DEFAULT = 'middle' as const;

// Web-safe font stacks the user can pick from in the sidebar
export const TEXT_FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Sans',     value: 'Geist Variable, system-ui, sans-serif' },
  { label: 'Serif',    value: 'ui-serif, Georgia, serif' },
  { label: 'Mono',     value: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  { label: 'Display',  value: '"Bebas Neue", Impact, "Arial Black", sans-serif' },
];
