import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const SKILLS_ROOT = join(process.cwd(), "skills");

const parseFrontmatter = (text) => {
  const meta = {};
  if (!text.startsWith("---")) return meta;
  const end = text.indexOf("\n---", 3);
  if (end < 0) return meta;
  for (const line of text.slice(3, end).split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) meta[match[1]] = match[2].trim();
  }
  return meta;
};

const listSkillScripts = (dir) => {
  const scriptsDir = join(dir, "scripts");
  if (!existsSync(scriptsDir)) return [];
  return readdirSync(scriptsDir)
    .filter((name) => {
      try {
        return statSync(join(scriptsDir, name)).isFile();
      } catch {
        return false;
      }
    })
    .sort();
};

const readSkill = (id) => {
  const dir = join(SKILLS_ROOT, id);
  const file = join(dir, "SKILL.md");
  if (!statSync(dir).isDirectory() || !existsSync(file)) return null;
  const meta = parseFrontmatter(readFileSync(file, "utf8"));
  return {
    id,
    name: meta.name || id,
    description: meta.description || "",
    path: `skills/${id}`,
    docPath: `skills/${id}/SKILL.md`,
    scripts: listSkillScripts(dir),
    updatedAt: statSync(file).mtime.toISOString()
  };
};

const listInstalledSkills = () => {
  if (!existsSync(SKILLS_ROOT)) return [];
  return readdirSync(SKILLS_ROOT)
    .map((id) => {
      try {
        return readSkill(id);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
};

export {
  listInstalledSkills
};
