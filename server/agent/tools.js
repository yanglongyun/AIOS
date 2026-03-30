const tools = [
  {
    type: "function",
    function: {
      name: "shell",
      description: "\u6267\u884C shell \u547D\u4EE4\uFF0C\u53EF\u4EE5\u8FD0\u884C\u4EFB\u610F shell \u547D\u4EE4\u5E76\u8FD4\u56DE\u8F93\u51FA\u7ED3\u679C",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "\u8981\u6267\u884C\u7684 shell \u547D\u4EE4"
          },
          reason: {
            type: "string",
            description: "\u7B80\u8981\u8BF4\u660E\u6267\u884C\u6B64\u547D\u4EE4\u7684\u539F\u56E0"
          }
        },
        required: ["command", "reason"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search",
      description: "\u5728\u4E92\u8054\u7F51\u4E0A\u641C\u7D22\u4FE1\u606F\uFF0C\u8FD4\u56DE\u641C\u7D22\u7ED3\u679C\u5217\u8868\uFF08\u6807\u9898\u3001\u94FE\u63A5\u3001\u6458\u8981\uFF09\u3002\u9002\u7528\u4E8E\u67E5\u627E\u6700\u65B0\u8D44\u8BAF\u3001\u6280\u672F\u6587\u6863\u3001\u89E3\u51B3\u65B9\u6848\u7B49",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "\u641C\u7D22\u5173\u952E\u8BCD"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_url",
      description: "\u83B7\u53D6\u6307\u5B9A\u7F51\u9875\u7684\u6B63\u6587\u5185\u5BB9\uFF08\u8FD4\u56DE Markdown \u683C\u5F0F\uFF09\u3002\u9002\u7528\u4E8E\u9605\u8BFB\u6587\u7AE0\u3001\u6587\u6863\u3001\u535A\u5BA2\u7B49\u7F51\u9875\u5185\u5BB9",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "\u8981\u83B7\u53D6\u5185\u5BB9\u7684\u7F51\u9875 URL"
          }
        },
        required: ["url"]
      }
    }
  }
];
export {
  tools
};
