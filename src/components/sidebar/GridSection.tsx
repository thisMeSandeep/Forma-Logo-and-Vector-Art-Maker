import { Grid3x3, Grip, Hexagon, LayoutGrid } from 'lucide-react';
import { Slider } from '../ui/slider';
import { useAppStore } from '../../store/useAppStore';
import { GRID_SIZE_MIN, GRID_SIZE_MAX } from '../../config/constants';
import { Section, PropertyRow } from './Section';
import { NumberField } from './NumberField';
import type { GridMode } from '../../types';

const MODES: { value: GridMode; label: string; icon: typeof Grid3x3 }[] = [
  { value: 'square',    label: 'Square', icon: Grid3x3 },
  { value: 'isometric', label: 'Iso',    icon: Hexagon },
  { value: 'dots',      label: 'Dots',   icon: Grip },
];

export function GridSection() {
  const gridSize = useAppStore((s) => s.gridSize);
  const gridMode = useAppStore((s) => s.gridMode);
  const setGridSize = useAppStore((s) => s.setGridSize);
  const setGridMode = useAppStore((s) => s.setGridMode);

  return (
    <Section title="Grid" icon={<LayoutGrid size={11} />}>
      <PropertyRow label="Type">
        <div
          className="flex p-0.5 rounded-md border bg-foreground/[0.03]"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          {MODES.map((m) => {
            const Icon = m.icon;
            const isActive = gridMode === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setGridMode(m.value)}
                title={m.label}
                className={[
                  'h-6 px-2.5 flex items-center gap-1 rounded text-[10px] font-medium transition-all',
                  isActive
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/5'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                <Icon size={11} />
                {m.label}
              </button>
            );
          })}
        </div>
      </PropertyRow>

      <PropertyRow label="Size">
        <NumberField
          value={gridSize}
          onChange={setGridSize}
          min={GRID_SIZE_MIN}
          max={GRID_SIZE_MAX}
          suffix="px"
        />
      </PropertyRow>

      <Slider
        min={GRID_SIZE_MIN}
        max={GRID_SIZE_MAX}
        step={2}
        value={[gridSize]}
        onValueChange={([val]) => setGridSize(val)}
        className="mt-2"
      />
    </Section>
  );
}
