import { listSkills } from "../service/skills/list.js";
const skills = () => {
  const sections = listSkills().map((skill) => skill.content);
  if (sections.length === 0) return "";
  return `

## Skills
The following are the full instructions for available skills. Use them directly as written.

${sections.join("\n\n---\n\n")}`;
};
export {
  skills
};
