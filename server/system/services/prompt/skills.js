// @ts-nocheck
import fs from "fs";
import path from "path";

const SKILLS_ROOT = path.join(process.cwd(), "skills");

const parseSkillMd = (file) => {
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const meta = { name: "", description: "" };
  if (lines[0]?.trim() === "---") {
    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (line === "---") break;
      for (const key of Object.keys(meta)) {
        if (line.startsWith(`${key}:`)) meta[key] = line.slice(key.length + 1).trim();
      }
    }
  }
  const body = text.replace(/^---[\s\S]*?---\s*/, "").trim();
  return meta.name || meta.description || body ? { ...meta, body } : null;
};

const listSkills = () => {
  if (!fs.existsSync(SKILLS_ROOT)) return "";

  return fs.readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => parseSkillMd(path.join(SKILLS_ROOT, entry.name, "SKILL.md")))
    .filter(Boolean)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
};

const skills = () => {
  const list = listSkills();
  if (!list.length) return "";

  const items = list.map((skill, i) => {
    const name = skill.name || `skill-${i + 1}`;
    const description = skill.description ? ` — ${skill.description}` : "";
    return `${i + 1}. ${name}${description}`;
  });

  return `\n\n## 技能目录\n下面是当前系统可用技能。需要对应能力时,优先按技能说明执行;技能是能力说明,不是聊天内容。\n${items.join("\n")}`;
};

export { listSkills, skills };
