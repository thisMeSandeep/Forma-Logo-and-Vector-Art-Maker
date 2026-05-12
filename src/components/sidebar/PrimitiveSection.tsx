import { Shapes } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Section, PropertyRow } from './Section';
import { NumberField } from './NumberField';
import { Slider } from '../ui/slider';
import {
  POLYGON_SIDES_MIN,
  POLYGON_SIDES_MAX,
  STAR_POINTS_MIN,
  STAR_POINTS_MAX,
  STAR_INNER_RATIO_MIN,
  STAR_INNER_RATIO_MAX,
} from '../../config/constants';

// Visible only when polygon or star tool is active. Keeps the sidebar quiet
// for other tools where these controls are irrelevant.
export function PrimitiveSection() {
  const activeTool       = useAppStore((s) => s.activeTool);
  const polygonSides     = useAppStore((s) => s.polygonSides);
  const starPointCount   = useAppStore((s) => s.starPointCount);
  const starInnerRatio   = useAppStore((s) => s.starInnerRatio);
  const setPolygonSides  = useAppStore((s) => s.setPolygonSides);
  const setStarPointCount = useAppStore((s) => s.setStarPointCount);
  const setStarInnerRatio = useAppStore((s) => s.setStarInnerRatio);

  if (activeTool !== 'polygon' && activeTool !== 'star') return null;

  return (
    <Section title="Primitive" icon={<Shapes size={11} />}>
      {activeTool === 'polygon' && (
        <>
          <PropertyRow label="Sides">
            <NumberField
              value={polygonSides}
              onChange={setPolygonSides}
              min={POLYGON_SIDES_MIN}
              max={POLYGON_SIDES_MAX}
              step={1}
            />
          </PropertyRow>
          <Slider
            min={POLYGON_SIDES_MIN}
            max={POLYGON_SIDES_MAX}
            step={1}
            value={[polygonSides]}
            onValueChange={([v]) => setPolygonSides(v)}
            className="mt-2"
          />
        </>
      )}

      {activeTool === 'star' && (
        <>
          <PropertyRow label="Points">
            <NumberField
              value={starPointCount}
              onChange={setStarPointCount}
              min={STAR_POINTS_MIN}
              max={STAR_POINTS_MAX}
              step={1}
            />
          </PropertyRow>
          <Slider
            min={STAR_POINTS_MIN}
            max={STAR_POINTS_MAX}
            step={1}
            value={[starPointCount]}
            onValueChange={([v]) => setStarPointCount(v)}
            className="mt-2"
          />

          <PropertyRow label="Inner">
            <NumberField
              value={starInnerRatio}
              onChange={setStarInnerRatio}
              min={STAR_INNER_RATIO_MIN}
              max={STAR_INNER_RATIO_MAX}
              step={0.05}
            />
          </PropertyRow>
          <Slider
            min={STAR_INNER_RATIO_MIN}
            max={STAR_INNER_RATIO_MAX}
            step={0.05}
            value={[starInnerRatio]}
            onValueChange={([v]) => setStarInnerRatio(v)}
            className="mt-2"
          />
        </>
      )}
    </Section>
  );
}
