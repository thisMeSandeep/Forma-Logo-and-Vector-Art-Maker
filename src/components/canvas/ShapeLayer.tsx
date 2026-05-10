import { useAppStore } from '../../store/useAppStore';

export function ShapeLayer() {
  const shapes = useAppStore((s) => s.shapes);

  return (
    <g id="shape-layer">
      {shapes.map((shape) => (
        <polygon
          key={shape.id}
          points={shape.points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
      ))}
    </g>
  );
}
