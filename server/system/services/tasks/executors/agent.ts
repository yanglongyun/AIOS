// @ts-nocheck
import { runConversationChat } from "../../chat/run.js";
import { getLastAssistantMessage } from "../utils.js";

const executeAgentTask = async ({
  conversationId,
  input,
  signal,
}) => {
  const { result } = await runConversationChat(conversationId, input, { signal });
  const lastAssistant = getLastAssistantMessage(result.messages);
  const response = lastAssistant?.content || result.text || "";
  return { response };
};

export { executeAgentTask };
