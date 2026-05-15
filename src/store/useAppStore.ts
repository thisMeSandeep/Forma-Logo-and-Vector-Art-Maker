import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FILL_COLOR_DEFAULT,
  STROKE_COLOR_DEFAULT,
  STROKE_WIDTH_DEFAULT,
  CORNER_RADIUS_DEFAULT,
  OPACITY_DEFAULT,
  STROKE_STYLE_DEFAULT,
  GRID_SIZE_DEFAULT,
  MAX_HISTORY,
  TEXT_FONT_FAMILY_DEFAULT,
  TEXT_FONT_SIZE_DEFAULT,
  TEXT_FONT_WEIGHT_DEFAULT,
  TEXT_FILL_DEFAULT,
  TEXT_ANCHOR_DEFAULT,
  TEXT_ITALIC_DEFAULT,
  TEXT_DECORATION_DEFAULT,
  TEXT_LETTER_SPACING_DEFAULT,
  TEXT_LINE_HEIGHT_DEFAULT,
  TEXT_BASELINE_DEFAULT,
  TEXT_OPACITY_DEFAULT,
  TEXT_STROKE_DEFAULT,
  TEXT_STROKE_WIDTH_DEFAULT,
  TEXT_STROKE_STYLE_DEFAULT,
  POLYGON_SIDES_DEFAULT,
  STAR_POINTS_DEFAULT,
  STAR_INNER_RATIO_DEFAULT,
  CANVAS_BG_DEFAULT,
  ZOOM_MIN,
  ZOOM_MAX,
} from '../config/constants';
import { translateRings } from '../lib/geometry';
import { alignToCanvasDelta, visualBBox } from '../lib/alignment';
import {
  applyCutout,
  duplicatedShape,
  flippedShape,
  patchSelectedShape,
  reorderedShapes,
  withRotationDelta,
  withTransformPatch,
} from './actions/shapes';
import {
  duplicatedText,
  flippedText,
  patchSelectedText,
  reorderedTexts,
  withTextRotationDelta,
} from './actions/text';
import { zoomedViewBoxCenter } from './actions/viewport';
import type {
  AppState,
  Tool,
  GridMode,
  Point,
  ViewBox,
  TextAnchor,
  TextDecoration,
  TextBaseline,
  FontWeight,
  CanvasSnapshot,
  ShapeTransform,
  StrokeStyle,
} from '../types';
import { IDENTITY_TRANSFORM } from '../types';

