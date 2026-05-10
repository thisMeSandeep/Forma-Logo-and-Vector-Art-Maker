import { useAppStore } from '../../store/useAppStore';

export function GridLayer() {
  const gridSize = useAppStore((s) => s.gridSize);
  const showGrid = useAppStore((s) => s.showGrid);
  const gridMode = useAppStore((s) => s.gridMode);

  if (!showGrid) return null;

  return gridMode === 'isometric'
    ? <IsometricGrid gridSize={gridSize} />
    : <SquareGrid gridSize={gridSize} />;
}

// A rect this large ensures the pattern covers any pan/zoom position.
// SVG clips rendering to the viewBox, so there is no performance cost.
const GRID_EXTENT = 100_000;

function SquareGrid({ gridSize }: { gridSize: number }) {
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
      <rect
        x={-GRID_EXTENT} y={-GRID_EXTENT}
        width={GRID_EXTENT * 2} height={GRID_EXTENT * 2}
        fill="url(#grid-pattern)"
      />
    </g>
  );
}

function IsometricGrid({ gridSize }: { gridSize: number }) {
  // Row height for a triangular lattice with cell size g: h = g * √3/2
  // The smallest rectangular tile that covers a full period of all three
  // line families (0°, 60°, 120°) is width=g, height=g*√3 (two rows).
  const h = (gridSize * Math.sqrt(3)) / 2;
  const tileH = h * 2;

  return (
    <g id="grid-layer">
      <defs>
        <pattern
          id="iso-grid-pattern"
          width={gridSize}
          height={tileH}
          patternUnits="userSpaceOnUse"
        >
          {/* Family 1 (0°): two horizontal lines per tile */}
          <line x1={0} y1={0} x2={gridSize} y2={0}
            stroke="var(--grid-line-stroke)" strokeWidth="var(--grid-line-width)" />
          <line x1={0} y1={h} x2={gridSize} y2={h}
            stroke="var(--grid-line-stroke)" strokeWidth="var(--grid-line-width)" />

          {/* Family 2 (60°): diagonal from top-left to bottom-right */}
          <line x1={0} y1={0} x2={gridSize} y2={tileH}
            stroke="var(--grid-line-stroke)" strokeWidth="var(--grid-line-width)" />

          {/* Family 3 (120°): diagonal from top-right to bottom-left */}
          <line x1={gridSize} y1={0} x2={0} y2={tileH}
            stroke="var(--grid-line-stroke)" strokeWidth="var(--grid-line-width)" />
        </pattern>
      </defs>
      <rect
        x={-GRID_EXTENT} y={-GRID_EXTENT}
        width={GRID_EXTENT * 2} height={GRID_EXTENT * 2}
        fill="url(#iso-grid-pattern)"
      />
    </g>
  );
}
