import { Move3d, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { IDENTITY_TRANSFORM } from '../../types';
import { Section, PropertyRow } from './Section';
import { NumberField } from './NumberField';

// Only renders when a shape is selected. Mirrors how the text section is
// always present but its fields drive the selected text.
export function TransformSection() {
  const selectedShapeId     = useAppStore((s) => s.selectedShapeId);
  const shape               = useAppStore((s) =>
    s.selectedShapeId ? s.shapes.find((sh) => sh.id === s.selectedShapeId) ?? null : null,
  );
  const setShapeTransform   = useAppStore((s) => s.setShapeTransform);
  const resetShapeTransform = useAppStore((s) => s.resetShapeTransform);
  const commitHistory       = useAppStore((s) => s.commitHistory);

  if (!shape || !selectedShapeId) return null;

  const t = shape.transform ?? IDENTITY_TRANSFORM;

  // Commit a single history entry per numeric edit (NumberField commits onBlur).
  function update(patch: Partial<typeof t>) {
    setShapeTransform(selectedShapeId!, patch);
    commitHistory();
  }

  return (
    <Section title="Transform" icon={<Move3d size={11} />}>
      <PropertyRow label="Rotation">
        <NumberField
          value={t.rotation}
          onChange={(v) => update({ rotation: v })}
          step={1}
          suffix="°"
        />
      </PropertyRow>

      <PropertyRow label="Scale X">
        <NumberField
          value={t.scaleX}
          onChange={(v) => update({ scaleX: v })}
          step={0.1}
        />
      </PropertyRow>

      <PropertyRow label="Scale Y">
        <NumberField
          value={t.scaleY}
          onChange={(v) => update({ scaleY: v })}
          step={0.1}
        />
      </PropertyRow>

      <PropertyRow label="Skew X">
        <NumberField
          value={t.skewX}
          onChange={(v) => update({ skewX: v })}
          min={-89}
          max={89}
          step={1}
          suffix="°"
        />
      </PropertyRow>

      <PropertyRow label="Skew Y">
        <NumberField
          value={t.skewY}
          onChange={(v) => update({ skewY: v })}
          min={-89}
          max={89}
          step={1}
          suffix="°"
        />
      </PropertyRow>

      <button
        onClick={() => resetShapeTransform(selectedShapeId)}
        className="flex items-center justify-center gap-1.5 h-7 rounded border text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
        style={{ borderColor: 'var(--panel-border)' }}
      >
        <RefreshCw size={11} />
        Reset transform
      </button>
    </Section>
  );
}
