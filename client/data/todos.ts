import { fetchJSON } from "@/api/fetchJSON";

export type Priority = "none" | "low" | "normal" | "high";

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  notes: string;
  due_date: string | null;               // "YYYY-MM-DD"
  due_time: string | null;               // "HH:MM"
  reminder_offset_minutes: number | null;
  reminder_fired_at: string | null;
  priority: Priority;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TodoPayload {
  title: string;
  notes?: string;
  due_date?: string | null;
  due_time?: string | null;
  reminder_offset_minutes?: number | null;
  priority?: Priority;
  completed_at?: string | null;
}

export async function listTodos(status: "open" | "completed" | "all" = "all"): Promise<Todo[]> {
  const data = await fetchJSON(`/todos?status=${status}`);
  return data ?? [];
}

export async function createTodo(payload: TodoPayload): Promise<Todo> {
  return fetchJSON("/todos", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateTodo(id: number, payload: TodoPayload): Promise<Todo> {
  return fetchJSON(`/todos/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteTodo(id: number): Promise<void> {
  await fetchJSON(`/todos/${id}`, { method: "DELETE" });
}
