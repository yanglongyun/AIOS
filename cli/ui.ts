import chalk from 'chalk';
import { readFileSync } from 'fs';
import path from 'path';
import { marked } from 'marked';
import { ROOT } from './config.ts';

// --- Banner ---

const getVersion = () => {
  try {
    const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
};

export const banner = () => {
  const v = getVersion();
  console.log();
  console.log(chalk.bold('    _   ___ ___  ___'));
  console.log(chalk.bold('   /_\\ |_ _/ _ \\/ __|'));
  console.log(chalk.bold('  / _ \\ | | (_) \\__ \\'));
  console.log(chalk.bold(' /_/ \\_\\___\\___/|___/'));
  console.log(chalk.dim(`  v${v}`));
  console.log();
};

// --- Spinner ---

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export const createSpinner = (message = '') => {
  let i = 0;
  let timer = null;

  const start = () => {
    if (timer) return;
    if (!process.stdout.isTTY) {
      process.stdout.write(chalk.dim(`  ${message}\n`));
      return;
    }
    process.stdout.write('\x1B[?25l');
    timer = setInterval(() => {
      const frame = FRAMES[i % FRAMES.length];
      process.stdout.write(`\r  ${chalk.cyan(frame)} ${chalk.dim(message)}`);
      i++;
    }, 80);
  };

  const stop = (finalMessage = '') => {
    if (timer) { clearInterval(timer); timer = null; }
    if (process.stdout.isTTY) {
      process.stdout.write('\r\x1B[2K');
      process.stdout.write('\x1B[?25h');
    }
    if (finalMessage) console.log(`  ${chalk.green('✓')} ${chalk.dim(finalMessage)}`);
  };

  const fail = (finalMessage = '') => {
    if (timer) { clearInterval(timer); timer = null; }
    if (process.stdout.isTTY) {
      process.stdout.write('\r\x1B[2K');
      process.stdout.write('\x1B[?25h');
    }
    if (finalMessage) console.log(`  ${chalk.red('✗')} ${finalMessage}`);
  };

  return { start, stop, fail };
};

// ensure cursor restored on exit
process.on('exit', () => {
  if (process.stdout.isTTY) process.stdout.write('\x1B[?25h');
});

// --- Markdown Renderer ---

const renderInline = (tokens) => {
  if (!tokens) return '';
  return tokens.map(token => {
    switch (token.type) {
      case 'text': return token.text;
      case 'strong': return chalk.bold(renderInline(token.tokens));
      case 'em': return chalk.italic(renderInline(token.tokens));
      case 'codespan': return chalk.cyan(`\`${token.text}\``);
      case 'link': return chalk.underline(renderInline(token.tokens)) + chalk.dim(` (${token.href})`);
      case 'br': return '\n';
      default: return token.raw || '';
    }
  }).join('');
};

export const renderMarkdown = (text) => {
  const tokens = marked.lexer(text);
  const lines = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'heading':
        lines.push('');
        lines.push(chalk.bold.underline(renderInline(token.tokens)));
        break;

      case 'paragraph':
        lines.push(renderInline(token.tokens));
        lines.push('');
        break;

      case 'code': {
        const lang = token.lang ? chalk.dim(` ${token.lang}`) : '';
        lines.push(chalk.dim('  ┌─' + '─'.repeat(38)) + lang);
        for (const l of token.text.split('\n')) {
          lines.push(chalk.dim('  │ ') + l);
        }
        lines.push(chalk.dim('  └─' + '─'.repeat(38)));
        lines.push('');
        break;
      }

      case 'list':
        for (let idx = 0; idx < token.items.length; idx++) {
          const item = token.items[idx];
          const bullet = token.ordered ? chalk.dim(`  ${idx + 1}. `) : chalk.dim('  ● ');
          const content = item.tokens ? renderInline(item.tokens[0]?.tokens || []) : item.text;
          lines.push(bullet + content);
        }
        lines.push('');
        break;

      case 'blockquote':
        if (token.tokens) {
          for (const t of token.tokens) {
            if (t.type === 'paragraph') {
              lines.push(chalk.dim('  │ ') + chalk.italic(renderInline(t.tokens)));
            }
          }
          lines.push('');
        }
        break;

      case 'hr':
        lines.push(chalk.dim('─'.repeat(40)));
        lines.push('');
        break;

      case 'space':
        break;

      default:
        if (token.raw) lines.push(token.raw.trim());
        break;
    }
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
};
