import { useRef } from 'react';
import { useCanvasEvents } from '../../hooks/useCanvasEvents';
import { useAppStore } from '../../store/useAppStore';
import { GridLayer } from './GridLayer';
import { ShapeLayer } from './ShapeLayer';
import { PreviewLayer } from './PreviewLayer';
import { CROSSHAIR_ARM } from '../../config/constants';

export function DrawingCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  // Crosshair is updated via direct DOM — no React re-render on every pointermove
  const crosshairRef = useRef<SVGGElement>(null);
  useCanvasEvents(svgRef, crosshairRef);

  // hide built-in cursor only when the SVG crosshair is active (draw/cutout)
  const activeTool = useAppStore((s) => s.activeTool);
  const cursor = activeTool === 'select' ? 'default' : 'none';

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: 'var(--canvas-bg)', cursor }}
    >
      <GridLayer />
      <ShapeLayer />
      <PreviewLayer />
      {/* Crosshair starts hidden; useCanvasEvents drives position and visibility */}
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
