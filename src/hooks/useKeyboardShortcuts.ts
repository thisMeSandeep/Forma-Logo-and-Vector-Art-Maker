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
      }

      // Ctrl+Y and Ctrl+Shift+Z are both standard redo shortcuts
      if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      }

      // Escape cancels the in-progress polygon without committing it
      if (e.key === 'Escape') {
        e.preventDefault();
        const store = useAppStore.getState();
        store.setPreviewPoints([]);
        store.setEditingTextId(null);
        store.setSelectedTextId(null);
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        const store = useAppStore.getState();
        if (!store.selectedTextId) return;
        e.preventDefault();
        store.deleteText(store.selectedTextId);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);
}
