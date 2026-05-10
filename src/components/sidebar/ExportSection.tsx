import { Download, Image } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { exportSVG, exportPNG } from '../../lib/exportUtils';
import { Button } from '../ui/button';

export function ExportSection() {
  const shapes = useAppStore((s) => s.shapes);
  const isEmpty = shapes.length === 0;

  return (
    <section>
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Export</p>
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isEmpty}
          onClick={() => exportSVG(shapes)}
          className="w-full justify-start gap-2"
          title={isEmpty ? 'Draw something first' : 'Download as SVG'}
        >
          <Download size={14} />
          Export SVG
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isEmpty}
          onClick={() => exportPNG(shapes)}
          className="w-full justify-start gap-2"
          title={isEmpty ? 'Draw something first' : 'Download as PNG (2×)'}
        >
          <Image size={14} />
          Export PNG
        </Button>
      </div>
    </section>
  );
}
