import { fetchJSON } from "@/api/fetchJSON";

export interface UserAvailability {
  id: number;
  user_id: number;
  calendar_event_id?: number;
  start_at: string;
  end_at: string;
  availability_type: string; // busy | ooo | tentative
  source: string;
  title?: string;
}

export interface BusyUser {
  user_id: number;
  user_name: string;
  title: string;
  availability_type: string;
  start_at: string;
  end_at: string;
}

export interface ConflictCheckResult {
  conflicts: BusyUser[];
  has_conflicts: boolean;
}

export async function fetchUserAvailability(
  userId: number,
  start: string,
  end: string,
): Promise<UserAvailability[]> {
  const token = localStorage.getItem("avm_token");
  const params = new URLSearchParams({
    user_id: String(userId),
    start,
    end,
  });
  return fetchJSON(`/operations/availability?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function checkConflicts(
  userIds: number[],
  start: string,
  end: string,
  excludeEventId?: number,
): Promise<ConflictCheckResult> {
  const token = localStorage.getItem("avm_token");
  const params = new URLSearchParams({
    user_ids: userIds.join(","),
    start,
    end,
  });
  if (excludeEventId) params.set("exclude_event_id", String(excludeEventId));
  return fetchJSON(`/operations/availability/check?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
