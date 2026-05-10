import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Palette } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Slider } from '../ui/slider';
import { STROKE_WIDTH_MIN, STROKE_WIDTH_MAX } from '../../config/constants';
import { Section, PropertyRow } from './Section';
import { NumberField } from './NumberField';

type ColorRowProps = {
  label: string;
  value: string;
  onChange: (color: string) => void;
};

// Editor-style color row: swatch + hex input, both open the picker.
function ColorRow({ label, value, onChange }: ColorRowProps) {
  const [draft, setDraft] = useState(value.replace('#', '').toUpperCase());

  useEffect(() => {
    setDraft(value.replace('#', '').toUpperCase());
  }, [value]);

  function commitHex() {
    const cleaned = draft.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    if (cleaned.length === 6 || cleaned.length === 3) {
      onChange('#' + cleaned);
    } else {
      setDraft(value.replace('#', '').toUpperCase());
    }
  }

  return (
    <PropertyRow label={label}>
      <div
        className="flex items-center h-7 rounded border bg-foreground/[0.03] overflow-hidden"
        style={{ borderColor: 'var(--panel-border)' }}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-7 h-7 border-r hover:opacity-90 transition-opacity"
              style={{ background: value, borderColor: 'var(--panel-border)' }}
              aria-label={`Pick ${label.toLowerCase()}`}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="end">
            <HexColorPicker color={value} onChange={onChange} />
            <p className="mt-2 text-center font-mono text-xs text-muted-foreground uppercase">
              {value}
            </p>
          </PopoverContent>
        </Popover>
        <span className="text-[10px] text-muted-foreground/60 px-1 select-none">#</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
          onBlur={commitHex}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') {
              setDraft(value.replace('#', '').toUpperCase());
              (e.target as HTMLInputElement).blur();
            }
          }}
          maxLength={6}
          className="w-14 bg-transparent text-xs font-mono uppercase tracking-wide outline-none pr-1.5"
        />
      </div>
    </PropertyRow>
  );
}

export function StyleSection() {
  const fillColor = useAppStore((s) => s.fillColor);
  const strokeColor = useAppStore((s) => s.strokeColor);
  const strokeWidth = useAppStore((s) => s.strokeWidth);
  const setFillColor = useAppStore((s) => s.setFillColor);
  const setStrokeColor = useAppStore((s) => s.setStrokeColor);
  const setStrokeWidth = useAppStore((s) => s.setStrokeWidth);

  return (
    <Section title="Style" icon={<Palette size={11} />}>
      <ColorRow label="Fill"   value={fillColor}   onChange={setFillColor} />
      <ColorRow label="Stroke" value={strokeColor} onChange={setStrokeColor} />

      <PropertyRow label="Width">
        <NumberField
          value={strokeWidth}
          onChange={setStrokeWidth}
          min={STROKE_WIDTH_MIN}
          max={STROKE_WIDTH_MAX}
          step={0.5}
          suffix="px"
        />
      </PropertyRow>

      <Slider
        min={STROKE_WIDTH_MIN}
        max={STROKE_WIDTH_MAX}
        step={0.5}
        value={[strokeWidth]}
        onValueChange={([val]) => setStrokeWidth(val)}
        className="mt-2"
      />
    </Section>
  );
}
