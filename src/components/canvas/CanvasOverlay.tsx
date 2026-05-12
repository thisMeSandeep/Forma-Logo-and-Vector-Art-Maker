import { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Layers, Grid3x3, Hexagon, MousePointer2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ZOOM_BUTTON_FACTOR } from '../../config/constants';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export function CanvasOverlay() {
  const shapes         = useAppStore((s) => s.shapes);
  const texts          = useAppStore((s) => s.texts);
  const previewPoints  = useAppStore((s) => s.previewPoints);
  const activeTool     = useAppStore((s) => s.activeTool);
  const gridMode       = useAppStore((s) => s.gridMode);
  const gridSize       = useAppStore((s) => s.gridSize);
  const cursorPoint    = useAppStore((s) => s.cursorPoint);
  const viewBox        = useAppStore((s) => s.viewBox);
  const initialViewBox = useAppStore((s) => s.initialViewBox);
  const zoomViewport   = useAppStore((s) => s.zoomViewport);
  const resetViewport  = useAppStore((s) => s.resetViewport);
  const setZoomPercent = useAppStore((s) => s.setZoomPercent);
  const zoomToFitContent = useAppStore((s) => s.zoomToFitContent);

  const itemCount = shapes.length + texts.length;
  const isEmpty = itemCount === 0 && previewPoints.length === 0;
  const zoom = initialViewBox ? initialViewBox.w / viewBox.w : 1;
  const zoomPct = Math.round(zoom * 100);

  const GridIcon = gridMode === 'isometric' ? Hexagon : Grid3x3;

  return (
    <>
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm select-none text-muted-foreground opacity-50">
            {activeTool === 'text' ? 'Click to place text' : 'Click to start drawing'}
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
            <span className="tabular-nums">{itemCount}</span>
            <span className="opacity-60">{itemCount === 1 ? 'item' : 'items'}</span>
          </StatusChip>

          {/* Tool + grid chips drop on phones to save horizontal space */}
          <Divider className="hidden sm:block" />

          <div className="hidden sm:flex items-stretch h-full">
            <StatusChip icon={<MousePointer2 size={11} />}>
              <span className="capitalize">{activeTool}</span>
            </StatusChip>

            <Divider />

            <StatusChip icon={<GridIcon size={11} />}>
              <span>{gridMode === 'isometric' ? 'Isometric' : 'Square'}</span>
              <span className="opacity-60 tabular-nums">{gridSize}px</span>
            </StatusChip>
          </div>
        </div>

        {/* Center: live cursor coords (only while in canvas; hidden on touch) */}
        {cursorPoint && (
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-2 font-mono text-[11px] tabular-nums opacity-70 pointer-events-none">
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

          <ZoomPercentPopover
            zoomPct={zoomPct}
            onPick={(pct) => setZoomPercent(pct / 100)}
            onFit={zoomToFitContent}
            onReset={resetViewport}
          />

          <ZoomBtn onClick={() => zoomViewport(ZOOM_BUTTON_FACTOR)} title="Zoom in">
            <ZoomIn size={11} />
          </ZoomBtn>

          <ZoomBtn onClick={zoomToFitContent} title="Fit content to view">
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

function Divider({ className }: { className?: string } = {}) {
  return (
    <div
      className={['w-px my-1.5 self-stretch', className].filter(Boolean).join(' ')}
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

// Popover trigger that shows the current zoom and exposes presets + custom %.
function ZoomPercentPopover({
  zoomPct,
  onPick,
  onFit,
  onReset,
}: {
  zoomPct: number;
  onPick: (pct: number) => void;
  onFit: () => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const presets = [50, 100, 150, 200, 400];

  function commitDraft() {
    const n = parseFloat(draft);
    if (!Number.isNaN(n) && n > 0) onPick(n);
    setDraft('');
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="px-2 h-6 flex items-center justify-center text-[11px] hover:text-foreground hover:bg-foreground/5 transition-colors tabular-nums border-x"
          style={{ borderColor: 'var(--panel-border)' }}
          title="Zoom presets"
        >
          {zoomPct}%
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="end">
        <div className="flex items-center gap-1 px-1 pb-1 border-b" style={{ borderColor: 'var(--panel-border)' }}>
          <input
            type="number"
            value={draft}
            placeholder={`${zoomPct}`}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitDraft(); }}
            className="flex-1 h-6 px-1.5 text-[11px] font-mono tabular-nums bg-transparent outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[10px] text-muted-foreground pr-1">%</span>
        </div>
        <button
          onClick={() => { onFit(); setOpen(false); }}
          className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-foreground/5 transition-colors"
        >
          Fit content
        </button>
        <button
          onClick={() => { onReset(); setOpen(false); }}
          className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-foreground/5 transition-colors"
        >
          Reset view
        </button>
        <div className="border-t my-1" style={{ borderColor: 'var(--panel-border)' }} />
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => { onPick(p); setOpen(false); }}
            className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-foreground/5 transition-colors tabular-nums"
          >
            {p}%
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
