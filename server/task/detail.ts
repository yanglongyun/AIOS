import { getTaskById } from '../repository/task/detail.ts';

export const getTaskDetail = ({ id }) => {
  return getTaskById(id);
};
