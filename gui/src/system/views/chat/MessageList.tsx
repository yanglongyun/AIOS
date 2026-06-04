import { Check, Pencil, PanelLeft, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DisplayMessage } from "../../api";
import { useLayout } from "../../state/layout";
import { MessageItem } from "./MessageItem";
import { WelcomePanel } from "./WelcomePanel";

export function MessageList({
  title,
  canRename,
  renameConversation,
  messages,
  streaming = "",
  toggleTool,
}: {
  title: string;
  canRename: boolean;
  renameConversation: (title: string) => Promise<void>;
  messages: DisplayMessage[];
  streaming?: string;
  toggleTool: (id: string) => void;
}) {
  const layout = useLayout();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [stick, setStick] = useState(true);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  useEffect(() => {
    if (!editing) setDraftTitle(title);
  }, [editing, title]);

  useEffect(() => {
    if (!stick || !boxRef.current) return;
    boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages, streaming, stick]);

  const onScroll = () => {
    const el = boxRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.clientHeight - el.scrollTop < 120;
    setStick(near);
    setShowScrollDown(!near && messages.length > 0);
  };

  return (
    <>
      <div className="hidden md:flex items-center justify-between gap-3 py-3 px-5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            className="btn btn-sm btn-ghost !px-2 !h-8 !w-8"
            title={layout.chatListCollapsed ? "显示对话列表" : "隐藏对话列表"}
            onClick={layout.toggleChatList}
          >
            <PanelLeft size={15} />
          </button>
          {editing ? (
            <form
              className="flex items-center gap-1 min-w-0"
              onSubmit={async (event) => {
                event.preventDefault();
                const next = draftTitle.trim();
                if (!next || next === title) {
                  setEditing(false);
                  setDraftTitle(title);
                  return;
                }
                await renameConversation(next);
                setEditing(false);
              }}
            >
              <input
                className="input !h-8 !py-1 min-w-[220px] max-w-[420px]"
                value={draftTitle}
                autoFocus
                onChange={(event) => setDraftTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setEditing(false);
                    setDraftTitle(title);
                  }
                }}
              />
              <button className="btn btn-sm btn-ghost !px-2 !h-8 !w-8" title="保存" type="submit">
                <Check size={14} />
              </button>
              <button
                className="btn btn-sm btn-ghost !px-2 !h-8 !w-8"
                title="取消"
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraftTitle(title);
                }}
              >
                <X size={14} />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1 min-w-0">
              <strong className="text-sm font-semibold text-text truncate">{title}</strong>
              {canRename ? (
                <button className="btn btn-sm btn-ghost !px-2 !h-8 !w-8" title="重命名" onClick={() => setEditing(true)}>
                  <Pencil size={13} />
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div ref={boxRef} className="flex-1 min-h-0 overflow-y-auto" onScroll={onScroll}>
        <div className="mx-auto max-w-3xl xl:max-w-4xl px-5 pt-2 pb-44 flex flex-col gap-6 sm:gap-7">
          {messages.length === 0 && !streaming ? <WelcomePanel /> : null}
          {messages.map((message) => (
            <MessageItem key={message._id} message={message} toggleTool={toggleTool} />
          ))}
          {streaming ? (
            <MessageItem
              key="__streaming__"
              message={{ role: "assistant", content: streaming, _id: "__streaming__", streaming: true }}
              toggleTool={toggleTool}
            />
          ) : null}
        </div>
      </div>

      {showScrollDown ? (
        <button
          className="absolute bottom-[calc(var(--input-h,160px)+12px)] right-6 w-10 h-10 rounded-full border border-border bg-bg-raised shadow-lg flex items-center justify-center text-text-dim hover:text-text hover:bg-bg-hover transition-all z-10"
          title="滚动到最新"
          onClick={() => boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" })}
        >
          ↓
        </button>
      ) : null}
    </>
  );
}
