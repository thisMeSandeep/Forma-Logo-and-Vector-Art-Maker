# Forma — Logo & Icon Drawing Tool
> A grid-based SVG polygon drawing tool. Draw geometric logos and icons with snapping, boolean cutouts, and clean SVG/PNG export.

---

## What We Are Building

A web app where users can:
- Draw filled polygons on a snapped grid (square or isometric)
- Cut holes into shapes (boolean subtract)
- Adjust stroke, fill, grid size
- Export the result as SVG or PNG
- Undo/redo actions

This is **not** a copy of Logo Lattice. The UI/UX will be redesigned — cleaner, more intuitive, with better controls and layout.

---

## Tech Stack

| Purpose | Library |
|---|---|
| Framework | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Icons | Lucide React |
| State management | Zustand |
| Boolean geometry | `polygon-clipping` |
| Rendering | SVG (native browser SVG, inside React JSX) |

---

## UI/UX Direction

**Layout:** Two-panel layout.
- Left: full-screen drawing canvas (dark background, subtle grid)
- Right: collapsible sidebar panel with all controls

**Design language:**
- Dark theme (not pitch black — use zinc/slate tones)
- Minimal, no visual clutter
- Controls grouped into clear sections with dividers
- Smooth hover/active states on all interactive elements
- Cursor changes based on active tool (crosshair for draw, default for select)

**Improvements over Logo Lattice:**
- Tool switcher as icon toolbar on the left edge of canvas (vertical, floating), not buried in sidebar
- Grid toggle is a subtle button on canvas, not in sidebar
- Sidebar is collapsible with a toggle button
- Color pickers use shadcn component
- Undo/Redo buttons visible in a top toolbar bar
- Canvas has a faint checkerboard or dot grid background when no grid overlay is active
- Zoom in/out buttons on canvas (future step, scaffold now)
- Shape count and canvas status shown in a subtle bottom status bar

---

## Coding Style Guide

> Claude Code must follow these rules strictly.

- **Simple over clever** — if two approaches exist, pick the more readable one
- **No hardcoded values** — all sizes, colors, grid settings go into a `config.ts` file
- **Modular** — one responsibility per file, no 300-line components
- **Well commented** — short inline comments explaining *why*, not *what*
- **No premature abstraction** — don't abstract until there are 3+ use cases
- **TypeScript strict** — all types defined, no `any`
- **Named exports only** — no default exports except for page-level components

---

## Folder Structure

```
src/
├── config/
│   └── constants.ts          # grid sizes, defaults, limits, color presets
│
├── types/
│   └── index.ts              # Shape, Point, Tool, GridMode, AppState types
│
├── store/
│   └── useAppStore.ts        # Zustand store — single source of truth
│
├── lib/
│   ├── geometry.ts           # snap, distance, isometric math utils
│   ├── booleanOps.ts         # polygon-clipping wrapper
│   └── exportUtils.ts        # SVG serialize, PNG export
│
├── components/
│   ├── canvas/
│   │   ├── DrawingCanvas.tsx     # main SVG element, mouse handlers
│   │   ├── GridLayer.tsx         # renders grid lines
│   │   ├── ShapeLayer.tsx        # renders all permanent shapes
│   │   ├── PreviewLayer.tsx      # renders in-progress polygon + cursor dot
│   │   └── CanvasOverlay.tsx     # zoom controls, status bar
│   │
│   ├── sidebar/
│   │   ├── Sidebar.tsx           # collapsible container
│   │   ├── BrushSection.tsx      # Draw / Cutout tool selector
│   │   ├── GridSection.tsx       # Square / Isometric + grid size slider
│   │   ├── StyleSection.tsx      # stroke width, stroke color, fill color
│   │   └── ExportSection.tsx     # SVG + PNG export buttons
│   │
│   ├── toolbar/
│   │   ├── TopBar.tsx            # app name, undo, redo, reset
│   │   └── ToolFloater.tsx       # floating vertical tool icons on canvas edge
│   │
│   └── ui/                       # shadcn components live here (auto-generated)
│
├── hooks/
│   ├── useCanvasEvents.ts        # all mouse/pointer event logic
│   └── useKeyboardShortcuts.ts   # undo, redo, tool switch via keyboard
│
└── App.tsx                       # layout shell only, no logic
```

---

## Config File (constants.ts) — Shape of It

The config file must include (not limited to):
- Default grid size
- Min/max grid size
- Default fill color
- Default stroke color
- Default stroke width
- Grid line color and opacity
- Snap threshold distance
- Max undo history length
- Isometric angle

Everything that could ever need changing lives here. No magic numbers in components.

---

## Data Model

### Point
```ts
{ x: number, y: number }
```

### Shape
```ts
{
  id: string
  points: Point[]
  fill: string
  stroke: string
  strokeWidth: number
  type: 'draw' | 'cutout'
}
```

### AppState (Zustand)
```ts
{
  shapes: Shape[]
  activeTool: 'draw' | 'cutout' | 'select'
  gridMode: 'square' | 'isometric'
  gridSize: number
  strokeColor: string
  fillColor: string
  strokeWidth: number
  history: Shape[][]        // for undo
  future: Shape[][]         // for redo
  previewPoints: Point[]    // points being placed right now
  cursorPoint: Point | null // snapped cursor position
}
```

---

## Build Steps

> Complete each step fully before starting the next.
> Each step is a focused, testable unit of work.

---

### Step 1 — Project Setup
- Init Vite + React + TypeScript
- Install and configure Tailwind CSS
- Install shadcn/ui and init
- Install Zustand, polygon-clipping, lucide-react
- Create folder structure (empty files with TODO comments)
- Create `config/constants.ts` with all default values
- Create `types/index.ts` with all types
- Render a blank dark canvas that fills the screen
- **Checkpoint:** App loads, dark screen visible, no errors

