import { GridSection } from './GridSection';
import { StyleSection } from './StyleSection';
import { PrimitiveSection } from './PrimitiveSection';
import { TransformSection } from './TransformSection';
import { AlignSection } from './AlignSection';
import { TextSection } from './TextSection';
import { ExportSection } from './ExportSection';

type Props = {
  isOpen: boolean;
};

export function Sidebar({ isOpen }: Props) {
  return (
    <aside
      className="h-full shrink-0 border-l overflow-hidden transition-all duration-200 ease-in-out flex flex-col"
      style={{
        width: isOpen ? '19rem' : '0',
        borderColor: isOpen ? 'var(--panel-border)' : 'transparent',
        background: 'var(--sidebar-bg)',
      }}
    >
      {/* Fixed-width inner keeps content from compressing during the slide */}
      <div className="w-[19rem] h-full flex flex-col">
        {/* Panel header strip — editor-style title bar */}
        <div
          className="h-11 px-4 flex items-center justify-between border-b shrink-0 select-none"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Properties
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/60">
            ⌘P
          </span>
        </div>

        {/* Sections — divided by hairline borders, no gap so headers feel docked */}
        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--panel-border)' }}>
          <div style={{ borderColor: 'var(--panel-border)' }}>
            <GridSection />
          </div>
          <div className="border-t" style={{ borderColor: 'var(--panel-border)' }}>
            <StyleSection />
          </div>
          <div className="border-t" style={{ borderColor: 'var(--panel-border)' }}>
            <PrimitiveSection />
          </div>
          <div className="border-t" style={{ borderColor: 'var(--panel-border)' }}>
            <TransformSection />
          </div>
          <div className="border-t" style={{ borderColor: 'var(--panel-border)' }}>
            <AlignSection />
          </div>
          <div className="border-t" style={{ borderColor: 'var(--panel-border)' }}>
            <TextSection />
          </div>
          <div className="border-t" style={{ borderColor: 'var(--panel-border)' }}>
            <ExportSection />
          </div>
        </div>
      </div>
    </aside>
  );
}
