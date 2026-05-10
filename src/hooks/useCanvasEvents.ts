import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { snapToSquare, snapToIsometric } from '../lib/geometry';

export function useCanvasEvents(svgRef: React.RefObject<SVGSVGElement | null>) {
  const setCursorPoint = useAppStore((s) => s.setCursorPoint);

  // Use refs so the event handler never goes stale without re-attaching
  const gridSizeRef = useRef(useAppStore.getState().gridSize);
  const gridModeRef = useRef(useAppStore.getState().gridMode);

  useEffect(() =>
    useAppStore.subscribe((s) => {
      gridSizeRef.current = s.gridSize;
      gridModeRef.current = s.gridMode;
    }),
  []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function onPointerMove(e: PointerEvent) {
      const rect = svg!.getBoundingClientRect();
      const raw = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const snap = gridModeRef.current === 'square' ? snapToSquare : snapToIsometric;
      setCursorPoint(snap(raw, gridSizeRef.current));
    }

    function onPointerLeave() {
      setCursorPoint(null);
    }

    svg.addEventListener('pointermove', onPointerMove);
    svg.addEventListener('pointerleave', onPointerLeave);
    return () => {
      svg.removeEventListener('pointermove', onPointerMove);
      svg.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [svgRef, setCursorPoint]);
}
