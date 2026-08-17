/**
 * Projects feature — real API client.
 *
 * Types mirror the API JSON exactly (snake_case, cents as integers). See
 * PROJECTS_TECHNICAL_SPEC.md §6 (REST surface), §7 (this file's contract) and
 * §8 (FE-type ⇄ DTO parity table) — the spec is law for this module.
 */

import { fetchJSON, authFetch } from "@/api/fetchJSON";
import { openAuthPdf } from "@/api/openAuthPdf";
import { downloadAuthFile } from "@/api/downloadAuthFile";

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
  contract_amount_cents: number | null; // agreed client price (Package A); null = unset
  percent_complete: number;
  start_date: string | null; // "YYYY-MM-DD"
  target_end_date: string | null;
  actual_end_date: string | null;
  manager_user_id: number | null;
  manager_name: string;
  manager_initials: string;
  // Field team managers + collaborators (migration 142) — display-only lists.
  // The *_ids arrays are the stored ids; the resolved arrays carry name +
  // initials for display. All four are always present ([], never null).
  field_team_manager_ids: number[];
  collaborator_ids: number[];
  field_team_managers: { id: number; name: string; initials: string }[];
  collaborators: { id: number; name: string; initials: string }[];
  is_visible_to_client: boolean;
  created_by_user_id: number | null;
  last_edited_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetSubItem {
  id: number;
  name: string;
  vendor_id: number | null;
  vendor_name: string; // "" = inherit the category's vendor, else "AVM" on export
  amount_cents: number;
  sort_order: number;
}
export interface BudgetCategory {
  id: number;
  name: string;
  vendor_id: number | null;
  vendor_name: string; // "" = unassigned, rendered as "AVM" on the client export
  amount_cents: number;
  spent_cents: number; // paid (Σ bill_payments) via milestone rollup
  committed_cents: number; // booked (Σ bills) via the same rollup (Package A)
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
  receipt_object_key: string | null; // proof attachment (served at /files/<key>)
  receipt_mime: string | null;
  receipt_filename: string | null;
  allocated_cents: number; // Σ of this payment's allocations to bills (≤ amount_cents)
  created_by_user_id: number | null;
  created_at: string;
  // voided_at is a Postgres text-cast timestamp (e.g. "2026-07-26 14:23:01.123456-04"),
  // NOT RFC3339 — do not feed it to `new Date()`. Use only as a truthy void flag.
  voided_at: string | null;
  voided_by_user_id: number | null;
  void_reason: string | null;
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
  spent_cents: number; // paid (Σ bill_payments) — retained for back-compat
  committed_cents: number; // Σ booked bills (Package A)
  paid_cents: number; // == spent_cents (cash out); clearer alias
  unpaid_committed_cents: number; // committed − paid (booked, not yet paid)
  remaining_budget_cents: number; // current_budget − committed (D3)
  collected_cents: number;
  billed_to_date_cents: number;
  billed_vs_cost_cents: number; // billed_to_date − committed (over/under-billing)
  outstanding_invoices_cents: number;
  net_cash_cents: number;
  // Contract / margin (nullable — omitted server-side when contract unset).
  // projected_margin = contract − committed is the OWNER BUDGET VARIANCE (headroom
  // vs cost), NOT AVM P&L profit — project billing is DFO cost-recovery (D5).
  contract_amount_cents: number | null;
  projected_margin_cents: number | null;
  margin_pct: number | null;
  project_fee_income_cents: number; // Σ fee/markup invoice lines = true AVM earnings (D5)
  pending_change_orders_cents: number;
  pending_change_orders_count: number;
}

// VendorFinancialSummary — Package B: money by vendor for the Payables tab.
// A cost/vendor rollup keyed on the bill's own vendor. quoted = Σ budget-item
// amounts stamped to the vendor; committed/paid = Σ project bills; planned = Σ
// forward-looking vendor payment plan; remaining = quoted − committed.
export interface VendorFinancialSummary {
  vendor_id: number;
  vendor_name: string;
  quoted_cents: number;
  committed_cents: number;
  paid_cents: number;
  remaining_cents: number;
  planned_cents: number;
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
  vendor_summary: VendorFinancialSummary[]; // Package B: money by vendor
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
  field_team_manager_ids?: number[];
  collaborator_ids?: number[];
  start_date?: string;
  target_end_date?: string;
  description?: string;
  budget?: {
    name: string;
    vendor_id?: number | null;
    vendor_name?: string;
    amount_cents: number;
    sub_budgets?: { name: string; vendor_id?: number | null; vendor_name?: string; amount_cents: number }[];
  }[];
  milestones?: {
    name: string;
    target_date?: string;
    status?: MilestoneStatus;
    budget_category_index?: number;
  }[];
  tasks?: { task_id: number; milestone_index?: number }[];
  // Intake audit trail — set only by the "New Project from Meeting Notes" flow.
  intake_notes?: string;
  intake_extraction?: unknown; // the model's raw extraction JSON (IntakeDraft.raw_extraction)
}

