import { listSkills } from '../service/skills/list.ts';

export const skills = () => {
  const sections = listSkills().map((skill) => skill.content);

  if (sections.length === 0) return '';

  return `\n\n## Skills\n以下是可用技能的完整指令，直接按说明使用即可。\n\n${sections.join('\n\n---\n\n')}`;
};
