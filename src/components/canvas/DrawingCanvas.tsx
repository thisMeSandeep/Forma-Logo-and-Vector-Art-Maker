// TODO: Step 4 — pointerdown polygon building via useCanvasEvents
import { useRef } from 'react';
import { useCanvasEvents } from '../../hooks/useCanvasEvents';
import { GridLayer } from './GridLayer';
import { ShapeLayer } from './ShapeLayer';
import { PreviewLayer } from './PreviewLayer';

export function DrawingCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  useCanvasEvents(svgRef);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: 'var(--canvas-bg)' }}
    >
      <GridLayer />
      <ShapeLayer />
      <PreviewLayer />
    </svg>
  );
}
