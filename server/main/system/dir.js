import { mkdirSync } from "fs";
import { join } from "path";
const ROOT_DIR = process.cwd();
const FILES_DIR = join(ROOT_DIR, "files");
const MEMORY_DIR = join(ROOT_DIR, "memory");
const initSystemDirs = () => {
  mkdirSync(join(FILES_DIR, "uploads"), { recursive: true });
  mkdirSync(join(FILES_DIR, "exports"), { recursive: true });
  mkdirSync(join(FILES_DIR, "tmp"), { recursive: true });
  mkdirSync(MEMORY_DIR, { recursive: true });
};
export {
  MEMORY_DIR,
  initSystemDirs
};
