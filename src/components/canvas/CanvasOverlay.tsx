import { useAppStore } from '../../store/useAppStore';

export function CanvasOverlay() {
  const shapes        = useAppStore((s) => s.shapes);
  const previewPoints = useAppStore((s) => s.previewPoints);
  const activeTool    = useAppStore((s) => s.activeTool);
  const gridMode      = useAppStore((s) => s.gridMode);

  const isEmpty = shapes.length === 0 && previewPoints.length === 0;

  return (
    <>
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm select-none" style={{ color: 'var(--grid-line-stroke)', opacity: 0.6 }}>
            Click to start drawing
          </p>
        </div>
      )}

      <div
        className="absolute bottom-0 left-0 right-0 h-6 flex items-center px-3 gap-5 text-xs border-t pointer-events-none select-none"
        style={{ background: 'var(--topbar-bg)', borderColor: 'var(--panel-border)' }}
      >
        <span className="text-muted-foreground">
          {shapes.length} {shapes.length === 1 ? 'shape' : 'shapes'}
        </span>
        <span className="text-muted-foreground capitalize">
          {activeTool}
        </span>
        <span className="text-muted-foreground capitalize">
          {gridMode === 'isometric' ? 'iso' : 'square'} grid
        </span>
      </div>
    </>
  );
}
