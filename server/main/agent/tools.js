export const tools = [
  {
    type: 'function',
    function: {
      name: 'shell',
      description: 'Execute a shell command and return its output.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The shell command to execute.'
          },
          reason: {
            type: 'string',
            description: 'A brief reason for running this command.'
          },
          timeout: {
            type: 'number',
            description: 'Timeout in seconds. Defaults to 30. The server clamps this to [1, 300]. Use a larger value for long-running work such as installing dependencies, builds, tests, or web scraping.'
          },
          cwd: {
            type: 'string',
            description: 'Optional working directory. Defaults to the current process working directory.'
          }
        },
        required: ['command', 'reason']
      }
    }
  }
];
