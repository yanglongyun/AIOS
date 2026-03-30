import { listTaskSchedules } from "../../repository/task/schedule.js";
const listSchedules = ({ limit = 200 } = {}) => {
  return listTaskSchedules(limit);
};
export {
  listSchedules
};
