import { useRef } from 'react';
import { useCanvasEvents } from '../../hooks/useCanvasEvents';
import { useViewBox } from '../../hooks/useViewBox';
import { useAppStore } from '../../store/useAppStore';
import { GridLayer } from './GridLayer';
import { ShapeLayer } from './ShapeLayer';
import { TextLayer } from './TextLayer';
import { PreviewLayer } from './PreviewLayer';
import { CROSSHAIR_ARM } from '../../config/constants';

export function DrawingCanvas() {
  const svgRef       = useRef<SVGSVGElement>(null);
  const crosshairRef = useRef<SVGGElement>(null);

  const { viewBoxStr, isInitialized, zoomAt, panBy } = useViewBox(svgRef);
  useCanvasEvents(svgRef, crosshairRef, zoomAt, panBy);

  // Hide built-in cursor only when the SVG crosshair is active (draw/cutout)
  const activeTool = useAppStore((s) => s.activeTool);
  const cursor = activeTool === 'draw' || activeTool === 'cutout' ? 'none' : 'default';

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      // Only set viewBox once we know the real SVG size (avoids a 1-frame scale flash)
      viewBox={isInitialized ? viewBoxStr : undefined}
      style={{ background: 'var(--canvas-bg)', cursor }}
    >
      <GridLayer />
      <ShapeLayer />
      <TextLayer />
      <PreviewLayer />
      {/* Crosshair: translate to world point, scale so arms stay pixel-sized at any zoom */}
      <g
        ref={crosshairRef}
        style={{ pointerEvents: 'none', display: 'none' }}
        stroke="var(--cursor-dot-fill)"
        strokeWidth={1.5}
      >
        <line x1={-CROSSHAIR_ARM} y1={0} x2={CROSSHAIR_ARM} y2={0} />
        <line x1={0} y1={-CROSSHAIR_ARM} x2={0} y2={CROSSHAIR_ARM} />
      </g>
    </svg>
  );
}