export interface UpdateProjectPayload {
  name?: string;
  status?: ProjectStatus;
  percent_complete?: number;
  start_date?: string;
  target_end_date?: string;
  actual_end_date?: string;
  manager_user_id?: number | null;
  field_team_manager_ids?: number[];
  collaborator_ids?: number[];
  description?: string;
  is_visible_to_client?: boolean;
  contract_amount_cents?: number; // agreed client price (Package A); integer cents
}

export interface PutBudgetPayload {
  categories: {
    id?: number;
    name: string;
    // Omit to preserve the stored vendor (quote-accept stamps it); "" clears it.
    vendor_id?: number | null;
    vendor_name?: string;
    amount_cents: number;
    sub_budgets?: {
      id?: number;
      name: string;
      vendor_id?: number | null;
      vendor_name?: string;
      amount_cents: number;
    }[];
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
  project_invoice_id?: number | null;
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

/* ----------------------------- intake pipeline ---------------------------- */
// "New Project from Meeting Notes": POST notes → model-structured draft. The
// draft is NOT saved — it feeds the review UI, then createProject persists it.

export interface IntakeScopeItem {
  name: string;
  amount_cents: number | null; // null = unpriced
  hint: string;
  confidence: number;
}

export interface IntakeVendor {
  name: string;
  trade: string;
  quote_amount: string; // as mentioned in the notes, "" if none
  quote_note: string;
  // enrichment from our records (advisory):
  known: boolean;
  vendor_id: number | null;
  has_coi: boolean;
  coi_expires_on: string | null; // "YYYY-MM-DD"
}

export interface IntakeFlag {
  text: string;
}

export interface IntakeDraft {
  title: string;
  summary: string;
  start_date: string | null;
  target_end_date: string | null;
  scope: IntakeScopeItem[];
  vendors: IntakeVendor[];
  flags: IntakeFlag[];
  raw_extraction: unknown; // pass back as intake_extraction on create (audit)
}

export async function extractProjectIntake(payload: {
  property_id: number;
  notes: string;
}): Promise<IntakeDraft> {
  return fetchJSON("/projects/intake/extract", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ------------------------------ quotes (Phase 2) -------------------------- */

export type QuoteStatus = "received" | "shortlisted" | "accepted" | "rejected";
export type QuoteSource = "manual" | "verbal_intake" | "written" | "uploaded";
export type QuoteVerdict = "fair" | "high" | "low" | "insufficient_data";

export interface QuoteAnalysis {
  verdict: QuoteVerdict;
  reasoning: string;
  suggested_low_cents: number;
  suggested_high_cents: number;
  red_flags: string[];
  confidence: number;
  comparables_used?: number;
}

export interface ProjectQuote {
  id: number;
  project_id: number;
  vendor_id: number | null;
  vendor_name: string;
  trade: string;
  scope_description: string;
  amount_cents: number;
  status: QuoteStatus;
  source: QuoteSource;
  ai_analysis: QuoteAnalysis | null;
  analyzed_at: string | null;
  created_at: string;
  updated_at: string;
  // Bidding (Part B / B3)
  budget_item_id: number | null;
  supersedes_quote_id: number | null;
  // Per-sub-budget breakdown (migration 144): null for leaf-linked quotes; an
  // array of {budget_item_id, amount_cents} (Σ = amount_cents) when the quote is
  // tied to a category that has sub-budgets. Accept → budget overwrites each child.
  budget_breakdown: { budget_item_id: number; amount_cents: number }[] | null;
  // Quote document (uploaded via the attachment endpoint) — all null until a file
  // is attached. Served at /files/<attachment_object_key>.
  attachment_object_key: string | null;
  attachment_file_name: string | null;
  attachment_mime: string | null;
  attachment_size_bytes: number | null;
  // Set on accept: accepting a quote auto-creates a Task + Work Order (backend).
  created_task_id: number | null;
  created_work_order_id: number | null;
}

export interface CreateQuotePayload {
  vendor_id?: number | null;
  vendor_name?: string;
  trade?: string;
  scope_description?: string;
  amount_cents: number;
  source?: QuoteSource;
  budget_item_id?: number | null;
  supersedes_quote_id?: number | null; // create as a revision of an earlier quote
  // Optional per-sub-budget split. When set, budget_item_id must be a category
  // and each entry a sub-budget of it; amount_cents should equal the Σ (backend
  // recomputes it authoritatively).
  budget_breakdown?: { budget_item_id: number; amount_cents: number }[];
}

export interface UpdateQuotePayload {
  status?: Exclude<QuoteStatus, "accepted">; // accept goes through acceptQuote
  vendor_id?: number | null;
  vendor_name?: string;
  trade?: string;
  scope_description?: string;
  amount_cents?: number;
  budget_item_id?: number | null;
  // When set, budget_item_id must be a category and each entry a sub-budget of
  // it; amount_cents is set to Σ breakdown (backend authoritative).
  budget_breakdown?: { budget_item_id: number; amount_cents: number }[];
  // Free-text reason for the edit, stamped onto the revision-history row.
  note?: string;
}

// One audited edit of a quote (migration 145). before/after_snapshot capture the
// tracked-field set { amount_cents, trade, scope_description, vendor_id,
// vendor_name, budget_item_id, budget_breakdown, status }; changed_fields lists
// only the fields that moved.
export interface QuoteRevision {
  id: number;
  quote_id: number;
  revised_by_name: string;
  revised_at: string;
  before_snapshot: Record<string, unknown>;
  after_snapshot: Record<string, unknown>;
  changed_fields: string[];
  note: string;
}

export async function listQuotes(projectId: number): Promise<ProjectQuote[]> {
  const data = await fetchJSON(`/projects/${projectId}/quotes`);
  return data ?? [];
}

export async function createQuote(projectId: number, payload: CreateQuotePayload): Promise<ProjectQuote> {
  return fetchJSON(`/projects/${projectId}/quotes`, { method: "POST", body: JSON.stringify(payload) });
}

export async function updateQuote(projectId: number, quoteId: number, payload: UpdateQuotePayload): Promise<ProjectQuote> {
  return fetchJSON(`/projects/${projectId}/quotes/${quoteId}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteQuote(projectId: number, quoteId: number): Promise<void> {
  return fetchJSON(`/projects/${projectId}/quotes/${quoteId}`, { method: "DELETE" });
}

export async function analyzeQuote(projectId: number, quoteId: number): Promise<ProjectQuote> {
  return fetchJSON(`/projects/${projectId}/quotes/${quoteId}/analyze`, { method: "POST" });
}

// The auditable edit trail for a quote, newest first (migration 145).
export async function listQuoteRevisions(projectId: number, quoteId: number): Promise<QuoteRevision[]> {
  const data = await fetchJSON(`/projects/${projectId}/quotes/${quoteId}/revisions`);
  return data ?? [];
}

export interface UploadQuoteAttachmentResult {
  object_key: string;
  download: string; // "/files/<object_key>"
}

// Attach a quote document (PDF/image) to a quote (multipart, field `file`).
export async function uploadQuoteAttachment(
  projectId: number,
  quoteId: number,
  file: File,
): Promise<UploadQuoteAttachmentResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await authFetch(`/projects/${projectId}/quotes/${quoteId}/attachment`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    let msg = "Failed to upload quote document";
    try {
      const b = await res.json();
      if (b?.error) msg = b.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json();
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

/* ----------------------------- project bills ------------------------------ */
// Bills booked on the project via its work orders / FTOs (money out). Σ booked =
// financials.committed_cents, Σ paid = financials.paid_cents.

export interface ProjectBillRow {
  id: number;
  vendor_id: number | null;
  vendor_name: string;
  statement_date: string | null; // "YYYY-MM-DD"
  booked_cents: number; // bills.amount_cents (committed)
  paid_cents: number; // Σ bill_payments
  covered_cents: number; // Σ client payment allocations to this bill (migration 139)
  description: string; // memo, else invoice #
  work_order_name: string;
  qbo_bill_id: string | null;
  buildium_bill_id: string | null;
}

export async function listProjectBills(projectId: number): Promise<ProjectBillRow[]> {
  const data = await fetchJSON(`/projects/${projectId}/bills`);
  return data ?? [];
}

/* --------------------------- project cost lines ---------------------------- */
// The unified Financials cost feed: vendor bills + FTO labor + FTO expenses that
// have NOT yet been converted into a bill. Mirrors ProjectCostLine in
// modules/projects/http/cost_lines.go.
//
// Conversion is tracked per MATERIAL (fto_submissions.materials[i].bill_id), so a
// converted expense arrives as a `vendor_bill` row and never also as `fto_expense`.
// Only `vendor_bill` and `fto_labor` rows are allocatable — an unbilled expense
// becomes a bill later, and allowing both would double-count the same dollar.

export type ProjectCostLineKind = "vendor_bill" | "fto_labor" | "fto_expense";

export interface ProjectCostLine {
  kind: ProjectCostLineKind;
  bill_id: number; // vendor_bill only (0 otherwise)
  submission_id: number; // fto_labor / fto_expense (0 otherwise)
  vendor_id: number | null;
  party: string; // vendor name, or "AVM field team"
  description: string;
  date: string; // "YYYY-MM-DD" ("" when unknown)
  booked_cents: number;
  paid_cents: number; // vendor_bill only — labor/expense have no vendor payment
  covered_cents: number; // client payment allocated to this row
  allocatable: boolean;
  is_avm_expense: boolean; // AVM absorbed it; not client-billable
  work_order_name: string;
  qbo_bill_id: string | null;
  buildium_bill_id: string | null;
}

export async function listProjectCostLines(projectId: number): Promise<ProjectCostLine[]> {
  const data = await fetchJSON(`/projects/${projectId}/cost-lines`);
  return data ?? [];
}

/* ------------------- payment → cost allocations (tracking) ----------------- */
// Manually split a collected client payment across the project's vendor bills and
// FTO labor. Pure platform tracking (no GL impact): drives the derived
// covered_cents on cost lines and allocated_cents on payments.

export interface PaymentAllocation {
  id: number;
  bill_id: number; // 0 for an fto_labor allocation
  amount_cents: number;
  vendor_name: string; // joined for display
  description: string; // bill memo/invoice # or labor label for display
  // Migration 152: exactly one of bill_id / fto_submission_id is set.
  target_kind: "bill" | "fto_labor";
  fto_submission_id: number;
}

// AllocationInput mirrors allocationInput in modules/projects/http/allocations.go.
// Omitting target_kind is treated as "bill" server-side for back-compat.
export interface AllocationInput {
  target_kind?: "bill" | "fto_labor";
  bill_id?: number;
  fto_submission_id?: number;
  amount_cents: number;
}

export async function getPaymentAllocations(
  projectId: number,
  paymentId: number,
): Promise<PaymentAllocation[]> {
  const data = await fetchJSON(`/projects/${projectId}/payments/${paymentId}/allocations`);
  return data ?? [];
}

export async function putPaymentAllocations(
  projectId: number,
  paymentId: number,
  allocations: AllocationInput[],
): Promise<PaymentAllocation[]> {
  const data = await fetchJSON(`/projects/${projectId}/payments/${paymentId}/allocations`, {
    method: "PUT",
    body: JSON.stringify({ allocations }),
  });
  return data ?? [];
}

/* -------------------- siloed project invoicing (Part A / P0) --------------- */
// The client-billing lane: payment schedule → project invoice → client payment.
// FULLY separate from the monthly per-property invoicing (invoices/
// invoice_line_items) — different endpoints, different tables. Types mirror the
// Go DTOs in modules/projects/http/invoicing.go exactly (snake_case, cents).

export type ProjectInvoiceStatus = "draft" | "sent" | "partially_paid" | "paid" | "void";
export type ProjectInvoiceDeliveryMode = "qbo_email" | "manual";
export type ProjectInvoiceLineSource =
  | "manual"
  | "budget_category"
  | "change_order"
  | "installment"
  | "cost_reimbursement"
  | "project_fee" // real-income fee/margin line (concierge: routes to Project Fee Income item)
  | "fto_labor" // FTO hour-entry labor line (server-expanded); vendor displays "AVM"
  | "fto_expense" // FTO material passthrough at cost (server-expanded); vendor "AVM"
  | "materials_markup"; // FTO material upcharge (server-expanded)
export type InstallmentBasis = "percent" | "fixed";
export type InstallmentStatus = "upcoming" | "due" | "invoiced" | "paid";

export interface ProjectInvoiceLine {
  id: number;
  description: string;
  amount_cents: number; // negative allowed = credit
  sort_order: number;
  source_type: ProjectInvoiceLineSource;
  source_id: number | null;
  source_line_id: number | null;
  vendor_id: number | null; // FK to vendors (manual/bill lines); null for FTO lines
  vendor_name: string; // display: vendor name, or "AVM" for FTO lines
}

export interface ProjectInvoicePayment {
  id: number;
  kind: string; // 'deposit' | 'progress_payment'
  amount_cents: number;
  received_on: string; // "YYYY-MM-DD"
  reference: string;
  via_qbo: boolean;
  // Text-cast timestamp, not RFC3339 — truthy void flag only, never parse as a date.
  voided_at: string | null;
}

export interface ProjectInvoice {
  id: number;
  project_id: number;
  seq: number;
  invoice_number: string; // 'PI-{project_id}-{seq:03d}'
  status: ProjectInvoiceStatus;
  title: string;
  notes: string;
  issue_date: string | null;
  due_date: string | null;
  total_amount_cents: number; // derived from lines
  paid_cents: number; // Σ linked payments
  sent_at: string | null;
  client_email: string | null;
  client_emailed_at: string | null; // last successful QBO email
  client_email_count: number;
  qbo_invoice_id: string | null; // Package C: set once pushed to QBO
  qbo_push_status: string | null; // 'pushed' | 'error' | null (not pushed)
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
  // Derived server-side from the property type — branch on THIS, never on
  // property_type. 'qbo_email': concierge, QuickBooks emails the client for us.
  // 'manual': the platform has no way to email it (no SMTP, Graph Mail.Send not
  // granted), and the invoice isn't in QBO either — download the PDF and send it.
  delivery_mode: ProjectInvoiceDeliveryMode;
  lines: ProjectInvoiceLine[]; // [] on the list endpoint, populated on detail
  payments: ProjectInvoicePayment[]; // [] on the list endpoint, populated on detail
}

export interface PaymentInstallment {
  id: number;
  project_id: number;
  label: string;
  basis: InstallmentBasis;
  percent_bps: number | null; // percent basis; basis points (10000 = 100%)
  amount_cents: number | null; // fixed basis (stored)
  resolved_amount_cents: number; // fixed amount, or percent × current budget
  due_date: string | null;
  milestone_id: number | null;
  milestone_name: string | null;
  milestone_complete: boolean;
  sort_order: number;
  project_invoice_id: number | null;
  invoice_number: string | null;
  status: InstallmentStatus; // derived server-side
}

export interface BillableInstallment {
  id: number;
  label: string;
  basis: InstallmentBasis;
  resolved_amount_cents: number;
  due_date: string | null;
  milestone_name: string | null;
}
export interface BillableChangeOrder {
  id: number;
  co_number: string;
  description: string;
  amount_cents: number;
}
// One project work-order vendor bill (spec §3.1) — a selectable itemized billable.
// One billable line item of a vendor bill — a vendor's own deposit / progress /
// final breakdown. billed_on_* are set when this line already sits on a live
// (non-void) project invoice, in which case the builder greys the row out.
export interface BillableVendorBillLine {
  line_id: number;
  description: string;
  amount_cents: number; // vendor cost, pre-upcharge
  upcharge_cents: number; // AVMRE markup on THIS line
  billed_on_invoice_id: number | null;
  billed_on_invoice_number: string | null;
}
export interface BillableVendorBill {
  bill_id: number;
  vendor_id: number | null;
  vendor_name: string;
  description: string;
  amount_cents: number; // vendor cost, pre-upcharge
  upcharge_cents: number; // AVMRE markup, folded into the billed line by vendorBillTotalCents
  // lines is EMPTY when the bill's line items cannot be trusted as a breakdown of
  // its total (backend: explodeBillLines) — 321 of 410 bills carry line_items='[]'.
  // The builder then bills the bill whole, as it always did.
  lines: BillableVendorBillLine[];
  billed_cents: number; // Σ live invoice lines for this bill
  remaining_cents: number; // amount + upcharge − billed
}
// One computed labor entry inside an FTO submission (hours × property rate).
export interface FtoLaborLine {
  note: string;
  hours_decimal: number;
  emergency: boolean;
  amount_cents: number;
}
// One computed material entry (billed at cost, with optional markup).
export interface FtoExpenseLine {
  note: string;
  vendor_name: string;
  amount_cents: number; // at cost
  upcharge_cents: number; // separate materials_markup line when > 0
}
// One selectable FTO submission (spec §3.2) with its computed breakdown.
export interface FtoItem {
  submission_id: number;
  date_of_work: string;
  work_description: string;
  labor_lines: FtoLaborLine[];
  expense_lines: FtoExpenseLine[];
  labor_total_cents: number;
  expense_total_cents: number;
}
export interface Billables {
  installments_due: BillableInstallment[];
  change_orders_unbilled: BillableChangeOrder[];
  vendor_bills: BillableVendorBill[];
  fto_items: FtoItem[];
}

export interface CreateInvoiceLineInput {
  description: string;
  amount_cents: number;
  source_type: ProjectInvoiceLineSource;
  source_id?: number | null;
  // Which bills.line_items entry a cost_reimbursement line bills. null/absent =
  // the whole bill (every line written before migration 155).
  source_line_id?: number | null;
  vendor_id?: number | null; // optional vendor on manual/bill lines
}
export interface CreateInvoicePayload {
  title: string;
  notes?: string;
  issue_date?: string;
  due_date?: string;
  client_email?: string;
  lines: CreateInvoiceLineInput[];
  // Selected FTO submissions the server expands into per-entry labor/expense
  // (+markup) lines. Kept separate from `lines` so the rate math is authoritative.
  fto_submission_ids?: number[];
}
export interface UpdateInvoicePayload {
  title?: string;
  notes?: string;
  issue_date?: string;
  due_date?: string;
  client_email?: string;
  lines?: CreateInvoiceLineInput[]; // full-replace; allowed on any invoice with no live (non-voided) payment
  fto_submission_ids?: number[]; // FTO selections to (re)expand on replace
}
export interface RecordInvoicePaymentPayload {
  amount_cents: number;
  received_on: string;
  reference?: string;
}
export interface InstallmentInput {
  id?: number;
  label: string;
  basis: InstallmentBasis;
  percent_bps?: number | null;
  amount_cents?: number | null;
  due_date?: string | null;
  milestone_id?: number | null;
}

export async function listProjectInvoices(projectId: number): Promise<ProjectInvoice[]> {
  const data = await fetchJSON(`/projects/${projectId}/invoices`);
  return data ?? [];
}

export async function getProjectInvoice(projectId: number, invoiceId: number): Promise<ProjectInvoice> {
  return fetchJSON(`/projects/${projectId}/invoices/${invoiceId}`);
}

export async function createProjectInvoice(projectId: number, payload: CreateInvoicePayload): Promise<ProjectInvoice> {
  return fetchJSON(`/projects/${projectId}/invoices`, { method: "POST", body: JSON.stringify(payload) });
}

export async function updateProjectInvoice(
  projectId: number,
  invoiceId: number,
  payload: UpdateInvoicePayload,
): Promise<ProjectInvoice> {
  return fetchJSON(`/projects/${projectId}/invoices/${invoiceId}`, { method: "PATCH", body: JSON.stringify(payload) });
}

// Marks the invoice sent (draft → sent) and books A/R for concierge properties.
// Does NOT email anyone — delivery is a separate step that differs by
// delivery_mode. For 'manual' invoices this is the "I've sent it" confirmation.
//
// paymentMethod ("ach" | "card") adds a one-time ACH/credit-card processing-fee
// line for concierge properties before booking A/R — there's no local payment
// history to auto-detect from (unlike monthly invoicing), so omitting it adds
// no fee at all, it does not "guess".
export async function sendProjectInvoice(
  projectId: number,
  invoiceId: number,
  paymentMethod?: "ach" | "card",
): Promise<ProjectInvoice> {
  const qs = paymentMethod ? `?payment_method=${paymentMethod}` : "";
  return fetchJSON(`/projects/${projectId}/invoices/${invoiceId}/send${qs}`, { method: "POST" });
}

// Asks QuickBooks to email the invoice (with our rendered PDF attached) to the
// client. Concierge only — 400s for delivery_mode 'manual', which has no QBO
// invoice to email. Re-sendable; each success bumps client_email_count.
// sendTo overrides the invoice's stored client_email when provided.
export async function emailProjectInvoice(
  projectId: number,
  invoiceId: number,
  sendTo?: string,
): Promise<ProjectInvoice> {
  return fetchJSON(`/projects/${projectId}/invoices/${invoiceId}/email`, {
    method: "POST",
    body: JSON.stringify({ send_to: sendTo ?? "" }),
  });
}

// Prefilled subject/body for the platform compose box (sent from
// billing@avmre.com, our PDF attached) — both concierge and non-concierge.
// pay_link is "" for non-concierge invoices (there is no QBO invoice to link
// to) — that is normal, not an error; body_text simply contains no payment
// line. Does not send anything. 409s if the invoice isn't sendable
// (draft/void).
export interface ProjectInvoiceEmailPreview {
  subject: string;
  body_text: string;
  pay_link: string;
  attachment_name: string;
  attachment_size: number;
}

export async function getProjectInvoiceEmailPreview(
  projectId: number,
  invoiceId: number,
): Promise<ProjectInvoiceEmailPreview> {
  return fetchJSON(`/projects/${projectId}/invoices/${invoiceId}/email/preview`);
}

export interface SendProjectInvoiceEmailPayload {
  to: string;
  cc?: string;
  subject: string;
  body_html: string;
}

// Sends the invoice from billing@avmre.com with the PDF attached — both
// concierge and non-concierge. Distinct from emailProjectInvoice above (the
// QuickBooks rail), which stays as a concierge-only fallback for when this
// mailbox can't send (e.g. missing Mail.Send grant).
export async function sendProjectInvoiceEmail(
  projectId: number,
  invoiceId: number,
  payload: SendProjectInvoiceEmailPayload,
): Promise<{ delivered_to: string }> {
  return fetchJSON(`/projects/${projectId}/invoices/${invoiceId}/email/send`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function recordInvoicePayment(
  projectId: number,
  invoiceId: number,
  payload: RecordInvoicePaymentPayload,
): Promise<ProjectInvoice> {
  return fetchJSON(`/projects/${projectId}/invoices/${invoiceId}/payments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function voidProjectInvoice(projectId: number, invoiceId: number): Promise<ProjectInvoice> {
  return fetchJSON(`/projects/${projectId}/invoices/${invoiceId}/void`, { method: "POST" });
}

// Hard-deletes a project invoice. Allowed only while no live (non-voided)
// payment is attached — the API 409s otherwise, with the amount in the message.
// NOTE: the invoice number is reused by the next invoice created on the project.
export async function deleteProjectInvoice(projectId: number, invoiceId: number): Promise<void> {
  await fetchJSON(`/projects/${projectId}/invoices/${invoiceId}`, { method: "DELETE" });
}

// Opens the invoice's PDF — the AVMRE invoice template (logo letterhead,
// Services Provided To / INVOICE blocks, Service Provider · Date · Service
// Provided · Reference# · Amount table) — in a new tab (auth-attached blob fetch).
// The endpoint regenerates the PDF on each call → always reflects the latest
// lines, and persists it (also surfaced in the Files tab). Not concierge-gated.
export async function openProjectInvoicePdf(projectId: number, invoiceId: number): Promise<void> {
  return openAuthPdf(`/projects/${projectId}/invoices/${invoiceId}/pdf`);
}

// Downloads the project budget as a client-ready ESTIMATE PDF (the older
// bordered-grid AVMRE layout, with a Category column — the invoice now uses the
// letterhead invoice template instead). Saved to disk rather than
// opened, since the point is to attach it to an email to the client. Derived from
// the live budget on every call, so it is never persisted server-side.
export async function downloadProjectBudgetPdf(projectId: number, projectName: string): Promise<void> {
  const slug = projectName.trim().split(/\s+/).join("-") || "project";
  return downloadAuthFile(`/projects/${projectId}/budget/pdf`, `${slug}-budget.pdf`);
}

// A QuickBooks item, from GET /accounting/qbo-items (active items, cached server-side).
export interface QboItem {
  qbo_item_id: string;
  name: string;
  fully_qualified_name: string;
  type: string;
  parent_name: string | null;
}

// listQboItems fetches the live QBO item list used to populate the invoice-push
// item picker. Shared, read-only accounting endpoint (not project-specific).
export async function listQboItems(): Promise<QboItem[]> {
  const data = (await fetchJSON(`/accounting/qbo-items`)) as { items?: QboItem[] };
  return data.items ?? [];
}

// voidPayment voids a received client payment. For concierge properties the
// matching QuickBooks Payment is voided too; the whole call fails if QBO refuses.
export async function voidPayment(
  projectId: number,
  paymentId: number,
  reason?: string,
): Promise<{ payment_id: number; voided: boolean }> {
  return fetchJSON(`/projects/${projectId}/payments/${paymentId}/void`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? "" }),
  });
}

// Billable items for the invoice builder. excludeInvoiceId is edit mode: the
// items already on THAT invoice come back into the picker instead of being
// filtered out as already-billed.
export async function getBillables(projectId: number, excludeInvoiceId?: number): Promise<Billables> {
  const qs = excludeInvoiceId ? `?exclude_invoice_id=${excludeInvoiceId}` : "";
  return fetchJSON(`/projects/${projectId}/billables${qs}`);
}

export async function getPaymentSchedule(projectId: number): Promise<PaymentInstallment[]> {
  const data = await fetchJSON(`/projects/${projectId}/payment-schedule`);
  return data ?? [];
}

export async function putPaymentSchedule(
  projectId: number,
  installments: InstallmentInput[],
): Promise<PaymentInstallment[]> {
  const data = await fetchJSON(`/projects/${projectId}/payment-schedule`, {
    method: "PUT",
    body: JSON.stringify({ installments }),
  });
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

/* --------------------- quotes bidding (Part B / B3) ----------------------- */

export interface AcceptQuotePayload {
  copy_to_budget?: boolean; // also copy the accepted amount into the budget category
  // Link to an existing task/work order instead of creating a new one.
  // existing_work_order_id takes priority (its task comes along with it) —
  // existing_task_id is ignored when both are set.
  existing_task_id?: number;
  existing_work_order_id?: number;
}

// Accept returns the updated quote (with created_task_id/created_work_order_id
// populated) PLUS a warnings array — e.g. when the auto Work Order couldn't be
// created. Surface non-empty warnings to the user.
export type AcceptQuoteResult = ProjectQuote & { warnings: string[] };

export async function acceptQuote(
  projectId: number,
  quoteId: number,
  payload: AcceptQuotePayload = {},
): Promise<AcceptQuoteResult> {
  return fetchJSON(`/projects/${projectId}/quotes/${quoteId}/accept`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ------------------ vendor payment schedules (Part B / B1) ---------------- */

export type VendorPaymentStatus = "scheduled" | "paid";

export interface VendorPayment {
  id: number;
  project_id: number;
  budget_item_id: number | null;
  vendor_id: number | null;
  vendor_name: string;
  label: string;
  amount_cents: number;
  due_date: string | null;
  status: VendorPaymentStatus;
  paid_on: string | null;
  bill_id: number | null;
  notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateVendorPaymentPayload {
  budget_item_id?: number | null;
  vendor_id?: number | null;
  vendor_name?: string;
  label?: string;
  amount_cents: number;
  due_date?: string | null;
  notes?: string;
  sort_order?: number;
}

export interface UpdateVendorPaymentPayload {
  budget_item_id?: number | null;
  vendor_id?: number | null;
  vendor_name?: string;
  label?: string;
  amount_cents?: number;
  due_date?: string | null;
  status?: VendorPaymentStatus;
  paid_on?: string | null;
  bill_id?: number | null;
  notes?: string;
  sort_order?: number;
}

export async function listVendorPayments(projectId: number): Promise<VendorPayment[]> {
  const data = await fetchJSON(`/projects/${projectId}/vendor-payments`);
  return data ?? [];
}

export async function createVendorPayment(projectId: number, payload: CreateVendorPaymentPayload): Promise<VendorPayment> {
  return fetchJSON(`/projects/${projectId}/vendor-payments`, { method: "POST", body: JSON.stringify(payload) });
}

export async function updateVendorPayment(
  projectId: number,
  vpId: number,
  payload: UpdateVendorPaymentPayload,
): Promise<VendorPayment> {
  return fetchJSON(`/projects/${projectId}/vendor-payments/${vpId}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteVendorPayment(projectId: number, vpId: number): Promise<void> {
  await fetchJSON(`/projects/${projectId}/vendor-payments/${vpId}`, { method: "DELETE" });
}

/* ------------------------------ files (Part B / B2) ----------------------- */

export type ProjectFileSource = "project" | "task" | "work_order" | "field_team" | "invoice" | "bill" | "quote";

export interface ProjectFileRow {
  id: number;
  source: ProjectFileSource;
  name: string;
  parent: string;
  object_key: string;
  mime: string;
  size_bytes: number;
  download: string; // "/files/<object_key>"
  created_at: string;
  deletable: boolean;
  // Association (migration 141) is conveyed via `source` (project/task/work_order/
  // invoice) + `parent` (associated task/WO name). description/uploaded_by are set
  // for direct project uploads only.
  description: string;
  uploaded_by: string; // uploader display name ("" if unknown)
}

export async function listProjectFiles(projectId: number): Promise<ProjectFileRow[]> {
  const data = await fetchJSON(`/projects/${projectId}/files`);
  return data ?? [];
}

export async function uploadProjectFile(
  projectId: number,
  file: File,
  meta?: { associated_type?: string; associated_id?: number; description?: string },
): Promise<ProjectFileRow> {
  const form = new FormData();
  form.append("file", file);
  if (meta?.associated_type) form.append("associated_type", meta.associated_type);
  if (meta?.associated_id != null) form.append("associated_id", String(meta.associated_id));
  if (meta?.description) form.append("description", meta.description);
  const res = await authFetch(`/projects/${projectId}/files`, { method: "POST", body: form });
  if (!res.ok) {
    let msg = "Failed to upload file";
    try {
      const b = await res.json();
      if (b?.error) msg = b.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function deleteProjectFile(projectId: number, fileId: number): Promise<void> {
  await fetchJSON(`/projects/${projectId}/files/${fileId}`, { method: "DELETE" });
}

export interface PaymentReceiptResult {
  payment_id: number;
  receipt_object_key: string;
  receipt_mime: string;
  receipt_filename: string;
  download: string; // "/files/<object_key>"
}

// Attach a receipt/proof file to a recorded client payment (multipart).
export async function uploadPaymentReceipt(
  projectId: number,
  paymentId: number,
  file: File,
): Promise<PaymentReceiptResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await authFetch(`/projects/${projectId}/payments/${paymentId}/receipt`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    let msg = "Failed to upload receipt";
    try {
      const b = await res.json();
      if (b?.error) msg = b.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json();
}

/* ------------------------------ vendor lookup ----------------------------- */
// Lightweight vendor typeahead source for pickers (vendor payment stages, etc.).
// Backed by GET /vendors?search=&limit= (name ILIKE, active only, ORDER BY name).

export interface VendorLite {
  id: number;
  name: string;
  category?: string;
}

export async function searchVendors(query: string, limit = 10): Promise<VendorLite[]> {
  const q = new URLSearchParams();
  if (query.trim()) q.set("search", query.trim());
  q.set("limit", String(limit));
  const data = await fetchJSON(`/vendors?${q.toString()}`);
  return (data ?? []).map((v: any) => ({ id: v.id, name: v.name, category: v.category }));
}
