import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import type { Task } from "../api";

type TaskState = {
  currentId: number | null;
  current: Task | null;
  setCurrentTask: (id: number, task?: Task | null) => void;
  clearCurrentTask: () => void;
};

const TaskContext = createContext<TaskState | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [current, setCurrent] = useState<Task | null>(null);

  const value = useMemo<TaskState>(
    () => ({
      currentId,
      current,
      setCurrentTask: (id, task = null) => {
        setCurrentId(id ?? null);
        setCurrent(task);
      },
      clearCurrentTask: () => {
        setCurrentId(null);
        setCurrent(null);
      },
    }),
    [current, currentId],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export const useTask = () => {
  const value = useContext(TaskContext);
  if (!value) throw new Error("useTask must be used inside TaskProvider");
  return value;
};
