import readline from 'readline';
import { WebSocket } from 'ws';
import chalk from 'chalk';
import { WS_URL } from './config.js';
import { createSession } from './service.js';
import { print } from './print.js';

const connect = (onReady) => {
  const ws = new WebSocket(WS_URL);

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

  let sessionId;
  try {
    sessionId = await createSession();
  } catch (e) {
    console.error(chalk.red('启动失败: ' + e.message));
    process.exit(1);
  }

  let busy = false;
  let pendingConfirm = null;

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
      const data = JSON.parse(raw);

      if (data.type === 'pong') return;

      if (data.type === 'tool_call') {
        print.clearThinking();
        print.tool(data.command, data.reason);
        return;
      }

      if (data.type === 'tool_confirm') {
        print.clearThinking();
        pendingConfirm = data;
        print.confirm(data.command, data.reason);
        process.stdout.write(chalk.yellow('确认执行? [y/N] '));
        return;
      }

      if (data.type === 'tool_result') {
        print.result(data.content);
        return;
      }

      if (data.type === 'reply') {
        print.clearThinking();
        print.reply(data.content);
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

      if (pendingConfirm) {
        const approved = input.toLowerCase() === 'y';
        socket.send(JSON.stringify({ type: approved ? 'tool_approve' : 'tool_reject' }));
        pendingConfirm = null;
        return;
      }

      if (busy) {
        console.log(chalk.dim('（等待上一条回复完成）'));
        rl.prompt();
        return;
      }

      busy = true;
      print.thinking();

      socket.send(JSON.stringify({
        type: 'message',
        sessionId,
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
