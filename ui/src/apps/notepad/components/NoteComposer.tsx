import { RotateCcw, Sparkles, X } from "lucide-react";

const ghostButtonClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";
const primaryButtonClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-900 bg-slate-900 px-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200";

export function NoteComposer({
  draft,
  setDraft,
  polishing,
  canUndo,
  onCreate,
  onPolish,
  onCancelPolish,
  onUndoPolish,
}: {
  draft: string;
  setDraft: (value: string) => void;
  polishing: boolean;
  canUndo: boolean;
  onCreate: () => void;
  onPolish: () => void;
  onCancelPolish: () => void;
  onUndoPolish: () => void;
}) {
  const hasContent = !!draft.trim();

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 transition-colors focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/15 dark:border-neutral-800 dark:bg-neutral-900">
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") onCreate();
        }}
        className="min-h-[72px] w-full resize-none bg-transparent text-sm leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        placeholder="现在的想法是…(⌘/Ctrl + Enter 记录)"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 dark:text-neutral-500">{draft.trim().length} 字</span>
        <div className="flex items-center gap-2">
          {canUndo ? (
            <button className={ghostButtonClass} onClick={onUndoPolish} title="撤销润色">
              <RotateCcw size={14} />
              撤销
            </button>
          ) : null}
          {polishing ? (
            <button className={ghostButtonClass} onClick={onCancelPolish} title="取消">
              <X size={14} />
              取消
            </button>
          ) : (
            <button className={ghostButtonClass} disabled={!hasContent} onClick={onPolish}>
              <Sparkles size={14} />
              智能润色
            </button>
          )}
          <button className={primaryButtonClass} disabled={!hasContent} onClick={onCreate}>
            记录
          </button>
        </div>
      </div>
    </div>
  );
}
