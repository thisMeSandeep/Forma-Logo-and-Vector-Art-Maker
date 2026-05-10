import type { Point } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { CUTOUT_FILL_OPACITY } from '../../config/constants';

// Converts one ring to an SVG path segment ("M x,y L x,y ... Z")
function ringToD(ring: Point[]): string {
  if (ring.length < 2) return '';
  return `M${ring[0].x},${ring[0].y} ` +
    ring.slice(1).map((p) => `L${p.x},${p.y}`).join(' ') + ' Z';
}

export function ShapeLayer() {
  const shapes     = useAppStore((s) => s.shapes);
  const activeTool = useAppStore((s) => s.activeTool);

  // Soften fills while cutting so grid intersections inside shapes are visible
  const fillOpacity = activeTool === 'cutout' ? CUTOUT_FILL_OPACITY : 1;

  return (
    <g id="shape-layer">
      {shapes.map((shape) => (
        // fillRule="evenodd" makes inner rings render as transparent holes
        <path
          key={shape.id}
          d={shape.points.map(ringToD).join(' ')}
          fillRule="evenodd"
          fill={shape.fill}
          fillOpacity={fillOpacity}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
      ))}
    </g>
  );
}
