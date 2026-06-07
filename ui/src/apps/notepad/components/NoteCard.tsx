import { Check, Pencil, Trash2, X } from "lucide-react";
import type { Note } from "../types";

const iconButtonClass =
  "inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export function NoteCard({
  note,
  editing,
  editText,
  setEditText,
  onEdit,
  onSave,
  onCancel,
  onRemove,
}: {
  note: Note;
  editing: boolean;
  editText: string;
  setEditText: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="group flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400 dark:text-neutral-500">{formatTime(note.updated_at)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {editing ? (
            <>
              <button className={iconButtonClass} title="保存" onClick={onSave}>
                <Check size={14} />
              </button>
              <button className={iconButtonClass} title="取消" onClick={onCancel}>
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button className={iconButtonClass} title="编辑" onClick={onEdit}>
                <Pencil size={13} />
              </button>
              <button className={iconButtonClass} title="删除" onClick={onRemove}>
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        <textarea
          value={editText}
          onChange={(event) => setEditText(event.target.value)}
          className="min-h-[80px] w-full resize-none rounded-md border border-slate-200 bg-white p-2 text-sm leading-relaxed text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
          autoFocus
        />
      ) : (
        <p className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-900 dark:text-neutral-100">{note.content}</p>
      )}
    </div>
  );
}
