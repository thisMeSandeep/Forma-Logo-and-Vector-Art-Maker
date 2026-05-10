import { BrushSection } from './BrushSection';
import { GridSection } from './GridSection';
import { StyleSection } from './StyleSection';
import { ExportSection } from './ExportSection';

type Props = {
  isOpen: boolean;
};

export function Sidebar({ isOpen }: Props) {
  return (
    <aside
      className="h-full shrink-0 border-l overflow-hidden transition-all duration-200 ease-in-out"
      style={{
        width: isOpen ? '16rem' : '0',
        borderColor: isOpen ? 'var(--panel-border)' : 'transparent',
        background: 'var(--sidebar-bg)',
      }}
    >
      {/* Fixed-width inner keeps content from compressing during the slide */}
      <div className="w-64 h-full flex flex-col gap-5 p-4 overflow-y-auto">
        <BrushSection />
        <div className="border-t" style={{ borderColor: 'var(--panel-border)' }} />
        <GridSection />
        <div className="border-t" style={{ borderColor: 'var(--panel-border)' }} />
        <StyleSection />
        <div className="border-t" style={{ borderColor: 'var(--panel-border)' }} />
        <ExportSection />
      </div>
    </aside>
  );
}
