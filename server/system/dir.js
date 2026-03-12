import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = process.cwd();
const FILES_DIR = join(ROOT_DIR, 'files');
const FILES_UPLOADS_DIR = join(FILES_DIR, 'uploads');
const FILES_EXPORTS_DIR = join(FILES_DIR, 'exports');
const FILES_TMP_DIR = join(FILES_DIR, 'tmp');
const MEMORY_DIR = join(ROOT_DIR, 'memory');
const MEMORY_INDEX_PATH = join(MEMORY_DIR, 'index.md');
const CREATE_APP_PATH = join(MEMORY_DIR, 'create-app.md');

const DEFAULT_CREATE_APP = `---
description: 创建应用前必读的基础约束与交付要求
---

# create-app

- 创建应用前先阅读目标应用的 \`APP.md\` 与当前系统架构（\`ui/\`、\`apps/\`、\`server/\`）。
- 交付必须包含：API 路由、service、repository、前端入口（如需要）、数据初始化（如需要）。
- 禁止半成品：不得只做页面或只做接口。
- 默认遵循项目硬规则：单一路径、无兜底、开发期不做数据兼容。
`;

const DEFAULT_INDEX = `# Memory Index

- [create-app.md](./create-app.md): 创建应用前的必读规则与最小交付标准。
`;

const ensureFile = (filePath, content) => {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, content, 'utf8');
    return;
  }
  const text = readFileSync(filePath, 'utf8').trim();
  if (!text) writeFileSync(filePath, content, 'utf8');
};

export const initSystemDirs = () => {
  mkdirSync(FILES_UPLOADS_DIR, { recursive: true });
  mkdirSync(FILES_EXPORTS_DIR, { recursive: true });
  mkdirSync(FILES_TMP_DIR, { recursive: true });
  mkdirSync(MEMORY_DIR, { recursive: true });
  ensureFile(CREATE_APP_PATH, DEFAULT_CREATE_APP);
  ensureFile(MEMORY_INDEX_PATH, DEFAULT_INDEX);
};
