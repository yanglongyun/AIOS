// 单 worker 串行队列：图片/语音/ffmpeg 都是重活，串行执行避免并发打爆接口或 CPU。
// 每个 job: { key, label, run }（run 为 async 函数）。key 用于去重，避免同一项目重复入队。

const queue = [];
const queued = new Set();
let working = false;

const pump = async () => {
  if (working) return;
  working = true;
  while (queue.length) {
    const job = queue.shift();
    queued.delete(job.key);
    try {
      await job.run();
    } catch (err) {
      console.error("[longvideo:queue]", job.label || job.key, err?.message || err);
    }
  }
  working = false;
};

// 入队；若同 key 的任务已在队列中（尚未开始执行）则跳过，返回是否真正入队。
const enqueue = (job) => {
  if (job.key && queued.has(job.key)) return false;
  if (job.key) queued.add(job.key);
  queue.push(job);
  pump();
  return true;
};

const isQueued = (key) => queued.has(key);

export { enqueue, isQueued };
