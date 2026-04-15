import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "path";
import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";

const ROOT = process.cwd();
const MEMORY_DIR = join(ROOT, "memory");
const TEXT_EXT = new Set([".md", ".txt", ".json", ".csv", ".log"]);

const toUnix = (value = "") => String(value).replace(/\\/g, "/");

const safeMemoryPath = (subPath = "") => {
  const base = resolve(MEMORY_DIR);
  const full = resolve(base, String(subPath || ""));
  if (full !== base && !full.startsWith(base + sep)) return null;
  return full;
};

const relMemoryPath = (fullPath) => {
  const rel = relative(resolve(MEMORY_DIR), fullPath);
  return rel ? toUnix(rel) : "";
};

const sortEntries = (entries = []) => {
  return [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name, "zh-Hans-CN");
  });
};

const buildTree = async (relPath = "") => {
  const fullPath = safeMemoryPath(relPath);
  if (!fullPath) return null;
  let entries = [];
  try {
    entries = await readdir(fullPath, { withFileTypes: true });
  } catch {
    return {
      name: relPath ? relPath.split("/").pop() : "memory",
      path: relPath,
      type: "dir",
      children: []
    };
  }

  const children = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const childRelPath = relPath ? `${relPath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      children.push(await buildTree(childRelPath));
      continue;
    }
    children.push({
      name: entry.name,
      path: childRelPath,
      type: "file"
    });
  }

  return {
    name: relPath ? relPath.split("/").pop() : "memory",
    path: relPath,
    type: "dir",
    children: sortEntries(children)
  };
};

const readMemoryFile = async (relPath = "") => {
  const fullPath = safeMemoryPath(relPath);
  if (!fullPath) return { status: 400, message: "invalid path" };
  const ext = extname(fullPath).toLowerCase();
  if (!TEXT_EXT.has(ext)) return { status: 400, message: "file type not supported" };
  try {
    const content = await readFile(fullPath, "utf8");
    const fileStat = await stat(fullPath);
    return {
      success: true,
      item: {
        name: fullPath.split(sep).pop(),
        path: relMemoryPath(fullPath),
        content,
        modified: fileStat.mtime.toISOString()
      }
    };
  } catch {
    return { status: 404, message: "file not found" };
  }
};

const saveMemoryFile = async (relPath = "", content = "") => {
  const fullPath = safeMemoryPath(relPath);
  if (!fullPath) return { status: 400, message: "invalid path" };
  const ext = extname(fullPath).toLowerCase();
  if (!TEXT_EXT.has(ext)) return { status: 400, message: "file type not supported" };
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, String(content || ""), "utf8");
  const fileStat = await stat(fullPath);
  return {
    success: true,
    item: {
      name: fullPath.split(sep).pop(),
      path: relMemoryPath(fullPath),
      modified: fileStat.mtime.toISOString()
    }
  };
};

const createMemoryFile = async (relPath = "", content = "") => {
  const fullPath = safeMemoryPath(relPath);
  if (!fullPath) return { status: 400, message: "invalid path" };
  const ext = extname(fullPath).toLowerCase();
  if (!TEXT_EXT.has(ext)) return { status: 400, message: "file type not supported" };
  try {
    await stat(fullPath);
    return { status: 409, message: "file already exists" };
  } catch {}
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, String(content || ""), "utf8");
  const fileStat = await stat(fullPath);
  return {
    success: true,
    item: {
      name: fullPath.split(sep).pop(),
      path: relMemoryPath(fullPath),
      modified: fileStat.mtime.toISOString()
    }
  };
};

const createMemoryDir = async (relPath = "") => {
  const fullPath = safeMemoryPath(relPath);
  if (!fullPath) return { status: 400, message: "invalid path" };
  try {
    await stat(fullPath);
    return { status: 409, message: "directory already exists" };
  } catch {}
  await mkdir(fullPath, { recursive: true });
  return {
    success: true,
    item: {
      name: fullPath.split(sep).pop(),
      path: relMemoryPath(fullPath),
      type: "dir"
    }
  };
};

const renameMemoryEntry = async (relPath = "", nextName = "") => {
  const sourcePath = safeMemoryPath(relPath);
  if (!sourcePath) return { status: 400, message: "invalid path" };
  const cleanName = String(nextName || "").trim();
  if (!cleanName || cleanName.includes("/") || cleanName.includes("\\")) {
    return { status: 400, message: "invalid name" };
  }
  let sourceStat;
  try {
    sourceStat = await stat(sourcePath);
  } catch {
    return { status: 404, message: "entry not found" };
  }
  if (sourceStat.isFile()) {
    const ext = extname(sourcePath).toLowerCase();
    if (!TEXT_EXT.has(ext)) return { status: 400, message: "file type not supported" };
  }
  const targetPath = safeMemoryPath(join(dirname(relPath), cleanName));
  if (!targetPath) return { status: 400, message: "invalid target path" };
  try {
    await stat(targetPath);
    return { status: 409, message: "target already exists" };
  } catch {}
  await rename(sourcePath, targetPath);
  return {
    success: true,
    item: {
      name: cleanName,
      path: relMemoryPath(targetPath),
      type: sourceStat.isDirectory() ? "dir" : "file"
    }
  };
};

const deleteMemoryEntry = async (relPath = "") => {
  const fullPath = safeMemoryPath(relPath);
  if (!fullPath || !relPath) return { status: 400, message: "invalid path" };
  let entryStat;
  try {
    entryStat = await stat(fullPath);
  } catch {
    return { status: 404, message: "entry not found" };
  }
  if (entryStat.isDirectory()) {
    const entries = await readdir(fullPath);
    if (entries.length) return { status: 409, message: "directory is not empty" };
    await rm(fullPath, { recursive: false, force: false });
    return { success: true };
  }
  const ext = extname(fullPath).toLowerCase();
  if (!TEXT_EXT.has(ext)) return { status: 400, message: "file type not supported" };
  await rm(fullPath, { force: false });
  return { success: true };
};

const handleMemoryApi = async (req, res, path) => {
  if (path === "/api/memory/tree" && req.method === "GET") {
    const tree = await buildTree("");
    return json(res, { success: true, tree });
  }
  if (path === "/api/memory/read" && req.method === "GET") {
    const url = new URL(req.url, "http://localhost");
    const data = await readMemoryFile(url.searchParams.get("path") || "");
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/api/memory/save" && req.method === "POST") {
    const body = await readBody(req);
    const data = await saveMemoryFile(body?.path, body?.content);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/api/memory/create-file" && req.method === "POST") {
    const body = await readBody(req);
    const data = await createMemoryFile(body?.path, body?.content);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/api/memory/create-dir" && req.method === "POST") {
    const body = await readBody(req);
    const data = await createMemoryDir(body?.path);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/api/memory/rename" && req.method === "POST") {
    const body = await readBody(req);
    const data = await renameMemoryEntry(body?.path, body?.name);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/api/memory/delete" && req.method === "POST") {
    const body = await readBody(req);
    const data = await deleteMemoryEntry(body?.path);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  return json(res, { success: false, message: "API endpoint not found" }, 404);
};

export {
  handleMemoryApi
};
