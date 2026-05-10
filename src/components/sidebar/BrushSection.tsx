import { Pencil, Scissors, Brush } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Section } from './Section';
import type { Tool } from '../../types';

const TOOLS: { value: Tool; label: string; icon: typeof Pencil; description: string }[] = [
  { value: 'draw',   label: 'Draw',   icon: Pencil,   description: 'Add filled polygons' },
  { value: 'cutout', label: 'Cutout', icon: Scissors, description: 'Subtract from existing shapes' },
];

export function BrushSection() {
  const activeTool    = useAppStore((s) => s.activeTool);
  const setActiveTool = useAppStore((s) => s.setActiveTool);

  return (
    <Section title="Tool" icon={<Brush size={11} />}>
      {/* Segmented icon-and-label control */}
      <div
        className="flex p-0.5 rounded-md border bg-foreground/[0.03]"
        style={{ borderColor: 'var(--panel-border)' }}
      >
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.value;
          return (
            <button
              key={tool.value}
              onClick={() => setActiveTool(tool.value)}
              title={tool.description}
              className={[
                'flex-1 h-8 flex items-center justify-center gap-1.5 rounded text-[11px] font-medium transition-all',
                isActive
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/5'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              <Icon size={12} />
              {tool.label}
            </button>
          );
        })}
      </div>
    </Section>
  );
}
