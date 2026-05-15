import { useState } from 'react';
import { FileCode2, Image, Share2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { exportSVG, exportPNG } from '../../lib/exportUtils';
import { Section, PropertyRow } from './Section';

type Scope = 'canvas' | 'selection';
type Scale = 1 | 2 | 3;

export function ExportSection() {
  const shapes           = useAppStore((s) => s.shapes);
  const texts            = useAppStore((s) => s.texts);
  const images           = useAppStore((s) => s.images);
  const selectedShapeId  = useAppStore((s) => s.selectedShapeId);
  const selectedTextId   = useAppStore((s) => s.selectedTextId);
  const selectedImageId  = useAppStore((s) => s.selectedImageId);

  const [scope, setScope] = useState<Scope>('canvas');
  const [scale, setScale] = useState<Scale>(2);

  const hasSelection = !!(selectedShapeId || selectedTextId || selectedImageId);
  const isEmpty = shapes.length === 0 && texts.length === 0 && images.length === 0;

  // If the user picked Selection but later cleared the selection, fall back to canvas.
  const effectiveScope: Scope = scope === 'selection' && hasSelection ? 'selection' : 'canvas';

  function targetShapes() {
    if (effectiveScope === 'selection' && selectedShapeId) {
      return shapes.filter((s) => s.id === selectedShapeId);
    }
    return shapes;
  }
  function targetTexts() {
    if (effectiveScope === 'selection' && selectedTextId) {
      return texts.filter((t) => t.id === selectedTextId);
    }
    if (effectiveScope === 'selection' && (selectedShapeId || selectedImageId)) {
      return [];
    }
    return texts;
  }
  function targetImages() {
    if (effectiveScope === 'selection' && selectedImageId) {
      return images.filter((img) => img.id === selectedImageId);
    }
    if (effectiveScope === 'selection' && (selectedShapeId || selectedTextId)) {
      return [];
    }
    return images;
  }

  const targetIsEmpty =
    targetShapes().length === 0 && targetTexts().length === 0 && targetImages().length === 0;

  return (
    <Section title="Export" icon={<Share2 size={11} />}>
      {/* Scope: Canvas vs Selection */}
      <PropertyRow label="Scope">
        <div className="w-44">
          <Segmented<Scope>
            value={effectiveScope}
            options={[
              { value: 'canvas',    label: 'Canvas' },
              { value: 'selection', label: 'Selection', disabled: !hasSelection },
            ]}
            onChange={setScope}
          />
        </div>
      </PropertyRow>

      {/* PNG scale presets */}
      <PropertyRow label="PNG scale">
        <div className="w-44">
          <Segmented<Scale>
            value={scale}
            options={[
              { value: 1, label: '1×' },
              { value: 2, label: '2×' },
              { value: 3, label: '3×' },
            ]}
            onChange={setScale}
          />
        </div>
      </PropertyRow>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <ExportButton
          label="SVG"
          icon={<FileCode2 size={14} />}
          disabled={isEmpty || targetIsEmpty}
          onClick={() => exportSVG(targetShapes(), targetTexts(), targetImages())}
          title={isEmpty ? 'Draw something first' : `Download SVG (${effectiveScope})`}
        />
        <ExportButton
          label="PNG"
          icon={<Image size={14} />}
          disabled={isEmpty || targetIsEmpty}
          onClick={() => exportPNG(targetShapes(), targetTexts(), targetImages(), scale)}
          title={isEmpty ? 'Draw something first' : `Download PNG (${effectiveScope}, ${scale}×)`}
        />
      </div>
    </Section>
  );
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="flex p-0.5 rounded-md border bg-foreground/[0.03] w-full min-w-0"
      style={{ borderColor: 'var(--panel-border)' }}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={[
              'flex-1 min-w-0 h-7 px-2 flex items-center justify-center rounded text-[11px] font-medium transition-all truncate',
              opt.disabled
                ? 'text-muted-foreground/40 cursor-not-allowed'
                : isActive
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/5'
                  : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ExportButton({
  label,
  icon,
  disabled,
  onClick,
  title,
}: {
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="h-16 flex flex-col items-center justify-center gap-1.5 rounded-md border bg-foreground/[0.02] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-foreground/[0.02]"
      style={{ borderColor: 'var(--panel-border)' }}
    >
      {icon}
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}
