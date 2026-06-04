// @ts-nocheck
const model = ({ name, apiUrl } = {}) => `

## 模型
- model: ${name || ""}
- apiUrl: ${apiUrl || ""}`;

export { model };
