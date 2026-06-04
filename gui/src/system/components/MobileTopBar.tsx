import { ChevronDown, Menu } from "lucide-react";
import { useLayout } from "../state/layout";
import { useTheme } from "../state/theme";

export function MobileTopBar({
  title,
  subTitle,
  hasSheet,
  openSheet,
}: {
  title: string;
  subTitle: string;
  hasSheet: boolean;
  openSheet: () => void;
}) {
  const layout = useLayout();
  const theme = useTheme();

  return (
    <header className="md:hidden h-14 shrink-0 flex items-center gap-2 px-3 border-b border-border-soft bg-bg/90 backdrop-blur z-30">
      <button className="btn btn-sm btn-ghost !px-2 !h-9 !w-9" title="打开菜单" onClick={layout.openMobileNav}>
        <Menu size={18} />
      </button>

      {hasSheet ? (
        <button
          className="flex-1 min-w-0 flex items-center justify-center gap-1 text-sm font-semibold text-text truncate bg-transparent border-0"
          onClick={openSheet}
        >
          <span className="truncate">{title}</span>
          {subTitle ? <span className="text-text-mute font-normal text-xs">{subTitle}</span> : null}
          <ChevronDown size={12} className="shrink-0 text-text-mute" strokeWidth={2.5} />
        </button>
      ) : (
        <div className="flex-1 min-w-0 text-center text-sm font-semibold text-text truncate">{title}</div>
      )}

      <button className="btn btn-sm btn-ghost !px-2 !h-9 !w-9" title={theme.mode === "dark" ? "切换到浅色主题" : "切换到深色主题"} onClick={theme.toggleTheme}>
        {theme.mode === "dark" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 1 0 9 9 9 9 0 1 1-9-9z" />
          </svg>
        )}
      </button>
    </header>
  );
}
