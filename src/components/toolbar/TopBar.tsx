import { MessageSquareMore, PanelRight, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";

const feedbackUrl = "https://drop-form.vercel.app/f/cmp2luhxr000004l6xak4jz45";

type Props = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function TopBar({ sidebarOpen, onToggleSidebar }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header
      className="h-11 flex items-center px-4 gap-3 shrink-0 border-b backdrop-blur-md"
      style={{
        background: "var(--topbar-bg)",
        borderColor: "var(--panel-border)",
      }}
    >
      {/* Brand mark + name */}
      <div className="flex items-center gap-2 select-none">
        <img src="/logo.svg" alt="" className="h-12 w-12" aria-hidden />
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold tracking-tight">Forma</span>
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            Studio
          </span>
        </div>
      </div>

      {/* Right cluster: theme + sidebar in a subtle pill */}
      <div
        className="ml-auto flex items-center gap-0.5 p-0.5 rounded-md border"
        style={{ borderColor: "var(--panel-border)" }}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </Button>

        <div
          className="w-px h-4"
          style={{ background: "var(--panel-border)" }}
        />

        <Button asChild variant="ghost" size="sm" className="px-2.5">
          <a
            href={feedbackUrl}
            target="_blank"
            rel="noreferrer"
            title="Send feedback"
          >
            <MessageSquareMore size={14} />
            Feedback
          </a>
        </Button>

        <div
          className="w-px h-4"
          style={{ background: "var(--panel-border)" }}
        />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          aria-pressed={sidebarOpen}
        >
          <PanelRight size={14} />
        </Button>
      </div>
    </header>
  );
}
