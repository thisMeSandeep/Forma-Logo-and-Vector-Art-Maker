import { useAppStore } from '../../store/useAppStore';
import { distance } from '../../lib/geometry';
import {
  CLOSE_SNAP_RADIUS,
  CLOSE_INDICATOR_RADIUS,
  PREVIEW_LINE_STROKE_WIDTH,
  PREVIEW_DASH_ARRAY,
} from '../../config/constants';

export function PreviewLayer() {
  const cursorPoint = useAppStore((s) => s.cursorPoint);
  const previewPoints = useAppStore((s) => s.previewPoints);

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
