export const tools = [
  {
    type: 'function',
    function: {
      name: 'shell',
      description: '执行 shell 命令，可以运行任意 shell 命令并返回输出结果',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: '要执行的 shell 命令'
          },
          reason: {
            type: 'string',
            description: '简要说明执行此命令的原因'
          }
        },
        required: ['command', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_chat_description',
      description: '更新当前会话描述。用于总结本次对话主题，便于后续检索。',
      parameters: {
        type: 'object',
        properties: {
          chatId: {
            type: 'string',
            description: '当前会话ID'
          },
          description: {
            type: 'string',
            description: '会话描述，建议 1-3 句，尽量精炼'
          }
        },
        required: ['chatId', 'description']
      }
    }
  }
];
