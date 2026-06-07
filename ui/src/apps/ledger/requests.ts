import type { LedgerEntry, LedgerSummary } from "./types";

const BASE = "/apps/ledger/entries";

const readJson = async <T,>(response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data as T;
};

export const listLedgerEntries = async () =>
  readJson<{ entries: LedgerEntry[]; summary: LedgerSummary }>(await fetch(BASE));

export const createLedgerEntry = async (entry: {
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
}) => {
  await readJson(await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  }));
};

export const deleteLedgerEntry = async (id: number) => {
  await readJson(await fetch(`${BASE}?id=${id}`, { method: "DELETE" }));
};
