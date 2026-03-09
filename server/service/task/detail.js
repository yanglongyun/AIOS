import { getTaskById } from '../../repository/task/detail.js';

export const getTaskDetail = ({ id }) => {
  return getTaskById(id);
};
