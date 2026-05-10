// TODO: Steps 3–8 — add mouse handlers via useCanvasEvents
import { useRef } from 'react';
import { CANVAS_BG_COLOR } from '../../config/constants';
import { GridLayer } from './GridLayer';
import { ShapeLayer } from './ShapeLayer';
import { PreviewLayer } from './PreviewLayer';

export function DrawingCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: CANVAS_BG_COLOR }}
    >
      <GridLayer />
      <ShapeLayer />
      <PreviewLayer />
    </svg>
  );
}
