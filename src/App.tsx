import { useState } from 'react';
import { TopBar } from './components/toolbar/TopBar';
import { DrawingCanvas } from './components/canvas/DrawingCanvas';
import { CanvasOverlay } from './components/canvas/CanvasOverlay';
import { CanvasContextMenu } from './components/canvas/CanvasContextMenu';
import { ToolFloater } from './components/toolbar/ToolFloater';
import { HistoryBar } from './components/toolbar/HistoryBar';
import { Sidebar } from './components/sidebar/Sidebar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';


export default function App() {
  useKeyboardShortcuts();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
        <Sidebar isOpen={sidebarOpen} />
      </div>
    </div>
  );
}
