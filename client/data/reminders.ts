import { fetchJSON } from "@/api/fetchJSON";

export interface ReminderItem {
  type:
    | "task"
    | "work_order"
    | "field_team_order"
    | "inspection"
    | "recurring_task"
    | "calendar_event";
  id: number;
  title: string;
  property_name: string;
  property_id?: number;
  unit_name?: string;
  due_at: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: string;
  relation: "assignee" | "collaborator";
  detail?: string;
}

export async function fetchReminders(daysAhead = 60): Promise<ReminderItem[]> {
  const data = await fetchJSON(
    `/operations/reminders?days_ahead=${daysAhead}`,
  );
  return data ?? [];
}
