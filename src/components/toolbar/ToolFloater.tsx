import { Pencil, Scissors, Type } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Tool } from '../../types';

type ToolEntry = { value: Tool; Icon: LucideIcon; label: string };

const TOOLS: ToolEntry[] = [
  { value: 'draw',   Icon: Pencil,   label: 'Draw' },
  { value: 'cutout', Icon: Scissors, label: 'Cutout' },
  { value: 'text',   Icon: Type,     label: 'Text' },
];

export function ToolFloater() {
  const activeTool    = useAppStore((s) => s.activeTool);
  const setActiveTool = useAppStore((s) => s.setActiveTool);

  return (
    <div
      className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 rounded-lg p-1 border shadow-md"
      style={{
        background: 'var(--sidebar-bg)',
        borderColor: 'var(--panel-border)',
      }}
    >
      {TOOLS.map(({ value, Icon, label }) => (
        <button
          key={value}
          onClick={() => setActiveTool(value)}
          title={label}
          className={[
            'w-8 h-8 flex items-center justify-center rounded-md transition-colors',
            activeTool === value
              ? 'bg-foreground/10 text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5',
          ].join(' ')}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
