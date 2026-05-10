import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Palette } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Slider } from '../ui/slider';
import {
  STROKE_WIDTH_MIN,
  STROKE_WIDTH_MAX,
  CORNER_RADIUS_MIN,
  CORNER_RADIUS_MAX,
} from '../../config/constants';
import { Section, PropertyRow } from './Section';
import { NumberField } from './NumberField';

type ColorRowProps = {
  label: string;
  value: string;
  onChange: (color: string) => void;
};

// Editor-style color row: swatch + hex input, both open the picker.
function ColorRow({ label, value, onChange }: ColorRowProps) {
  const [draftState, setDraftState] = useState({
    value,
    draft: value.replace('#', '').toUpperCase(),
  });
  const draft = draftState.value === value
    ? draftState.draft
    : value.replace('#', '').toUpperCase();

  function commitHex() {
    const cleaned = draft.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    if (cleaned.length === 6 || cleaned.length === 3) {
      onChange('#' + cleaned);
      setDraftState({ value: '#' + cleaned, draft: cleaned.toUpperCase() });
    } else {
      setDraftState({ value, draft: value.replace('#', '').toUpperCase() });
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
          onChange={(e) => setDraftState({ value, draft: e.target.value.toUpperCase() })}
          onBlur={commitHex}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') {
              setDraftState({ value, draft: value.replace('#', '').toUpperCase() });
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
  const cornerRadius = useAppStore((s) => s.cornerRadius);
  const setFillColor = useAppStore((s) => s.setFillColor);
  const setStrokeColor = useAppStore((s) => s.setStrokeColor);
  const setStrokeWidth = useAppStore((s) => s.setStrokeWidth);
  const setCornerRadius = useAppStore((s) => s.setCornerRadius);

  return (
    <Section title="Style" icon={<Palette size={11} />}>
      <ColorRow label="Fill" value={fillColor} onChange={setFillColor} />
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

      <PropertyRow label="Radius">
        <NumberField
          value={cornerRadius}
          onChange={setCornerRadius}
          min={CORNER_RADIUS_MIN}
          max={CORNER_RADIUS_MAX}
          step={1}
          suffix="px"
        />
      </PropertyRow>

      <Slider
        min={CORNER_RADIUS_MIN}
        max={CORNER_RADIUS_MAX}
        step={1}
        value={[cornerRadius]}
        onValueChange={([val]) => setCornerRadius(val)}
        className="mt-2"
      />
    </Section>
  );
}
