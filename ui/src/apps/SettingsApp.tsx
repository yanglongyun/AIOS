import { useState } from "react";
import { type SkillInfo, skillsApi } from "../api/skills";
import { SettingsPanel } from "../components/settings/SettingsPanel";
import { renderMarkdown } from "../lib/markdown";
import { X } from "../components/ui/icons";
import type { AppProps } from "./types";

export function SettingsApp(_: AppProps) {
  const [skill, setSkill] = useState<{ info: SkillInfo; html: string } | null>(null);
  const openSkill = (info: SkillInfo) => {
    void skillsApi.skillDoc(info.id).then((r) => setSkill({ info, html: renderMarkdown(r.content) })).catch(() => {});
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SettingsPanel onOpenSkill={openSkill} onSaved={() => window.dispatchEvent(new Event("aios:settings-saved"))} />
      {skill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setSkill(null)}>
          <div className="flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-bg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="text-[14px] font-medium text-text">{skill.info.name}</span>
              <button onClick={() => setSkill(null)} className="rounded-full p-1.5 text-text-dim hover:bg-bg-hover"><X size={16} /></button>
            </header>
            <div className="prose min-h-0 overflow-y-auto px-6 py-4" dangerouslySetInnerHTML={{ __html: skill.html }} />
          </div>
        </div>
      )}
    </div>
  );
}
