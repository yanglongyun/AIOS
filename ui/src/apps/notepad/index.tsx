import { useEffect, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { appFetch } from "../lib";

type Note = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

const BASE = "/apps/notepad/notes";

const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function NotepadApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      const { notes: list } = await appFetch<{ notes: Note[] }>(BASE);
      setNotes(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const create = async () => {
    const content = draft.trim();
    if (!content) return;
    try {
      await appFetch(BASE, { method: "POST", body: JSON.stringify({ title: "", content }) });
      setDraft("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "记录失败");
    }
  };

  const saveEdit = async (id: number) => {
    try {
      await appFetch(`${BASE}?id=${id}`, { method: "PATCH", body: JSON.stringify({ content: editText }) });
      setEditingId(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    }
  };

  const remove = async (id: number) => {
    try {
      await appFetch(`${BASE}?id=${id}`, { method: "DELETE" });
      if (editingId === id) setEditingId(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-8 flex flex-col gap-5">
        <h2 className="m-0 text-2xl font-semibold text-text leading-tight">记事本</h2>

        {/* 顶部输入框 */}
        <div className="flex flex-col gap-2 p-3 rounded-2xl border border-border-soft bg-bg-raised focus-within:border-accent transition-colors">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") create();
            }}
            className="w-full resize-none bg-transparent text-text text-sm leading-relaxed outline-none min-h-[72px]"
            placeholder="现在的想法是…(⌘/Ctrl + Enter 记录)"
          />
          <div className="flex items-center justify-between">
            <span className="text-xxs text-text-faint">{draft.trim().length} 字</span>
            <button className="btn btn-sm btn-primary" disabled={!draft.trim()} onClick={create}>
              记录
            </button>
          </div>
        </div>

        {error ? <p className="inline-error">{error}</p> : null}

        {/* 笔记流 */}
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <div key={note.id} className="group flex flex-col gap-2 p-4 rounded-2xl border border-border-soft bg-bg-raised">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xxs text-text-faint">{formatTime(note.updated_at)}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingId === note.id ? (
                    <>
                      <button className="btn btn-sm btn-ghost !px-2 !h-7 !w-7" title="保存" onClick={() => saveEdit(note.id)}>
                        <Check size={14} />
                      </button>
                      <button className="btn btn-sm btn-ghost !px-2 !h-7 !w-7" title="取消" onClick={() => setEditingId(null)}>
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-sm btn-ghost !px-2 !h-7 !w-7"
                        title="编辑"
                        onClick={() => {
                          setEditingId(note.id);
                          setEditText(note.content);
                        }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button className="btn btn-sm btn-ghost !px-2 !h-7 !w-7" title="删除" onClick={() => remove(note.id)}>
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {editingId === note.id ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full resize-none bg-transparent text-text text-sm leading-relaxed outline-none min-h-[80px] border border-border-soft rounded-lg p-2"
                  autoFocus
                />
              ) : (
                <p className="m-0 text-sm text-text leading-relaxed whitespace-pre-wrap break-words">{note.content}</p>
              )}
            </div>
          ))}
          {notes.length === 0 ? (
            <div className="empty mt-2">
              <div className="text-text-dim font-medium">还没有记录</div>
              <div className="text-xxs text-text-faint">在上方写下第一条</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
