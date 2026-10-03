export type Socket = { send: (m: any) => void; on: (t: string, fn: (p: any) => void) => () => void };

/** 壳交给每个内置应用的东西。navOpen:窄屏时左栏是否展开(宽屏左栏常驻)。 */
export type AppProps = {
  socket: Socket;
  active: boolean;
  navOpen: boolean;
  /** 宽屏上左栏是否收起(汉堡切换) */
  railCollapsed: boolean;
  onCloseNav: () => void;
};
