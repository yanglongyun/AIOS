import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import type { Conversation } from "../api";

type ConversationState = {
  currentId: string;
  current: Conversation | null;
  setCurrentConversation: (id: string, conversation?: Conversation | null) => void;
  clearCurrentConversation: () => void;
};

const ConversationContext = createContext<ConversationState | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [currentId, setCurrentId] = useState("");
  const [current, setCurrent] = useState<Conversation | null>(null);

  const value = useMemo<ConversationState>(
    () => ({
      currentId,
      current,
      setCurrentConversation: (id, conversation = null) => {
        setCurrentId(id || "");
        setCurrent(conversation);
      },
      clearCurrentConversation: () => {
        setCurrentId("");
        setCurrent(null);
      },
    }),
    [current, currentId],
  );

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
}

export const useConversation = () => {
  const value = useContext(ConversationContext);
  if (!value) throw new Error("useConversation must be used inside ConversationProvider");
  return value;
};
