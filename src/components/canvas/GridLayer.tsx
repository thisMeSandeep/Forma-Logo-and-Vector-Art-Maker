import { useAppStore } from '../../store/useAppStore';

export function GridLayer() {
  const gridSize = useAppStore((s) => s.gridSize);
  const showGrid = useAppStore((s) => s.showGrid);

  if (!showGrid) return null;

  // SVG pattern tiles a single cell across the full canvas — no line-count math needed
  return (
    <g id="grid-layer">
      <defs>
        <pattern
          id="grid-pattern"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          {/* Top and left edges of each cell form the full grid when tiled */}
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke="var(--grid-line-stroke)"
            strokeWidth="var(--grid-line-width)"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </g>
  );
}
