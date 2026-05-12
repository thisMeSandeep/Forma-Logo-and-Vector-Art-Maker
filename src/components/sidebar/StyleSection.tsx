import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Palette, Sparkles, CircleDashed } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Slider } from '../ui/slider';
import {
  STROKE_WIDTH_MIN,
  STROKE_WIDTH_MAX,
  CORNER_RADIUS_MIN,
  CORNER_RADIUS_MAX,
  SHADOW_DEFAULT,
  BLUR_DEFAULT,
  GRADIENT_DEFAULT,
} from '../../config/constants';
import { Section, PropertyRow } from './Section';
import { NumberField } from './NumberField';
import type { StrokeStyle } from '../../types';

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

// Segmented control reused by Stroke Style and Fill Kind selectors.
function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
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
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={[
              'flex-1 min-w-0 h-7 px-2 flex items-center justify-center rounded text-[11px] font-medium transition-all truncate',
              isActive
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

export function StyleSection() {
  const fillColor       = useAppStore((s) => s.fillColor);
  const strokeColor     = useAppStore((s) => s.strokeColor);
  const strokeWidth     = useAppStore((s) => s.strokeWidth);
  const cornerRadius    = useAppStore((s) => s.cornerRadius);
  const opacity         = useAppStore((s) => s.opacity);
  const strokeStyle     = useAppStore((s) => s.strokeStyle);
  const setFillColor    = useAppStore((s) => s.setFillColor);
  const setStrokeColor  = useAppStore((s) => s.setStrokeColor);
  const setStrokeWidth  = useAppStore((s) => s.setStrokeWidth);
  const setCornerRadius = useAppStore((s) => s.setCornerRadius);
  const setOpacity      = useAppStore((s) => s.setOpacity);
  const setStrokeStyle  = useAppStore((s) => s.setStrokeStyle);

  // Selected shape — used for per-shape-only properties (gradient, shadow, blur).
  const selectedId = useAppStore((s) => s.selectedShapeId);
  const selected   = useAppStore((s) =>
    s.selectedShapeId ? s.shapes.find((sh) => sh.id === s.selectedShapeId) ?? null : null,
  );
  const updateShape = useAppStore((s) => s.updateShape);

  function patch(p: Parameters<typeof updateShape>[1]) {
    if (selectedId) updateShape(selectedId, p);
  }

  const fillKind = selected?.fillKind ?? 'solid';
  const gradient = selected?.fillGradient ?? GRADIENT_DEFAULT;
  const shadow = selected?.shadow ?? null;
  const blur = selected?.blur ?? 0;

  return (
    <Section title="Style" icon={<Palette size={11} />}>
      {/* Fill kind toggle — only when shape selected, since gradient lives per-shape */}
      {selected && (
        <PropertyRow label="Fill">
          <div className="w-44">
            <Segmented
              value={fillKind}
              options={[
                { value: 'solid',  label: 'Solid' },
                { value: 'linear', label: 'Gradient' },
              ]}
              onChange={(v) => {
                if (v === 'linear') patch({ fillKind: 'linear', fillGradient: gradient });
                else patch({ fillKind: 'solid' });
              }}
            />
          </div>
        </PropertyRow>
      )}

      {fillKind === 'solid' && (
        <ColorRow label={selected ? 'Color' : 'Fill'} value={fillColor} onChange={setFillColor} />
      )}

      {selected && fillKind === 'linear' && (
        <>
          <ColorRow
            label="From"
            value={gradient.from}
            onChange={(c) => patch({ fillGradient: { ...gradient, from: c } })}
          />
          <ColorRow
            label="To"
            value={gradient.to}
            onChange={(c) => patch({ fillGradient: { ...gradient, to: c } })}
          />
          <PropertyRow label="Angle">
            <NumberField
              value={gradient.angle}
              onChange={(v) => patch({ fillGradient: { ...gradient, angle: v } })}
              step={1}
              suffix="°"
            />
          </PropertyRow>
          <Slider
            min={0}
            max={360}
            step={1}
            value={[gradient.angle]}
            onValueChange={([v]) => patch({ fillGradient: { ...gradient, angle: v } })}
            className="mt-2"
          />
        </>
      )}

      <ColorRow label="Stroke" value={strokeColor} onChange={setStrokeColor} />

      <PropertyRow label="Style">
        <div className="w-44">
          <Segmented<StrokeStyle>
            value={strokeStyle}
            options={[
              { value: 'solid',  label: 'Solid' },
              { value: 'dashed', label: 'Dashed' },
              { value: 'dotted', label: 'Dotted' },
            ]}
            onChange={setStrokeStyle}
          />
        </div>
      </PropertyRow>

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

      <PropertyRow label="Opacity">
        <NumberField
          value={Math.round(opacity * 100)}
          onChange={(v) => setOpacity(Math.max(0, Math.min(100, v)) / 100)}
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
        onValueChange={([v]) => setOpacity(v)}
        className="mt-2"
      />

      {/* Shadow + Blur — per-shape, so only shown when selected */}
      {selected && (
        <>
          <div className="flex items-center gap-2 pt-3 text-[11px] uppercase tracking-[0.1em] text-muted-foreground/80">
            <Sparkles size={11} />
            <span>Shadow</span>
            <div className="ml-auto w-24">
              <Segmented
                value={shadow ? 'on' : 'off'}
                options={[{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]}
                onChange={(v) => patch({ shadow: v === 'on' ? SHADOW_DEFAULT : null })}
              />
            </div>
          </div>
          {shadow && (
            <>
              <PropertyRow label="X">
                <NumberField
                  value={shadow.x}
                  onChange={(v) => patch({ shadow: { ...shadow, x: v } })}
                  step={1}
                  suffix="px"
                />
              </PropertyRow>
              <PropertyRow label="Y">
                <NumberField
                  value={shadow.y}
                  onChange={(v) => patch({ shadow: { ...shadow, y: v } })}
                  step={1}
                  suffix="px"
                />
              </PropertyRow>
              <PropertyRow label="Blur">
                <NumberField
                  value={shadow.blur}
                  onChange={(v) => patch({ shadow: { ...shadow, blur: Math.max(0, v) } })}
                  step={1}
                  min={0}
                  suffix="px"
                />
              </PropertyRow>
              <ColorRow
                label="Color"
                value={shadow.color.slice(0, 7)}
                onChange={(c) => patch({ shadow: { ...shadow, color: c } })}
              />
            </>
          )}

          <div className="flex items-center gap-2 pt-3 text-[11px] uppercase tracking-[0.1em] text-muted-foreground/80">
            <CircleDashed size={11} />
            <span>Blur</span>
          </div>
          <PropertyRow label="Radius">
            <NumberField
              value={blur}
              onChange={(v) => patch({ blur: Math.max(0, v) })}
              step={1}
              min={0}
              suffix="px"
            />
          </PropertyRow>
          <Slider
            min={0}
            max={40}
            step={1}
            value={[blur]}
            onValueChange={([v]) => patch({ blur: v })}
            className="mt-2"
            onPointerDown={() => {
              // Initialize blur if it wasn't set so the slider value sticks
              if (selected.blur === undefined) patch({ blur: BLUR_DEFAULT });
            }}
          />
        </>
      )}
    </Section>
  );
}
