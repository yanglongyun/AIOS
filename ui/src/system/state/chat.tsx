import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

type Chat = {
  id: string;
  title?: string;
};

type ChatState = {
  currentId: string;
  current: Chat | null;
  setCurrentChat: (id: string, chat?: Chat | null) => void;
  clearCurrentChat: () => void;
};

const ChatContext = createContext<ChatState | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [currentId, setCurrentId] = useState("");
  const [current, setCurrent] = useState<Chat | null>(null);

  const value = useMemo<ChatState>(
    () => ({
      currentId,
      current,
      setCurrentChat: (id, chat = null) => {
        setCurrentId(id || "");
        setCurrent(chat);
      },
      clearCurrentChat: () => {
        setCurrentId("");
        setCurrent(null);
      },
    }),
    [current, currentId],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChat must be used inside ChatProvider");
  return value;
};
