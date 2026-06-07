import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Trash2, X } from "lucide-react";
import type { Chat, ChatMessageRecord, DisplayMessage, Message } from "../types";
import { useChat } from "../../../system/state/chat";
import { connectWs, ensureWsConnected, onWs, sendWs } from "../../../system/state/ws";
import { buildToolMessage, normalizeForDisplay, titleFromPrompt } from "../messages";
import { ChatInput } from "../components/ChatInput";
import { MessageList } from "../components/MessageList";

const readJson = async <T,>(response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data as T;
};

const listChats = async (search = "") => {
  const url = search.trim()
    ? `/api/chat/list?search=${encodeURIComponent(search.trim())}`
    : "/api/chat/list";
  return readJson<Chat[]>(await fetch(url));
};

const createChat = async (title: string) => {
  const result = await readJson<{ chat: Chat }>(await fetch("/api/chat/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  }));
  return result.chat;
};

const deleteChat = async (chatId: string) => {
  await readJson<{ ok: boolean }>(await fetch("/api/chat/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId }),
  }));
};

const listChatMessages = async (chatId: string) =>
  readJson<{ messages: ChatMessageRecord[] }>(
    await fetch(`/api/chat/messages?chatId=${encodeURIComponent(chatId)}&limit=200&offset=0`),
  );

export default function ChatApp() {
  const chat = useChat();
  const currentIdRef = useRef("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [search, setSearch] = useState("");
  const [prompt, setPrompt] = useState("");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const busyIdsRef = useRef<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [draftMode, setDraftMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const streamingChatIdRef = useRef("");
  const streamingMessageIdRef = useRef("");
  const skipNextMessageRefreshRef = useRef("");
  const busy = isSending || (!!chat.currentId && busyIds.has(chat.currentId));

  const refreshChats = useCallback(async (options: { selectFirst?: boolean } = {}) => {
    const list = await listChats(search.trim());
    setChats(list);
    if (options.selectFirst !== false && !draftMode && !chat.currentId && list.length > 0) {
      chat.setCurrentChat(list[0].id, list[0]);
    } else if (chat.currentId) {
      const fresh = list.find((item) => item.id === chat.currentId);
      if (fresh) chat.setCurrentChat(fresh.id, fresh);
    }
  }, [chat, draftMode, search]);

  const refreshMessages = useCallback(
    async (id = chat.currentId) => {
      if (!id) {
        setMessages([]);
        return;
      }
      const result = await listChatMessages(id);
      setMessages(normalizeForDisplay(result.messages || []));
    },
    [chat.currentId],
  );
  const refreshChatsRef = useRef(refreshChats);

  useEffect(() => {
    refreshChatsRef.current = refreshChats;
  }, [refreshChats]);

  useEffect(() => {
    refreshChats().catch((error) => setErrorText(error.message || "加载失败"));
  }, []);

  useEffect(() => {
    const applyPrompt = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      if (typeof value === "string") setPrompt(value);
    };
    const newChat = () => startChat();
    const toggleHistory = () => setHistoryOpen((value) => !value);
    window.addEventListener("agent:applyPrompt", applyPrompt);
    window.addEventListener("aios:chat:new", newChat);
    window.addEventListener("aios:chat:history", toggleHistory);
    return () => {
      window.removeEventListener("agent:applyPrompt", applyPrompt);
      window.removeEventListener("aios:chat:new", newChat);
      window.removeEventListener("aios:chat:history", toggleHistory);
    };
  }, []);

  useEffect(() => {
    if (chat.currentId && skipNextMessageRefreshRef.current === chat.currentId) {
      skipNextMessageRefreshRef.current = "";
      return;
    }
    streamingChatIdRef.current = "";
    streamingMessageIdRef.current = "";
    refreshMessages().catch((error) => setErrorText(error.message || "加载失败"));
  }, [chat.currentId, refreshMessages]);

  useEffect(() => {
    currentIdRef.current = chat.currentId;
  }, [chat.currentId]);

  const setBusy = useCallback((chatId: string, next: boolean) => {
    if (!chatId) return;
    const value = new Set(busyIdsRef.current);
    if (next) value.add(chatId);
    else value.delete(chatId);
    busyIdsRef.current = value;
    setBusyIds(value);
  }, []);

  const selectChat = async (id: string) => {
    const item = chats.find((entry) => entry.id === id) || null;
    chat.setCurrentChat(id, item);
    setDraftMode(false);
    setHistoryOpen(false);
  };

  const startChat = () => {
    chat.clearCurrentChat();
    setMessages([]);
    setPrompt("");
    setErrorText("");
    setDraftMode(true);
    setHistoryOpen(false);
  };

  const removeChat = async (id: string) => {
    if (!window.confirm("删除此会话？")) return;
    await deleteChat(id);
    if (chat.currentId === id) {
      chat.clearCurrentChat();
      setMessages([]);
      setDraftMode(true);
    }
    await refreshChats();
  };

  const toggleTool = (id: string) => {
    setMessages((items) =>
      items.map((item) => (item.id === id ? { ...item, expanded: !item.expanded } : item)),
    );
  };

  const ensureStreamingMessage = useCallback((chatId = currentIdRef.current) => {
    const id = String(chatId || "");
    let key = streamingMessageIdRef.current;
    if (!key || streamingChatIdRef.current !== id) {
      key = `stream:${Date.now()}:${Math.random()}`;
      streamingChatIdRef.current = id;
      streamingMessageIdRef.current = key;
    }

    setMessages((items) => {
      if (items.some((item) => item.id === key)) return items;
      return [...items, { role: "assistant", source: "ai", content: "", id: key, streaming: true }];
    });

    return key;
  }, []);

  const finishStreamingMessage = useCallback((content = "") => {
    const id = streamingMessageIdRef.current;
    if (!id) return false;
    streamingChatIdRef.current = "";
    streamingMessageIdRef.current = "";

    setMessages((items) =>
      items.flatMap((item) => {
        if (item.id !== id) return [item];
        const nextContent = content || item.content || "";
        if (!String(nextContent).trim()) return [];
        return [{ ...item, content: nextContent, streaming: false }];
      }),
    );

    return true;
  }, []);

  const stopStreamingMessage = useCallback(() => {
    const id = streamingMessageIdRef.current;
    if (!id) return false;
    streamingChatIdRef.current = "";
    streamingMessageIdRef.current = "";
    setMessages((items) =>
      items.flatMap((item) => {
        if (item.id !== id) return [item];
        if (!String(item.content || "").trim()) return [];
        return [{ ...item, streaming: false }];
      }),
    );
    return true;
  }, []);

  const appendToolCall = useCallback((toolCall: Message["tool_calls"] extends Array<infer T> ? T : never) => {
    setMessages((items) => {
      const key = `rt:${Date.now()}:${Math.random()}:tc`;
      return [...items, buildToolMessage(toolCall, key)];
    });
  }, []);

  const appendToolResult = useCallback((toolCallId: string, content: string) => {
    setMessages((items) => {
      const next = [...items];
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
        next[target] = { ...next[target], result: content };
        return next;
      }
      return [...next, {
        role: "tool",
        source: "tool",
        id: `rt:${Date.now()}:${Math.random()}:tr`,
        toolName: "tool",
        orphan: true,
        result: content,
        expanded: false,
      }];
    });
  }, []);

  const appendMessageChunk = useCallback((content: string, chatId = currentIdRef.current) => {
    if (!content) return;
    const id = String(chatId || "");
    let key = streamingMessageIdRef.current;
    if (!key || streamingChatIdRef.current !== id) {
      key = `stream:${Date.now()}:${Math.random()}`;
      streamingChatIdRef.current = id;
      streamingMessageIdRef.current = key;
    }

    setMessages((items) => {
      let found = false;
      const next = items.map((item) => {
        if (item.id !== key) return item;
        found = true;
        return { ...item, content: `${item.content || ""}${content}`, streaming: true };
      });

      if (!found) {
        return [...items, { role: "assistant", source: "ai", content, id: key, streaming: true }];
      }
      return next;
    });
  }, []);

  const appendInputMessage = useCallback((payload: Record<string, unknown>) => {
    if (payload.chatId !== currentIdRef.current) return;
    const source = String(payload.source || "");
    if (source !== "subscription") return;
    const message = payload.message;
    if (!message || typeof message !== "object") return;

    const id = payload.id != null
      ? payload.id
      : `rt:${Date.now()}:${Math.random()}:input`;
    const items = normalizeForDisplay([{
      id: String(id),
      source,
      message: message as ChatMessageRecord["message"],
      usage: null,
    }]);
    if (!items.length) return;

    setMessages((current) => {
      const known = new Set(current.map((item) => item.id));
      return [
        ...current,
        ...items.filter((item) => !known.has(item.id)),
      ];
    });
  }, []);

  const attachUsage = useCallback((payload: Record<string, unknown>) => {
    if (payload.chatId !== currentIdRef.current) return;
    const usage = payload.usage;
    if (!usage || typeof usage !== "object" || Array.isArray(usage)) return;
    const streamId = streamingMessageIdRef.current;

    setMessages((items) => {
      if (streamId && items.some((item) => item.id === streamId)) {
        return items.map((item) =>
          item.id === streamId ? { ...item, usage: usage as Record<string, any> } : item,
        );
      }

      for (let index = items.length - 1; index >= 0; index -= 1) {
        if (items[index].role === "assistant") {
          const next = [...items];
          next[index] = { ...next[index], usage: usage as Record<string, any> };
          return next;
        }
      }
      return items;
    });
  }, []);

  useEffect(() => {
    const finishChat = (chatId: string) => {
      setBusy(chatId, false);
      refreshChatsRef.current().catch((error) => setErrorText(error.message || "加载失败"));
    };

    const handleStart = (payload: Record<string, unknown>) => {
      setBusy(String(payload.chatId || ""), true);
      if (payload.chatId !== currentIdRef.current) return;
      ensureStreamingMessage(String(payload.chatId || ""));
    };
    const handleMessage = (payload: Record<string, unknown>) => {
      setBusy(String(payload.chatId || ""), true);
      if (payload.chatId !== currentIdRef.current) return;
      appendMessageChunk(String(payload.content || ""), String(payload.chatId || ""));
    };
    const handleToolCalls = (payload: Record<string, unknown>) => {
      setBusy(String(payload.chatId || ""), true);
      if (payload.chatId !== currentIdRef.current) return;
      stopStreamingMessage();
      const toolCalls = Array.isArray(payload.toolCalls) ? payload.toolCalls : [];
      toolCalls.forEach((toolCall) => appendToolCall(toolCall as never));
    };
    const handleToolResults = (payload: Record<string, unknown>) => {
      setBusy(String(payload.chatId || ""), true);
      if (payload.chatId !== currentIdRef.current) return;
      const results = Array.isArray(payload.results) ? payload.results : [];
      results.forEach((result) => {
        const item = (result || {}) as { toolCallId?: string; content?: string };
        appendToolResult(String(item.toolCallId || ""), String(item.content || ""));
      });
    };
    const handleDone = (payload: Record<string, unknown>) => {
      const chatId = String(payload.chatId || "");
      finishChat(chatId);
      if (payload.chatId !== currentIdRef.current) return;
      // 新协议:done 不再带 message,最终全文已通过 message 事件流式累积,这里只定稿。
      finishStreamingMessage();
    };
    const handleStopped = (payload: Record<string, unknown>) => {
      stopStreamingMessage();
      finishChat(String(payload.chatId || ""));
    };
    const handleError = (payload: Record<string, unknown>) => {
      setBusy(String(payload.chatId || ""), false);
      if (payload.chatId !== currentIdRef.current) return;
      stopStreamingMessage();
      const content = String(payload.content || "发送失败");
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          source: "ai",
          content,
          id: `rt:${Date.now()}:${Math.random()}:error`,
        },
      ]);
      setErrorText(String(payload.content || "发送失败"));
    };

    connectWs();
    const offInput = onWs("input", appendInputMessage);
    const offStart = onWs("start", handleStart);
    const offMessage = onWs("message", handleMessage);
    const offUsage = onWs("usage", attachUsage);
    const offToolCalls = onWs("tool_calls", handleToolCalls);
    const offToolResults = onWs("tool_results", handleToolResults);
    const offDone = onWs("done", handleDone);
    const offStopped = onWs("aborted", handleStopped);
    const offError = onWs("error", handleError);

    return () => {
      offInput();
      offStart();
      offMessage();
      offUsage();
      offToolCalls();
      offToolResults();
      offDone();
      offStopped();
      offError();
    };
  }, [appendInputMessage, appendMessageChunk, appendToolCall, appendToolResult, attachUsage, ensureStreamingMessage, finishStreamingMessage, setBusy, stopStreamingMessage]);

  const sendPrompt = async () => {
    const text = prompt.trim();
    if (!text || busy) return;

    setIsSending(true);
    setErrorText("");
    let activeChatId = "";

    try {
      let chatId = chat.currentId;
      if (!chatId) {
        const created = await createChat(titleFromPrompt(text));
        chatId = created?.id;
        if (!chatId) throw new Error("failed to create chat");
        currentIdRef.current = chatId;
        skipNextMessageRefreshRef.current = chatId;
        chat.setCurrentChat(chatId, created);
        setDraftMode(false);
      }

      activeChatId = chatId;
      setPrompt("");
      setBusy(chatId, true);
      setMessages((items) => [
        ...items,
        {
          role: "user",
          source: "user",
          content: text,
          id: `local:${Date.now()}:user`,
        },
      ]);
      await ensureWsConnected();
      sendWs({
        type: "chat.message",
        chatId,
        prompt: text,
      });
    } catch (error) {
      if (activeChatId) setBusy(activeChatId, false);
      setErrorText(error instanceof Error ? error.message : "发送失败");
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          source: "ai",
          content: error instanceof Error ? error.message : "发送失败",
          id: `rt:${Date.now()}:${Math.random()}:error`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 min-w-0 flex relative">
      <section className="flex-1 flex flex-col min-h-0 min-w-0 relative">
        <MessageList
          messages={messages}
          busy={busy}
          toggleTool={toggleTool}
        />
        <ChatInput
          value={prompt}
          setValue={setPrompt}
          sending={busy}
          errorText={errorText}
          send={sendPrompt}
          stop={() => {
            if (!chat.currentId) return;
            setBusy(chat.currentId, false);
            sendWs({ type: "chat.abort", chatId: chat.currentId });
          }}
        />
      </section>
      {historyOpen ? (
        <>
          <div className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setHistoryOpen(false)} />
          <aside className="fixed bottom-0 right-0 top-0 z-50 flex min-h-0 w-[300px] max-w-[86vw] flex-col border-l border-slate-200 bg-slate-50 shadow-2xl md:static md:z-auto md:shadow-none dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 px-3 dark:border-neutral-800">
              <div className="flex flex-col min-w-0 flex-1 leading-tight">
                <strong className="truncate text-sm font-semibold text-slate-950 dark:text-neutral-100">历史</strong>
                <span className="mt-1 truncate text-[10px] text-slate-500 dark:text-neutral-400">对话应用</span>
              </div>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100" title="关闭历史" onClick={() => setHistoryOpen(false)}>
                <X size={15} />
              </button>
            </div>
            <div className="flex flex-col gap-2.5 p-3 shrink-0">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 grid -translate-y-1/2 place-items-center text-slate-400 dark:text-neutral-500">
                  <Search size={14} />
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onBlur={() => refreshChats()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") refreshChats();
                  }}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                  placeholder="搜索历史"
                />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 flex flex-col gap-0.5">
              {chats.map((item) => (
                <button
                  key={item.id}
                  className={[
                    "group flex w-full items-center rounded-md border-l-2 px-3 py-2.5 text-left transition",
                    item.id === chat.currentId
                      ? "border-amber-500 bg-slate-200 dark:bg-neutral-800"
                      : "border-transparent hover:bg-slate-100 dark:hover:bg-neutral-900",
                  ].join(" ")}
                  onClick={() => selectChat(item.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-900 dark:text-neutral-100">{item.title || `会话 #${item.id}`}</span>
                    <span
                      className="rounded-md p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-200 hover:text-red-600 group-hover:opacity-100 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-red-400"
                      role="button"
                      title="删除"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeChat(item.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </span>
                  </div>
                </button>
              ))}
              {chats.length === 0 ? (
                <div className="mx-1 mt-2 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-slate-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
                  <div className="font-medium text-slate-600 dark:text-neutral-300">还没有历史</div>
                  <div className="text-[10px] text-slate-400 dark:text-neutral-500">点击顶栏 + 开始新对话</div>
                </div>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
