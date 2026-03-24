import chalk from 'chalk';
import t from './locale.ts';
import { createSpinner, renderMarkdown } from './ui.ts';

let thinkingSpinner = null;

export const print = {
  reply: (text) => {
    const clean = String(text || '').trim();
    if (!clean) return;
    console.log();
    console.log(renderMarkdown(clean));
    console.log();
  },

  tool: (cmd, reason) => {
    console.log(chalk.yellow('\n  ⚡ ') + chalk.bold(cmd));
    if (reason) console.log(chalk.dim('     ' + reason));
  },

  result: (content) => {
    const all = content.trim().split('\n');
    const lines = all.slice(0, 10);
    lines.forEach(l => console.log(chalk.dim('     ' + l)));
    if (all.length > 10) console.log(chalk.dim('     ...'));
  },

  error: (msg) => console.log(chalk.red('\n  ✗ ') + msg),

  thinking: () => {
    thinkingSpinner = createSpinner(t.thinking);
    thinkingSpinner.start();
  },

  clearThinking: () => {
    if (thinkingSpinner) {
      thinkingSpinner.stop();
      thinkingSpinner = null;
    }
  },
};
