import chalk from 'chalk';

export const print = {
  user: (text) => console.log(chalk.cyan('\nYou: ') + text),
  reply: (text) => {
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
