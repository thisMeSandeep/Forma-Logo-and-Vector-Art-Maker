import { Undo2, Redo2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/button';

export function TopBar() {
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const canUndo = useAppStore((s) => s.history.length > 0 || s.previewPoints.length > 0);
  const canRedo = useAppStore((s) => s.future.length > 0);

  return (
    <header
      className="h-10 flex items-center px-4 gap-3 shrink-0 border-b"
      style={{ background: 'var(--topbar-bg)', borderColor: 'var(--panel-border)' }}
    >
      <span className="text-sm font-semibold tracking-tight">Forma</span>

      <div className="w-px h-4 bg-white/10" />

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 />
      </Button>

      {/* TODO: Step 10 — Reset canvas button with AlertDialog confirmation */}
    </header>
  );
}
