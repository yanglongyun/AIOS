import { listInstalledSkills } from "../skills/list.js";

const skills = () => {
  const list = listInstalledSkills();
  if (!list.length) return "";

  const lines = list.map((skill, index) => {
    const desc = skill.description ? ` - ${skill.description}` : "";
    const scripts = skill.scripts.length
      ? ` | scripts: ${skill.scripts.map((script) => `${skill.path}/scripts/${script}`).join(", ")}`
      : "";
    return `${index + 1}. ${skill.id} | ${skill.name}${desc} | doc: ${skill.docPath}${scripts}`;
  });

  return `

## 技能目录
已安装技能位于 skills/。需要使用某个技能时,先阅读对应 SKILL.md,再按说明通过 shell 或本地 API 调用。不要臆测未列出的技能。
${lines.join("\n")}`;
};

export {
  skills
};
