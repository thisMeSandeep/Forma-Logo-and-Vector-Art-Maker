import { useAppStore } from '../../store/useAppStore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Slider } from '../ui/slider';
import { STROKE_WIDTH_MIN, STROKE_WIDTH_MAX } from '../../config/constants';

type ColorRowProps = {
  label: string;
  value: string;
  onChange: (color: string) => void;
};

function ColorRow({ label, value, onChange }: ColorRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-400">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          {/* Swatch button — click to open color picker */}
          <button
            className="w-6 h-6 rounded border border-white/15 hover:border-white/30 transition-colors"
            style={{ background: value }}
            aria-label={`Pick ${label.toLowerCase()}`}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-32 h-32 cursor-pointer rounded border-0 bg-transparent"
          />
        </PopoverContent>
      </Popover>
    </div>
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
    <section className="flex flex-col gap-3">
      <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
        Style
      </p>

      <ColorRow label="Fill" value={fillColor} onChange={setFillColor} />
      <ColorRow label="Stroke" value={strokeColor} onChange={setStrokeColor} />

      {/* Stroke width slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-400">Stroke width</span>
          <span className="text-xs font-mono text-zinc-300">{strokeWidth}px</span>
        </div>
        <Slider
          min={STROKE_WIDTH_MIN}
          max={STROKE_WIDTH_MAX}
          step={0.5}
          value={[strokeWidth]}
          onValueChange={([val]) => setStrokeWidth(val)}
        />
      </div>
    </section>
  );
}
