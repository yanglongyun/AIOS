import { Plus, Search, Trash2 } from "lucide-react";
import type { Conversation } from "../../api";
import { useLayout } from "../../state/layout";

export function ConversationList({
  conversations,
  selectedId,
  search,
  setSearch,
  refresh,
  startConversation,
  selectConversation,
  removeConversation,
}: {
  conversations: Conversation[];
  selectedId: string;
  search: string;
  setSearch: (value: string) => void;
  refresh: () => void;
  startConversation: () => void;
  selectConversation: (id: string) => void;
  removeConversation: (id: string) => void;
}) {
  const layout = useLayout();

  return (
    <aside
      className={["hidden md:flex flex-col min-h-0 overflow-hidden transition-[width] duration-300 ease-out shrink-0", layout.chatListCollapsed ? "md:w-0" : "md:w-[280px]"].join(" ")}
      style={{ background: "linear-gradient(to right, var(--nav-from), var(--nav-to)), var(--color-bg)" }}
    >
      <div className="w-[280px] flex flex-col min-h-0 flex-1">
        <div className="flex flex-col gap-2.5 p-3">
          <button
            className="flex items-center justify-center gap-2 h-10 rounded-xl border border-border-soft bg-bg-raised text-text text-sm font-semibold hover:bg-bg-hover transition-colors shadow-sm"
            onClick={startConversation}
          >
            <Plus size={14} strokeWidth={2.2} />
            新对话
          </button>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none grid place-items-center">
              <Search size={14} />
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onBlur={refresh}
              onKeyDown={(event) => {
                if (event.key === "Enter") refresh();
              }}
              className="input pl-9 !h-9 !rounded-lg"
              placeholder="搜索对话"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 flex flex-col gap-0.5">
          {conversations.map((item) => (
            <button
              key={item.id}
              className={["conv-item group !h-9 !py-0 !flex-row !items-center !gap-2", item.id === selectedId ? "active" : ""].join(" ")}
              onClick={() => selectConversation(item.id)}
            >
              <span className="flex-1 min-w-0 text-sm text-text truncate">{item.title || `会话 #${item.id}`}</span>
              <span
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-bg-active text-text-faint hover:text-danger"
                role="button"
                title="删除"
                onClick={(event) => {
                  event.stopPropagation();
                  removeConversation(item.id);
                }}
              >
                <Trash2 size={14} />
              </span>
            </button>
          ))}
          {conversations.length === 0 ? (
            <div className="empty mx-1 mt-2">
              <div className="text-text-dim font-medium">还没有对话</div>
              <div className="text-xxs text-text-faint">点击「新对话」开始</div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
