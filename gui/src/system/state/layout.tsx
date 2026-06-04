import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

type LayoutState = {
  mainNavCollapsed: boolean;
  chatListCollapsed: boolean;
  tasksListCollapsed: boolean;
  mobileNavOpen: boolean;
  mobileChatListOpen: boolean;
  mobileTasksListOpen: boolean;
  toggleMainNav: () => void;
  toggleChatList: () => void;
  toggleTasksList: () => void;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  openMobileChatList: () => void;
  closeMobileChatList: () => void;
  openMobileTasksList: () => void;
  closeMobileTasksList: () => void;
};

const readBool = (key: string, fallback: boolean) => {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === "1";
  } catch {
    return fallback;
  }
};

const saveBool = (key: string, value: boolean) => {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* ignore */
  }
};

const LayoutContext = createContext<LayoutState | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [mainNavCollapsed, setMainNavCollapsed] = useState(() => readBool("layout.mainNav", false));
  const [chatListCollapsed, setChatListCollapsed] = useState(() => readBool("layout.chatList", false));
  const [tasksListCollapsed, setTasksListCollapsed] = useState(() => readBool("layout.tasksList", false));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileChatListOpen, setMobileChatListOpen] = useState(false);
  const [mobileTasksListOpen, setMobileTasksListOpen] = useState(false);

  const value = useMemo<LayoutState>(
    () => ({
      mainNavCollapsed,
      chatListCollapsed,
      tasksListCollapsed,
      mobileNavOpen,
      mobileChatListOpen,
      mobileTasksListOpen,
      toggleMainNav: () =>
        setMainNavCollapsed((current) => {
          saveBool("layout.mainNav", !current);
          return !current;
        }),
      toggleChatList: () =>
        setChatListCollapsed((current) => {
          saveBool("layout.chatList", !current);
          return !current;
        }),
      toggleTasksList: () =>
        setTasksListCollapsed((current) => {
          saveBool("layout.tasksList", !current);
          return !current;
        }),
      openMobileNav: () => {
        setMobileNavOpen(true);
        setMobileChatListOpen(false);
        setMobileTasksListOpen(false);
      },
      closeMobileNav: () => setMobileNavOpen(false),
      openMobileChatList: () => {
        setMobileChatListOpen(true);
        setMobileNavOpen(false);
        setMobileTasksListOpen(false);
      },
      closeMobileChatList: () => setMobileChatListOpen(false),
      openMobileTasksList: () => {
        setMobileTasksListOpen(true);
        setMobileNavOpen(false);
        setMobileChatListOpen(false);
      },
      closeMobileTasksList: () => setMobileTasksListOpen(false),
    }),
    [
      chatListCollapsed,
      mainNavCollapsed,
      mobileChatListOpen,
      mobileNavOpen,
      mobileTasksListOpen,
      tasksListCollapsed,
    ],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export const useLayout = () => {
  const value = useContext(LayoutContext);
  if (!value) throw new Error("useLayout must be used inside LayoutProvider");
  return value;
};
