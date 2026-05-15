import { useEffect, useState } from 'react';
import { TopBar } from './components/toolbar/TopBar';
import { useAppStore } from './store/useAppStore';
import { ensureFontLoaded } from './lib/fonts';
import { clearTextMeasureCache } from './lib/textMeasure';
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

  // When web fonts finish loading, the canvas measureText cache was filled
  // against the system fallback — its widths/ascents are now stale. Clear the
  // cache and bump `texts` so subscribers re-render with the real metrics.
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return;
    const onFontsChange = () => {
      clearTextMeasureCache();
      useAppStore.setState((s) => ({ texts: s.texts.slice() }));
    };
    document.fonts.addEventListener('loadingdone', onFontsChange);
    // Also schedule one refresh after initial fonts.ready in case the load
    // events fired before this effect attached.
    document.fonts.ready.then(onFontsChange).catch(() => {});
    return () => document.fonts.removeEventListener('loadingdone', onFontsChange);
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
