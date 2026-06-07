import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../state/theme";

const cardClass = "rounded-lg border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900";
const optionClass = (active: boolean) =>
  [
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition",
    active
      ? "border-slate-900 bg-slate-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950"
      : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
  ].join(" ");

export function ThemeSettings() {
  const theme = useTheme();

  return (
    <section className={`${cardClass} flex flex-col gap-4`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className="m-0 text-sm font-semibold text-slate-950 dark:text-neutral-100">主题</h3>
          <p className="m-0 text-xs text-slate-500 dark:text-neutral-400">切换界面明暗模式</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-neutral-800 dark:bg-neutral-950">
          <button
            className={optionClass(theme.mode === "dark")}
            onClick={() => {
              if (theme.mode !== "dark") theme.toggleTheme();
            }}
          >
            <Moon size={14} />
            深色
          </button>
          <button
            className={optionClass(theme.mode === "light")}
            onClick={() => {
              if (theme.mode !== "light") theme.toggleTheme();
            }}
          >
            <Sun size={14} />
            浅色
          </button>
        </div>
      </div>
    </section>
  );
}
