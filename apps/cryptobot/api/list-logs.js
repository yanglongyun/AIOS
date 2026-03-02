import { listLogs } from '../service.js';

export const listLogsHandler = ({ limit }) => listLogs({ limit });
