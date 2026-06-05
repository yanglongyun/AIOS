import { useEffect, useState } from "react";
import type { Skill } from "../api";
import { api } from "../api";

export function SkillsView() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [errorText, setErrorText] = useState("");

  const refresh = async () => {
    setErrorText("");
    try {
      const result = await api.listSkills();
      setSkills(result.skills || []);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "加载失败");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-5 py-6 flex flex-col gap-5">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-3 min-w-0">
            <h2 className="m-0 text-2xl font-semibold text-text leading-tight">技能</h2>
            <p className="m-0 text-sm text-text-mute">本地 SKILL.md · 共 {skills.length} 项</p>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={refresh}>刷新</button>
        </header>

        {errorText ? <p className="inline-error">{errorText}</p> : null}

        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
          {skills.map((skill) => (
            <article key={skill.name} className="rounded-xl border border-border-soft bg-bg-raised p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="m-0 text-base font-semibold text-text truncate">{skill.name}</h3>
                  <p className="m-0 mt-1 text-xs text-text-faint font-mono truncate">{skill.path}</p>
                </div>
                <span className="badge badge-success">已加载</span>
              </div>
              <p className="m-0 text-sm text-text-dim leading-relaxed">{skill.description || "暂无说明"}</p>
            </article>
          ))}
        </div>

        {skills.length === 0 ? (
          <div className="empty">
            <div className="text-text-dim font-medium">暂无技能</div>
            <div className="text-xs text-text-faint">在 skills 目录添加 SKILL.md 后会显示在这里</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
