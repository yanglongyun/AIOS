import { Plus } from "../../ui/icons";

export function PanelCreateAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 m-3 mb-2 h-11 self-start inline-flex items-center gap-2.5 rounded-full bg-bg-panel pl-4 pr-5 cursor-pointer select-none text-text-dim hover:bg-bg-hover"
    >
      <Plus size={18} className="shrink-0" />
      <span className="text-[14px]">{label}</span>
    </button>
  );
}
