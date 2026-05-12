import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

type Props = {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
};

// Editor-style collapsible panel with a header strip and indented body.
export function Section({ title, icon, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="flex flex-col">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex items-center gap-2 px-3 h-10 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors select-none"
      >
        <ChevronDown
          size={12}
          className="transition-transform"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
        {icon && (
          <span className="opacity-70 group-hover:opacity-100 transition-opacity">
            {icon}
          </span>
        )}
        <span>{title}</span>
      </button>

      {open && <div className="flex flex-col gap-4 px-3 pb-5 pt-2">{children}</div>}
    </section>
  );
}

// Single property row: label on the left, control on the right.
// When `stretch` is set, the control area grows to fill remaining width —
// use for segmented controls / sliders that otherwise look cramped.
export function PropertyRow({
  label,
  children,
  stretch,
}: {
  label: string;
  children: ReactNode;
  stretch?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 min-h-8">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <div
        className={
          stretch
            ? 'flex items-center gap-1 flex-1 min-w-0'
            : 'flex items-center gap-1 ml-auto'
        }
      >
        {children}
      </div>
    </div>
  );
}
