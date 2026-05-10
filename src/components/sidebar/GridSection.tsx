import { Slider } from '../ui/slider';
import { useAppStore } from '../../store/useAppStore';
import { GRID_SIZE_MIN, GRID_SIZE_MAX } from '../../config/constants';
import type { GridMode } from '../../types';

const MODES: { value: GridMode; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'isometric', label: 'Isometric' },
];

export function GridSection() {
  const gridSize = useAppStore((s) => s.gridSize);
  const gridMode = useAppStore((s) => s.gridMode);
  const setGridSize = useAppStore((s) => s.setGridSize);
  const setGridMode = useAppStore((s) => s.setGridMode);

  return (
    <section className="flex flex-col gap-3">
      <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
        Grid
      </p>

      {/* Square / Isometric toggle */}
      <div className="flex rounded-md overflow-hidden border border-[var(--panel-border)]">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setGridMode(mode.value)}
            className={[
              'flex-1 py-1.5 text-xs font-medium transition-colors',
              gridMode === mode.value
                ? 'bg-white/10 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
            ].join(' ')}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Grid size slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-400">Size</span>
          <span className="text-xs font-mono text-zinc-300">{gridSize}px</span>
        </div>
        <Slider
          min={GRID_SIZE_MIN}
          max={GRID_SIZE_MAX}
          step={2}
          value={[gridSize]}
          onValueChange={([val]) => setGridSize(val)}
        />
      </div>
    </section>
  );
}
