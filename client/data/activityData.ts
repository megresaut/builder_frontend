import { fetchJSON } from "@/api/fetchJSON";

export type ActivityEventType =
  | "maintenance_submitted"
  | "work_order_created"
  | "work_order_completed"
  | "fto_created"
  | "fto_completed"
  | "inspection_created"
  | "inspection_completed"
  | "tenant_added"
  | "tenant_moved_in"
  | "tenant_moved_out"
  | "renters_insurance_uploaded"
  | "insurance_policy_added"
  | "invoice_issued"
  | "vendor_compliance_uploaded";

export interface ActivityEvent {
  id: string;
  event_type: ActivityEventType;
  title: string;
  description: string;
  property_id?: number;
  property_address?: string;
  entity_type: string;
  entity_id: number;
  parent_id?: number;
  occurred_at: string;
}

export interface ActivityResponse {
  events: ActivityEvent[];
  total: number;
}

export async function fetchActivityFeed(
  limit = 20,
  offset = 0,
  propertyId?: number,
): Promise<ActivityResponse> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (propertyId !== undefined) params.set("property_id", String(propertyId));
  return fetchJSON(`/activity?${params}`);
}
