// 聊天:左栏对话列表,右边当前对话。新对话发出第一条消息时才真正建档。
import { useEffect, useState } from "react";
import type { Chat } from "../api/chats";
import { ChatPanel } from "../components/chat/ChatPanel";
import { chatStartTab, type ChatStartTab } from "../components/chat/types";
import { ChatRail } from "../components/sidebar/panels/ChatRail";
import { EVENTS } from "../../../server/shared/events";
import { navigate } from "../lib/nav";
import { SideRail } from "./SideRail";
import type { AppProps } from "./types";

export function ChatApp({ socket, navOpen, railCollapsed, onCloseNav }: AppProps) {
  const [node, setNode] = useState<Chat | ChatStartTab>(() => chatStartTab());
  const [railRefresh, setRailRefresh] = useState(0);

  // 运行状态变化时让列表跟上(未读点/运行点)
  useEffect(() => {
    const bump = () => setRailRefresh((n) => n + 1);
    const offs = ["chats_changed", EVENTS.RUN_START, EVENTS.RUN_DONE, EVENTS.RUN_ABORTED, EVENTS.RUN_ERROR].map((t) => socket.on(t, bump));
    return () => offs.forEach((off) => off());
  }, [socket]);

  const select = (chat: Chat) => { setNode(chat); onCloseNav(); };

  // 列表顶上的「新建对话」发的是这个事件
  useEffect(() => {
    const startNew = () => { setNode(chatStartTab()); onCloseNav(); };
    window.addEventListener("aios:new-chat", startNew);
    return () => window.removeEventListener("aios:new-chat", startNew);
  }, [onCloseNav]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <SideRail open={navOpen} collapsed={railCollapsed} onClose={onCloseNav}>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ChatRail selectedId={node.id} onSelect={select} refreshKey={railRefresh} socket={socket} />
        </div>
      </SideRail>
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatPanel
          key={node.kind === "chat-start" ? node.id : `chat:${node.id}`}
          node={node}
          socket={socket}
          onSelect={select}
          onOpenSettings={() => navigate({ appId: "settings" })}
          onCreated={(chat, prompt, attachments) => {
            setNode(chat);
            socket.send({ type: "send", chatId: chat.id, prompt, attachments });
            setRailRefresh((n) => n + 1);
          }}
        />
      </main>
    </div>
  );
}
