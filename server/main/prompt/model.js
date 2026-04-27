const model = ({ provider, name, apiUrl }) => {
  return `

## Current Model Configuration
- Provider: ${provider || "-"}
- Model: ${name || "-"}
- API URL: ${apiUrl || "-"}`;
};
export {
  model
};
