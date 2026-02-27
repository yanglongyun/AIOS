#!/usr/bin/env node
import readline from 'readline';
import { WebSocket } from 'ws';
import chalk from 'chalk';
import { randomUUID } from 'crypto';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const WS_URL = `ws://localhost:9700/ws`;
const WEB_URL = `http://localhost:9700`;
const API_URL = `http://localhost:9700/api`;

function startServices() {
  console.log(chalk.dim('  启动 AIOS 服务...'));
  const opts = { cwd: ROOT, detached: true, stdio: 'ignore' };
  spawn('node', ['server/index.js'], opts).unref();
  spawn('node', ['apps/index.js'], opts).unref();
}

async function waitReady(retries = 15, delay = 800) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${API_URL}/chat/create`, { method: 'POST' });
      if (res.ok) {
        const { id } = await res.json();
        return id;
      }
    } catch {}
    await new Promise(r => setTimeout(r, delay));
    process.stdout.write('.');
  }
  throw new Error('服务启动超时');
}

async function createChat() {
  try {
    const res = await fetch(`${API_URL}/chat/create`, { method: 'POST' });
    if (!res.ok) throw new Error(`${res.status}`);
    const { id } = await res.json();
    return id;
  } catch {
    // 服务未运行，自动启动
    startServices();
    process.stdout.write(chalk.dim('  等待服务就绪'));
    const id = await waitReady();
    console.log(chalk.dim(' 就绪\n'));
    return id;
  }
}

// ── 子命令处理 ───────────────────────────────────────────
const arg = process.argv[2];
if (arg === 'web') {
  const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
  console.log(chalk.dim(`Opening ${WEB_URL} ...`));
  execSync(`${cmd} ${WEB_URL}`);
  process.exit(0);
}

// ── 渲染 ────────────────────────────────────────────────
const print = {
  user: (text) => console.log(chalk.cyan('\nYou: ') + text),
  reply: (text) => {
    // 去掉 <suggestions>...</suggestions> 块
    const clean = text.replace(/<suggestions>[\s\S]*?<\/suggestions>/g, '').trim();
    if (clean) process.stdout.write('\n' + clean + '\n');
  },
  tool: (cmd, reason) => {
    console.log(chalk.yellow('\n⚡ ' + cmd));
    if (reason) console.log(chalk.dim('   ' + reason));
  },
  result: (content) => {
    const lines = content.trim().split('\n').slice(0, 10);
    lines.forEach(l => console.log(chalk.dim('   ' + l)));
    if (content.trim().split('\n').length > 10) {
      console.log(chalk.dim('   ...'));
    }
  },
  error: (msg) => console.log(chalk.red('\n✗ ' + msg)),
  confirm: (cmd, reason) => {
    console.log(chalk.yellow('\n⚡ 执行命令: ') + cmd);
    if (reason) console.log(chalk.dim('   原因: ' + reason));
  },
  thinking: () => process.stdout.write(chalk.dim('\n思考中...')),
  clearThinking: () => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  },
};

// ── WebSocket ────────────────────────────────────────────
function connect(onReady) {
  const ws = new WebSocket(WS_URL);

  ws.on('error', (e) => {
    console.error(chalk.red('连接失败，请确认 AIOS 守护进程正在运行'));
    console.error(chalk.dim('  ' + e.message));
    process.exit(1);
  });

  ws.on('open', () => {
    onReady(ws);
  });

  return ws;
}

// ── 主逻辑 ───────────────────────────────────────────────
async function main() {
  console.log(chalk.bold('\n  AIOS') + chalk.dim(' — AI Agent CLI'));
  console.log(chalk.dim('  输入消息开始对话，Ctrl+C 退出\n'));

  let chatId;
  try {
    chatId = await createChat();
  } catch (e) {
    console.error(chalk.red('启动失败: ' + e.message));
    process.exit(1);
  }

  let ws;
  let busy = false;
  let pendingConfirm = null;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('> '),
  });

  ws = connect((socket) => {
    // 心跳
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
        // ask 模式：需要用户确认
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
      if (!input) {
        rl.prompt();
        return;
      }

      // ask 模式确认中
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
        chatId,
        content: input,
        mode: 'auto',
      }));
    });

    rl.on('close', () => {
      socket.close();
      process.exit(0);
    });
  });
}

main();
