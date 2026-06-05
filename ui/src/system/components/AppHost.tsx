import { useEffect, useState, type ComponentType } from "react";
import { getApp } from "../../apps/registry";

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
        <p className="inline-error">{error}</p>
      </div>
    );
  }
  if (!Comp) {
    return (
      <div className="flex-1 min-h-0 grid place-items-center text-text-faint text-sm">加载中…</div>
    );
  }
  return <Comp />;
}
