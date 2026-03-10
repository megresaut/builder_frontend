import { fetchJSON } from "@/api/fetchJSON";

export interface CalendarNotification {
  id: number;
  notification_type: string; // conflict_detected | availability_change | schedule_overload | overdue_warning
  severity: string; // info | warning | critical
  title: string;
  message: string;
  metadata: Record<string, any>;
  target_user_ids: number[];
  read_by_user_ids: number[];
  dismissed: boolean;
  created_at: string;
  expires_at?: string;
}

export async function fetchNotifications(
  userId: number,
  limit = 20,
): Promise<CalendarNotification[]> {
  const data = await fetchJSON(
    `/operations/notifications?user_id=${userId}&limit=${limit}`,
  );
  return data ?? [];
}

export async function fetchUnreadCount(userId: number): Promise<number> {
  const data = await fetchJSON(
    `/operations/notifications/unread-count?user_id=${userId}`,
  );
  return data?.count ?? 0;
}

export async function markNotificationRead(
  id: number,
  userId: number,
): Promise<void> {
  await fetchJSON(`/operations/notifications/${id}/read?user_id=${userId}`, {
    method: "POST",
  });
}

export async function dismissNotification(id: number): Promise<void> {
  await fetchJSON(`/operations/notifications/${id}/dismiss`, {
    method: "POST",
  });
}
