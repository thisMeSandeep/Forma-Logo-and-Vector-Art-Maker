import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { FONT_LIST, ensureFontLoaded, findFontByFamily, type FontDef } from '../../lib/fonts';

type Props = {
  value: string;
  onChange: (family: string) => void;
};

// Lazy-loads a Google font when it first becomes visible in the list so the
// dropdown previews render in their own typeface. Driven by IntersectionObserver
// so opening the picker doesn't kick off 35+ stylesheet requests at once.
function useLazyLoad(ref: React.RefObject<HTMLElement | null>, font: FontDef) {
  useEffect(() => {
    if (!ref.current || font.source !== 'google') return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            ensureFontLoaded(font.family);
            obs.disconnect();
            break;
          }
        }
      },
      { root: null, rootMargin: '50px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, font]);
}

function FontRow({
  font,
  selected,
  onSelect,
}: {
  font: FontDef;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLazyLoad(ref, font);

  return (
    <CommandItem
      value={font.label}
      onSelect={onSelect}
      className="flex items-center justify-between gap-2 cursor-pointer"
    >
      <div
        ref={ref}
        className="flex-1 min-w-0 truncate text-sm"
        style={{ fontFamily: font.family }}
        title={font.label}
      >
        {font.label}
      </div>
      {selected && <Check size={12} className="opacity-60 shrink-0" />}
    </CommandItem>
  );
}

export function FontPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = findFontByFamily(value);
  const label = current?.label ?? value;

  // Preload the selected font so the trigger button renders in its own face.
  useEffect(() => {
    ensureFontLoaded(value);
  }, [value]);

  const grouped = useMemo(() => {
    const system = FONT_LIST.filter((f) => f.source === 'system');
    const google = FONT_LIST.filter((f) => f.source === 'google');
    return { system, google };
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="h-7 w-32 px-2 rounded border bg-foreground/[0.03] text-xs outline-none flex items-center justify-between gap-1 hover:bg-foreground/[0.06] transition-colors"
          style={{ borderColor: 'var(--panel-border)', fontFamily: value }}
          aria-label="Pick font"
        >
          <span className="truncate text-left">{label}</span>
          <ChevronDown size={12} className="opacity-50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <Command>
          <CommandInput placeholder="Search fonts..." />
          <CommandList className="max-h-72">
            <CommandEmpty>No fonts match.</CommandEmpty>
            <CommandGroup heading="System">
              {grouped.system.map((f) => (
                <FontRow
                  key={f.family}
                  font={f}
                  selected={f.family === value}
                  onSelect={() => {
                    onChange(f.family);
                    setOpen(false);
                  }}
                />
              ))}
            </CommandGroup>
            <CommandGroup heading="Google Fonts">
              {grouped.google.map((f) => (
                <FontRow
                  key={f.family}
                  font={f}
                  selected={f.family === value}
                  onSelect={() => {
                    ensureFontLoaded(f.family);
                    onChange(f.family);
                    setOpen(false);
                  }}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
