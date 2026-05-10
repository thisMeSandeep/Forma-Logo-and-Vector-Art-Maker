import { TopBar } from './components/toolbar/TopBar';
import { DrawingCanvas } from './components/canvas/DrawingCanvas';
import { CanvasOverlay } from './components/canvas/CanvasOverlay';
import { ToolFloater } from './components/toolbar/ToolFloater';
import { Sidebar } from './components/sidebar/Sidebar';

// Layout shell only — no logic here
export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Canvas fills all remaining space */}
        <div className="relative flex-1 overflow-hidden">
          <DrawingCanvas />
          <ToolFloater />
          <CanvasOverlay />
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
