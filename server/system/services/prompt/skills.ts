// @ts-nocheck
import fs from "fs";
import path from "path";

const SKILLS_DIR = path.join(process.cwd(), "skills");

const firstParagraph = (content) => {
  const lines = String(content || "").split(/\r?\n/);
  const descriptionIndex = lines.findIndex((line) => line.trim().toLowerCase() === "## description");
  if (descriptionIndex < 0) return "";
  const out = [];
  for (const line of lines.slice(descriptionIndex + 1)) {
    const value = line.trim();
    if (value.startsWith("## ")) break;
    if (value) out.push(value);
  }
  return out.join(" ");
};

const listSkillSummaries = () => {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const name = entry.name;
      const file = path.join(SKILLS_DIR, name, "SKILL.md");
      if (!fs.existsSync(file)) return null;
      const content = fs.readFileSync(file, "utf8");
      return {
        name,
        path: path.relative(process.cwd(), file),
        description: firstParagraph(content),
      };
    })
    .filter(Boolean);
};

const skills = () => {
  const summaries = listSkillSummaries();
  if (summaries.length === 0) {
    return "";
  }

  const items = summaries
    .map((skill) => `- ${skill.name}: ${skill.description || "No description."} (${skill.path})`)
    .join("\n");

  return `

## Skills
本地 skills 目录提供任务处理说明。只在任务明显匹配时使用；匹配后遵循对应 SKILL.md 的流程和约束。Skill 是提示词机制，不是工具。

Available skills:
${items}`;
};

export { listSkillSummaries, skills };
