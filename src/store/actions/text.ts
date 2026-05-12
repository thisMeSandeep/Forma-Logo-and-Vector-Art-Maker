import type { TextItem } from '../../types';

// Apply a style patch to the selected text only. Mirrors patchSelectedShape.
export function patchSelectedText<K extends keyof TextItem>(
  texts: TextItem[],
  selectedId: string | null,
  key: K,
  value: TextItem[K],
): TextItem[] {
  if (!selectedId) return texts;
  return texts.map((t) => (t.id === selectedId ? { ...t, [key]: value } : t));
}
