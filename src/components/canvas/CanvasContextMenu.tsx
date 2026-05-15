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

// Wraps the canvas surface and exposes shape/text operations via right-click.
// Right-click on a shape/text selects it first (handled in ShapeLayer /
// TextLayer onContextMenu), so by the time the menu opens, either
// selectedShapeId or selectedTextId points at the target — and the two are
// mutually exclusive, so we just dispatch based on which is set.
export function CanvasContextMenu({ children }: { children: React.ReactNode }) {
  const selectedShapeId     = useAppStore((s) => s.selectedShapeId);
  const selectedTextId      = useAppStore((s) => s.selectedTextId);
  const duplicateShape      = useAppStore((s) => s.duplicateShape);
  const flipShape           = useAppStore((s) => s.flipShape);
  const reorderShape        = useAppStore((s) => s.reorderShape);
  const deleteShape         = useAppStore((s) => s.deleteShape);
  const rotateShape         = useAppStore((s) => s.rotateShape);
  const resetShapeTransform = useAppStore((s) => s.resetShapeTransform);
  const duplicateText       = useAppStore((s) => s.duplicateText);
  const flipText            = useAppStore((s) => s.flipText);
  const reorderText         = useAppStore((s) => s.reorderText);
  const deleteText          = useAppStore((s) => s.deleteText);
  const rotateText          = useAppStore((s) => s.rotateText);
  const resetTextTransform  = useAppStore((s) => s.resetTextTransform);

  const hasSelection = selectedShapeId != null || selectedTextId != null;

  function onDuplicate() {
    if (selectedShapeId) duplicateShape(selectedShapeId);
    else if (selectedTextId) duplicateText(selectedTextId);
  }
  function onFlip(axis: 'horizontal' | 'vertical') {
    if (selectedShapeId) flipShape(selectedShapeId, axis);
    else if (selectedTextId) flipText(selectedTextId, axis);
  }
  function onRotate(delta: number) {
    if (selectedShapeId) rotateShape(selectedShapeId, delta);
    else if (selectedTextId) rotateText(selectedTextId, delta);
  }
  function onResetTransform() {
    if (selectedShapeId) resetShapeTransform(selectedShapeId);
    else if (selectedTextId) resetTextTransform(selectedTextId);
  }
  function onReorder(direction: 'front' | 'back' | 'forward' | 'backward') {
    if (selectedShapeId) reorderShape(selectedShapeId, direction);
    else if (selectedTextId) reorderText(selectedTextId, direction);
  }
  function onDelete() {
    if (selectedShapeId) deleteShape(selectedShapeId);
    else if (selectedTextId) deleteText(selectedTextId);
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabled={!hasSelection} onSelect={onDuplicate}>
          <Copy /> Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={!hasSelection} onSelect={() => onFlip('horizontal')}>
          <FlipHorizontal2 /> Flip horizontal
        </ContextMenuItem>
        <ContextMenuItem disabled={!hasSelection} onSelect={() => onFlip('vertical')}>
          <FlipVertical2 /> Flip vertical
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={!hasSelection} onSelect={() => onRotate(90)}>
          <RotateCw /> Rotate 90° CW
        </ContextMenuItem>
        <ContextMenuItem disabled={!hasSelection} onSelect={() => onRotate(-90)}>
          <RotateCcw /> Rotate 90° CCW
        </ContextMenuItem>
        <ContextMenuItem disabled={!hasSelection} onSelect={() => onRotate(180)}>
          <RotateCw /> Rotate 180°
        </ContextMenuItem>
        <ContextMenuItem disabled={!hasSelection} onSelect={onResetTransform}>
          <RefreshCw /> Reset transform
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={!hasSelection} onSelect={() => onReorder('front')}>
          <BringToFront /> Bring to front
          <ContextMenuShortcut>]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled={!hasSelection} onSelect={() => onReorder('back')}>
          <SendToBack /> Send to back
          <ContextMenuShortcut>[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" disabled={!hasSelection} onSelect={onDelete}>
          <Trash2 /> Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
