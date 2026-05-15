import { Image as ImageIcon, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Slider } from '../ui/slider';
import { Section, PropertyRow } from './Section';
import { NumberField } from './NumberField';
import { readImageFile } from '../../store/actions/image';

export function ImageSection() {
  const selectedImageId = useAppStore((s) => s.selectedImageId);
  const selectedImage   = useAppStore((s) =>
    s.selectedImageId ? s.images.find((img) => img.id === s.selectedImageId) ?? null : null,
  );
  const updateImage   = useAppStore((s) => s.updateImage);
  const commitHistory = useAppStore((s) => s.commitHistory);
  const replaceRef    = useRef<HTMLInputElement>(null);

  if (!selectedImageId || !selectedImage) return null;

  function patch(p: Parameters<typeof updateImage>[1]) {
    if (selectedImageId) updateImage(selectedImageId, p);
  }

  // Aspect-locked resize via either axis. Width drives height (and vice-versa)
  // using the original natural pixel ratio so the image never distorts here.
  const aspect = selectedImage.naturalHeight / Math.max(1, selectedImage.naturalWidth);
  function setWidth(w: number) {
    const clamped = Math.max(1, w);
    patch({ width: clamped, height: clamped * aspect });
    commitHistory();
  }
  function setHeight(h: number) {
    const clamped = Math.max(1, h);
    patch({ width: clamped / aspect, height: clamped });
    commitHistory();
  }

  async function onReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const { dataUrl, width, height } = await readImageFile(file);
    // Keep the image anchored at the same top-left + center, fit into the
    // existing display width so the swap doesn't visually jump.
    const w = selectedImage!.width;
    const h = w * (height / Math.max(1, width));
    patch({ dataUrl, width: w, height: h, naturalWidth: width, naturalHeight: height });
    commitHistory();
  }

  const opacity = selectedImage.opacity ?? 1;

  return (
    <Section title="Image" icon={<ImageIcon size={11} />}>
      <PropertyRow label="Width">
        <NumberField
          value={Math.round(selectedImage.width)}
          onChange={setWidth}
          min={1}
          step={1}
          suffix="px"
        />
      </PropertyRow>
      <PropertyRow label="Height">
        <NumberField
          value={Math.round(selectedImage.height)}
          onChange={setHeight}
          min={1}
          step={1}
          suffix="px"
        />
      </PropertyRow>

      <PropertyRow label="Opacity">
        <NumberField
          value={Math.round(opacity * 100)}
          onChange={(v) => patch({ opacity: Math.max(0, Math.min(100, v)) / 100 })}
          min={0}
          max={100}
          step={1}
          suffix="%"
        />
      </PropertyRow>
      <Slider
        min={0}
        max={1}
        step={0.01}
        value={[opacity]}
        onValueChange={([v]) => patch({ opacity: v })}
      />

      <PropertyRow label="Replace">
        <button
          onClick={() => replaceRef.current?.click()}
          className="h-7 px-2 flex items-center gap-1 rounded border bg-foreground/[0.03] text-[11px] hover:bg-foreground/[0.06]"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          <Upload size={11} />
          Choose
        </button>
        <input
          ref={replaceRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onReplace}
        />
      </PropertyRow>
    </Section>
  );
}
