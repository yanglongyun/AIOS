import { handleConfigApi } from './config/index.js';
import { handleReportApi } from './report/index.js';

export const handleBriefingApi = async (ctx) => {
  const configResult = await handleConfigApi(ctx);
  if (configResult !== false) return configResult;

  const reportResult = await handleReportApi(ctx);
  if (reportResult !== false) return reportResult;

  return false;
};

