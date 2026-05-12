import { useAppStore } from '../../store/useAppStore';
import { distance } from '../../lib/geometry';
import {
  rectanglePoints,
  ellipsePoints,
  regularPolygonPoints,
  starPoints,
  squareConstrain,
} from '../../lib/primitives';
import { isPrimitiveTool } from '../../types';
import {
  CLOSE_SNAP_RADIUS,
  CLOSE_INDICATOR_RADIUS,
  PREVIEW_LINE_STROKE_WIDTH,
  PREVIEW_DASH_ARRAY,
} from '../../config/constants';
import type { Point, Tool } from '../../types';

function primitivePreviewPoints(
  tool: Tool,
  start: Point,
  end: Point,
  polygonSides: number,
  starPointCount: number,
  starInnerRatio: number,
): Point[] {
  switch (tool) {
    case 'rectangle': return rectanglePoints(start, end);
    case 'ellipse':   return ellipsePoints(start, end);
    case 'polygon':   return regularPolygonPoints(start, end, polygonSides);
    case 'star':      return starPoints(start, end, starPointCount, starInnerRatio);
    default: return [];
  }
}

export function PreviewLayer() {
  const cursorPoint    = useAppStore((s) => s.cursorPoint);
  const previewPoints  = useAppStore((s) => s.previewPoints);
  const dragStart      = useAppStore((s) => s.dragStart);
  const activeTool     = useAppStore((s) => s.activeTool);
  const shiftConstrain = useAppStore((s) => s.shiftConstrain);
  const polygonSides   = useAppStore((s) => s.polygonSides);
  const starPointCount = useAppStore((s) => s.starPointCount);
  const starInnerRatio = useAppStore((s) => s.starInnerRatio);

  // --- Primitive drag preview ---
  if (dragStart && cursorPoint && isPrimitiveTool(activeTool)) {
    let end = cursorPoint;
    if (shiftConstrain && (activeTool === 'rectangle' || activeTool === 'ellipse')) {
      end = squareConstrain(dragStart, end);
    }
    // Line/Arrow: render as an open polyline so the preview matches the final stroke shape.
    if (activeTool === 'line' || activeTool === 'arrow') {
      return (
        <g id="preview-layer" style={{ pointerEvents: 'none' }}>
          <line
            x1={dragStart.x}
            y1={dragStart.y}
            x2={end.x}
            y2={end.y}
            stroke="var(--preview-line-stroke)"
            strokeWidth={PREVIEW_LINE_STROKE_WIDTH}
            strokeDasharray={PREVIEW_DASH_ARRAY}
            strokeLinecap="round"
          />
        </g>
      );
    }
    const ring = primitivePreviewPoints(
      activeTool, dragStart, end,
      polygonSides, starPointCount, starInnerRatio,
    );
    if (ring.length < 2) return null;
    const polygonStr = ring.map((p) => `${p.x},${p.y}`).join(' ');
    return (
      <g id="preview-layer" style={{ pointerEvents: 'none' }}>
        <polygon
          points={polygonStr}
          fill="var(--preview-line-stroke)"
          fillOpacity={0.1}
          stroke="var(--preview-line-stroke)"
          strokeWidth={PREVIEW_LINE_STROKE_WIDTH}
          strokeDasharray={PREVIEW_DASH_ARRAY}
        />
      </g>
    );
  }

  // --- Click-sequence polygon preview (draw/cutout) ---
  const hasPoints = previewPoints.length > 0;
  const lastPoint = hasPoints ? previewPoints[previewPoints.length - 1] : null;

  // Show close indicator when cursor is within snap radius of the first point
  const isNearFirst =
    previewPoints.length >= 3 &&
    cursorPoint != null &&
    distance(cursorPoint, previewPoints[0]) < CLOSE_SNAP_RADIUS;

  // "x1,y1 x2,y2 ..." format for SVG polyline
  const polylinePoints = previewPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <g id="preview-layer" style={{ pointerEvents: 'none' }}>
      {/* Completed segments of the in-progress polygon */}
      {hasPoints && (
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="var(--preview-line-stroke)"
          strokeWidth={PREVIEW_LINE_STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Live rubber-band segment from last placed point to cursor */}
      {lastPoint && cursorPoint && (
        <line
          x1={lastPoint.x}
          y1={lastPoint.y}
          x2={cursorPoint.x}
          y2={cursorPoint.y}
          stroke="var(--preview-line-stroke)"
          strokeWidth={PREVIEW_LINE_STROKE_WIDTH}
          strokeDasharray={PREVIEW_DASH_ARRAY}
        />
      )}

      {/* Closing indicator — highlights first point when polygon is about to close */}
      {isNearFirst && (
        <circle
          cx={previewPoints[0].x}
          cy={previewPoints[0].y}
          r={CLOSE_INDICATOR_RADIUS}
          fill="none"
          stroke="var(--close-indicator-fill)"
          strokeWidth={PREVIEW_LINE_STROKE_WIDTH}
        />
      )}

    </g>
  );
}
