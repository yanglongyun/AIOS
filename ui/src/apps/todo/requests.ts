import type { Todo } from "./types";

const BASE = "/apps/todo/todos";

const readJson = async <T,>(response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data as T;
};

export const listTodos = async () => {
  const data = await readJson<{ todos: Todo[] }>(await fetch(BASE));
  return data.todos;
};

export const createTodo = async (text: string) => {
  await readJson(await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }));
};

export const updateTodoDone = async (id: number, done: boolean) => {
  await readJson(await fetch(`${BASE}?id=${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  }));
};

export const deleteTodo = async (id: number) => {
  await readJson(await fetch(`${BASE}?id=${id}`, { method: "DELETE" }));
};
