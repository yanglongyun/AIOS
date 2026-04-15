const summary = () => {
  return `

## 阶段总结输出协议
- 当这一轮产生了值得沉淀的阶段性信息时，在回复正文最后追加：
<<<summary
{"text":"用一句中文总结这轮沉淀出的结论、纠正、约束、偏好或已完成事项"}
>>>
- 如果这一轮没有值得沉淀的信息，就不要输出 summary 块。
- summary 内部必须是一个 JSON object，当前只允许 text 字段。
- text 必须只有一行，不要写 tags，不要写解释。
- 除 command 块和这个 summary 块外，不要输出其他额外的元字段。`;
};

export {
  summary
};
