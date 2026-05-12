import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Monitor } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Section, PropertyRow } from './Section';

// Same swatch+hex layout as StyleSection's ColorRow. Kept local so changes to
// the canvas picker don't ripple into shape styling — the two pickers have
// different lifecycles (canvas color is global, fill color is per-shape).
function CanvasColorRow({ value, onChange }: { value: string; onChange: (c: string) => void }) {
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
    <PropertyRow label="Background">
      <div
        className="flex items-center h-7 rounded border bg-foreground/[0.03] overflow-hidden"
        style={{ borderColor: 'var(--panel-border)' }}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-7 h-7 border-r hover:opacity-90 transition-opacity"
              style={{ background: value, borderColor: 'var(--panel-border)' }}
              aria-label="Pick canvas background"
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

export function CanvasSection() {
  const canvasBackground    = useAppStore((s) => s.canvasBackground);
  const setCanvasBackground = useAppStore((s) => s.setCanvasBackground);

  return (
    <Section title="Canvas" icon={<Monitor size={11} />}>
      <CanvasColorRow value={canvasBackground} onChange={setCanvasBackground} />
    </Section>
  );
}
