import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation, DisplayMessage, Message } from "../api";
import { api } from "../api";
import { useConversation } from "../state/conversation";
import { useLayout } from "../state/layout";
import { useSocket } from "../state/socket";
import { buildToolMessage, isMonitorMessage, normalizeForDisplay, parseMonitorContent, titleFromPrompt } from "../lib/messages";
import { ChatInput } from "./chat/ChatInput";
import { ConversationList } from "./chat/ConversationList";
import { MessageList } from "./chat/MessageList";
import { MobileConversationSheet } from "./chat/MobileConversationSheet";

export function ChatView() {
  const conversation = useConversation();
  const layout = useLayout();
  const socket = useSocket();
  const currentIdRef = useRef("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [search, setSearch] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [draftMode, setDraftMode] = useState(false);
  const [streaming, setStreaming] = useState("");

  const refreshConversations = useCallback(async (options: { selectFirst?: boolean } = {}) => {
    const result = await api.listConversations(search.trim());
    const list = result.conversations || [];
    setConversations(list);
    if (options.selectFirst !== false && !draftMode && !conversation.currentId && list.length > 0) {
      conversation.setCurrentConversation(list[0].id, list[0]);
    } else if (conversation.currentId) {
      const fresh = list.find((item) => item.id === conversation.currentId);
      if (fresh) conversation.setCurrentConversation(fresh.id, fresh);
    }
  }, [conversation, draftMode, search]);

  const refreshMessages = useCallback(
    async (id = conversation.currentId) => {
      if (!id) {
        setMessages([]);
        return;
      }
      const result = await api.listMessages(id);
      setMessages(normalizeForDisplay(result.messages || []));
    },
    [conversation.currentId],
  );

  useEffect(() => {
    refreshConversations().catch((error) => setErrorText(error.message || "加载失败"));
  }, []);

  useEffect(() => {
    const applyPrompt = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      if (typeof value === "string") setPrompt(value);
    };
    window.addEventListener("agent:applyPrompt", applyPrompt);
    return () => window.removeEventListener("agent:applyPrompt", applyPrompt);
  }, []);

  useEffect(() => {
    setStreaming("");
    refreshMessages().catch((error) => setErrorText(error.message || "加载失败"));
  }, [conversation.currentId, refreshMessages]);

  useEffect(() => {
    currentIdRef.current = conversation.currentId;
  }, [conversation.currentId]);

  useEffect(() => {
    const conversationId = conversation.currentId;
    if (!conversationId) return;
    socket.send({ type: "chat.subscribe", conversationId });
    return () => socket.send({ type: "chat.unsubscribe", conversationId });
  }, [conversation.currentId, socket]);

  const selectConversation = async (id: string) => {
    const item = conversations.find((entry) => entry.id === id) || null;
    conversation.setCurrentConversation(id, item);
    setDraftMode(false);
    layout.closeMobileChatList();
  };

  const startConversation = () => {
    conversation.clearCurrentConversation();
    setMessages([]);
    setPrompt("");
    setErrorText("");
    setDraftMode(true);
    layout.closeMobileChatList();
  };

  const removeConversation = async (id: string) => {
    if (!window.confirm("删除此会话？")) return;
    await api.deleteConversation(id);
    if (conversation.currentId === id) {
      conversation.clearCurrentConversation();
      setMessages([]);
      setDraftMode(true);
    }
    await refreshConversations();
  };

  const renameConversation = async (title: string) => {
    if (!conversation.currentId) return;
    const result = await api.updateConversationTitle(conversation.currentId, title);
    if (result.conversation) {
      conversation.setCurrentConversation(result.conversation.id, result.conversation);
      setConversations((items) =>
        items.map((item) => (item.id === result.conversation.id ? { ...item, ...result.conversation } : item)),
      );
    }
  };

  const toggleTool = (id: string) => {
    setMessages((items) =>
      items.map((item) => (item._id === id ? { ...item, expanded: !item.expanded } : item)),
    );
  };

  const appendMessage = useCallback((message: Message) => {
    setMessages((items) => {
      const next = [...items];
      const baseId = `rt:${Date.now()}:${Math.random()}`;
      const content = typeof message.content === "string" ? message.content : "";

      if (message.role === "user" && content) {
        next.push({
          role: "user",
          content,
          _id: `${baseId}:u`,
          ...(isMonitorMessage(message) ? { monitor: parseMonitorContent(content) } : {}),
        });
        return next;
      }

      if (message.role === "assistant" && Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
        if (content) {
          next.push({
            role: "assistant",
            content,
            memo: message.memo,
            _id: `${baseId}:a`,
          });
        }
        message.tool_calls.forEach((toolCall, index) => {
          next.push(buildToolMessage(toolCall, `${baseId}:tc:${index}`));
        });
        return next;
      }

      if (message.role === "tool") {
        const content = message.content ?? "";
        const toolCallId = message.tool_call_id || "";
        let target = -1;
        if (toolCallId) {
          for (let index = next.length - 1; index >= 0; index -= 1) {
            if (next[index].role === "tool" && next[index].toolCallId === toolCallId) {
              target = index;
              break;
            }
          }
        }
        if (target < 0) {
          for (let index = next.length - 1; index >= 0; index -= 1) {
            if (next[index].role === "tool" && next[index].result == null) {
              target = index;
              break;
            }
          }
        }
        if (target >= 0) {
          next[target] = { ...next[target], result: String(content) };
        } else {
          next.push({
            role: "tool",
            _id: `${baseId}:tr`,
            toolName: "tool",
            orphan: true,
            result: String(content),
            expanded: false,
          });
        }
        return next;
      }

      if (message.role === "assistant" && content) {
        next.push({
          role: "assistant",
          content,
          memo: message.memo,
          _id: `${baseId}:a`,
        });
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const finishChat = (conversationId: string) => {
      if (conversationId !== currentIdRef.current) return;
      setSending(false);
      setStreaming("");
      refreshConversations().catch((error) => setErrorText(error.message || "加载失败"));
      refreshMessages(conversationId).catch(() => {});
    };

    const offDelta = socket.subscribe("chat.delta", (payload) => {
      if (payload.conversationId !== currentIdRef.current) return;
      setSending(true);
      setStreaming((prev) => prev + String(payload.delta || ""));
    });
    const offMessage = socket.subscribe("chat.message", (payload) => {
      if (payload.conversationId !== currentIdRef.current || !payload.message) return;
      setStreaming("");
      appendMessage(payload.message as Message);
    });
    const offEnd = socket.subscribe("chat.end", (payload) => {
      finishChat(String(payload.conversationId || ""));
    });
    const offStopped = socket.subscribe("chat.stopped", (payload) => {
      finishChat(String(payload.conversationId || ""));
    });
    const offError = socket.subscribe("chat.error", (payload) => {
      if (payload.conversationId !== currentIdRef.current) return;
      setSending(false);
      setStreaming("");
      setErrorText(String(payload.error || "发送失败"));
    });

    return () => {
      offDelta();
      offMessage();
      offEnd();
      offStopped();
      offError();
    };
  }, [appendMessage, refreshConversations, refreshMessages, socket]);

  const sendPrompt = async () => {
    const text = prompt.trim();
    if (!text || sending) return;

    setSending(true);
    setErrorText("");

    try {
      let conversationId = conversation.currentId;
      if (!conversationId) {
        const result = await api.createConversation(titleFromPrompt(text));
        conversationId = result.conversation?.id;
        if (!conversationId) throw new Error("failed to create conversation");
        currentIdRef.current = conversationId;
        conversation.setCurrentConversation(conversationId, result.conversation);
        setDraftMode(false);
      }

      setPrompt("");
      socket.send({ type: "chat.subscribe", conversationId });
      socket.send({
        type: "chat.send",
        conversationId,
        prompt: text,
      });
    } catch (error) {
      setSending(false);
      setErrorText(error instanceof Error ? error.message : "发送失败");
      await refreshMessages().catch(() => {});
    }
  };

  return (
    <div className="flex-1 min-h-0 min-w-0 flex relative">
      <ConversationList
        conversations={conversations}
        selectedId={conversation.currentId}
        search={search}
        setSearch={setSearch}
        refresh={refreshConversations}
        startConversation={startConversation}
        selectConversation={selectConversation}
        removeConversation={removeConversation}
      />
      <section className="flex-1 flex flex-col min-h-0 min-w-0 relative">
        <MessageList
          title={conversation.current?.title || (conversation.current ? `会话 #${conversation.current.id}` : "新会话")}
          canRename={!!conversation.currentId}
          renameConversation={renameConversation}
          messages={messages}
          streaming={streaming}
          toggleTool={toggleTool}
        />
        <ChatInput
          value={prompt}
          setValue={setPrompt}
          sending={sending}
          errorText={errorText}
          send={sendPrompt}
          stop={() => conversation.currentId && socket.send({ type: "chat.stop", conversationId: conversation.currentId })}
        />
      </section>
      <MobileConversationSheet
        conversations={conversations}
        selectedId={conversation.currentId}
        selectConversation={selectConversation}
        startConversation={startConversation}
        close={layout.closeMobileChatList}
        open={layout.mobileChatListOpen}
      />
    </div>
  );
}
