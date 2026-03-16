import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SKILLS_ROOT = join(process.cwd(), 'skills');

export const skills = () => {
  if (!existsSync(SKILLS_ROOT)) return '';

  const sections = [];
  for (const dir of readdirSync(SKILLS_ROOT)) {
    const skillDir = join(SKILLS_ROOT, dir);
    try { if (!statSync(skillDir).isDirectory()) continue; } catch { continue; }

    const skillFile = join(skillDir, 'SKILL.md');
    if (!existsSync(skillFile)) continue;

    const content = readFileSync(skillFile, 'utf8').trim();
    if (!content) continue;

    sections.push(content);
  }

  if (sections.length === 0) return '';

  return `\n\n## Skills\n以下是可用技能的完整指令，直接按说明使用即可。\n\n${sections.join('\n\n---\n\n')}`;
};
