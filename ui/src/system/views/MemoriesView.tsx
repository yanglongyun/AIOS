import { useEffect, useMemo, useState } from "react";
import type { Memory } from "../api";
import { api } from "../api";
import { MemoryCard } from "./memories/MemoryCard";
import { MemoryForm } from "./memories/MemoryForm";

export type Visibility = "hidden" | "starred" | "pinned";

export const VISIBILITY_ORDER: Visibility[] = ["hidden", "starred", "pinned"];
export const VISIBILITY_META = {
  hidden: { label: "隐藏", hint: "模型不可见，需要时可用 shell 查库", badge: "badge-neutral" },
  starred: { label: "星标", hint: "标题+描述进 system，全文可用 shell 查库", badge: "badge-warning" },
  pinned: { label: "必读", hint: "完整内容直接拼进 system", badge: "badge-success" },
};

export function MemoriesView() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [form, setForm] = useState({ title: "", description: "", content: "", visibility: "hidden" as Visibility });
  const [errorText, setErrorText] = useState("");

  const counts = useMemo(() => {
    const result = { hidden: 0, starred: 0, pinned: 0, total: memories.length };
    for (const memory of memories) {
      if (memory.visibility === "hidden" || memory.visibility === "starred" || memory.visibility === "pinned") {
        result[memory.visibility] += 1;
      }
    }
    return result;
  }, [memories]);

  const refresh = async () => {
    setErrorText("");
    try {
      const result = await api.listMemories();
      setMemories(result.memories || []);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "加载失败");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    try {
      await api.createMemory(form);
      setForm({ title: "", description: "", content: "", visibility: "hidden" });
      await refresh();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "创建失败");
    }
  };

  const updateMemory = async (id: number, payload: Partial<Memory>) => {
    try {
      await api.updateMemory(id, payload);
      await refresh();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "更新失败");
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("删除此记忆？")) return;
    try {
      await api.deleteMemory(id);
      await refresh();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-5 py-6 flex flex-col gap-5">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-3 min-w-0">
            <h2 className="m-0 text-2xl font-semibold text-text leading-tight">记忆</h2>
            <p className="m-0 text-sm text-text-mute">
              跨会话沉淀 · 共 {counts.total} 条 <span className="text-text-faint">·</span> 必读 {counts.pinned} · 星标 {counts.starred} · 隐藏 {counts.hidden}
            </p>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={refresh}>刷新</button>
        </header>
        {errorText ? <p className="inline-error">{errorText}</p> : null}
        <MemoryForm form={form} setForm={setForm} submit={submit} />
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
          {memories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} updateMemory={updateMemory} remove={remove} />
          ))}
        </div>
        {memories.length === 0 ? (
          <div className="empty">
            <div className="text-text-dim font-medium">暂无记忆</div>
            <div className="text-xs text-text-faint">在上方表单创建第一条</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
