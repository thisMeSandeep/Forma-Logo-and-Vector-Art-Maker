import {
  Copy,
  FlipHorizontal2,
  FlipVertical2,
  BringToFront,
  SendToBack,
  Trash2,
  RotateCw,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '../ui/context-menu';
import { useAppStore } from '../../store/useAppStore';

// Wraps the canvas surface and exposes shape operations via right-click.
// Right-click on a shape selects it first (handled in ShapeLayer onContextMenu),
// so by the time the menu opens, selectedShapeId points at the target.
export function CanvasContextMenu({ children }: { children: React.ReactNode }) {
  const selectedShapeId     = useAppStore((s) => s.selectedShapeId);
  const duplicateShape      = useAppStore((s) => s.duplicateShape);
  const flipShape           = useAppStore((s) => s.flipShape);
  const reorderShape        = useAppStore((s) => s.reorderShape);
  const deleteShape         = useAppStore((s) => s.deleteShape);
  const rotateShape         = useAppStore((s) => s.rotateShape);
  const resetShapeTransform = useAppStore((s) => s.resetShapeTransform);

  const hasSelection = selectedShapeId != null;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          disabled={!hasSelection}
          onSelect={() => selectedShapeId && duplicateShape(selectedShapeId)}
        >
          <Copy /> Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={!hasSelection}
          onSelect={() => selectedShapeId && flipShape(selectedShapeId, 'horizontal')}
        >
          <FlipHorizontal2 /> Flip horizontal
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!hasSelection}
          onSelect={() => selectedShapeId && flipShape(selectedShapeId, 'vertical')}
        >
          <FlipVertical2 /> Flip vertical
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={!hasSelection}
          onSelect={() => selectedShapeId && rotateShape(selectedShapeId, 90)}
        >
          <RotateCw /> Rotate 90° CW
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!hasSelection}
          onSelect={() => selectedShapeId && rotateShape(selectedShapeId, -90)}
        >
          <RotateCcw /> Rotate 90° CCW
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!hasSelection}
          onSelect={() => selectedShapeId && rotateShape(selectedShapeId, 180)}
        >
          <RotateCw /> Rotate 180°
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!hasSelection}
          onSelect={() => selectedShapeId && resetShapeTransform(selectedShapeId)}
        >
          <RefreshCw /> Reset transform
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={!hasSelection}
          onSelect={() => selectedShapeId && reorderShape(selectedShapeId, 'front')}
        >
          <BringToFront /> Bring to front
          <ContextMenuShortcut>]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!hasSelection}
          onSelect={() => selectedShapeId && reorderShape(selectedShapeId, 'back')}
        >
          <SendToBack /> Send to back
          <ContextMenuShortcut>[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          disabled={!hasSelection}
          onSelect={() => selectedShapeId && deleteShape(selectedShapeId)}
        >
          <Trash2 /> Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
