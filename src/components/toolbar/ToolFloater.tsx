import {
  Pencil,
  Scissors,
  Type,
  MousePointer2,
  Square,
  Circle,
  Hexagon,
  Star,
  Slash,
  MoveRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import type { Tool } from '../../types';

type ToolEntry = { value: Tool; Icon: LucideIcon; label: string };

const TOOLS: ToolEntry[] = [
  { value: 'select',    Icon: MousePointer2, label: 'Select' },
  { value: 'draw',      Icon: Pencil,        label: 'Draw' },
  { value: 'rectangle', Icon: Square,        label: 'Rectangle' },
  { value: 'ellipse',   Icon: Circle,        label: 'Ellipse' },
  { value: 'line',      Icon: Slash,         label: 'Line' },
  { value: 'arrow',     Icon: MoveRight,     label: 'Arrow' },
  { value: 'polygon',   Icon: Hexagon,       label: 'Polygon' },
  { value: 'star',      Icon: Star,          label: 'Star' },
  { value: 'cutout',    Icon: Scissors,      label: 'Cutout' },
  { value: 'text',      Icon: Type,          label: 'Text' },
];

export function ToolFloater() {
  const activeTool    = useAppStore((s) => s.activeTool);
  const setActiveTool = useAppStore((s) => s.setActiveTool);

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 rounded-lg p-1 border shadow-md"
        style={{
          background: 'var(--sidebar-bg)',
          borderColor: 'var(--panel-border)',
        }}
      >
        {TOOLS.map(({ value, Icon, label }) => (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTool(value)}
                className={[
                  'w-8 h-8 flex items-center justify-center rounded-md transition-colors',
                  activeTool === value
                    ? 'bg-foreground/10 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5',
                ].join(' ')}
              >
                <Icon size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
