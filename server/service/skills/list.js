import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SKILLS_ROOT = join(process.cwd(), 'skills');

const parseFrontmatter = (filePath) => {
  if (!existsSync(filePath)) return null;
  const text = readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') return null;

  let name = '';
  let description = '';
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '---') break;
    if (line.startsWith('name:')) name = line.replace(/^name:\s*/, '').replace(/^["']|["']$/g, '').trim();
    if (line.startsWith('description:')) description = line.replace(/^description:\s*/, '').replace(/^["']|["']$/g, '').trim();
  }
  if (!name && !description) return null;
  return { name, description };
};

export const listSkills = () => {
  if (!existsSync(SKILLS_ROOT)) return [];

  const list = [];
  for (const dir of readdirSync(SKILLS_ROOT)) {
    const skillDir = join(SKILLS_ROOT, dir);
    try { if (!statSync(skillDir).isDirectory()) continue; } catch { continue; }

    const meta = parseFrontmatter(join(skillDir, 'SKILL.md'));
    if (!meta) continue;
    list.push({ id: dir, ...meta });
  }
  list.sort((a, b) => a.id.localeCompare(b.id));
  return list;
};
