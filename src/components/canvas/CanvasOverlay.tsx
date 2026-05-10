import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ZOOM_BUTTON_FACTOR } from '../../config/constants';

export function CanvasOverlay() {
  const shapes        = useAppStore((s) => s.shapes);
  const previewPoints = useAppStore((s) => s.previewPoints);
  const activeTool    = useAppStore((s) => s.activeTool);
  const gridMode      = useAppStore((s) => s.gridMode);
  const viewBox       = useAppStore((s) => s.viewBox);
  const initialViewBox = useAppStore((s) => s.initialViewBox);
  const zoomViewport  = useAppStore((s) => s.zoomViewport);
  const resetViewport = useAppStore((s) => s.resetViewport);

  const isEmpty = shapes.length === 0 && previewPoints.length === 0;
  const zoom = initialViewBox ? initialViewBox.w / viewBox.w : 1;
  const zoomPct = Math.round(zoom * 100);

  return (
    <>
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm select-none text-muted-foreground opacity-50">
            Click to start drawing
          </p>
        </div>
      )}

      {/* Status bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-6 flex items-center px-3 border-t select-none"
        style={{ background: 'var(--topbar-bg)', borderColor: 'var(--panel-border)' }}
      >
        {/* Left: canvas metadata */}
        <div className="flex items-center gap-5 text-xs text-muted-foreground pointer-events-none">
          <span>{shapes.length} {shapes.length === 1 ? 'shape' : 'shapes'}</span>
          <span className="capitalize">{activeTool}</span>
          <span>{gridMode === 'isometric' ? 'iso' : 'square'} grid</span>
        </div>

        {/* Right: zoom controls */}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => zoomViewport(1 / ZOOM_BUTTON_FACTOR)}
            className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={11} />
          </button>

          <button
            onClick={resetViewport}
            className="px-1.5 h-5 flex items-center justify-center rounded text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors tabular-nums"
            title="Reset zoom to 100%"
          >
            {zoomPct}%
          </button>

          <button
            onClick={() => zoomViewport(ZOOM_BUTTON_FACTOR)}
            className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={11} />
          </button>

          <button
            onClick={resetViewport}
            className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors ml-0.5"
            title="Fit to window"
          >
            <Maximize2 size={11} />
          </button>
        </div>
      </div>
    </>
  );
}
