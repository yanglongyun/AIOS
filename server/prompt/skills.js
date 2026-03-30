import { listSkills } from "../service/skills/list.js";
const skills = () => {
  const sections = listSkills().map((skill) => skill.content);
  if (sections.length === 0) return "";
  return `

## Skills
\u4EE5\u4E0B\u662F\u53EF\u7528\u6280\u80FD\u7684\u5B8C\u6574\u6307\u4EE4\uFF0C\u76F4\u63A5\u6309\u8BF4\u660E\u4F7F\u7528\u5373\u53EF\u3002

${sections.join("\n\n---\n\n")}`;
};
export {
  skills
};
