import { useCallback, useEffect, useState } from "react";
import { fetchJSON } from "@/api/fetchJSON";

export interface TaskCategory {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export function useTaskCategories() {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJSON("/maintenance/task-categories");
      setCategories(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createCategory = useCallback(async (name: string): Promise<TaskCategory> => {
    const created: TaskCategory = await fetchJSON("/maintenance/task-categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setCategories((prev) => {
      const withoutExisting = prev.filter((c) => c.id !== created.id);
      return [...withoutExisting, created].sort((a, b) => a.name.localeCompare(b.name));
    });
    return created;
  }, []);

  const renameCategory = useCallback(async (id: number, name: string): Promise<TaskCategory> => {
    const updated: TaskCategory = await fetchJSON(`/maintenance/task-categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    setCategories((prev) =>
      prev
        .map((c) => (c.id === id ? updated : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
    return updated;
  }, []);

  const deactivateCategory = useCallback(async (id: number): Promise<void> => {
    await fetchJSON(`/maintenance/task-categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { categories, loading, refresh, createCategory, renameCategory, deactivateCategory };
}
