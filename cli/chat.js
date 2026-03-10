import readline from 'readline';
import { WebSocket } from 'ws';
import chalk from 'chalk';
import { WS_URL } from './config.js';
import { createSession, getAuthCookie } from './service.js';
import { print } from './print.js';

const connect = (onReady) => {
  const cookie = getAuthCookie();
  const ws = new WebSocket(WS_URL, {
    headers: {
      ...(cookie ? { cookie } : {})
    }
  });

  ws.on('error', (e) => {
    console.error(chalk.red('连接失败，请确认 AIOS 守护进程正在运行'));
    console.error(chalk.dim('  ' + e.message));
    process.exit(1);
  });

  ws.on('open', () => onReady(ws));
  return ws;
};

export const startChat = async () => {
  console.log(chalk.bold('\n  AIOS') + chalk.dim(' — AI Agent CLI'));
  console.log(chalk.dim('  输入消息开始对话，Ctrl+C 退出\n'));

  let conversationId;
  try {
    conversationId = await createSession();
  } catch (e) {
    console.error(chalk.red('启动失败: ' + e.message));
    process.exit(1);
  }

  let busy = false;
  let replyBuffer = '';

  const parseToolCall = (toolCall) => {
    const name = toolCall?.function?.name || 'tool';
    let args = {};
    try {
      args = JSON.parse(toolCall?.function?.arguments || '{}');
    } catch {}

    if (name === 'shell') {
      return {
        cmd: args.command || 'shell',
        reason: args.reason || ''
      };
    }

    return {
      cmd: name,
      reason: Object.keys(args).length ? JSON.stringify(args) : ''
    };
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('> '),
  });

  connect((socket) => {
    const ping = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    socket.on('close', () => {
      clearInterval(ping);
      console.log(chalk.red('\n连接断开'));
      process.exit(0);
    });

    socket.on('message', (raw) => {
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch {
        return;
      }

      if (data.type === 'pong') return;

      if (data.type === 'tool_call') {
        print.clearThinking();
        const parsed = parseToolCall(data.toolCall);
        print.tool(parsed.cmd, parsed.reason);
        return;
      }

      if (data.type === 'tool_result') {
        print.result(data.content);
        return;
      }

      if (data.type === 'delta') {
        replyBuffer += data.delta || '';
        return;
      }

      if (data.type === 'done' || data.type === 'reply') {
        print.clearThinking();
        print.reply(replyBuffer || data.content || '');
        replyBuffer = '';
        busy = false;
        rl.prompt();
        return;
      }

      if (data.type === 'aborted') {
        print.clearThinking();
        busy = false;
        rl.prompt();
        return;
      }

      if (data.type === 'error') {
        print.clearThinking();
        print.error(data.content);
        busy = false;
        rl.prompt();
        return;
      }
    });

    rl.prompt();

    rl.on('line', (line) => {
      const input = line.trim();
      if (!input) { rl.prompt(); return; }

      if (busy) {
        console.log(chalk.dim('（等待上一条回复完成）'));
        rl.prompt();
        return;
      }

      busy = true;
      replyBuffer = '';
      print.thinking();

      socket.send(JSON.stringify({
        type: 'message',
        conversationId,
        content: input,
        mode: 'auto',
      }));
    });

    rl.on('close', () => {
      socket.close();
      process.exit(0);
    });
  });
};
