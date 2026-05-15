import { GridSection } from './GridSection';
import { CanvasSection } from './CanvasSection';
import { StyleSection } from './StyleSection';
import { PrimitiveSection } from './PrimitiveSection';
import { TransformSection } from './TransformSection';
import { AlignSection } from './AlignSection';
import { TextSection } from './TextSection';
import { ImageSection } from './ImageSection';
import { ExportSection } from './ExportSection';
import { useIsMobile } from '../../hooks/use-mobile';

type Props = {
  isOpen: boolean;
  onClose?: () => void;
};

export function Sidebar({ isOpen, onClose }: Props) {
  const isMobile = useIsMobile();

  // On mobile, the sidebar overlays the canvas instead of pushing it. A backdrop
  // dims the canvas and tapping it closes the panel. On desktop, the original
  // collapse-to-zero behavior is preserved.
  if (isMobile) {
    return (
      <>
        {isOpen && (
          <button
            type="button"
            aria-label="Close panel"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30"
          />
        )}
        <aside
          className="fixed top-11 bottom-0 right-0 z-50 w-[min(21rem,90vw)] border-l flex flex-col transition-transform duration-200 ease-in-out"
          style={{
            transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
            borderColor: 'var(--panel-border)',
            background: 'var(--sidebar-bg)',
          }}
        >
          <SidebarBody />
        </aside>
      </>
    );
  }

  return (
    <aside
      className="h-full shrink-0 border-l overflow-hidden transition-all duration-200 ease-in-out flex flex-col"
      style={{
        width: isOpen ? '21rem' : '0',
        borderColor: isOpen ? 'var(--panel-border)' : 'transparent',
        background: 'var(--sidebar-bg)',
      }}
    >
      {/* Fixed-width inner keeps content from compressing during the slide */}
      <div className="w-[21rem] h-full flex flex-col">
        <SidebarBody />
      </div>
    </aside>
  );
}

function SidebarBody() {
  return (
    <>
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
          <CanvasSection />
        </div>
        <div className="border-t" style={{ borderColor: 'var(--panel-border)' }}>
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
          <ImageSection />
        </div>
        <div className="border-t" style={{ borderColor: 'var(--panel-border)' }}>
          <ExportSection />
        </div>
      </div>
    </>
  );
}
