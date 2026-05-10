// TODO: Step 10 — make collapsible with smooth transition
import { GridSection } from './GridSection';
import { StyleSection } from './StyleSection';
import { ExportSection } from './ExportSection';

export function Sidebar() {
  return (
    <aside className="w-64 h-full bg-zinc-900 border-l border-white/10 flex flex-col gap-4 p-4 shrink-0 overflow-y-auto">
      <GridSection />
      <StyleSection />
      <ExportSection />
    </aside>
  );
}
