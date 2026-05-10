import { useAppStore } from '../../store/useAppStore';
import { CUTOUT_FILL_OPACITY } from '../../config/constants';
import { roundedRingToD } from '../../lib/svgPath';

export function ShapeLayer() {
  const shapes     = useAppStore((s) => s.shapes);
  const activeTool = useAppStore((s) => s.activeTool);

  // Soften fills while cutting so grid intersections inside shapes are visible
  const fillOpacity = activeTool === 'cutout' ? CUTOUT_FILL_OPACITY : 1;

  return (
    <g id="shape-layer">
      {shapes.map((shape) => {
        // Older persisted shapes may not have cornerRadius — default to 0
        const r = shape.cornerRadius ?? 0;
        // fillRule="evenodd" makes inner rings render as transparent holes
        return (
          <path
            key={shape.id}
            d={shape.points.map((ring) => roundedRingToD(ring, r)).join(' ')}
            fillRule="evenodd"
            fill={shape.fill}
            fillOpacity={fillOpacity}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
}
