import { useEffect, useState, useRef } from "react";
import { checkConflicts, type BusyUser } from "@/data/availability";

export function useConflictCheck(
  userIds: number[],
  start: string | undefined,
  end: string | undefined,
) {
  const [conflicts, setConflicts] = useState<BusyUser[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Need at least one user and valid dates
    if (!userIds.length || !start || !end) {
      setConflicts([]);
      return;
    }

    // Debounce 500ms
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await checkConflicts(userIds, start, end);
        setConflicts(result.conflicts || []);
      } catch {
        setConflicts([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userIds.join(","), start, end]);

  return { conflicts, loading, hasConflicts: conflicts.length > 0 };
}
