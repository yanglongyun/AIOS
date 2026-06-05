import type { Memory } from "../../api";
import { previewText } from "../../lib/messages";
import { VISIBILITY_META, VISIBILITY_ORDER, type Visibility } from "../MemoriesView";

export function MemoryCard({
  memory,
  updateMemory,
  remove,
}: {
  memory: Memory;
  updateMemory: (id: number, payload: Partial<Memory>) => void;
  remove: (id: number) => void;
}) {
  const visibility = (memory.visibility || "hidden") as Visibility;
  const enabled = Boolean(memory.enabled);

  return (
    <article className={["item-card", !enabled ? "opacity-50" : ""].join(" ")}>
      <div className="flex items-start justify-between gap-2.5">
        <div className="text-sm font-semibold text-text leading-snug break-words">{memory.title}</div>
        <span className={["badge", VISIBILITY_META[visibility]?.badge || "badge-neutral"].join(" ")}>
          {VISIBILITY_META[visibility]?.label || memory.visibility}
        </span>
      </div>
      {memory.description ? <div className="text-xs text-text-mute break-words">{memory.description}</div> : null}
      <div className="text-xs text-text-dim leading-relaxed break-words">{previewText(memory.content)}</div>
      <div className="flex flex-col gap-1.5 mt-1">
        <span className="text-xxs text-text-faint uppercase tracking-wider font-semibold">可见性</span>
        <div className="flex flex-wrap gap-1.5">
          {VISIBILITY_ORDER.map((item) => (
            <button key={item} type="button" className={["btn btn-sm", visibility === item ? "btn-primary" : "btn-ghost"].join(" ")} onClick={() => updateMemory(memory.id, { visibility: item })}>
              {VISIBILITY_META[item].label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5 mt-1">
        <button className="btn btn-sm" onClick={() => updateMemory(memory.id, { enabled: !enabled })}>{enabled ? "停用" : "启用"}</button>
        <button className="btn btn-sm btn-danger" onClick={() => remove(memory.id)}>删除</button>
      </div>
    </article>
  );
}
