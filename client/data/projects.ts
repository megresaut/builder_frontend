/**
 * Projects feature — real API client.
 *
 * Types mirror the API JSON exactly (snake_case, cents as integers). See
 * PROJECTS_TECHNICAL_SPEC.md §6 (REST surface), §7 (this file's contract) and
 * §8 (FE-type ⇄ DTO parity table) — the spec is law for this module.
 */

import { fetchJSON } from "@/api/fetchJSON";

/* --------------------------------- enums --------------------------------- */

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";
export type MilestoneStatus = "not_started" | "in_progress" | "complete";
export type ChangeOrderStatus = "draft" | "pending_approval" | "approved" | "rejected";
export type PaymentKind = "deposit" | "progress_payment";

/* --------------------------------- types ---------------------------------- */

export interface Project {
  id: number;
  property_id: number;
  property_name: string;
  property_address: string;
  name: string;
  description: string;
  status: ProjectStatus;
  original_budget_cents: number;
  percent_complete: number;
  start_date: string | null; // "YYYY-MM-DD"
  target_end_date: string | null;
  actual_end_date: string | null;
  manager_user_id: number | null;
  manager_name: string;
  manager_initials: string;
  is_visible_to_client: boolean;
  created_by_user_id: number | null;
  last_edited_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetSubItem {
  id: number;
  name: string;
  amount_cents: number;
  sort_order: number;
}
export interface BudgetCategory {
  id: number;
  name: string;
  amount_cents: number;
  spent_cents: number;
  sort_order: number;
  sub_budgets: BudgetSubItem[];
}

export interface Milestone {
  id: number;
  project_id: number;
  name: string;
  target_date: string | null;
  status: MilestoneStatus;
  budget_item_id: number | null;
  sort_order: number;
  task_ids: number[];
  task_stats: { total: number; done: number; percent: number };
}

export interface ChangeOrder {
  id: number;
  project_id: number;
  co_number: string;
  description: string;
  reason: string;
  amount_cents: number;
  status: ChangeOrderStatus;
  approved_by_user_id: number | null;
  approved_at: string | null;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleLine {
  id: number;
  project_id: number;
  description: string;
  scheduled_value_cents: number;
  percent_complete: number;
  retainage_percent: number;
  sort_order: number;
  billed_to_date_cents: number; // derived; 0 until Phase 4
}

/**
 * Progress-draw types (Phase 4, Decision #3). A draw bills an amount against
 * one or more schedule lines; the backend creates ONE new draft invoice plus
 * one invoice_line_items row per line (source_type='project_progress'). No
 * QBO/Buildium push is triggered — the draft flows through the existing
 * invoicing lifecycle. Mirrors avm-backend models.go CreateDrawRequest/
 * DrawResult exactly (snake_case, cents as integers).
 */
export interface DrawLineInput {
  schedule_line_id: number;
  amount_cents: number; // required, > 0
}

export interface CreateDrawPayload {
  lines: DrawLineInput[];
  memo?: string;
}

export interface DrawLineResult {
  schedule_line_id: number;
  invoice_line_item_id: number;
  amount_cents: number;
  retainage_cents: number; // informational (Decision #4 minimal retainage)
  billed_to_date_cents: number; // cumulative AFTER this draw
}

export interface DrawResult {
  invoice_id: number;
  invoice_month: string; // "YYYY-MM-DD"
  memo: string;
  total_amount_cents: number;
  total_retainage_cents: number; // informational
  lines: DrawLineResult[];
}

export interface ProjectPayment {
  id: number;
  project_id: number;
  kind: PaymentKind;
  amount_cents: number;
  received_on: string;
  reference: string;
  deposit_account_qbo_id: string | null;
  qbo_payment_id: string | null;
  created_by_user_id: number | null;
  created_at: string;
}

export interface ProjectTaskRow {
  id: number;
  name: string;
  status: string;
  priority: string;
  milestone_id: number | null;
  work_order_count: number;
  fto_count: number;
  spent_cents: number;
  due_date: string | null;
  assignee_initials: string;
}

export interface UnassignedTask {
  id: number;
  name: string;
  property_id: number;
  property_name: string;
  status: string;
  priority: string;
  work_order_count: number;
  fto_count: number;
  due_date: string | null;
  assignee_initials: string;
}

export interface ProjectWorkOrderRow {
  id: number;
  name: string;
  task_id: number;
  task_name: string;
  vendor_id: number;
  vendor_name: string;
  status: string;
  priority: string;
  estimated_cost_cents: number | null;
  billed_cents: number;
  due_date: string | null;
}

export interface ProjectFTORow {
  id: number;
  name: string;
  task_id: number | null;
  task_name: string;
  member_names: string;
  status: string;
  hours_decimal: number;
  amount_cents: number | null;
  due_date: string | null;
}

export interface CashFlowEntry {
  date: string;
  direction: "inbound" | "outbound";
  kind: string;
  description: string;
  party: string;
  amount_cents: number;
}

export interface ProjectFinancials {
  original_budget_cents: number;
  approved_change_orders_cents: number;
  current_budget_cents: number;
  spent_cents: number;
  remaining_budget_cents: number;
  collected_cents: number;
  billed_to_date_cents: number;
  outstanding_invoices_cents: number;
  net_cash_cents: number;
  pending_change_orders_cents: number;
  pending_change_orders_count: number;
}

export interface ProjectSummary {
  project: Project;
  financials: ProjectFinancials;
  counts: { tasks: number; work_orders: number; field_team_orders: number };
  tasks: ProjectTaskRow[];
  budget: BudgetCategory[];
  milestones: Milestone[];
  change_orders: ChangeOrder[];
  schedule: ScheduleLine[];
  work_orders: ProjectWorkOrderRow[];
  field_team_orders: ProjectFTORow[];
}

export interface ProjectListItem {
  id: number;
  name: string;
  property_id: number;
  property_name: string;
  property_address: string;
  status: ProjectStatus;
  current_budget_cents: number;
  spent_cents: number;
  outstanding_invoices_cents: number; // Outstanding column; Phase 4 derivation, 0 until then
  percent_complete: number;
  start_date: string | null;
  target_end_date: string | null;
  manager_name: string;
  manager_initials: string;
  task_count: number;
  pending_change_orders_count: number;
  pending_change_orders_cents: number;
}

/* ---------------------------- request payloads ---------------------------- */

export interface CreateProjectPayload {
  name: string;
  property_id: number;
  status?: ProjectStatus;
  manager_user_id?: number | null;
  start_date?: string;
  target_end_date?: string;
  description?: string;
  budget?: {
    name: string;
    amount_cents: number;
    sub_budgets?: { name: string; amount_cents: number }[];
  }[];
  milestones?: {
    name: string;
    target_date?: string;
    status?: MilestoneStatus;
    budget_category_index?: number;
  }[];
  tasks?: { task_id: number; milestone_index?: number }[];
}

export interface UpdateProjectPayload {
  name?: string;
  status?: ProjectStatus;
  percent_complete?: number;
  start_date?: string;
  target_end_date?: string;
  actual_end_date?: string;
  manager_user_id?: number | null;
  description?: string;
  is_visible_to_client?: boolean;
}

export interface PutBudgetPayload {
  categories: {
    id?: number;
    name: string;
    amount_cents: number;
    sub_budgets?: { id?: number; name: string; amount_cents: number }[];
  }[];
}

export interface PutMilestonesPayload {
  milestones: {
    id?: number;
    name: string;
    target_date?: string | null;
    status: MilestoneStatus;
    budget_item_id?: number | null;
  }[];
}

export interface PutSchedulePayload {
  lines: {
    id?: number;
    description: string;
    scheduled_value_cents: number;
    percent_complete: number;
    retainage_percent: number;
  }[];
}

export interface CreateChangeOrderPayload {
  description: string;
  reason?: string;
  amount_cents: number;
  status?: "draft" | "pending_approval";
}

export interface CreatePaymentPayload {
  kind: PaymentKind;
  amount_cents: number;
  received_on: string;
  reference?: string;
  deposit_account_qbo_id?: string;
}

/* -------------------------------- projects -------------------------------- */

export async function listProjects(opts: {
  status?: ProjectStatus;
  property_id?: number;
  limit?: number;
} = {}): Promise<ProjectListItem[]> {
  const q = new URLSearchParams();
  if (opts.status) q.set("status", opts.status);
  if (opts.property_id != null) q.set("property_id", String(opts.property_id));
  if (opts.limit != null) q.set("limit", String(opts.limit));
  const qs = q.toString();
  const data = await fetchJSON(`/projects${qs ? `?${qs}` : ""}`);
  return data ?? [];
}

export async function getProject(id: number): Promise<Project> {
  return fetchJSON(`/projects/${id}`);
}

export async function getProjectSummary(id: number): Promise<ProjectSummary> {
  return fetchJSON(`/projects/${id}/summary`);
}

export async function createProject(payload: CreateProjectPayload): Promise<ProjectSummary> {
  return fetchJSON("/projects", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateProject(id: number, payload: UpdateProjectPayload): Promise<Project> {
  return fetchJSON(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteProject(id: number): Promise<void> {
  await fetchJSON(`/projects/${id}`, { method: "DELETE" });
}

/* --------------------------------- budget --------------------------------- */

export async function getBudget(projectId: number): Promise<BudgetCategory[]> {
  const data = await fetchJSON(`/projects/${projectId}/budget`);
  return data ?? [];
}

export async function putBudget(
  projectId: number,
  payload: PutBudgetPayload,
): Promise<BudgetCategory[]> {
  const data = await fetchJSON(`/projects/${projectId}/budget`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data ?? [];
}

/* ------------------------------- milestones ------------------------------- */

export async function getMilestones(projectId: number): Promise<Milestone[]> {
  const data = await fetchJSON(`/projects/${projectId}/milestones`);
  return data ?? [];
}

export async function putMilestones(
  projectId: number,
  payload: PutMilestonesPayload,
): Promise<Milestone[]> {
  const data = await fetchJSON(`/projects/${projectId}/milestones`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data ?? [];
}

/* ---------------------------------- tasks ---------------------------------- */

export async function attachTasks(
  projectId: number,
  tasks: { task_id: number; milestone_id?: number | null }[],
): Promise<ProjectTaskRow[]> {
  const data = await fetchJSON(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ tasks }),
  });
  return data ?? [];
}

export async function detachTask(projectId: number, taskId: number): Promise<void> {
  await fetchJSON(`/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
}

export async function setTaskMilestone(
  projectId: number,
  taskId: number,
  milestoneId: number | null,
): Promise<void> {
  await fetchJSON(`/projects/${projectId}/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ milestone_id: milestoneId }),
  });
}

export async function listUnassignedTasks(opts: {
  property_id?: number;
  limit?: number;
} = {}): Promise<UnassignedTask[]> {
  const q = new URLSearchParams();
  if (opts.property_id != null) q.set("property_id", String(opts.property_id));
  if (opts.limit != null) q.set("limit", String(opts.limit));
  const qs = q.toString();
  const data = await fetchJSON(`/projects/unassigned-tasks${qs ? `?${qs}` : ""}`);
  return data ?? [];
}

/* ------------------------------ change orders ------------------------------ */

export async function listChangeOrders(projectId: number): Promise<ChangeOrder[]> {
  const data = await fetchJSON(`/projects/${projectId}/change-orders`);
  return data ?? [];
}

export async function createChangeOrder(
  projectId: number,
  payload: CreateChangeOrderPayload,
): Promise<ChangeOrder> {
  return fetchJSON(`/projects/${projectId}/change-orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateChangeOrder(
  projectId: number,
  coId: number,
  // Omit CreateChangeOrderPayload's narrower create-time status union before
  // intersecting, so the §6-mandated {status:"approved"|"rejected"} PATCH is
  // expressible (a plain intersection collapses status to draft|pending_approval).
  payload: Partial<Omit<CreateChangeOrderPayload, "status">> & { status?: ChangeOrderStatus },
): Promise<ChangeOrder> {
  return fetchJSON(`/projects/${projectId}/change-orders/${coId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/* --------------------------------- schedule -------------------------------- */

export async function getSchedule(projectId: number): Promise<ScheduleLine[]> {
  const data = await fetchJSON(`/projects/${projectId}/schedule`);
  return data ?? [];
}

export async function putSchedule(
  projectId: number,
  payload: PutSchedulePayload,
): Promise<ScheduleLine[]> {
  const data = await fetchJSON(`/projects/${projectId}/schedule`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data ?? [];
}

/* ----------------------------------- draws --------------------------------- */

/**
 * POST /projects/{id}/draws — create a progress draw (Phase 4, Decision #3).
 * Over-billing beyond a schedule line's scheduled value (net of the approved
 * change-order allowance) fails loud with a 400 whose message names the line;
 * callers should surface `e.message` to the user.
 */
export async function createDraw(
  projectId: number,
  payload: CreateDrawPayload,
): Promise<DrawResult> {
  return fetchJSON(`/projects/${projectId}/draws`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* --------------------------------- payments -------------------------------- */

export async function listPayments(projectId: number): Promise<ProjectPayment[]> {
  const data = await fetchJSON(`/projects/${projectId}/payments`);
  return data ?? [];
}

export async function createPayment(
  projectId: number,
  payload: CreatePaymentPayload,
): Promise<ProjectPayment> {
  return fetchJSON(`/projects/${projectId}/payments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* -------------------------------- cash flow -------------------------------- */

export async function getCashFlow(projectId: number): Promise<CashFlowEntry[]> {
  const data = await fetchJSON(`/projects/${projectId}/cashflow`);
  return data ?? [];
}

/* ------------------------------ display helpers ----------------------------- */
// Ported unchanged from mockProjects.ts (§7), plus a `cancelled` entry in
// PROJECT_STATUS_META (§8 divergence: plan adds `cancelled`, mock lacked it).

export function formatUSD(cents: number): string {
  // Whole-dollar amounts stay compact ($342,668); real cents are never hidden
  // ($342,668.03) so displayed totals always match the sum of their parts.
  const digits = cents % 100 === 0 ? 0 : 2;
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatUSDPrecise(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  planning: { label: "Planning", dot: "#9CA3AF", text: "#4B5563", bg: "#F3F4F6" },
  active: { label: "Active", dot: "#2563EB", text: "#1D4ED8", bg: "#EFF6FF" },
  on_hold: { label: "On Hold", dot: "#D97706", text: "#B45309", bg: "#FFFBEB" },
  completed: { label: "Completed", dot: "#16A34A", text: "#15803D", bg: "#F0FDF4" },
  cancelled: { label: "Cancelled", dot: "#EF4444", text: "#B91C1C", bg: "#FEF2F2" },
};

export const MILESTONE_STATUS_META: Record<
  MilestoneStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  not_started: { label: "Not Started", dot: "#9CA3AF", text: "#4B5563", bg: "#F3F4F6" },
  in_progress: { label: "In Progress", dot: "#2563EB", text: "#1D4ED8", bg: "#EFF6FF" },
  complete: { label: "Complete", dot: "#16A34A", text: "#15803D", bg: "#F0FDF4" },
};

export const CHANGE_ORDER_STATUS_META: Record<
  ChangeOrderStatus,
  { label: string; text: string; bg: string }
> = {
  draft: { label: "Draft", text: "#4B5563", bg: "#F3F4F6" },
  pending_approval: { label: "Pending Approval", text: "#B45309", bg: "#FFFBEB" },
  approved: { label: "Approved", text: "#15803D", bg: "#F0FDF4" },
  rejected: { label: "Rejected", text: "#B91C1C", bg: "#FEF2F2" },
};

// Real enum (§8 parity table): mock only had new|scheduled|in_progress|completed;
// FE meta map gains the extra states (sent, cancelled, deferred, closed).
export type WorkOrderStatus =
  | "new"
  | "sent"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "deferred"
  | "closed";

export const WORK_ORDER_STATUS_META: Record<WorkOrderStatus, { label: string; dot: string }> = {
  new: { label: "New", dot: "#9CA3AF" },
  sent: { label: "Sent", dot: "#7C3AED" },
  scheduled: { label: "Scheduled", dot: "#7C3AED" },
  in_progress: { label: "In Progress", dot: "#2563EB" },
  completed: { label: "Completed", dot: "#16A34A" },
  cancelled: { label: "Cancelled", dot: "#EF4444" },
  deferred: { label: "Deferred", dot: "#D97706" },
  closed: { label: "Closed", dot: "#4B5563" },
};

// Real enum (§8 parity table): mock only had dispatched|in_progress|completed;
// FE meta map gains the extra states (new, cancelled).
export type FTOStatus = "new" | "dispatched" | "in_progress" | "completed" | "cancelled";

export const FTO_STATUS_META: Record<FTOStatus, { label: string; dot: string }> = {
  new: { label: "New", dot: "#9CA3AF" },
  dispatched: { label: "Dispatched", dot: "#7C3AED" },
  in_progress: { label: "In Progress", dot: "#2563EB" },
  completed: { label: "Completed", dot: "#16A34A" },
  cancelled: { label: "Cancelled", dot: "#EF4444" },
};
