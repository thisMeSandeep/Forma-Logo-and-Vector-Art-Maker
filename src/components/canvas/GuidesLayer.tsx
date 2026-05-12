import { useAppStore } from '../../store/useAppStore';

const GUIDE_STROKE = '#ec4899';

// Renders the transient smart-alignment guide lines populated by ShapeLayer's
// drag handler. Lines use vector-effect="non-scaling-stroke" so they stay 1px
// regardless of zoom level.
export function GuidesLayer() {
  const guides = useAppStore((s) => s.activeGuides);

  if (guides.length === 0) return null;

  return (
    <g id="guides-layer" style={{ pointerEvents: 'none' }}>
      {guides.map((g, i) =>
        g.axis === 'x' ? (
          <line
            key={i}
            x1={g.pos}
            y1={g.span[0]}
            x2={g.pos}
            y2={g.span[1]}
            stroke={GUIDE_STROKE}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          <line
            key={i}
            x1={g.span[0]}
            y1={g.pos}
            x2={g.span[1]}
            y2={g.pos}
            stroke={GUIDE_STROKE}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ),
      )}
    </g>
  );
}
