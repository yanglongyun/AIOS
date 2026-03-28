import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { globSync } from 'fs';

const ROOT = join(import.meta.dirname, '..');
const I18N_PATH = join(ROOT, 'shared/i18n.json');

const lang = process.argv[2];
if (!lang) {
  console.error('Usage: tsx scripts/apply-locale.ts <lang>');
  console.error('Example: tsx scripts/apply-locale.ts zh');
  process.exit(1);
}

const allMessages = JSON.parse(readFileSync(I18N_PATH, 'utf8'));
const messages = allMessages[lang];
if (!messages) {
  console.error(`Language "${lang}" not found in ${I18N_PATH}`);
  console.error(`Available: ${Object.keys(allMessages).join(', ')}`);
  process.exit(1);
}

// Collect all vue and ts files under ui/src/
import { execSync } from 'child_process';
const files = execSync('find ui/src -name "*.vue" -o -name "*.ts" | grep -v "i18n/"', { cwd: ROOT, encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);

let totalReplacements = 0;

for (const rel of files) {
  const filePath = join(ROOT, rel);
  let content = readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace __T_KEY__ with translated text
  const replaced = content.replace(/__T_([A-Z0-9_]+)__/g, (match, rawKey) => {
    const key = rawKey.toLowerCase();
    if (key in messages) {
      changed = true;
      totalReplacements++;
      return messages[key];
    }
    console.warn(`  WARN: key "${key}" not found in ${lang} messages (file: ${rel})`);
    return match;
  });

  if (changed) {
    writeFileSync(filePath, replaced);
    console.log(`  ${rel}`);
  }
}

console.log(`\nDone. ${totalReplacements} replacements in ${lang}.`);
