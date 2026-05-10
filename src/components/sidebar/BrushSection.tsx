import { useAppStore } from '../../store/useAppStore';
import type { Tool } from '../../types';

const TOOLS: { value: Tool; label: string; description: string }[] = [
  { value: 'draw',   label: 'Draw',   description: 'Add filled polygons' },
  { value: 'cutout', label: 'Cutout', description: 'Subtract from existing shapes' },
];

export function BrushSection() {
  const activeTool  = useAppStore((s) => s.activeTool);
  const setActiveTool = useAppStore((s) => s.setActiveTool);

  return (
    <section className="flex flex-col gap-3">
      <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
        Tool
      </p>
      <div className="flex rounded-md overflow-hidden border border-[var(--panel-border)]">
        {TOOLS.map((tool) => (
          <button
            key={tool.value}
            onClick={() => setActiveTool(tool.value)}
            title={tool.description}
            className={[
              'flex-1 py-1.5 text-xs font-medium transition-colors',
              activeTool === tool.value
                ? 'bg-white/10 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
            ].join(' ')}
          >
            {tool.label}
          </button>
        ))}
      </div>
    </section>
  );
}
