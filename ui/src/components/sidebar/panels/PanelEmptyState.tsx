import type { ReactNode } from "react";

export function PanelEmptyState({ title, description, action, icon, onAction }: {
  title: string;
  description: string;
  action: string;
  icon: ReactNode;
  onAction: () => void;
}) {
  return (
    <div className="px-4 py-10 flex flex-col items-center text-center">
      <div className="text-[13px] text-text-dim">{title}</div>
      <div className="mt-1 min-h-[3.25em] text-[11.5px] text-text-faint leading-relaxed">{description}</div>
      <button
        onClick={onAction}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white text-[14px] font-medium hover:opacity-90 transition-opacity"
      >
        {icon} {action}
      </button>
    </div>
  );
}
