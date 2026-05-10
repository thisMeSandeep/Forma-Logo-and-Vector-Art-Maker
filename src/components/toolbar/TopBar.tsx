// TODO: Step 6 — wire undo, redo, reset buttons to store

export function TopBar() {
  return (
    <header
      className="h-10 flex items-center px-4 shrink-0 border-b"
      style={{
        background: 'var(--topbar-bg)',
        borderColor: 'var(--panel-border)',
      }}
    >
      <span className="text-sm font-semibold text-white tracking-tight">Forma</span>
      {/* Undo, Redo, Reset buttons go here — Step 6 */}
    </header>
  );
}
