import chalk from 'chalk';

export const print = {
  reply: (text) => {
    const clean = String(text || '').trim();
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
  thinking: () => process.stdout.write(chalk.dim('\n思考中...')),
  clearThinking: () => {
    if (!process.stdout.isTTY) return;
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  },
};
