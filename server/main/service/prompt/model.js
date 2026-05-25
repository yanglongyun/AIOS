const model = ({ name, apiUrl }) => {
  return `

## 当前模型配置
- 模型：${name || "-"}
- 请求地址：${apiUrl || "-"}`;
};
export {
  model
};
