import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const I18N_DIR = join(ROOT, 'shared/i18n');

const lang = process.argv[2];
if (!lang) {
  console.error('Usage: tsx scripts/apply-locale.ts <lang>');
  console.error('Example: tsx scripts/apply-locale.ts zh');
  process.exit(1);
}

const langDir = join(I18N_DIR, lang);
try {
  statSync(langDir);
} catch {
  const available = readdirSync(I18N_DIR).filter(f => statSync(join(I18N_DIR, f)).isDirectory());
  console.error(`Language "${lang}" not found. Available: ${available.join(', ')}`);
  process.exit(1);
}

// Recursively read all JSON files under shared/i18n/{lang}/ and merge
const messages: Record<string, string> = {};

const loadDir = (dir: string) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      loadDir(full);
    } else if (entry.endsWith('.json')) {
      const obj = JSON.parse(readFileSync(full, 'utf8'));
      Object.assign(messages, obj);
    }
  }
};

loadDir(langDir);
console.log(`Loaded ${Object.keys(messages).length} keys for "${lang}"`);

// Collect all vue and ts files under ui/src/
const files = execSync('find ui/src -name "*.vue" -o -name "*.ts"', { cwd: ROOT, encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);

let totalReplacements = 0;

for (const rel of files) {
  const filePath = join(ROOT, rel);
  const content = readFileSync(filePath, 'utf8');

  const replaced = content.replace(/__T_([A-Z0-9_]+)__/g, (match, rawKey) => {
    const key = rawKey.toLowerCase();
    if (key in messages) {
      totalReplacements++;
      return messages[key];
    }
    console.warn(`  WARN: key "${key}" not found in ${lang} (file: ${rel})`);
    return match;
  });

  if (replaced !== content) {
    writeFileSync(filePath, replaced);
    console.log(`  ${rel}`);
  }
}

console.log(`\nDone. ${totalReplacements} replacements in ${lang}.`);
