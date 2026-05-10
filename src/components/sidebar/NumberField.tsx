import { useState, useEffect } from 'react';

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
};

// Compact editor-style numeric input. Commits on blur or Enter; reverts on Esc.
export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
  className = '',
}: Props) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit() {
    const n = parseFloat(draft);
    if (Number.isNaN(n)) {
      setDraft(String(value));
      return;
    }
    let clamped = n;
    if (min != null) clamped = Math.max(min, clamped);
    if (max != null) clamped = Math.min(max, clamped);
    onChange(clamped);
    setDraft(String(clamped));
  }

  return (
    <div
      className={`flex items-center h-7 rounded border bg-foreground/[0.03] px-2 focus-within:bg-foreground/[0.06] transition-colors ${className}`}
      style={{ borderColor: 'var(--panel-border)' }}
    >
      <input
        type="number"
        value={draft}
        min={min}
        max={max}
        step={step}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') {
            setDraft(String(value));
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-9 bg-transparent text-xs font-mono text-right outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {suffix && (
        <span className="text-[10px] text-muted-foreground ml-0.5 select-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
