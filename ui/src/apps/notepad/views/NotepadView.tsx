import { useEffect, useRef, useState } from "react";
import { runPolishTask } from "../task";
import { NoteCard } from "../components/NoteCard";
import { NoteComposer } from "../components/NoteComposer";
import { createNote, deleteNote, listNotes, updateNote } from "../requests";
import type { Note } from "../types";

const errorClass = "m-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400";
const emptyClass =
  "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-slate-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400";

export default function NotepadApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");
  const [taskHint, setTaskHint] = useState("");
  const [polishing, setPolishing] = useState(false);
  const [prePolish, setPrePolish] = useState<string | null>(null);
  const runRef = useRef<{ cancel: () => void } | null>(null);

  const refresh = async () => {
    try {
      setNotes(await listNotes());
    } catch (error) {
      setError(error instanceof Error ? error.message : "加载失败");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => () => runRef.current?.cancel(), []);

  const create = async () => {
    const content = draft.trim();
    if (!content) return;
    try {
      await createNote(content);
      setDraft("");
      setPrePolish(null);
      setTaskHint("");
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "记录失败");
    }
  };

  const saveEdit = async (id: number) => {
    try {
      await updateNote(id, editText);
      setEditingId(null);
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存失败");
    }
  };

  const remove = async (id: number) => {
    try {
      await deleteNote(id);
      if (editingId === id) setEditingId(null);
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "删除失败");
    }
  };

  const polishDraft = () => {
    const content = draft.trim();
    if (!content || polishing) return;
    setPolishing(true);
    setError("");
    setTaskHint("正在润色…");
    setPrePolish(null);
    runRef.current = runPolishTask(content, {
      onDone: ({ text }) => {
        const polished = String(text || "").trim();
        if (polished && polished !== content) {
          setPrePolish(content);
          setDraft(polished);
          setTaskHint("已润色,可撤销");
        } else {
          setTaskHint("已是较好表达,无需润色");
        }
      },
      onError: (message) => setError(message),
      onSettled: () => {
        setPolishing(false);
        runRef.current = null;
      },
    });
  };

  const cancelPolish = () => {
    runRef.current?.cancel();
    runRef.current = null;
    setPolishing(false);
    setTaskHint("");
  };

  const undoPolish = () => {
    if (prePolish === null) return;
    setDraft(prePolish);
    setPrePolish(null);
    setTaskHint("");
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-8 flex flex-col gap-5">
        <h2 className="m-0 text-2xl font-semibold leading-tight text-slate-950 dark:text-neutral-100">记事本</h2>

        <NoteComposer
          draft={draft}
          setDraft={setDraft}
          polishing={polishing}
          canUndo={prePolish !== null}
          onCreate={create}
          onPolish={polishDraft}
          onCancelPolish={cancelPolish}
          onUndoPolish={undoPolish}
        />

        {error ? <p className={errorClass}>{error}</p> : null}
        {taskHint ? (
          <p className={["m-0 text-xs", polishing ? "animate-pulse text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-neutral-400"].join(" ")}>{taskHint}</p>
        ) : null}

        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              editing={editingId === note.id}
              editText={editText}
              setEditText={setEditText}
              onEdit={() => {
                setEditingId(note.id);
                setEditText(note.content);
              }}
              onSave={() => saveEdit(note.id)}
              onCancel={() => setEditingId(null)}
              onRemove={() => remove(note.id)}
            />
          ))}
          {notes.length === 0 ? (
            <div className={`${emptyClass} mt-2`}>
              <div className="font-medium text-slate-600 dark:text-neutral-300">还没有记录</div>
              <div className="text-[10px] text-slate-400 dark:text-neutral-500">在上方写下第一条</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