// Placeholder until useViewBox sets the real value on mount
const DEFAULT_VIEWBOX: ViewBox = { x: 0, y: 0, w: 1200, h: 800 };

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      // Captures shapes + texts together so undo/redo treats both as one timeline
      function snapshot(): CanvasSnapshot {
        const { shapes, texts } = get();
        return { shapes, texts };
      }
      function pushHistory() {
        const { history } = get();
        return [...history.slice(-MAX_HISTORY), snapshot()];
      }

      return {
        shapes: [],
        texts: [],
        activeTool: 'select' as Tool,
        gridMode: 'square' as GridMode,
        gridSize: GRID_SIZE_DEFAULT,
        showGrid: true,
        strokeColor: STROKE_COLOR_DEFAULT,
        fillColor: FILL_COLOR_DEFAULT,
        strokeWidth: STROKE_WIDTH_DEFAULT,
        cornerRadius: CORNER_RADIUS_DEFAULT,
        opacity: OPACITY_DEFAULT,
        strokeStyle: STROKE_STYLE_DEFAULT,
        textFontFamily: TEXT_FONT_FAMILY_DEFAULT,
        textFontSize: TEXT_FONT_SIZE_DEFAULT,
        textFontWeight: TEXT_FONT_WEIGHT_DEFAULT,
        textFill: TEXT_FILL_DEFAULT,
        textAnchor: TEXT_ANCHOR_DEFAULT,
        textItalic: TEXT_ITALIC_DEFAULT,
        textDecoration: TEXT_DECORATION_DEFAULT,
        textLetterSpacing: TEXT_LETTER_SPACING_DEFAULT,
        textLineHeight: TEXT_LINE_HEIGHT_DEFAULT,
        textBaseline: TEXT_BASELINE_DEFAULT,
        textOpacity: TEXT_OPACITY_DEFAULT,
        textStroke: TEXT_STROKE_DEFAULT,
        textStrokeWidth: TEXT_STROKE_WIDTH_DEFAULT,
        textStrokeStyle: TEXT_STROKE_STYLE_DEFAULT,
        selectedShapeId: null,
        selectedTextId: null,
        editingTextId: null,
        history: [] as CanvasSnapshot[],
        future: [] as CanvasSnapshot[],
        previewPoints: [] as Point[],
        dragStart: null,
        activeGuides: [],
        shiftConstrain: false,
        polygonSides: POLYGON_SIDES_DEFAULT,
        starPointCount: STAR_POINTS_DEFAULT,
        starInnerRatio: STAR_INNER_RATIO_DEFAULT,
        cursorPoint: null,
        viewBox: DEFAULT_VIEWBOX,
        initialViewBox: null,
        spaceDown: false,
        canvasBackground: CANVAS_BG_DEFAULT,

        addShape: (shape) =>
          set((s) => ({ shapes: [...s.shapes, shape], history: pushHistory(), future: [] })),

        setViewBox: (vb) => set({ viewBox: vb }),
        setInitialViewBox: (vb) => set({ initialViewBox: vb }),
        zoomViewport: (factor) =>
          set((s) => ({ viewBox: zoomedViewBoxCenter(s.viewBox, s.initialViewBox, factor) })),
        resetViewport: () => {
          const { initialViewBox } = get();
          if (initialViewBox) set({ viewBox: initialViewBox });
        },

        // Pan-on-space cursor flag — flipped by useCanvasEvents key listeners.
        setSpaceDown: (down) => set({ spaceDown: down }),
        setCanvasBackground: (color) => set({ canvasBackground: color }),

        // Set absolute zoom: 1.0 = 100% (initialViewBox), 2.0 = 200%, etc.
        setZoomPercent: (pct) => {
          const { viewBox, initialViewBox } = get();
          if (!initialViewBox) return;
          const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pct));
          const newW = initialViewBox.w / clamped;
          const newH = initialViewBox.h / clamped;
          const cx = viewBox.x + viewBox.w / 2;
          const cy = viewBox.y + viewBox.h / 2;
          set({ viewBox: { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH } });
        },

        // Fit all shapes + text into view with a small padding margin.
        zoomToFitContent: () => {
          const { shapes, texts, initialViewBox } = get();
          if (!initialViewBox) return;
          if (shapes.length === 0 && texts.length === 0) {
            set({ viewBox: initialViewBox });
            return;
          }
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const sh of shapes) {
            const bbox = visualBBox(sh);
            minX = Math.min(minX, bbox.x);
            minY = Math.min(minY, bbox.y);
            maxX = Math.max(maxX, bbox.x + bbox.w);
            maxY = Math.max(maxY, bbox.y + bbox.h);
          }
          for (const t of texts) {
            // Rough estimate of text width; matches canvas TextLayer
            const w = Math.max(t.fontSize * 2, t.content.length * t.fontSize * 0.62);
            const x = t.anchor === 'middle' ? t.x - w / 2 : t.anchor === 'end' ? t.x - w : t.x;
            const y = t.y - t.fontSize;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + t.fontSize * 1.4);
          }
          if (!Number.isFinite(minX)) return;
          const pad = 40;
          const contentW = maxX - minX + pad * 2;
          const contentH = maxY - minY + pad * 2;
          // Pick the scale that fits both axes — keep aspect ratio of initial viewbox
          const aspect = initialViewBox.w / initialViewBox.h;
          let w = contentW;
          let h = contentH;
          if (w / h > aspect) h = w / aspect;
          else                w = h * aspect;
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;
          set({ viewBox: { x: cx - w / 2, y: cy - h / 2, w, h } });
        },

        setActiveTool: (tool) =>
          set((s) => ({
            activeTool: tool,
            // Pan is a transient navigation tool — preserve whatever is currently
            // selected so the user can pan and immediately resume editing.
            selectedTextId: tool === 'text' || tool === 'select' || tool === 'pan' ? s.selectedTextId : null,
            editingTextId:  tool === 'text' || tool === 'select' || tool === 'pan' ? s.editingTextId  : null,
            selectedShapeId: tool === 'select' || tool === 'pan' ? s.selectedShapeId : null,
          })),
        setGridMode: (mode) => set({ gridMode: mode }),
        setGridSize: (size) => set({ gridSize: size }),
        toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

        // Style setters update the selected shape when one is selected (live edit)
        // and always update the global default that future shapes inherit.
        setFillColor: (color) =>
          set((s) => ({ fillColor: color, shapes: patchSelectedShape(s.shapes, s.selectedShapeId, 'fill', color) })),
        setStrokeColor: (color) =>
          set((s) => ({ strokeColor: color, shapes: patchSelectedShape(s.shapes, s.selectedShapeId, 'stroke', color) })),
        setStrokeWidth: (width) =>
          set((s) => ({ strokeWidth: width, shapes: patchSelectedShape(s.shapes, s.selectedShapeId, 'strokeWidth', width) })),
        setCornerRadius: (r) =>
          set((s) => ({ cornerRadius: r, shapes: patchSelectedShape(s.shapes, s.selectedShapeId, 'cornerRadius', r) })),
        setOpacity: (o) =>
          set((s) => ({ opacity: o, shapes: patchSelectedShape(s.shapes, s.selectedShapeId, 'opacity', o) })),
        setStrokeStyle: (style) =>
          set((s) => ({ strokeStyle: style, shapes: patchSelectedShape(s.shapes, s.selectedShapeId, 'strokeStyle', style) })),

        setPreviewPoints: (points) => set({ previewPoints: points }),
        setDragStart: (point) => set({ dragStart: point }),
        setActiveGuides: (guides) => set({ activeGuides: guides }),

        alignSelectedToCanvas: (direction) => {
          const { selectedShapeId, shapes, initialViewBox } = get();
          if (!selectedShapeId || !initialViewBox) return;
          const shape = shapes.find((sh) => sh.id === selectedShapeId);
          if (!shape) return;
          const { dx, dy } = alignToCanvasDelta(visualBBox(shape), initialViewBox, direction);
          if (dx === 0 && dy === 0) return;
          set((s) => ({
            shapes: s.shapes.map((sh) =>
              sh.id === selectedShapeId ? { ...sh, points: translateRings(sh.points, dx, dy) } : sh,
            ),
            history: pushHistory(),
            future: [],
          }));
        },
        setShiftConstrain: (on) => set({ shiftConstrain: on }),
        setPolygonSides: (n) => set({ polygonSides: n }),
        setStarPointCount: (n) => set({ starPointCount: n }),
        setStarInnerRatio: (r) => set({ starInnerRatio: r }),
        setCursorPoint: (point) => set({ cursorPoint: point }),

        undo: () => {
          const { history, future, previewPoints } = get();
          if (previewPoints.length > 0) {
            set({ previewPoints: previewPoints.slice(0, -1) });
            return;
          }
          if (history.length === 0) return;
          const previous = history[history.length - 1];
          set({
            shapes: previous.shapes,
            texts: previous.texts,
            history: history.slice(0, -1),
            future: [snapshot(), ...future],
          });
        },

        redo: () => {
          const { future, history } = get();
          if (future.length === 0) return;
          const next = future[0];
          set({
            shapes: next.shapes,
            texts: next.texts,
            history: [...history, snapshot()],
            future: future.slice(1),
          });
        },

        resetCanvas: () =>
          set({
            shapes: [], texts: [],
            selectedShapeId: null, selectedTextId: null, editingTextId: null,
            history: [], future: [],
            previewPoints: [], cursorPoint: null,
          }),

        cutoutShape: (cutterPoints) => {
          const next = applyCutout(get().shapes, cutterPoints);
          if (next === null) {
            set({ previewPoints: [] });
            return;
          }
          set({ shapes: next, history: pushHistory(), future: [], previewPoints: [] });
        },

        // Selecting a shape pulls its style into the global slots so the sidebar
        // can act as a live editor for it. Shape and text selections are mutually
        // exclusive.
        setSelectedShapeId: (id) =>
          set((s) => {
            const shape = id ? s.shapes.find((sh) => sh.id === id) : null;
            return {
              selectedShapeId: id,
              selectedTextId: id ? null : s.selectedTextId,
              editingTextId:  id ? null : s.editingTextId,
              fillColor:    shape?.fill         ?? s.fillColor,
              strokeColor:  shape?.stroke       ?? s.strokeColor,
              strokeWidth:  shape?.strokeWidth  ?? s.strokeWidth,
              cornerRadius: shape?.cornerRadius ?? s.cornerRadius,
              opacity:      shape?.opacity      ?? s.opacity,
              strokeStyle:  shape?.strokeStyle  ?? s.strokeStyle,
            };
          }),

        updateShape: (id, patch) =>
          set((s) => ({ shapes: s.shapes.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)) })),

        // moveShape is called from drag (many times per second) so it deliberately
        // skips history. Callers that want a discrete undo entry (arrow-nudge,
        // drag-end) should call commitHistory() afterwards.
        moveShape: (id, dx, dy) =>
          set((s) => ({
            shapes: s.shapes.map((sh) =>
              sh.id === id ? { ...sh, points: translateRings(sh.points, dx, dy) } : sh,
            ),
          })),
        commitHistory: () => set({ history: pushHistory(), future: [] }),

        duplicateShape: (id) => {
          const { shapes, gridSize } = get();
          const source = shapes.find((sh) => sh.id === id);
          if (!source) return;
          const copy = duplicatedShape(source, gridSize);
          set({
            shapes: [...shapes, copy],
            selectedShapeId: copy.id,
            history: pushHistory(),
            future: [],
          });
        },

        flipShape: (id, axis) =>
          set((s) => ({
            shapes: s.shapes.map((sh) => (sh.id === id ? flippedShape(sh, axis) : sh)),
            history: pushHistory(),
            future: [],
          })),

        deleteShape: (id) =>
          set((s) => ({
            shapes: s.shapes.filter((sh) => sh.id !== id),
            selectedShapeId: s.selectedShapeId === id ? null : s.selectedShapeId,
            history: pushHistory(),
            future: [],
          })),

        reorderShape: (id, direction) =>
          set((s) => ({
            shapes: reorderedShapes(s.shapes, id, direction),
            history: pushHistory(),
            future: [],
          })),

        setShapeTransform: (id, patch) =>
          set((s) => ({
            shapes: s.shapes.map((sh) => (sh.id === id ? withTransformPatch(sh, patch) : sh)),
          })),

        rotateShape: (id, deltaDegrees) =>
          set((s) => ({
            shapes: s.shapes.map((sh) => (sh.id === id ? withRotationDelta(sh, deltaDegrees) : sh)),
            history: pushHistory(),
            future: [],
          })),

        resetShapeTransform: (id) =>
          set((s) => ({
            shapes: s.shapes.map((sh) => (sh.id === id ? { ...sh, transform: undefined } : sh)),
            history: pushHistory(),
            future: [],
          })),

        // Text actions
        addText: (text) =>
          set((s) => ({
            texts: [...s.texts, text],
            selectedTextId: text.id,
            editingTextId: text.id,
            textFontFamily: text.fontFamily,
            textFontSize: text.fontSize,
            textFontWeight: text.fontWeight,
            textFill: text.fill,
            textAnchor: text.anchor,
            textItalic:        text.italic        ?? s.textItalic,
            textDecoration:    text.decoration    ?? s.textDecoration,
            textLetterSpacing: text.letterSpacing ?? s.textLetterSpacing,
            textLineHeight:    text.lineHeight    ?? s.textLineHeight,
            textBaseline:      text.baseline      ?? s.textBaseline,
            textOpacity:       text.opacity       ?? s.textOpacity,
            textStroke:        text.stroke        ?? s.textStroke,
            textStrokeWidth:   text.strokeWidth   ?? s.textStrokeWidth,
            textStrokeStyle:   text.strokeStyle   ?? s.textStrokeStyle,
            history: pushHistory(),
            future: [],
          })),

        // Style edits to existing text don't push history (matches shape style behaviour).
        // Position drags and content edits also stay out of history for now —
        // simplest model: only creation/deletion are undoable.
        updateText: (id, patch) =>
          set((s) => ({ texts: s.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

        deleteText: (id) =>
          set((s) => ({
            texts: s.texts.filter((t) => t.id !== id),
            selectedTextId: null,
            editingTextId: null,
            history: pushHistory(),
            future: [],
          })),

        setSelectedTextId: (id) =>
          set((s) => {
            const text = id ? s.texts.find((t) => t.id === id) : null;
            return {
              selectedTextId: id,
              selectedShapeId: id ? null : s.selectedShapeId,
              textFontFamily: text?.fontFamily ?? s.textFontFamily,
              textFontSize:   text?.fontSize   ?? s.textFontSize,
              textFontWeight: text?.fontWeight ?? s.textFontWeight,
              textFill:       text?.fill       ?? s.textFill,
              textAnchor:     text?.anchor     ?? s.textAnchor,
              textItalic:        text?.italic        ?? s.textItalic,
              textDecoration:    text?.decoration    ?? s.textDecoration,
              textLetterSpacing: text?.letterSpacing ?? s.textLetterSpacing,
              textLineHeight:    text?.lineHeight    ?? s.textLineHeight,
              textBaseline:      text?.baseline      ?? s.textBaseline,
              textOpacity:       text?.opacity       ?? s.textOpacity,
              textStroke:        text?.stroke        ?? s.textStroke,
              textStrokeWidth:   text?.strokeWidth   ?? s.textStrokeWidth,
              textStrokeStyle:   text?.strokeStyle   ?? s.textStrokeStyle,
            };
          }),

        setEditingTextId: (id) =>
          set((s) => ({ editingTextId: id, selectedTextId: id ?? s.selectedTextId })),

        setTextFontFamily: (f: string) =>
          set((s) => ({ textFontFamily: f, texts: patchSelectedText(s.texts, s.selectedTextId, 'fontFamily', f) })),
        setTextFontSize: (size: number) =>
          set((s) => ({ textFontSize: size, texts: patchSelectedText(s.texts, s.selectedTextId, 'fontSize', size) })),
        setTextFontWeight: (w: FontWeight) =>
          set((s) => ({ textFontWeight: w, texts: patchSelectedText(s.texts, s.selectedTextId, 'fontWeight', w) })),
        setTextFill: (c: string) =>
          set((s) => ({ textFill: c, texts: patchSelectedText(s.texts, s.selectedTextId, 'fill', c) })),
        setTextAnchor: (a: TextAnchor) =>
          set((s) => ({ textAnchor: a, texts: patchSelectedText(s.texts, s.selectedTextId, 'anchor', a) })),
        setTextItalic: (v: boolean) =>
          set((s) => ({ textItalic: v, texts: patchSelectedText(s.texts, s.selectedTextId, 'italic', v) })),
        setTextDecoration: (d: TextDecoration) =>
          set((s) => ({ textDecoration: d, texts: patchSelectedText(s.texts, s.selectedTextId, 'decoration', d) })),
        setTextLetterSpacing: (px: number) =>
          set((s) => ({ textLetterSpacing: px, texts: patchSelectedText(s.texts, s.selectedTextId, 'letterSpacing', px) })),
        setTextLineHeight: (m: number) =>
          set((s) => ({ textLineHeight: m, texts: patchSelectedText(s.texts, s.selectedTextId, 'lineHeight', m) })),
        setTextBaseline: (b: TextBaseline) =>
          set((s) => ({ textBaseline: b, texts: patchSelectedText(s.texts, s.selectedTextId, 'baseline', b) })),
        setTextOpacity: (o: number) =>
          set((s) => ({ textOpacity: o, texts: patchSelectedText(s.texts, s.selectedTextId, 'opacity', o) })),
        setTextStroke: (c: string) =>
          set((s) => ({ textStroke: c, texts: patchSelectedText(s.texts, s.selectedTextId, 'stroke', c) })),
        setTextStrokeWidth: (w: number) =>
          set((s) => ({ textStrokeWidth: w, texts: patchSelectedText(s.texts, s.selectedTextId, 'strokeWidth', w) })),
        setTextStrokeStyle: (st: StrokeStyle) =>
          set((s) => ({ textStrokeStyle: st, texts: patchSelectedText(s.texts, s.selectedTextId, 'strokeStyle', st) })),

        // Live transform during drag (no history). Caller should commitHistory on pointerup.
        setTextTransform: (id: string, patch: Partial<ShapeTransform>) =>
          set((s) => ({
            texts: s.texts.map((t) =>
              t.id === id
                ? { ...t, transform: { ...IDENTITY_TRANSFORM, ...t.transform, ...patch } }
                : t,
            ),
          })),
        resetTextTransform: (id: string) =>
          set((s) => ({
            texts: s.texts.map((t) => (t.id === id ? { ...t, transform: undefined } : t)),
            history: pushHistory(),
            future: [],
          })),

        duplicateText: (id) => {
          const { texts, gridSize } = get();
          const source = texts.find((t) => t.id === id);
          if (!source) return;
          const copy = duplicatedText(source, gridSize);
          set({
            texts: [...texts, copy],
            selectedTextId: copy.id,
            editingTextId: null,
            history: pushHistory(),
            future: [],
          });
        },

        flipText: (id, axis) =>
          set((s) => ({
            texts: s.texts.map((t) => (t.id === id ? flippedText(t, axis) : t)),
            history: pushHistory(),
            future: [],
          })),

        rotateText: (id, deltaDegrees) =>
          set((s) => ({
            texts: s.texts.map((t) => (t.id === id ? withTextRotationDelta(t, deltaDegrees) : t)),
            history: pushHistory(),
            future: [],
          })),

        reorderText: (id, direction) =>
          set((s) => ({
            texts: reorderedTexts(s.texts, id, direction),
            history: pushHistory(),
            future: [],
          })),
      } satisfies AppState;
    },
    {
      name: 'forma-canvas',
      partialize: (state) => ({
        shapes:         state.shapes,
        texts:          state.texts,
        fillColor:      state.fillColor,
        strokeColor:    state.strokeColor,
        strokeWidth:    state.strokeWidth,
        cornerRadius:   state.cornerRadius,
        opacity:        state.opacity,
        strokeStyle:    state.strokeStyle,
        textFontFamily:    state.textFontFamily,
        textFontSize:      state.textFontSize,
        textFontWeight:    state.textFontWeight,
        textFill:          state.textFill,
        textAnchor:        state.textAnchor,
        textItalic:        state.textItalic,
        textDecoration:    state.textDecoration,
        textLetterSpacing: state.textLetterSpacing,
        textLineHeight:    state.textLineHeight,
        textBaseline:      state.textBaseline,
        textOpacity:       state.textOpacity,
        textStroke:        state.textStroke,
        textStrokeWidth:   state.textStrokeWidth,
        textStrokeStyle:   state.textStrokeStyle,
        gridSize:       state.gridSize,
        gridMode:       state.gridMode,
        showGrid:       state.showGrid,
        polygonSides:   state.polygonSides,
        starPointCount: state.starPointCount,
        starInnerRatio: state.starInnerRatio,
        canvasBackground: state.canvasBackground,
      }),
    },
  ),
);
