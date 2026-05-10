import { FileCode2, Image, Share2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { exportSVG, exportPNG } from '../../lib/exportUtils';
import { Section } from './Section';

export function ExportSection() {
  const shapes = useAppStore((s) => s.shapes);
  const texts = useAppStore((s) => s.texts);
  const isEmpty = shapes.length === 0 && texts.length === 0;

  return (
    <Section title="Export" icon={<Share2 size={11} />}>
      <div className="grid grid-cols-2 gap-2">
        <ExportButton
          label="SVG"
          icon={<FileCode2 size={14} />}
          disabled={isEmpty}
          onClick={() => exportSVG(shapes, texts)}
          title={isEmpty ? 'Draw something first' : 'Download as SVG'}
        />
        <ExportButton
          label="PNG"
          icon={<Image size={14} />}
          disabled={isEmpty}
          onClick={() => exportPNG(shapes, texts)}
          title={isEmpty ? 'Draw something first' : 'Download as PNG (2×)'}
        />
      </div>
    </Section>
  );
}

function ExportButton({
  label,
  icon,
  disabled,
  onClick,
  title,
}: {
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="h-16 flex flex-col items-center justify-center gap-1.5 rounded-md border bg-foreground/[0.02] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-foreground/[0.02]"
      style={{ borderColor: 'var(--panel-border)' }}
    >
      {icon}
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}
