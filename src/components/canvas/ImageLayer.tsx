import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { ImageItem, ShapeTransform } from '../../types';
import { IDENTITY_TRANSFORM } from '../../types';
import { screenToWorld } from '../../hooks/useViewBox';

// Convert the image's freeform transform into an SVG transform attribute
// anchored at the image's bbox center — mirrors textTransformString.
function imageTransformString(image: ImageItem): string | undefined {
  const t: ShapeTransform = image.transform ?? IDENTITY_TRANSFORM;
  const isIdentity =
    t.rotation === 0 && t.scaleX === 1 && t.scaleY === 1 && t.skewX === 0 && t.skewY === 0;
  if (isIdentity) return undefined;
  const cx = image.x + image.width / 2;
  const cy = image.y + image.height / 2;
  const parts: string[] = [`translate(${cx} ${cy})`];
  if (t.rotation) parts.push(`rotate(${t.rotation})`);
  if (t.scaleX !== 1 || t.scaleY !== 1) parts.push(`scale(${t.scaleX} ${t.scaleY})`);
  if (t.skewX) parts.push(`skewX(${t.skewX})`);
  if (t.skewY) parts.push(`skewY(${t.skewY})`);
  parts.push(`translate(${-cx} ${-cy})`);
  return parts.join(' ');
}

function eventToWorld(e: PointerEvent | React.PointerEvent, svg: SVGSVGElement) {
  const rect = svg.getBoundingClientRect();
  const vb = useAppStore.getState().viewBox;
  return screenToWorld(e.clientX, e.clientY, rect, vb);
}

export function ImageLayer() {
  const images = useAppStore((s) => s.images);
  const activeTool = useAppStore((s) => s.activeTool);
  const selectedImageId = useAppStore((s) => s.selectedImageId);
  const setSelectedImageId = useAppStore((s) => s.setSelectedImageId);
  const updateImage = useAppStore((s) => s.updateImage);
  const commitHistory = useAppStore((s) => s.commitHistory);

  const dragRef = useRef<{
    id: string;
    svg: SVGSVGElement;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const world = eventToWorld(e, drag.svg);
      drag.moved = true;
      updateImage(drag.id, { x: world.x - drag.offsetX, y: world.y - drag.offsetY });
    }
    function onPointerUp() {
      const drag = dragRef.current;
      if (drag?.moved) commitHistory();
      dragRef.current = null;
    }
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [updateImage, commitHistory]);

  function startDrag(e: React.PointerEvent<SVGImageElement>, image: ImageItem) {
    if (e.button !== 0) return;
    if (activeTool !== 'select') return;
    e.stopPropagation();
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const world = eventToWorld(e, svg);
    setSelectedImageId(image.id);
    dragRef.current = {
      id: image.id,
      svg,
      offsetX: world.x - image.x,
      offsetY: world.y - image.y,
      moved: false,
    };
  }

  return (
    <g
      id="image-layer"
      style={{ pointerEvents: activeTool === 'select' ? 'auto' : 'none' }}
    >
      {images.map((image) => {
        const selected = image.id === selectedImageId && activeTool === 'select';
        const transform = imageTransformString(image);
        return (
          <g key={image.id} transform={transform}>
            <image
              data-image-id={image.id}
              href={image.dataUrl}
              x={image.x}
              y={image.y}
              width={image.width}
              height={image.height}
              opacity={image.opacity != null && image.opacity !== 1 ? image.opacity : undefined}
              preserveAspectRatio="none"
              style={{ cursor: activeTool === 'select' ? 'move' : 'inherit' }}
              onPointerDown={(e) => startDrag(e, image)}
              onContextMenu={() => setSelectedImageId(image.id)}
            />
            {selected && (
              <rect
                x={image.x - 2}
                y={image.y - 2}
                width={image.width + 4}
                height={image.height + 4}
                fill="none"
                stroke="var(--cursor-dot-fill)"
                strokeWidth={1}
                strokeDasharray="4 3"
                pointerEvents="none"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
