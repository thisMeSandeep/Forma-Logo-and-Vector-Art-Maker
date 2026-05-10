import { Undo2, Redo2, RotateCcw, AlertTriangle, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

export function HistoryBar() {
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const resetCanvas = useAppStore((s) => s.resetCanvas);
  const canUndo = useAppStore((s) => s.history.length > 0 || s.previewPoints.length > 0);
  const canRedo = useAppStore((s) => s.future.length > 0);
  const shapeCount = useAppStore((s) => s.shapes.length);
  const historyCount = useAppStore((s) => s.history.length);

  return (
    // Sits above the status bar (h-8 = 32px), centered horizontally
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10">
      <div
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-full border shadow-md backdrop-blur-md"
        style={{
          background: 'color-mix(in oklch, var(--topbar-bg) 85%, transparent)',
          borderColor: 'var(--panel-border)',
        }}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={14} />
        </Button>

        <div
          className="w-px h-4 mx-0.5"
          style={{ background: 'var(--panel-border)' }}
        />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon-sm" title="Reset canvas">
              <RotateCcw size={14} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="p-0 overflow-hidden gap-0">
            {/* Header strip with warning icon */}
            <div className="flex items-start gap-3 p-5 pb-4">
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: 'color-mix(in oklch, oklch(0.65 0.2 25) 15%, transparent)',
                  color: 'oklch(0.65 0.2 25)',
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div className="flex flex-col gap-1 pt-0.5">
                <h2 className="text-sm font-semibold leading-tight">Reset canvas?</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This will permanently delete everything you've drawn.
                  <br />
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Stats panel — shows what's about to be lost */}
            <div
              className="mx-5 mb-4 rounded-md border divide-y"
              style={{ borderColor: 'var(--panel-border)' }}
            >
              <StatRow
                label="Shapes"
                value={shapeCount}
                style={{ borderColor: 'var(--panel-border)' }}
              />
              <StatRow
                label="Undo history"
                value={historyCount}
                style={{ borderColor: 'var(--panel-border)' }}
              />
            </div>

            {/* Footer actions */}
            <AlertDialogFooter
              className="!m-0 px-5 py-4 border-t rounded-b-xl bg-foreground/[0.02]"
              style={{ borderColor: 'var(--panel-border)' }}
            >
              <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={resetCanvas}
                className="h-8 text-xs gap-1.5 bg-[oklch(0.6_0.2_25)] hover:bg-[oklch(0.55_0.22_25)] text-white"
              >
                <Trash2 size={13} />
                Reset canvas
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  style,
}: {
  label: string;
  value: number;
  style?: React.CSSProperties;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 text-xs" style={style}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums font-medium">{value}</span>
    </div>
  );
}
