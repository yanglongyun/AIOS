import { uuid } from "../../lib/secure";

/** 还没落库的新对话:第一条消息发出时才创建真正的 Chat。 */
export type ChatStartTab = {
  id: string;
  kind: "chat-start";
  title: string;
  initialPrompt?: string;
  sendOnOpen?: boolean;
};

export const chatStartTab = (initialPrompt?: string, sendOnOpen = false): ChatStartTab => ({
  id: `__chat_start__:${uuid()}`,
  kind: "chat-start",
  title: "新对话",
  initialPrompt,
  sendOnOpen,
});
