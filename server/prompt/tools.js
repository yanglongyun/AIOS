const tools = ({
  enableToolResultTruncate,
  toolResultMaxChars,
  enableToolLoopLimit,
  toolMaxRounds
}) => {
  return `

## \u5DE5\u5177\u914D\u7F6E
- \u5DE5\u5177\u7ED3\u679C\u622A\u65AD\uFF1A${enableToolResultTruncate ? "\u5F00\u542F" : "\u5173\u95ED"}
- \u5DE5\u5177\u7ED3\u679C\u6700\u5927\u957F\u5EA6\uFF1A${toolResultMaxChars ?? "-"}
- \u5DE5\u5177\u5FAA\u73AF\u9650\u5236\uFF1A${enableToolLoopLimit ? "\u5F00\u542F" : "\u5173\u95ED"}
- \u5DE5\u5177\u6700\u5927\u5FAA\u73AF\u8F6E\u6B21\uFF1A${toolMaxRounds ?? "-"}`;
};
export {
  tools
};
