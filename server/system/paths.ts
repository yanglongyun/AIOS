// 两个根,分开说:
//   REPO_ROOT —— 代码在哪(仓库根)
//   DATA_HOME —— 数据在哪(database/、auth.json、apps/、skills/ ……),默认 ~/.aios,不落进仓库
import fs from "node:fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.join(__dirname, "../..");
export const DATA_HOME = path.resolve(process.env.AIOS_HOME || path.join(os.homedir(), ".aios"));

export const productHome = () => { fs.mkdirSync(DATA_HOME, { recursive: true }); return DATA_HOME; };
