import { useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUpToLine,
  Image as ImageIcon,
  Italic,
  Minus,
  Sparkles,
  Spline,
  Strikethrough,
  Type,
  Underline,
  Upload,
} from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { useAppStore } from '../../store/useAppStore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Slider } from '../ui/slider';
import { Section, PropertyRow } from './Section';
import { NumberField } from './NumberField';
import {
  GRADIENT_DEFAULT,
  RADIAL_GRADIENT_DEFAULT,
  TEXT_EFFECT_BLUR_DEFAULT,
  TEXT_EFFECT_EXTRUDE_DEFAULT,
  TEXT_EFFECT_GLOW_DEFAULT,
  TEXT_EFFECT_LONG_SHADOW_DEFAULT,
  TEXT_EFFECT_SHADOW_DEFAULT,
  TEXT_FONT_OPTIONS,
  TEXT_FONT_SIZE_MAX,
  TEXT_FONT_SIZE_MIN,
  TEXT_FONT_WEIGHT_OPTIONS,
  TEXT_LETTER_SPACING_MAX,
  TEXT_LETTER_SPACING_MIN,
  TEXT_LINE_HEIGHT_MAX,
  TEXT_LINE_HEIGHT_MIN,
  TEXT_STROKE_WIDTH_MAX,
  TEXT_STROKE_WIDTH_MIN,
} from '../../config/constants';
import type {
  StrokeStyle,
  TextAnchor,
  TextBaseline,
  TextDecoration,
  TextEffect,
  TextEffectKind,
  TextFillKind,
  TextItem,
} from '../../types';

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
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

const ANCHORS: { label: string; value: TextAnchor; icon: typeof AlignLeft }[] = [
  { label: 'Left', value: 'start', icon: AlignLeft },
  { label: 'Center', value: 'middle', icon: AlignCenter },
  { label: 'Right', value: 'end', icon: AlignRight },
];

const BASELINES: { label: string; value: TextBaseline; icon: typeof ArrowUpToLine }[] = [
  { label: 'Top',      value: 'hanging',     icon: ArrowUpToLine },
  { label: 'Middle',   value: 'middle',      icon: AlignCenter },
  { label: 'Baseline', value: 'alphabetic',  icon: Minus },
  { label: 'Bottom',   value: 'ideographic', icon: ArrowDownToLine },
];

function ToggleButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-7 w-8 flex items-center justify-center transition-colors hover:bg-foreground/[0.06]"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--accent-foreground)' : undefined,
      }}
    >
      {children}
    </button>
  );
}

