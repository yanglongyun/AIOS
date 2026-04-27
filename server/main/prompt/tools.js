const tools = ({
  enableToolResultTruncate,
  toolResultMaxChars,
  enableToolLoopLimit,
  toolMaxRounds
}) => {
  return `

## Tool Configuration
- Tool result truncation: ${enableToolResultTruncate ? "enabled" : "disabled"}
- Max tool result length: ${toolResultMaxChars ?? "-"}
- Tool loop limit: ${enableToolLoopLimit ? "enabled" : "disabled"}
- Max tool loop rounds: ${toolMaxRounds ?? "-"}`;
};
export {
  tools
};
