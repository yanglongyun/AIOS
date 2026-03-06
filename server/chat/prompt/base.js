import { readFileSync } from 'fs';
import { join } from 'path';

const INSTRUCTION_PATH = join(process.cwd(), 'INSTRUCTION.md');
const MEMORY_INDEX_PATH = join(process.cwd(), 'memory/index.md');

export const getInstruction = () => {
  try {
    return readFileSync(INSTRUCTION_PATH, 'utf8').trim();
  } catch {
    return '你是 AIOS。';
  }
};

export const getMemoryIndexOverview = () => {
  try {
    return readFileSync(MEMORY_INDEX_PATH, 'utf8').trim();
  } catch {
    return null;
  }
};