// Reads an image file as a base64 data URL so it travels with exported SVGs.
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function FillSection({
  text,
  patch,
  fallbackFill,
  setFallbackFill,
}: {
  text: TextItem;
  patch: (p: Partial<TextItem>) => void;
  fallbackFill: string;
  setFallbackFill: (c: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kind: TextFillKind = text.fillKind ?? 'solid';
  const linear = text.fillGradient ?? GRADIENT_DEFAULT;
  const radial = text.fillRadial   ?? RADIAL_GRADIENT_DEFAULT;

  function changeKind(next: TextFillKind) {
    if (next === kind) return;
    if (next === 'linear') {
      patch({ fillKind: 'linear', fillGradient: text.fillGradient ?? GRADIENT_DEFAULT });
    } else if (next === 'radial') {
      patch({ fillKind: 'radial', fillRadial: text.fillRadial ?? RADIAL_GRADIENT_DEFAULT });
    } else if (next === 'image') {
      patch({ fillKind: 'image' });
      // Auto-open the picker if no image yet.
      if (!text.fillImage) requestAnimationFrame(() => fileInputRef.current?.click());
    } else {
      patch({ fillKind: 'solid' });
    }
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    patch({ fillImage: { dataUrl } });
  }

  return (
    <>
      <PropertyRow label="Fill">
        <div className="w-44">
          <Segmented<TextFillKind>
            value={kind}
            options={[
              { value: 'none',   label: 'None' },
              { value: 'solid',  label: 'Solid' },
              { value: 'linear', label: 'Linear' },
              { value: 'radial', label: 'Radial' },
              { value: 'image',  label: 'Image' },
            ]}
            onChange={changeKind}
          />
        </div>
      </PropertyRow>

      {kind === 'solid' && (
        <ColorRow
          label="Color"
          value={fallbackFill}
          onChange={(c) => {
            setFallbackFill(c);
            patch({ fill: c });
          }}
        />
      )}

      {kind === 'linear' && (
        <>
          <ColorRow
            label="From"
            value={linear.from}
            onChange={(c) => patch({ fillGradient: { ...linear, from: c } })}
          />
          <ColorRow
            label="To"
            value={linear.to}
            onChange={(c) => patch({ fillGradient: { ...linear, to: c } })}
          />
          <PropertyRow label="Angle">
            <NumberField
              value={linear.angle}
              onChange={(v) => patch({ fillGradient: { ...linear, angle: v } })}
              step={1}
              suffix="°"
            />
          </PropertyRow>
          <Slider
            min={0}
            max={360}
            step={1}
            value={[linear.angle]}
            onValueChange={([v]) => patch({ fillGradient: { ...linear, angle: v } })}
          />
        </>
      )}

      {kind === 'radial' && (
        <>
          <ColorRow
            label="Center"
            value={radial.from}
            onChange={(c) => patch({ fillRadial: { ...radial, from: c } })}
          />
          <ColorRow
            label="Edge"
            value={radial.to}
            onChange={(c) => patch({ fillRadial: { ...radial, to: c } })}
          />
        </>
      )}

      {kind === 'image' && (
        <PropertyRow label="Image">
          <div className="flex items-center gap-1.5">
            {text.fillImage && (
              <div
                className="w-7 h-7 rounded border bg-center bg-cover"
                style={{
                  borderColor: 'var(--panel-border)',
                  backgroundImage: `url(${text.fillImage.dataUrl})`,
                }}
                title="Current image"
              />
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-7 px-2 flex items-center gap-1 rounded border bg-foreground/[0.03] text-[11px] hover:bg-foreground/[0.06]"
              style={{ borderColor: 'var(--panel-border)' }}
              title={text.fillImage ? 'Replace image' : 'Choose image'}
            >
              <Upload size={11} />
              {text.fillImage ? 'Replace' : 'Choose'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPickImage}
            />
          </div>
        </PropertyRow>
      )}
    </>
  );
}

// Default params per effect kind. Keeping these in one place means picking a
// kind from the dropdown always lands on a usable preset.
const EFFECT_DEFAULTS: Record<Exclude<TextEffectKind, 'none'>, TextEffect> = {
  shadow:        { ...TEXT_EFFECT_SHADOW_DEFAULT },
  blur:          { ...TEXT_EFFECT_BLUR_DEFAULT },
  glow:          { ...TEXT_EFFECT_GLOW_DEFAULT },
  'long-shadow': { ...TEXT_EFFECT_LONG_SHADOW_DEFAULT },
  extrude:       { ...TEXT_EFFECT_EXTRUDE_DEFAULT },
};

function EffectSection({
  text,
  patch,
}: {
  text: TextItem;
  patch: (p: Partial<TextItem>) => void;
}) {
  const effect: TextEffect = text.effect ?? { kind: 'none' };
  const kind = effect.kind;

  function changeKind(next: TextEffectKind) {
    if (next === kind) return;
    if (next === 'none') patch({ effect: { kind: 'none' } });
    else patch({ effect: EFFECT_DEFAULTS[next] });
  }

  // Narrowed mutators — TypeScript can't follow the `kind` field through patch().
  function patchEffect(next: TextEffect) {
    patch({ effect: next });
  }

  return (
    <>
      <div className="flex items-center gap-2 pt-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground/80">
        <Sparkles size={11} />
        <span>Effect</span>
      </div>

      <PropertyRow label="Kind">
        <select
          value={kind}
          onChange={(e) => changeKind(e.target.value as TextEffectKind)}
          className="h-7 w-32 rounded border bg-foreground/[0.03] px-2 text-xs outline-none"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          <option value="none">None</option>
          <option value="shadow">Drop shadow</option>
          <option value="blur">Blur</option>
          <option value="glow">Glow</option>
          <option value="long-shadow">Long shadow</option>
          <option value="extrude">3D extrude</option>
        </select>
      </PropertyRow>

      {effect.kind === 'shadow' && (
        <>
          <PropertyRow label="X">
            <NumberField
              value={effect.x}
              onChange={(v) => patchEffect({ ...effect, x: v })}
              step={1}
              suffix="px"
            />
          </PropertyRow>
          <PropertyRow label="Y">
            <NumberField
              value={effect.y}
              onChange={(v) => patchEffect({ ...effect, y: v })}
              step={1}
              suffix="px"
            />
          </PropertyRow>
          <PropertyRow label="Blur">
            <NumberField
              value={effect.blur}
              onChange={(v) => patchEffect({ ...effect, blur: Math.max(0, v) })}
              step={1}
              min={0}
              suffix="px"
            />
          </PropertyRow>
          <ColorRow
            label="Color"
            value={effect.color.slice(0, 7)}
            onChange={(c) => patchEffect({ ...effect, color: c })}
          />
        </>
      )}

      {effect.kind === 'blur' && (
        <>
          <PropertyRow label="Radius">
            <NumberField
              value={effect.radius}
              onChange={(v) => patchEffect({ ...effect, radius: Math.max(0, v) })}
              step={0.5}
              min={0}
              suffix="px"
            />
          </PropertyRow>
          <Slider
            min={0}
            max={20}
            step={0.5}
            value={[effect.radius]}
            onValueChange={([v]) => patchEffect({ ...effect, radius: v })}
          />
        </>
      )}

      {effect.kind === 'glow' && (
        <>
          <ColorRow
            label="Color"
            value={effect.color}
            onChange={(c) => patchEffect({ ...effect, color: c })}
          />
          <PropertyRow label="Radius">
            <NumberField
              value={effect.radius}
              onChange={(v) => patchEffect({ ...effect, radius: Math.max(0, v) })}
              step={0.5}
              min={0}
              suffix="px"
            />
          </PropertyRow>
          <Slider
            min={0}
            max={30}
            step={0.5}
            value={[effect.radius]}
            onValueChange={([v]) => patchEffect({ ...effect, radius: v })}
          />
        </>
      )}

      {effect.kind === 'long-shadow' && (
        <>
          <PropertyRow label="Length">
            <NumberField
              value={effect.length}
              onChange={(v) => patchEffect({ ...effect, length: Math.max(1, v) })}
              step={1}
              min={1}
              max={40}
              suffix="px"
            />
          </PropertyRow>
          <Slider
            min={1}
            max={40}
            step={1}
            value={[effect.length]}
            onValueChange={([v]) => patchEffect({ ...effect, length: v })}
          />
          <PropertyRow label="Angle">
            <NumberField
              value={effect.angle}
              onChange={(v) => patchEffect({ ...effect, angle: v })}
              step={1}
              suffix="°"
            />
          </PropertyRow>
          <Slider
            min={0}
            max={360}
            step={1}
            value={[effect.angle]}
            onValueChange={([v]) => patchEffect({ ...effect, angle: v })}
          />
          <ColorRow
            label="Color"
            value={effect.color.slice(0, 7)}
            onChange={(c) => patchEffect({ ...effect, color: c })}
          />
        </>
      )}

      {effect.kind === 'extrude' && (
        <>
          <PropertyRow label="Depth">
            <NumberField
              value={effect.depth}
              onChange={(v) => patchEffect({ ...effect, depth: Math.max(1, v) })}
              step={1}
              min={1}
              max={30}
              suffix="px"
            />
          </PropertyRow>
          <Slider
            min={1}
            max={30}
            step={1}
            value={[effect.depth]}
            onValueChange={([v]) => patchEffect({ ...effect, depth: v })}
          />
          <PropertyRow label="Angle">
            <NumberField
              value={effect.angle}
              onChange={(v) => patchEffect({ ...effect, angle: v })}
              step={1}
              suffix="°"
            />
          </PropertyRow>
          <Slider
            min={0}
            max={360}
            step={1}
            value={[effect.angle]}
            onValueChange={([v]) => patchEffect({ ...effect, angle: v })}
          />
          <ColorRow
            label="Color"
            value={effect.color.slice(0, 7)}
            onChange={(c) => patchEffect({ ...effect, color: c })}
          />
        </>
      )}
    </>
  );
}

export function TextSection() {
  const selectedTextId = useAppStore((s) => s.selectedTextId);
  const selectedText   = useAppStore((s) =>
    s.selectedTextId ? s.texts.find((t) => t.id === s.selectedTextId) ?? null : null,
  );
  const updateText = useAppStore((s) => s.updateText);
  const fontFamily = useAppStore((s) => s.textFontFamily);
  const fontSize = useAppStore((s) => s.textFontSize);
  const fontWeight = useAppStore((s) => s.textFontWeight);
  const fill = useAppStore((s) => s.textFill);
  const anchor = useAppStore((s) => s.textAnchor);
  const italic = useAppStore((s) => s.textItalic);
  const decoration = useAppStore((s) => s.textDecoration);
  const letterSpacing = useAppStore((s) => s.textLetterSpacing);
  const lineHeight = useAppStore((s) => s.textLineHeight);
  const baseline = useAppStore((s) => s.textBaseline);
  const opacity = useAppStore((s) => s.textOpacity);
  const stroke = useAppStore((s) => s.textStroke);
  const strokeWidth = useAppStore((s) => s.textStrokeWidth);
  const strokeStyle = useAppStore((s) => s.textStrokeStyle);
  const setFontFamily = useAppStore((s) => s.setTextFontFamily);
  const setFontSize = useAppStore((s) => s.setTextFontSize);
  const setFontWeight = useAppStore((s) => s.setTextFontWeight);
  const setFill = useAppStore((s) => s.setTextFill);
  const setAnchor = useAppStore((s) => s.setTextAnchor);
  const setItalic = useAppStore((s) => s.setTextItalic);
  const setDecoration = useAppStore((s) => s.setTextDecoration);
  const setLetterSpacing = useAppStore((s) => s.setTextLetterSpacing);
  const setLineHeight = useAppStore((s) => s.setTextLineHeight);
  const setBaseline = useAppStore((s) => s.setTextBaseline);
  const setOpacity = useAppStore((s) => s.setTextOpacity);
  const setStroke = useAppStore((s) => s.setTextStroke);
  const setStrokeWidth = useAppStore((s) => s.setTextStrokeWidth);
  const setStrokeStyle = useAppStore((s) => s.setTextStrokeStyle);

  if (!selectedTextId || !selectedText) return null;

  function toggleDecoration(next: TextDecoration) {
    setDecoration(decoration === next ? 'none' : next);
  }

  function patchText(p: Partial<TextItem>) {
    if (selectedTextId) updateText(selectedTextId, p);
  }

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

      <PropertyRow label="Weight">
        <select
          value={fontWeight}
          onChange={(e) => setFontWeight(Number(e.target.value) as typeof fontWeight)}
          className="h-7 w-32 rounded border bg-foreground/[0.03] px-2 text-xs outline-none"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          {TEXT_FONT_WEIGHT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value} — {opt.label}
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
      />

      <PropertyRow label="Style">
        <div
          className="grid grid-cols-3 overflow-hidden rounded border"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          <ToggleButton active={italic} onClick={() => setItalic(!italic)} title="Italic">
            <Italic size={13} />
          </ToggleButton>
          <ToggleButton
            active={decoration === 'underline'}
            onClick={() => toggleDecoration('underline')}
            title="Underline"
          >
            <Underline size={13} />
          </ToggleButton>
          <ToggleButton
            active={decoration === 'line-through'}
            onClick={() => toggleDecoration('line-through')}
            title="Strikethrough"
          >
            <Strikethrough size={13} />
          </ToggleButton>
        </div>
      </PropertyRow>

      <div className="flex items-center gap-2 pt-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground/80">
        <ImageIcon size={11} />
        <span>Fill</span>
      </div>

      <FillSection
        text={selectedText}
        patch={patchText}
        fallbackFill={fill}
        setFallbackFill={setFill}
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
      />

      <div className="flex items-center gap-2 pt-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground/80">
        <Spline size={11} />
        <span>Stroke</span>
      </div>

      <ColorRow label="Color" value={stroke} onChange={setStroke} />

      <PropertyRow label="Width">
        <NumberField
          value={strokeWidth}
          onChange={setStrokeWidth}
          min={TEXT_STROKE_WIDTH_MIN}
          max={TEXT_STROKE_WIDTH_MAX}
          step={0.5}
          suffix="px"
        />
      </PropertyRow>
      <Slider
        min={TEXT_STROKE_WIDTH_MIN}
        max={TEXT_STROKE_WIDTH_MAX}
        step={0.5}
        value={[strokeWidth]}
        onValueChange={([v]) => setStrokeWidth(v)}
      />

      {strokeWidth > 0 && (
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
      )}

      <EffectSection text={selectedText} patch={patchText} />

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

      <PropertyRow label="Baseline">
        <div
          className="grid grid-cols-4 overflow-hidden rounded border"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          {BASELINES.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setBaseline(value)}
              className="h-7 w-8 flex items-center justify-center transition-colors hover:bg-foreground/[0.06]"
              style={{
                background: baseline === value ? 'var(--accent)' : 'transparent',
                color: baseline === value ? 'var(--accent-foreground)' : undefined,
              }}
              title={label}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>
      </PropertyRow>

      <PropertyRow label="Tracking">
        <NumberField
          value={letterSpacing}
          onChange={setLetterSpacing}
          min={TEXT_LETTER_SPACING_MIN}
          max={TEXT_LETTER_SPACING_MAX}
          step={0.5}
          suffix="px"
        />
      </PropertyRow>

      <PropertyRow label="Line height">
        <NumberField
          value={lineHeight}
          onChange={setLineHeight}
          min={TEXT_LINE_HEIGHT_MIN}
          max={TEXT_LINE_HEIGHT_MAX}
          step={0.05}
        />
      </PropertyRow>
    </Section>
  );
}
