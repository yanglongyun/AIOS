import { useEffect, useState, type ComponentType } from "react";
import { getApp } from "../../apps/registry";

const errorClass = "m-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400";

// 按 id 动态加载并挂载一个 app 组件。
export function AppHost({ id }: { id: string }) {
  const [Comp, setComp] = useState<ComponentType | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const app = getApp(id);
    setComp(null);
    setError("");
    if (!app) {
      setError(`应用不存在: ${id}`);
      return;
    }
    app
      .load()
      .then((mod) => {
        if (alive) setComp(() => mod.default);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "加载失败");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="flex-1 min-h-0 grid place-items-center p-6 text-center">
        <p className={errorClass}>{error}</p>
      </div>
    );
  }
  if (!Comp) {
    return (
      <div className="flex-1 min-h-0 grid place-items-center text-sm text-slate-400 dark:text-neutral-500">加载中…</div>
    );
  }
  return <Comp />;
}
