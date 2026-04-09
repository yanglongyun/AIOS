const parseSqlDate = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = value instanceof Date ? value : parseSqlDate(value);
  if (!date) return "-";
  return date.toLocaleString();
};

const formatCompactDateTime = (value) => {
  const date = value instanceof Date ? value : parseSqlDate(value);
  if (!date) return "-";
  return date.toLocaleString([], {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatRelativeTime = (value, now = new Date()) => {
  const date = value instanceof Date ? value : parseSqlDate(value);
  if (!date) return "";
  const diffMs = date.getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  const minute = 60 * 1e3;
  const hour = 60 * minute;
  const day = 24 * hour;
  const suffix = diffMs >= 0 ? "后" : "前";
  if (abs < minute) return diffMs >= 0 ? "即将执行" : "刚刚";
  if (abs < hour) return `${Math.round(abs / minute)} 分钟${suffix}`;
  if (abs < day) return `${Math.round(abs / hour)} 小时${suffix}`;
  return `${Math.round(abs / day)} 天${suffix}`;
};

const cronFieldMatch = (field, value) => {
  if (field === "*") return true;
  if (field.startsWith("*/")) {
    const step = Number.parseInt(field.slice(2), 10);
    return step > 0 && value % step === 0;
  }
  return field.split(",").map((item) => Number(item)).includes(value);
};

const cronMatches = (expr, date) => {
  const parts = String(expr || "").trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [minute, hour, day, month, weekday] = parts;
  return cronFieldMatch(minute, date.getMinutes()) &&
    cronFieldMatch(hour, date.getHours()) &&
    cronFieldMatch(day, date.getDate()) &&
    cronFieldMatch(month, date.getMonth() + 1) &&
    cronFieldMatch(weekday, date.getDay());
};

const nextCronOccurrence = (expr, now = new Date()) => {
  const cursor = new Date(now);
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);
  const maxChecks = 60 * 24 * 90;
  for (let i = 0; i < maxChecks; i += 1) {
    if (cronMatches(expr, cursor)) return new Date(cursor);
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return null;
};

const getNextRunAt = (schedule, now = new Date()) => {
  if (!Number(schedule?.enabled)) return null;
  if (schedule?.run_at) {
    const runAt = parseSqlDate(schedule.run_at);
    if (!runAt || runAt.getTime() < now.getTime()) return null;
    return runAt;
  }
  if (schedule?.cron) return nextCronOccurrence(schedule.cron, now);
  return null;
};

const scheduleModeLabel = (schedule) => {
  if (schedule?.cron) return "循环";
  if (schedule?.run_at) return "定时";
  return "任务";
};

const buildFutureSchedules = (schedules = [], now = new Date()) => {
  return schedules
    .map((schedule) => {
      const nextRunAt = getNextRunAt(schedule, now);
      return {
        ...schedule,
        nextRunAt,
        nextRunLabel: nextRunAt ? formatCompactDateTime(nextRunAt) : "已暂停",
        countdownLabel: nextRunAt ? formatRelativeTime(nextRunAt, now) : "不会自动执行",
        modeLabel: scheduleModeLabel(schedule),
        lastRunLabel: schedule.last_run_at ? formatCompactDateTime(schedule.last_run_at) : "从未执行"
      };
    })
    .filter((schedule) => schedule.nextRunAt)
    .sort((a, b) => a.nextRunAt.getTime() - b.nextRunAt.getTime());
};

const buildArchivedSchedules = (schedules = [], now = new Date()) => {
  return schedules
    .map((schedule) => ({
      ...schedule,
      nextRunAt: getNextRunAt(schedule, now),
      modeLabel: scheduleModeLabel(schedule),
      lastRunLabel: schedule.last_run_at ? formatCompactDateTime(schedule.last_run_at) : "从未执行"
    }))
    .filter((schedule) => !schedule.nextRunAt)
    .sort((a, b) => {
      const aTime = parseSqlDate(a.updated_at)?.getTime() || 0;
      const bTime = parseSqlDate(b.updated_at)?.getTime() || 0;
      return bTime - aTime;
    });
};

const buildHistoryTasks = (tasks = []) => {
  return [...tasks]
    .map((task) => ({
      ...task,
      createdLabel: formatCompactDateTime(task.created_at),
      finishedLabel: task.finished_at ? formatCompactDateTime(task.finished_at) : "",
      statusLabel: task.status === "pending" ? "进行中" : task.status === "done" ? "已完成" : "异常"
    }))
    .sort((a, b) => {
      const aTime = parseSqlDate(a.finished_at || a.created_at)?.getTime() || 0;
      const bTime = parseSqlDate(b.finished_at || b.created_at)?.getTime() || 0;
      return bTime - aTime;
    });
};

const scheduleChipTone = (schedule) => {
  if (!Number(schedule?.enabled)) return "muted";
  if (schedule?.cron) return "green";
  return "amber";
};

const taskStatusTone = (task) => {
  if (task?.status === "pending") return "pending";
  if (task?.status === "done") return "done";
  return "error";
};

export {
  buildArchivedSchedules,
  buildFutureSchedules,
  buildHistoryTasks,
  formatCompactDateTime,
  formatDateTime,
  formatRelativeTime,
  getNextRunAt,
  parseSqlDate,
  scheduleChipTone,
  scheduleModeLabel,
  taskStatusTone
};
