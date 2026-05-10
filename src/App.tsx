import { useState } from 'react';
import { TopBar } from './components/toolbar/TopBar';
import { DrawingCanvas } from './components/canvas/DrawingCanvas';
import { CanvasOverlay } from './components/canvas/CanvasOverlay';
import { ToolFloater } from './components/toolbar/ToolFloater';
import { Sidebar } from './components/sidebar/Sidebar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Layout shell only — no logic here
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
        <div className="relative flex-1 overflow-hidden">
          <DrawingCanvas />
          <ToolFloater />
          <CanvasOverlay />
        </div>
        <Sidebar isOpen={sidebarOpen} />
      </div>
    </div>
  );
}
