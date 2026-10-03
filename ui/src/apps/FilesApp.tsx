// 文件:左栏常用文件夹的树,右边预览/编辑。对话里点到的路径也在这里打开。
import { useEffect, useRef, useState } from "react";
import { type FileNode, filesApi } from "../api/files";
import { FilePanel } from "../components/files/FilePanel";
import { FilesPanel } from "../components/sidebar/panels/FilesPanel";
import { dialog, showToast } from "../components/ui";
import { FileText, Folder } from "../components/ui/icons";
import { SideRail } from "./SideRail";
import type { AppProps } from "./types";

export function FilesApp({ socket, active, navOpen, onCloseNav, openRequest }: AppProps & { openRequest: { path: string; seq: number } | null }) {
  const [node, setNode] = useState<FileNode | null>(null);
  const [treeRefresh, setTreeRefresh] = useState(0);
  const [fileRefresh, setFileRefresh] = useState(0);
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const dirtyRef = useRef(false);
  const nodeRef = useRef<FileNode | null>(null);
  nodeRef.current = node;

  const select = async (next: FileNode | null) => {
    if (dirtyRef.current && next?.id !== nodeRef.current?.id
      && !(await dialog.confirm("有未保存的修改,确定离开?", { danger: true, confirmText: "离开" }))) return;
    dirtyRef.current = false;
    setDraft(undefined);
    setNode(next);
    if (next?.kind === "file") onCloseNav();
  };

  // 别的应用让打开某个路径(对话里点了文件链接)
  useEffect(() => {
    if (!openRequest?.path) return;
    filesApi.getNode(openRequest.path)
      .then((r) => void select(r.item))
      .catch(() => showToast(`找不到 ${openRequest.path}`));
  }, [openRequest?.seq]);

  // 磁盘变化:树节流刷新;当前文件被改了且没有本地修改 → 重新读
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return socket.on("tree_changed", (p: any) => {
      if (!timer) timer = setTimeout(() => { timer = null; setTreeRefresh((n) => n + 1); }, 300);
      const current = nodeRef.current;
      if (!current || current.kind !== "file" || dirtyRef.current) return;
      const paths: string[] | null = Array.isArray(p?.paths) ? p.paths.map(String) : p?.item?.id ? [String(p.item.id)] : null;
      if (!paths || paths.some((x) => x === current.id || current.id.startsWith(x.endsWith("/") ? x : x + "/"))) setFileRefresh((n) => n + 1);
    });
  }, [socket]);

  return (
    <div className="flex min-h-0 flex-1">
      <SideRail open={navOpen} onClose={onCloseNav}>
        <FilesPanel active={active} selectedId={node?.id || ""} onSelect={(n) => void select(n)}
          refreshKey={treeRefresh} onChanged={() => setTreeRefresh((n) => n + 1)} />
      </SideRail>
      <main className="flex min-w-0 flex-1 flex-col">
        {node?.kind === "file" ? (
          <FilePanel key={node.id} node={node} draft={draft} refreshKey={fileRefresh}
            onChange={(value) => { dirtyRef.current = true; setDraft(value); }}
            onSaved={() => { dirtyRef.current = false; setDraft(undefined); }} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-text-faint">
            {node ? <Folder size={30} /> : <FileText size={30} />}
            <p className="text-[13px]">{node ? node.id : "在左边选一个文件查看或编辑"}</p>
          </div>
        )}
      </main>
    </div>
  );
}
