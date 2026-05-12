import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignVerticalJustifyCenter,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Section } from './Section';
import type { AlignDirection } from '../../lib/alignment';

// Visible only when a shape is selected. Aligns the selection's visual bbox
// to the canvas (initialViewBox) extents.
export function AlignSection() {
  const selectedShapeId        = useAppStore((s) => s.selectedShapeId);
  const alignSelectedToCanvas  = useAppStore((s) => s.alignSelectedToCanvas);

  if (!selectedShapeId) return null;

  const buttons: { dir: AlignDirection; Icon: typeof AlignStartVertical; label: string }[] = [
    { dir: 'left',    Icon: AlignStartVertical,    label: 'Align left'   },
    { dir: 'centerX', Icon: AlignCenterVertical,   label: 'Center X'     },
    { dir: 'right',   Icon: AlignEndVertical,      label: 'Align right'  },
    { dir: 'top',     Icon: AlignStartHorizontal,  label: 'Align top'    },
    { dir: 'centerY', Icon: AlignCenterHorizontal, label: 'Center Y'     },
    { dir: 'bottom',  Icon: AlignEndHorizontal,    label: 'Align bottom' },
  ];

  return (
    <Section title="Align" icon={<AlignVerticalJustifyCenter size={11} />}>
      <div className="grid grid-cols-3 gap-1">
        {buttons.map(({ dir, Icon, label }) => (
          <button
            key={dir}
            onClick={() => alignSelectedToCanvas(dir)}
            title={label}
            className="h-8 flex items-center justify-center rounded border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            style={{ borderColor: 'var(--panel-border)' }}
          >
            <Icon size={13} />
          </button>
        ))}
      </div>
    </Section>
  );
}
