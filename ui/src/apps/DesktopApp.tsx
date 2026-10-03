// 桌面:这台机器的图形桌面(noVNC),经 AIOS 的 /desktop/ 转发,不另开端口、不另输密码。
// AI 的 browser / computer 工具也在这个桌面上干活,切过来就能看着它操作。
import { useEffect, useState } from "react";
import { systemApi } from "../api/system";
import { Monitor, RotateCw } from "../components/ui/icons";
import type { AppProps } from "./types";

// resize=scale:按窗口等比缩放,手机上也能看全;reconnect:断了自动重连
const SRC = "/desktop/vnc.html?autoconnect=1&reconnect=1&reconnect_delay=1500&resize=scale&path=desktop/websockify";

export function DesktopApp({ active }: AppProps) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!active || available) return;
    void systemApi.desktop().then(setAvailable).catch(() => setAvailable(false));
  }, [active, nonce]);

  if (available === null) return <div className="flex flex-1 items-center justify-center text-[13px] text-text-faint">正在连接桌面…</div>;

  if (!available) {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-5 text-center">
        <Monitor size={30} className="text-text-faint" />
        <p className="text-[14px] text-text">这台机器还没有图形桌面</p>
        <p className="w-full max-w-md text-[12.5px] leading-relaxed text-text-faint">
          在服务器上重新运行安装脚本并加上 <code className="rounded bg-bg-inset px-1">AIOS_DESKTOP=1</code>,
          会装好桌面和远程桌面服务。装好后 AI 的 computer 工具也能用了。
        </p>
        <pre className="w-full max-w-md whitespace-pre-wrap break-all rounded-xl bg-bg-inset px-4 py-3 text-left text-[11.5px] text-text-dim select-all">curl -fsSL https://raw.githubusercontent.com/yanglongyun/AIOS/main/install.sh | sudo AIOS_DESKTOP=1 bash</pre>
        <button onClick={() => { setAvailable(null); setNonce((n) => n + 1); }}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-[13px] text-white hover:opacity-90">
          <RotateCw size={13} />重新检测
        </button>
      </div>
    );
  }

  return <iframe key={nonce} src={SRC} title="桌面" className="min-h-0 flex-1 border-0 bg-black" allow="clipboard-read; clipboard-write" />;
}
