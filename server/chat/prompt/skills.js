import { listSkills } from '../../service/skills/list.js';

export const skills = () => {
  const list = listSkills();
  if (list.length === 0) return '';

  const lines = list.map((s, i) => {
    const desc = s.description ? ` - ${s.description}` : '';
    return `${i + 1}. ${s.name || s.id}${desc}`;
  });

  return `\n\n## Skills\n系统根目录 skills/ 文件夹包含可用技能，每个技能一个目录，内含 SKILL.md（指令）及可选的 scripts/、references/、assets/ 子目录。需要使用某个技能时，读取对应目录的 SKILL.md 获取完整指令。\n${lines.join('\n')}`;
};
