import type { Note } from "./types";

const BASE = "/apps/notepad/notes";

const readJson = async <T,>(response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data as T;
};

export const listNotes = async () => {
  const data = await readJson<{ notes: Note[] }>(await fetch(BASE));
  return data.notes;
};

export const createNote = async (content: string) => {
  await readJson(await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "", content }),
  }));
};

export const updateNote = async (id: number, content: string) => {
  await readJson(await fetch(`${BASE}?id=${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  }));
};

export const deleteNote = async (id: number) => {
  await readJson(await fetch(`${BASE}?id=${id}`, { method: "DELETE" }));
};
