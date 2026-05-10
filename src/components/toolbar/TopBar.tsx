import { PanelRight, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';

type Props = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function TopBar({ sidebarOpen, onToggleSidebar }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <header
      className="h-11 flex items-center px-4 gap-3 shrink-0 border-b backdrop-blur-md"
      style={{
        background: 'var(--topbar-bg)',
        borderColor: 'var(--panel-border)',
      }}
    >
      {/* Brand mark + name */}
      <div className="flex items-center gap-2 select-none">
        <BrandMark />
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold tracking-tight">Forma</span>
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            Studio
          </span>
        </div>
      </div>

      {/* Right cluster: theme + sidebar in a subtle pill */}
      <div
        className="ml-auto flex items-center gap-0.5 p-0.5 rounded-md border"
        style={{ borderColor: 'var(--panel-border)' }}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </Button>

        <div
          className="w-px h-4"
          style={{ background: 'var(--panel-border)' }}
        />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          aria-pressed={sidebarOpen}
        >
          <PanelRight size={14} />
        </Button>
      </div>
    </header>
  );
}

// Small geometric mark — an irregular polygon nodding to the grid-drawing theme
function BrandMark() {
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-md"
      style={{
        background: 'linear-gradient(135deg, var(--brand-from, #4f86f7), var(--brand-to, #8b5cf6))',
        boxShadow: '0 1px 0 0 rgba(255,255,255,0.08) inset, 0 1px 2px rgba(0,0,0,0.18)',
      }}
      aria-hidden
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M7 1.5 L12 4.5 L11 11 L3 11 L2 4.5 Z"
          fill="white"
          fillOpacity="0.95"
        />
      </svg>
    </span>
  );
}
