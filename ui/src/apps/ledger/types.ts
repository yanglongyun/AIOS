export type LedgerEntry = {
  id: number;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  occurred_on: string;
};

export type LedgerSummary = {
  income: number;
  expense: number;
  balance: number;
};

export type LedgerFormState = {
  type: "income" | "expense";
  amount: string;
  category: string;
  note: string;
};
