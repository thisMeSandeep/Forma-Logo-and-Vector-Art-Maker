import { useEffect, useState } from 'react';
import { TopBar } from './components/toolbar/TopBar';
import { useAppStore } from './store/useAppStore';
import { ensureFontLoaded } from './lib/fonts';
import { DrawingCanvas } from './components/canvas/DrawingCanvas';
import { CanvasOverlay } from './components/canvas/CanvasOverlay';
import { CanvasContextMenu } from './components/canvas/CanvasContextMenu';
import { ToolFloater } from './components/toolbar/ToolFloater';
import { HistoryBar } from './components/toolbar/HistoryBar';
import { Sidebar } from './components/sidebar/Sidebar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useIsMobile } from './hooks/use-mobile';


export default function App() {
  useKeyboardShortcuts();
  // Preload Google fonts referenced by persisted texts + the current text
  // default, so existing content renders correctly on first paint.
  useEffect(() => {
    const state = useAppStore.getState();
    ensureFontLoaded(state.textFontFamily);
    for (const text of state.texts) ensureFontLoaded(text.fontFamily);
  }, []);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Reset sidebarOpen when the viewport crosses the mobile breakpoint.
  // React's documented "reset state on prop change" pattern — a conditional
  // setState during render avoids the effect-driven double-render warning.
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  if (prevIsMobile !== isMobile) {
    setPrevIsMobile(isMobile);
    setSidebarOpen(!isMobile);
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <CanvasContextMenu>
          <div className="relative flex-1 overflow-hidden">
            <DrawingCanvas />
            <ToolFloater />
            <HistoryBar />
            <CanvasOverlay />
          </div>
        </CanvasContextMenu>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
    </div>
  );
}
