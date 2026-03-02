export const trimMessages = (messages, contextRounds) => {
  if (!contextRounds || messages.length <= contextRounds + 1) return messages;
  let cutIndex = messages.length - contextRounds;
  if (cutIndex > 1 && messages[cutIndex].role === 'tool') cutIndex--;
  return [messages[0], ...messages.slice(cutIndex)];
};
