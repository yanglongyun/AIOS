export type Task = {
  id: number;
  name: string;
  prompt?: string;
  detail?: string;
  status: string;
  response?: string;
  error?: string;
  chat_id?: string;
  created_at?: string;
  finished_at?: string;
};
