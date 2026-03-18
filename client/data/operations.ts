import { fetchJSON } from "@/api/fetchJSON";

export interface CalendarItem {
  type: "task" | "work_order" | "field_team_order" | "inspection" | "recurring_task" | "calendar_event";
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  property_id?: number;
  status: string;
  priority: string;
  assignees: number[];
  vendor_id?: number;
}

export interface CalendarFilters {
  property_id?: number;
  vendor_id?: number;
  assignee_id?: number;
  type?: string; // comma-separated
}

export interface CalendarEventPayload {
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  all_day?: boolean;
  property_id?: number;
  created_by: number;
  assignees?: number[];
  color?: string;
}

export async function fetchCalendarFeed(
  start: string,
  end: string,
  filters: CalendarFilters = {}
): Promise<CalendarItem[]> {
  const params = new URLSearchParams({ start, end });
  if (filters.property_id) params.set("property_id", String(filters.property_id));
  if (filters.vendor_id) params.set("vendor_id", String(filters.vendor_id));
  if (filters.assignee_id) params.set("assignee_id", String(filters.assignee_id));
  if (filters.type) params.set("type", filters.type);

  return fetchJSON(`/operations/calendar/feed?${params}`);
}

export async function createCalendarEvent(data: CalendarEventPayload) {
  return fetchJSON("/operations/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCalendarEvent(id: number, data: Partial<CalendarEventPayload>) {
  return fetchJSON(`/operations/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCalendarEvent(id: number) {
  return fetchJSON(`/operations/events/${id}`, {
    method: "DELETE",
  });
}
