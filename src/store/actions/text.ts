import type { TextItem } from '../../types';
import { IDENTITY_TRANSFORM } from '../../types';

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

export function duplicatedText(source: TextItem, gridSize: number): TextItem {
  const offset = gridSize * 2;
  return {
    ...source,
    id: crypto.randomUUID(),
    x: source.x + offset,
    y: source.y + offset,
  };
}

// Flip via the freeform transform — no glyph re-layout, just a mirror axis at
// the local bbox center.
export function flippedText(text: TextItem, axis: 'horizontal' | 'vertical'): TextItem {
  const current = text.transform ?? IDENTITY_TRANSFORM;
  return {
    ...text,
    transform: {
      ...current,
      scaleX: axis === 'horizontal' ? current.scaleX * -1 : current.scaleX,
      scaleY: axis === 'vertical'   ? current.scaleY * -1 : current.scaleY,
    },
  };
}

export function reorderedTexts(
  texts: TextItem[],
  id: string,
  direction: 'front' | 'back' | 'forward' | 'backward',
): TextItem[] {
  const idx = texts.findIndex((t) => t.id === id);
  if (idx === -1) return texts;
  const next = texts.slice();
  const [item] = next.splice(idx, 1);
  let targetIdx: number;
  switch (direction) {
    case 'front':    targetIdx = next.length; break;
    case 'back':     targetIdx = 0; break;
    case 'forward':  targetIdx = Math.min(next.length, idx + 1); break;
    case 'backward': targetIdx = Math.max(0, idx - 1); break;
  }
  next.splice(targetIdx, 0, item);
  return next;
}

export function withTextRotationDelta(text: TextItem, deltaDegrees: number): TextItem {
  const current = text.transform ?? IDENTITY_TRANSFORM;
  const rotation = ((current.rotation + deltaDegrees) % 360 + 360) % 360;
  return { ...text, transform: { ...current, rotation } };
}
