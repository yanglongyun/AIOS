import type { ReactNode } from "react";

/** 内置应用的左栏:宽屏常驻;窄屏是盖在内容上的抽屉,点遮罩收起。 */
export function SideRail({ open, collapsed = false, onClose, children }: { open: boolean; collapsed?: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <>
      {open && <div className="fixed inset-0 top-14 z-30 bg-black/20 md:hidden" onClick={onClose} />}
      <aside className={`${open ? "flex" : "hidden"} fixed bottom-0 left-0 top-14 z-40 w-[300px] max-w-[85vw] flex-col rounded-r-3xl bg-bg-raised shadow-xl
        md:static md:z-auto ${collapsed ? "md:hidden" : "md:flex"} md:w-[288px] md:max-w-none md:rounded-none md:shadow-none`}>
        {children}
      </aside>
    </>
  );
}
