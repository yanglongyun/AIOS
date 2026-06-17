// @ts-nocheck
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../skills");

const parseFrontmatter = (content) => {
  if (!content.startsWith("---")) return {};
  const end = content.indexOf("\n---", 3);
  if (end < 0) return {};
  const meta = {};
  for (const line of content.slice(3, end).split(/\r?\n/)) {
    const index = line.indexOf(":");
    if (index < 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key) meta[key] = value;
  }
  return meta;
};

const readSkillFile = async (dir) => {
  const file = path.join(ROOT, dir, "SKILL.md");
  const content = await fs.readFile(file, "utf8");
  const meta = parseFrontmatter(content);
  const [firstLine, ...rest] = content.split(/\r?\n/);
  const name = meta.name || (firstLine?.startsWith("#") ? firstLine.replace(/^#+\s*/, "").trim() : dir);
  const description = meta.description || rest.find((line) => line.trim() && !line.startsWith("#") && line.trim() !== "---")?.trim() || "";
  return { id: dir, name: name || dir, description, path: file, content };
};

const listSkills = async () => {
  await fs.mkdir(ROOT, { recursive: true });
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  const skills = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const skill = await readSkillFile(entry.name);
      skills.push({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        path: skill.path,
      });
    } catch {
      // Directories without SKILL.md are not skills.
    }
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
};

const getSkill = async (id) => {
  const clean = String(id || "").trim();
  if (!clean || clean.includes("/") || clean.includes("..")) return null;
  try {
    return await readSkillFile(clean);
  } catch {
    return null;
  }
};

export { getSkill, listSkills };
