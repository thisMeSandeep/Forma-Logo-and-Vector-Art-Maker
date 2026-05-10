import { ZoomIn, ZoomOut, Maximize2, Layers, Grid3x3, Hexagon, MousePointer2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ZOOM_BUTTON_FACTOR } from '../../config/constants';

export function CanvasOverlay() {
  const shapes         = useAppStore((s) => s.shapes);
  const previewPoints  = useAppStore((s) => s.previewPoints);
  const activeTool     = useAppStore((s) => s.activeTool);
  const gridMode       = useAppStore((s) => s.gridMode);
  const gridSize       = useAppStore((s) => s.gridSize);
  const cursorPoint    = useAppStore((s) => s.cursorPoint);
  const viewBox        = useAppStore((s) => s.viewBox);
  const initialViewBox = useAppStore((s) => s.initialViewBox);
  const zoomViewport   = useAppStore((s) => s.zoomViewport);
  const resetViewport  = useAppStore((s) => s.resetViewport);

  const isEmpty = shapes.length === 0 && previewPoints.length === 0;
  const zoom = initialViewBox ? initialViewBox.w / viewBox.w : 1;
  const zoomPct = Math.round(zoom * 100);

  const GridIcon = gridMode === 'isometric' ? Hexagon : Grid3x3;

  return (
    <>
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm select-none text-muted-foreground opacity-50">
            Click to start drawing
          </p>
        </div>
      )}

      {/* Status bar — editor footer */}
      <div
        className="absolute bottom-0 left-0 right-0 h-8 flex items-center px-3 border-t select-none text-[11px] text-muted-foreground"
        style={{ background: 'var(--topbar-bg)', borderColor: 'var(--panel-border)' }}
      >
        {/* Left: canvas metadata */}
        <div className="flex items-stretch h-full pointer-events-none">
          <StatusChip icon={<Layers size={11} />}>
            <span className="tabular-nums">{shapes.length}</span>
            <span className="opacity-60">{shapes.length === 1 ? 'shape' : 'shapes'}</span>
          </StatusChip>

          <Divider />

          <StatusChip icon={<MousePointer2 size={11} />}>
            <span className="capitalize">{activeTool}</span>
          </StatusChip>

          <Divider />

          <StatusChip icon={<GridIcon size={11} />}>
            <span>{gridMode === 'isometric' ? 'Isometric' : 'Square'}</span>
            <span className="opacity-60 tabular-nums">{gridSize}px</span>
          </StatusChip>
        </div>

        {/* Center: live cursor coords (only while in canvas) */}
        {cursorPoint && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 font-mono text-[11px] tabular-nums opacity-70 pointer-events-none">
            <span>X <span className="text-foreground/80">{Math.round(cursorPoint.x)}</span></span>
            <span>Y <span className="text-foreground/80">{Math.round(cursorPoint.y)}</span></span>
          </div>
        )}

        {/* Right: zoom controls */}
        <div
          className="ml-auto flex items-center h-6 rounded-md border bg-foreground/[0.02] overflow-hidden"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          <ZoomBtn onClick={() => zoomViewport(1 / ZOOM_BUTTON_FACTOR)} title="Zoom out">
            <ZoomOut size={11} />
          </ZoomBtn>

          <button
            onClick={resetViewport}
            className="px-2 h-6 flex items-center justify-center text-[11px] hover:text-foreground hover:bg-foreground/5 transition-colors tabular-nums border-x"
            style={{ borderColor: 'var(--panel-border)' }}
            title="Reset zoom to 100%"
          >
            {zoomPct}%
          </button>

          <ZoomBtn onClick={() => zoomViewport(ZOOM_BUTTON_FACTOR)} title="Zoom in">
            <ZoomIn size={11} />
          </ZoomBtn>

          <ZoomBtn onClick={resetViewport} title="Fit to window">
            <Maximize2 size={11} />
          </ZoomBtn>
        </div>
      </div>
    </>
  );
}

function StatusChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-2">
      <span className="opacity-70">{icon}</span>
      <span className="flex items-center gap-1">{children}</span>
    </div>
  );
}

function Divider() {
  return (
    <div
      className="w-px my-1.5 self-stretch"
      style={{ background: 'var(--panel-border)' }}
    />
  );
}

function ZoomBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-6 h-6 flex items-center justify-center hover:text-foreground hover:bg-foreground/5 transition-colors"
    >
      {children}
    </button>
  );
}
