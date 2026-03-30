const model = ({ provider, name, apiUrl }) => {
  return `

## \u5F53\u524D\u6A21\u578B\u914D\u7F6E
- \u4F9B\u5E94\u65B9\uFF1A${provider || "-"}
- \u6A21\u578B\uFF1A${name || "-"}
- \u8BF7\u6C42\u5730\u5740\uFF1A${apiUrl || "-"}`;
};
export {
  model
};
