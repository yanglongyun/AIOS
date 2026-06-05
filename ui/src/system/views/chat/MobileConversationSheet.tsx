import { Plus } from "lucide-react";
import type { Conversation } from "../../api";

export function MobileConversationSheet({
  open,
  conversations,
  selectedId,
  selectConversation,
  startConversation,
  close,
}: {
  open: boolean;
  conversations: Conversation[];
  selectedId: string;
  selectConversation: (id: string) => void;
  startConversation: () => void;
  close: () => void;
}) {
  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={close} />
      <div className="bg-bg-raised rounded-t-3xl flex flex-col max-h-[85vh] min-h-[60vh] shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border-strong" />
        </div>
        <div className="flex flex-col gap-2.5 p-3 shrink-0">
          <button
            className="flex items-center justify-center gap-2 h-10 rounded-xl border border-border-soft bg-bg text-text text-sm font-semibold hover:bg-bg-hover transition-colors"
            onClick={() => {
              startConversation();
              close();
            }}
          >
            <Plus size={14} strokeWidth={2.2} />
            新对话
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-0.5">
          {conversations.map((item) => (
            <button
              key={item.id}
              className={["conv-item !h-10 !py-0 !flex-row !items-center", item.id === selectedId ? "active" : ""].join(" ")}
              onClick={() => selectConversation(item.id)}
            >
              <span className="flex-1 min-w-0 text-sm text-text truncate">{item.title || `会话 #${item.id}`}</span>
            </button>
          ))}
          {conversations.length === 0 ? (
            <div className="empty mx-1">
              <div className="text-text-dim font-medium">还没有对话</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
