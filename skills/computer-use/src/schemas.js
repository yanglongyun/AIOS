export const toolSchemas = {
  computer_status: {
    description: 'Get computer-use service status and available local drivers.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
  computer_shell: {
    description: 'Execute a bash shell command and return stdout/stderr/exitCode.',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'bash command to execute' },
        cwd: { type: 'string', description: 'working directory' },
        timeoutMs: { type: 'number', description: 'default 30000' },
      },
      required: ['command'],
      additionalProperties: false,
    },
  },
  computer_screenshot: {
    description: 'Capture the current screen to a local image file.',
    parameters: {
      type: 'object',
      properties: {
        outputPath: { type: 'string' },
        format: { type: 'string', enum: ['png'] },
      },
      additionalProperties: false,
    },
  },
  computer_mouse_move: {
    description: 'Move the mouse pointer to screen coordinates.',
    parameters: {
      type: 'object',
      properties: { x: { type: 'number' }, y: { type: 'number' }, dryRun: { type: 'boolean' } },
      required: ['x', 'y'],
      additionalProperties: false,
    },
  },
  computer_click: {
    description: 'Click at screen coordinates.',
    parameters: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        button: { type: 'string', enum: ['left', 'right', 'middle'] },
        clicks: { type: 'number' },
        dryRun: { type: 'boolean' },
      },
      additionalProperties: false,
    },
  },
  computer_double_click: {
    description: 'Double-click at screen coordinates.',
    parameters: {
      type: 'object',
      properties: { x: { type: 'number' }, y: { type: 'number' }, dryRun: { type: 'boolean' } },
      additionalProperties: false,
    },
  },
  computer_right_click: {
    description: 'Right-click at screen coordinates.',
    parameters: {
      type: 'object',
      properties: { x: { type: 'number' }, y: { type: 'number' }, dryRun: { type: 'boolean' } },
      additionalProperties: false,
    },
  },
  computer_scroll: {
    description: 'Scroll the active desktop application.',
    parameters: {
      type: 'object',
      properties: {
        direction: { type: 'string', enum: ['up', 'down', 'left', 'right'] },
        amount: { type: 'number' },
        dryRun: { type: 'boolean' },
      },
      additionalProperties: false,
    },
  },
  computer_type: {
    description: 'Type text into the active desktop application.',
    parameters: {
      type: 'object',
      properties: { text: { type: 'string' }, dryRun: { type: 'boolean' } },
      required: ['text'],
      additionalProperties: false,
    },
  },
  computer_key: {
    description: 'Press one key, optionally with modifiers.',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        modifiers: { type: 'array', items: { type: 'string' } },
        dryRun: { type: 'boolean' },
      },
      required: ['key'],
      additionalProperties: false,
    },
  },
  computer_hotkey: {
    description: 'Press a keyboard shortcut, such as ["command", "l"].',
    parameters: {
      type: 'object',
      properties: {
        keys: { type: 'array', items: { type: 'string' } },
        dryRun: { type: 'boolean' },
      },
      required: ['keys'],
      additionalProperties: false,
    },
  },
};
