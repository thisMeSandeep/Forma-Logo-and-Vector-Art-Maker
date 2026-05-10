import { useAppStore } from '../../store/useAppStore';
import { CURSOR_DOT_RADIUS } from '../../config/constants';

export function PreviewLayer() {
  const cursorPoint = useAppStore((s) => s.cursorPoint);

  return (
    <g id="preview-layer">
      {/* Snapped cursor dot — Steps 4+ will add preview lines here */}
      {cursorPoint && (
        <circle
          cx={cursorPoint.x}
          cy={cursorPoint.y}
          r={CURSOR_DOT_RADIUS}
          fill="var(--cursor-dot-fill)"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  );
}
