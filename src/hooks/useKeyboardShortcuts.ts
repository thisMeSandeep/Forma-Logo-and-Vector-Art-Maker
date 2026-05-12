import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useKeyboardShortcuts() {
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't fire when the user is typing in an input or textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y and Ctrl+Shift+Z are both standard redo shortcuts
      if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
        return;
      }

      // Escape cancels the in-progress polygon and any selection
      if (e.key === 'Escape') {
        e.preventDefault();
        const store = useAppStore.getState();
        store.setPreviewPoints([]);
        store.setDragStart(null);
        store.setEditingTextId(null);
        store.setSelectedTextId(null);
        store.setSelectedShapeId(null);
        store.setActiveTool('select');
        return;
      }

      const store = useAppStore.getState();

      // Cmd/Ctrl+D — duplicate selected shape
      if (ctrl && e.key === 'd' && store.selectedShapeId) {
        e.preventDefault();
        store.duplicateShape(store.selectedShapeId);
        return;
      }

      // Z-order brackets
      if (!ctrl && store.selectedShapeId) {
        if (e.key === ']') {
          e.preventDefault();
          store.reorderShape(store.selectedShapeId, e.shiftKey ? 'front' : 'forward');
          return;
        }
        if (e.key === '[') {
          e.preventDefault();
          store.reorderShape(store.selectedShapeId, e.shiftKey ? 'back' : 'backward');
          return;
        }
      }

      // Delete — shape takes priority over text
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (store.selectedShapeId) {
          e.preventDefault();
          store.deleteShape(store.selectedShapeId);
          return;
        }
        if (store.selectedTextId) {
          e.preventDefault();
          store.deleteText(store.selectedTextId);
          return;
        }
      }

      // Arrow nudge for selected shape — 1px, Shift = grid step
      if (store.selectedShapeId && e.key.startsWith('Arrow')) {
        const step = e.shiftKey ? store.gridSize : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0;
        if (dx === 0 && dy === 0) return;
        e.preventDefault();
        store.moveShape(store.selectedShapeId, dx, dy);
        store.commitHistory();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);
}
