// TODO: Step 10 — make collapsible with smooth transition
import { GridSection } from './GridSection';
import { StyleSection } from './StyleSection';
import { ExportSection } from './ExportSection';

export function Sidebar() {
  return (
    <aside
      className="w-64 h-full flex flex-col gap-5 p-4 shrink-0 overflow-y-auto border-l"
      style={{
        background: 'var(--sidebar-bg)',
        borderColor: 'var(--panel-border)',
      }}
    >
      <GridSection />
      <div className="border-t" style={{ borderColor: 'var(--panel-border)' }} />
      <StyleSection />
      <div className="border-t" style={{ borderColor: 'var(--panel-border)' }} />
      <ExportSection />
    </aside>
  );
}
