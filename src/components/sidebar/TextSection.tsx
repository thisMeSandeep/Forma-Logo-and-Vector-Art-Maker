import { useState } from 'react';
import { AlignCenter, AlignLeft, AlignRight, Type } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { useAppStore } from '../../store/useAppStore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Slider } from '../ui/slider';
import { Section, PropertyRow } from './Section';
import { NumberField } from './NumberField';
import {
  TEXT_FONT_OPTIONS,
  TEXT_FONT_SIZE_MAX,
  TEXT_FONT_SIZE_MIN,
} from '../../config/constants';
import type { FontWeight, TextAnchor } from '../../types';

function TextColorRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
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
    <PropertyRow label="Color">
      <div
        className="flex items-center h-7 rounded border bg-foreground/[0.03] overflow-hidden"
        style={{ borderColor: 'var(--panel-border)' }}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-7 h-7 border-r hover:opacity-90 transition-opacity"
              style={{ background: value, borderColor: 'var(--panel-border)' }}
              aria-label="Pick text color"
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

const WEIGHTS: { label: string; value: FontWeight }[] = [
  { label: 'R', value: 400 },
  { label: 'M', value: 500 },
  { label: 'S', value: 600 },
  { label: 'B', value: 700 },
];

const ANCHORS: { label: string; value: TextAnchor; icon: typeof AlignLeft }[] = [
  { label: 'Left', value: 'start', icon: AlignLeft },
  { label: 'Center', value: 'middle', icon: AlignCenter },
  { label: 'Right', value: 'end', icon: AlignRight },
];

export function TextSection() {
  const selectedTextId = useAppStore((s) => s.selectedTextId);
  const fontFamily = useAppStore((s) => s.textFontFamily);
  const fontSize = useAppStore((s) => s.textFontSize);
  const fontWeight = useAppStore((s) => s.textFontWeight);
  const fill = useAppStore((s) => s.textFill);
  const anchor = useAppStore((s) => s.textAnchor);
  const setFontFamily = useAppStore((s) => s.setTextFontFamily);
  const setFontSize = useAppStore((s) => s.setTextFontSize);
  const setFontWeight = useAppStore((s) => s.setTextFontWeight);
  const setFill = useAppStore((s) => s.setTextFill);
  const setAnchor = useAppStore((s) => s.setTextAnchor);

  if (!selectedTextId) return null;

  return (
    <Section title="Text" icon={<Type size={11} />}>
      <PropertyRow label="Font">
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="h-7 w-32 rounded border bg-foreground/[0.03] px-2 text-xs outline-none"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          {TEXT_FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </PropertyRow>

      <PropertyRow label="Size">
        <NumberField
          value={fontSize}
          onChange={setFontSize}
          min={TEXT_FONT_SIZE_MIN}
          max={TEXT_FONT_SIZE_MAX}
          step={1}
          suffix="px"
        />
      </PropertyRow>

      <Slider
        min={TEXT_FONT_SIZE_MIN}
        max={TEXT_FONT_SIZE_MAX}
        step={1}
        value={[fontSize]}
        onValueChange={([val]) => setFontSize(val)}
        className="mt-2"
      />

      <PropertyRow label="Weight">
        <div
          className="grid grid-cols-4 overflow-hidden rounded border"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          {WEIGHTS.map((weight) => (
            <button
              key={weight.value}
              onClick={() => setFontWeight(weight.value)}
              className="h-7 w-8 text-[11px] font-semibold transition-colors hover:bg-foreground/[0.06]"
              style={{
                background: fontWeight === weight.value ? 'var(--accent)' : 'transparent',
                color: fontWeight === weight.value ? 'var(--accent-foreground)' : undefined,
              }}
              title={`${weight.value}`}
            >
              {weight.label}
            </button>
          ))}
        </div>
      </PropertyRow>

      <TextColorRow value={fill} onChange={setFill} />

      <PropertyRow label="Anchor">
        <div
          className="grid grid-cols-3 overflow-hidden rounded border"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          {ANCHORS.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setAnchor(value)}
              className="h-7 w-8 flex items-center justify-center transition-colors hover:bg-foreground/[0.06]"
              style={{
                background: anchor === value ? 'var(--accent)' : 'transparent',
                color: anchor === value ? 'var(--accent-foreground)' : undefined,
              }}
              title={label}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>
      </PropertyRow>
    </Section>
  );
}