---

### Step 2 — Grid Rendering
- Build `GridLayer.tsx` that reads `gridSize` and `gridMode` from store
- Render square grid as SVG `<line>` elements in a loop
- Grid lines should be subtle — low opacity, thin stroke
- Wire grid size slider in sidebar to store (GridSection.tsx)
- Wire square/isometric toggle (isometric can render same as square for now)
- **Checkpoint:** Grid visible on canvas, slider changes spacing live

---

### Step 3 — Mouse Tracking + Snapping
- Build `useCanvasEvents.ts` hook
- Capture `pointermove` on the SVG canvas
- Convert mouse position to SVG coordinate space
- Apply snap formula: `Math.round(x / gridSize) * gridSize`
- Store snapped point as `cursorPoint` in Zustand
- Render a small dot in `PreviewLayer.tsx` at the cursor snap point
- **Checkpoint:** Dot follows mouse, snaps to grid intersections visibly

---

### Step 4 — Polygon Drawing
- On `pointerdown`, push `cursorPoint` to `previewPoints` in store
- In `PreviewLayer.tsx`, render lines connecting all preview points
- Render a line from last point to current cursor (the "live" preview line)
- When cursor is near the first point (use distance check from `geometry.ts`), show a closing indicator (highlight the first point)
- On click near first point, close the polygon — move `previewPoints` into `shapes` array, clear `previewPoints`
- **Checkpoint:** Can draw a complete polygon, it appears filled on canvas

---

### Step 5 — Shape Rendering + Sidebar Styles
- Build `ShapeLayer.tsx` — renders all shapes from store as SVG `<polygon>` elements
- Connect fill color picker and stroke controls from sidebar to store
- Style changes (fill, stroke, stroke width) apply to **all existing shapes immediately** — the sidebar is a global style panel, not a per-shape inspector
- Each style change is pushed to history so it is undoable
- Build `StyleSection.tsx` with color pickers (`react-colorful` HexColorPicker inside shadcn Popover)
- **Checkpoint:** Can draw shapes and freely adjust fill, stroke color, and stroke width — changes reflect instantly on all shapes

---

### Step 6 — Undo / Redo
- Before every shape-adding action, push current `shapes` to `history`
- Undo: pop from `history`, push current to `future`, restore popped state
- Redo: pop from `future`, apply
- Wire Undo/Redo buttons in `TopBar.tsx`
- Wire `Ctrl+Z` / `Ctrl+Y` in `useKeyboardShortcuts.ts`
- Limit history to `MAX_HISTORY` from config
- **Checkpoint:** Undo/redo works for polygon drawing

---

### Step 7 — Isometric Grid + Snap
- In `GridLayer.tsx`, add isometric grid rendering (3 sets of lines at 0°, 60°, 120°)
- In `geometry.ts`, add `snapToIsometric(point, gridSize)` function
- In `useCanvasEvents.ts`, switch snap function based on `gridMode`
- **Checkpoint:** Switching to isometric shows correct grid, snap follows iso intersections

---

### Step 8 — Cutout (Boolean Subtract)
- Build `booleanOps.ts` wrapping `polygon-clipping`
- When `activeTool` is `cutout` and a polygon is closed:
  - Find the topmost shape that overlaps with the new polygon
  - Run `difference(existingShape, newPolygon)`
  - Replace the existing shape with the result
- Handle edge case: cutout on empty canvas does nothing
- **Checkpoint:** Drawing a shape over an existing one in cutout mode punches a hole

---

### Step 9 — Export
- Build `exportUtils.ts`
- SVG export: grab the shapes SVG group (not grid), serialize with `XMLSerializer`, trigger download
- PNG export: create offscreen `<canvas>`, draw SVG onto it via `Image + drawImage`, trigger download
- Wire both buttons in `ExportSection.tsx`
- **Checkpoint:** Both exports download correct files, grid lines not included in export

---

### Step 10 — Polish + UX
- Collapsible sidebar with smooth transition
- Floating vertical tool switcher on canvas left edge
- Cursor changes: crosshair when drawing, default when not
- Reset canvas button with confirmation dialog (shadcn AlertDialog)
- Keyboard shortcut: `Escape` cancels in-progress polygon
- Subtle status bar at bottom: shape count, active tool, grid mode
- Empty state message on canvas: "Click to start drawing"
- **Checkpoint:** Full UX flow feels smooth, no rough edges

---

## Extension Features (Future Steps — Do Not Build Now)

Document these as TODOs in code, scaffold the folder/file but leave empty:

- **Select tool** — click to select a shape, show bounding box, move it
- **Shape list panel** — list all shapes, click to select, reorder, delete
- **Layers** — group shapes into layers, toggle visibility
- **Color palette presets** — saved swatches
- **Zoom + pan** — viewBox manipulation
- **Snap to shape edges** — not just grid
- **Mirror/flip shapes**
- **Animate draw** (for content creation)
- **AI shape suggestion** — describe a logo, get a starting polygon

---

## Important Notes for Claude Code

1. **Build one step at a time.** Do not proceed to the next step unless asked.
2. **No logic in components** — components only render. Logic lives in hooks, store, or lib files.
3. **All values from config** — if you find yourself writing a number like `60` or `#000000` directly in a component, stop and put it in `constants.ts` first.
4. **Keep components small** — if a component exceeds ~80 lines, it probably needs to be split.
5. **Comment the why** — `// snap to nearest grid intersection` not `// rounds the number`
6. **Ask before assuming** — if a requirement is ambiguous, flag it rather than guess.