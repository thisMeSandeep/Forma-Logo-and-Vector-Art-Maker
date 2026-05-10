import { Undo2, Redo2, RotateCcw, PanelRight, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

type Props = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function TopBar({ sidebarOpen, onToggleSidebar }: Props) {
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const resetCanvas = useAppStore((s) => s.resetCanvas);
  const canUndo = useAppStore((s) => s.history.length > 0 || s.previewPoints.length > 0);
  const canRedo = useAppStore((s) => s.future.length > 0);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header
      className="h-10 flex items-center px-4 gap-3 shrink-0 border-b"
      style={{ background: 'var(--topbar-bg)', borderColor: 'var(--panel-border)' }}
    >
      <span className="text-sm font-semibold tracking-tight">Forma</span>

      <div className="w-px h-4 opacity-20 bg-current" />

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

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" title="Reset canvas">
            <RotateCcw size={14} />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset canvas?</AlertDialogTitle>
            <AlertDialogDescription>
              All shapes will be deleted and undo history cleared. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetCanvas}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <PanelRight size={14} />
        </Button>
      </div>
    </header>
  );
}
