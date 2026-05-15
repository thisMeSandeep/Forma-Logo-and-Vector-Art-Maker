import type { ImageItem } from '../../types';
import { IDENTITY_TRANSFORM } from '../../types';

export function duplicatedImage(source: ImageItem, gridSize: number): ImageItem {
  const offset = gridSize * 2;
  return {
    ...source,
    id: crypto.randomUUID(),
    x: source.x + offset,
    y: source.y + offset,
  };
}

// Flip mirrors via the freeform transform, like text.
export function flippedImage(image: ImageItem, axis: 'horizontal' | 'vertical'): ImageItem {
  const current = image.transform ?? IDENTITY_TRANSFORM;
  return {
    ...image,
    transform: {
      ...current,
      scaleX: axis === 'horizontal' ? current.scaleX * -1 : current.scaleX,
      scaleY: axis === 'vertical'   ? current.scaleY * -1 : current.scaleY,
    },
  };
}

export function reorderedImages(
  images: ImageItem[],
  id: string,
  direction: 'front' | 'back' | 'forward' | 'backward',
): ImageItem[] {
  const idx = images.findIndex((img) => img.id === id);
  if (idx === -1) return images;
  const next = images.slice();
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

export function withImageRotationDelta(image: ImageItem, deltaDegrees: number): ImageItem {
  const current = image.transform ?? IDENTITY_TRANSFORM;
  const rotation = ((current.rotation + deltaDegrees) % 360 + 360) % 360;
  return { ...image, transform: { ...current, rotation } };
}

// Reads an image file and returns its data URL + intrinsic pixel dimensions.
export async function readImageFile(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to decode image'));
    img.src = dataUrl;
  });
  return { dataUrl, width, height };
}
