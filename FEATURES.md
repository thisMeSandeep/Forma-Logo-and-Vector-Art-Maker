# Forma Studio — Feature Backlog

Ideas for features to expand Forma Studio beyond the current draw / cutout / text / grid toolset.

## Shape Manipulation

- **Duplicate** — Clone selected shape(s) / text with a small offset (Cmd/Ctrl+D).
- **Mirror / Flip** — Horizontal and vertical flip around the selection's bounding-box center.
- **Move position** — Numeric X/Y inputs in the sidebar for pixel-accurate placement; arrow-key nudge (1px, Shift+arrow 10px).
- **Rotate** — Free rotation handle + numeric angle input; snap to 15°/45°/90° with Shift.
- **Scale / Resize** — Bounding-box handles for proportional and free resize; numeric W/H fields.
- **Skew** — Horizontal/vertical skew controls for shapes and text.
- **Reset transform** — One-click button to clear rotation/scale/skew.

## Basic Shape Primitives

- **Rectangle** tool (with live corner-radius preview).
- **Ellipse / Circle** tool (Shift to constrain to circle).
- **Line / Arrow** tool with arrowhead styles.
- **Polygon** tool with adjustable sides (triangle, pentagon, hexagon, star).
- **Star** tool with inner/outer radius and point count.
- **Path / Pen** tool with bezier handles for precise curves.

## Selection & Editing

- **Multi-select** with marquee (drag-to-select) and Shift-click.
- **Group / Ungroup** shapes for collective transforms.
- **Lock / Unlock** to prevent accidental edits.
- **Hide / Show** per-shape visibility toggle.
- **Edit vertices** — Enter a node-edit mode to drag/add/delete points on an existing path.
- **Boolean operations** — Union, Intersect, Difference, Exclude (extend the current cutout into a full boolean toolkit).
- **Convert to path** — Turn primitives and text into editable paths.

## Layers & Organization

- **Layers panel** with reordering (drag to reorder, send-to-front/back, bring-forward/send-backward).
- **Rename** layers / shapes.
- **Layer opacity** and **blend modes**.
- **Folders / groups** in the layers panel.

## Alignment & Distribution

- **Align** — Left, right, center, top, middle, bottom relative to selection or canvas.
- **Distribute** — Equal spacing horizontally / vertically across 3+ objects.
- **Smart guides** — Snap-to-edge / center alignment guides while dragging.
- **Snap to shapes** in addition to the grid.

## Styling

- **Gradient fills** — Linear and radial gradients with multi-stop editor.
- **Pattern fills** — Built-in patterns (dots, lines, hatch) and image fills.
- **Multiple strokes / fills** per shape.
- **Stroke styles** — Dashed, dotted, custom dash array, line caps, line joins.
- **Drop shadow / inner shadow** effects.
- **Blur** (Gaussian / motion) effect.
- **Opacity slider** at the shape level.
- **Color palettes / swatches** — Save and reuse colors per project.
- **Eyedropper** to pick colors from the canvas.

## Text

- **Text alignment** — Left/center/right + multi-line support.
- **Letter spacing / line height**.
- **Italic / underline / strikethrough**.
- **Text on a path** — Flow text along a shape's outline.
- **Web fonts** picker (Google Fonts integration).

## Canvas & View

- **Pan tool** (Space + drag) and configurable zoom (fit, 100%, custom %).
- **Rulers** along the top and left edges.
- **Multiple artboards / pages**.
- **Custom canvas size** with presets (A4, 1080×1080, 1920×1080, etc.).
- **Background color** for the canvas (not just the page).
- **Bleed / safe-area** guides for print export.

## Grid & Guides

- **Custom guides** — Draggable horizontal/vertical guide lines.
- **Grid subdivisions** — Major/minor grid lines.
- **Polar / radial grid** in addition to square and isometric.
- **Configurable grid color and opacity**.

## Import / Export

- **Import SVG** to continue editing existing files.
- **Import image** (PNG/JPG) as a reference layer or fill.
- **Export selected** vs. whole canvas.
- **Export to PDF / JPEG / WebP**.
- **Copy as SVG / PNG** to clipboard.
- **Export presets** — 1x / 2x / 3x, custom DPI.
- **Optimized SVG** output (minified, decimal precision setting).

## Collaboration & Persistence

- **Save / load projects** locally (JSON file or IndexedDB).
- **Auto-save** with restore on reload.
- **Project templates** — Start from a blank, social-post, icon, or logo template.
- **Share link** — Encode design state in a URL.
- **Cloud sync** (optional, with a backend).

## Productivity

- **Command palette** (Cmd/Ctrl+K) for quick actions.
- **Customizable keyboard shortcuts**.
- **Right-click context menu** with common actions.
- **Action history panel** — Visual list of undo steps with the ability to jump to any state.
- **Search** within layers by name.

## Accessibility & Polish

- **Touch / iPad support** with pressure-sensitive drawing.
- **Color-blind safe palette previews**.
- **High-contrast UI mode**.
- **Onboarding tour** for first-time users.
- **Help / shortcut overlay** (? key).
