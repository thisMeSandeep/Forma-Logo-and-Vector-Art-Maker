import { Undo2, Redo2, RotateCcw, AlertTriangle, Trash2, Keyboard } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

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

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon-sm" title="Keyboard shortcuts">
              <Keyboard size={14} />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Keyboard shortcuts</DialogTitle>
              <DialogDescription className="text-xs">
                Modifier keys are <Kbd>⌘</Kbd> on Mac, <Kbd>Ctrl</Kbd> on Windows/Linux.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 space-y-5">
              <ShortcutGroup title="History">
                <Shortcut label="Undo"        keys={['⌘', 'Z']} />
                <Shortcut label="Redo"        keys={['⌘', '⇧', 'Z']} />
                <Shortcut label="Redo (alt)" keys={['⌘', 'Y']} />
              </ShortcutGroup>

              <ShortcutGroup title="Selection">
                <Shortcut label="Duplicate"        keys={['⌘', 'D']} />
                <Shortcut label="Delete"           keys={['Delete']} />
                <Shortcut label="Clear selection"  keys={['Esc']} />
                <Shortcut label="Nudge 1px"        keys={['←↑↓→']} />
                <Shortcut label="Nudge by grid"    keys={['⇧', '←↑↓→']} />
                <Shortcut label="Select from any tool" keys={['⌘', 'Click']} />
              </ShortcutGroup>

              <ShortcutGroup title="Layer order">
                <Shortcut label="Bring forward"  keys={[']']} />
                <Shortcut label="Send backward" keys={['[']} />
                <Shortcut label="Bring to front" keys={['⇧', ']']} />
                <Shortcut label="Send to back"   keys={['⇧', '[']} />
              </ShortcutGroup>

              <ShortcutGroup title="Canvas">
                <Shortcut label="Pan (hold)"        keys={['Space', '+', 'Drag']} />
                <Shortcut label="Constrain (while drawing)" keys={['⇧', 'Drag']} />
                <Shortcut label="Edit text"         keys={['Double-click']} />
              </ShortcutGroup>
            </div>
          </DialogContent>
        </Dialog>

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
                className="h-8 text-xs gap-1.5 bg-foreground hover:bg-[oklch(0.55_0.22_25)] text-white"
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

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1 rounded border text-[10px] font-mono font-medium bg-foreground/[0.04]"
      style={{ borderColor: 'var(--panel-border)' }}
    >
      {children}
    </kbd>
  );
}

function ShortcutGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 mb-2">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

// Each entry in `keys` is shown as a separate <Kbd>, except the literal '+'
// which is rendered as a plain "+" separator (so e.g. "Space + Drag" reads as
// two keys joined by a plus rather than three boxed tokens).
function Shortcut({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1">
        {keys.map((k, i) =>
          k === '+'
            ? <span key={i} className="text-muted-foreground/60 text-[10px]">+</span>
            : <Kbd key={i}>{k}</Kbd>,
        )}
      </span>
    </div>
  );
}
