import { fetchJSON } from "@/api/fetchJSON";

export interface CalendarNotification {
  id: number;
  notification_type: string; // conflict_detected | availability_change | overdue_warning | deadline_1day | deadline_1hour
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
  types?: string[],
): Promise<CalendarNotification[]> {
  let url = `/operations/notifications?user_id=${userId}&limit=${limit}`;
  if (types && types.length > 0) url += `&types=${types.join(",")}`;
  const data = await fetchJSON(url);
  return data ?? [];
}

export async function fetchUnreadCount(
  userId: number,
  types?: string[],
): Promise<number> {
  let url = `/operations/notifications/unread-count?user_id=${userId}`;
  if (types && types.length > 0) url += `&types=${types.join(",")}`;
  const data = await fetchJSON(url);
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

export async function markAllNotificationsRead(userId: number): Promise<void> {
  await fetchJSON(`/operations/notifications/read-all?user_id=${userId}`, {
    method: "POST",
  });
}

export async function dismissNotification(id: number): Promise<void> {
  await fetchJSON(`/operations/notifications/${id}/dismiss`, {
    method: "POST",
  });
}
