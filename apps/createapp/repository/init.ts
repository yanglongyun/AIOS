import { db } from './client.ts';

export const initCreateAppDatabase = () => {
  // createapp应用目前不需要特殊的数据表
  // 实际应用创建的数据存储在各自的数据库中
  console.log('CreateApp database initialized');
};
