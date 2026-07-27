/**
 * Projects FE ⇄ API contract-conformance test (spec §6/§7/§8 — the spec is law).
 *
 * - Response fixtures are copied VERBATIM from PROJECTS_TECHNICAL_SPEC.md §6
 *   response examples; each is (a) type-checked against the client types via
 *   `satisfies` (caught by `npm run typecheck`) and (b) runtime-asserted to
 *   have EXACTLY the JSON keys the Go DTOs in
 *   avm-backend/api/modules/projects/models.go emit (§8 parity table,
 *   materialized as EXPECTED_KEYS below). Drift on either side fails CI.
 * - Request-DTO wire checks: the client functions are driven against a mocked
 *   fetchJSON and the emitted path/method/body are compared to the §6 request
 *   examples byte-for-byte (after JSON.parse).
 * - §7 binding rule: cents are exact integers at the wire boundary; the editor
 *   converters must be integer-safe in both directions.
 */
import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";

vi.mock("@/api/fetchJSON", () => ({ fetchJSON: vi.fn() }));

import { fetchJSON } from "@/api/fetchJSON";
import {
  listProjects,
  getProject,
  getProjectSummary,
  createProject,
  updateProject,
  deleteProject,
  putBudget,
  putMilestones,
  attachTasks,
  detachTask,
  setTaskMilestone,
  listUnassignedTasks,
  createChangeOrder,
  updateChangeOrder,
  putSchedule,
  createPayment,
  voidPayment,
  listQboItems,
  getCashFlow,
  getBillables,
  createProjectInvoice,
  type Billables,
  type CreateInvoicePayload,
  PROJECT_STATUS_META,
  MILESTONE_STATUS_META,
  CHANGE_ORDER_STATUS_META,
  WORK_ORDER_STATUS_META,
  FTO_STATUS_META,
  type ProjectSummary,
  type ProjectListItem,
  type UnassignedTask,
  type CashFlowEntry,
  type ProjectPayment,
  type CreateProjectPayload,
} from "@/data/projects";
import {
  dollarsToCents,
  centsToInput,
  draftsToBudgetPayload,
  type CategoryDraft,
} from "@/components/projects/ProjectEditors";

const mockFetch = fetchJSON as unknown as Mock;

beforeEach(() => {
  mockFetch.mockReset();
});

/* ------------------------------------------------------------------------- *
 * §6 response fixtures — VERBATIM from the spec examples
 * ------------------------------------------------------------------------- */

// GET /projects (§6 "GET /projects?status=active&property_id=42&limit=50")
const LIST_FIXTURE = [
  {
    id: 1,
    name: "Full Kitchen & Primary Bath Renovation",
    property_id: 42,
    property_name: "(C) 544 Oenoke Ridge",
    property_address: "544 Oenoke Ridge, New Canaan, CT 06840",
    status: "active",
    current_budget_cents: 36600000,
    spent_cents: 17850000,
    outstanding_invoices_cents: 0,
    percent_complete: 50,
    start_date: "2026-03-02",
    target_end_date: "2026-09-30",
    manager_name: "Carter Hughes",
    manager_initials: "CH",
    task_count: 6,
    pending_change_orders_count: 2,
    pending_change_orders_cents: 1050000,
  },
] satisfies ProjectListItem[];

// GET /projects/unassigned-tasks (§6)
const UNASSIGNED_FIXTURE = [
  {
    id: 7002,
    name: "Refinish oak flooring",
    property_id: 42,
    property_name: "(C) 544 Oenoke Ridge",
    status: "open",
    priority: "medium",
    work_order_count: 1,
    fto_count: 0,
    due_date: "2026-08-01T00:00:00Z",
    assignee_initials: "CH",
  },
] satisfies UnassignedTask[];

// GET /projects/{id}/summary (§6, verbatim)
const SUMMARY_FIXTURE = {
  project: {
    id: 1,
    property_id: 42,
    property_name: "(C) 544 Oenoke Ridge",
    property_address: "544 Oenoke Ridge, New Canaan, CT 06840",
    name: "Full Kitchen & Primary Bath Renovation",
    description: "Gut renovation of the kitchen and primary bathroom.",
    status: "active",
    original_budget_cents: 34000000,
    contract_amount_cents: 40000000,
    percent_complete: 50,
    start_date: "2026-03-02",
    target_end_date: "2026-09-30",
    actual_end_date: null,
    manager_user_id: 7,
    manager_name: "Carter Hughes",
    manager_initials: "CH",
    field_team_manager_ids: [12, 15],
    collaborator_ids: [3],
    field_team_managers: [
      { id: 12, name: "Maria Lopez", initials: "ML" },
      { id: 15, name: "Dan Reed", initials: "DR" },
    ],
    collaborators: [{ id: 3, name: "Priya Shah", initials: "PS" }],
    is_visible_to_client: false,
    created_by_user_id: 3,
    last_edited_by_user_id: 3,
    created_at: "2026-03-02T14:11:09Z",
    updated_at: "2026-07-10T09:00:00Z",
  },
  financials: {
    original_budget_cents: 34000000,
    approved_change_orders_cents: 2600000,
    current_budget_cents: 36600000,
    spent_cents: 17850000,
    committed_cents: 21000000,
    paid_cents: 17850000,
    unpaid_committed_cents: 3150000,
    remaining_budget_cents: 15600000,
    collected_cents: 20400000,
    billed_to_date_cents: 0,
    billed_vs_cost_cents: -21000000,
    outstanding_invoices_cents: 0,
    net_cash_cents: 2550000,
    contract_amount_cents: 40000000,
    projected_margin_cents: 19000000,
    margin_pct: 0.475,
    project_fee_income_cents: 0,
    pending_change_orders_cents: 1050000,
    pending_change_orders_count: 2,
  },
  counts: { tasks: 6, work_orders: 8, field_team_orders: 2 },
  tasks: [
    {
      id: 101,
      name: "Demolition & haul-away",
      status: "closed",
      priority: "high",
      milestone_id: 11,
      work_order_count: 2,
      fto_count: 1,
      spent_cents: 2400000,
      due_date: "2026-03-20T00:00:00Z",
      assignee_initials: "CH",
    },
  ],
  budget: [
    {
      id: 10,
      name: "Demolition & Site Prep",
      amount_cents: 2500000,
      spent_cents: 2500000,
      committed_cents: 2500000,
      sort_order: 0,
      sub_budgets: [
        { id: 15, name: "Demo labor", amount_cents: 1600000, sort_order: 0 },
        { id: 16, name: "Dumpster & haul-away", amount_cents: 900000, sort_order: 1 },
      ],
    },
  ],
  milestones: [
    {
      id: 11,
      project_id: 1,
      name: "Demo & rough-ins complete",
      target_date: "2026-06-30",
      status: "in_progress",
      budget_item_id: 10,
      sort_order: 0,
      task_ids: [101, 102, 103],
      task_stats: { total: 3, done: 2, percent: 83 },
    },
  ],
  change_orders: [
    {
      id: 9001,
      project_id: 1,
      co_number: "CO-001",
      description: "Upgrade to quartzite countertops",
      reason: "Owner selection change",
      amount_cents: 1400000,
      status: "approved",
      approved_by_user_id: 3,
      approved_at: "2026-04-14T16:20:00Z",
      created_by_user_id: 7,
      created_at: "2026-04-10T12:00:00Z",
      updated_at: "2026-04-14T16:20:00Z",
    },
  ],
  schedule: [
    {
      id: 21,
      project_id: 1,
      description: "Demolition & site prep",
      scheduled_value_cents: 2500000,
      percent_complete: 100,
      retainage_percent: 0,
      sort_order: 0,
      billed_to_date_cents: 0,
    },
  ],
  work_orders: [
    {
      id: 501,
      name: "Demo crew",
      task_id: 101,
      task_name: "Demolition & haul-away",
      vendor_id: 88,
      vendor_name: "Greenwich Demo Co",
      status: "completed",
      priority: "high",
      estimated_cost_cents: 2500000,
      billed_cents: 2400000,
      due_date: "2026-03-20T00:00:00Z",
    },
  ],
  field_team_orders: [
    {
      id: 601,
      name: "Demo assist",
      task_id: 101,
      task_name: "Demolition & haul-away",
      member_names: "Carlos M.",
      status: "completed",
      hours_decimal: 8,
      amount_cents: 68000,
      due_date: "2026-03-20T00:00:00Z",
    },
  ],
  vendor_summary: [
    {
      vendor_id: 88,
      vendor_name: "Greenwich Demo Co",
      quoted_cents: 2500000,
      committed_cents: 2500000,
      paid_cents: 2400000,
      remaining_cents: 0,
      planned_cents: 2500000,
    },
  ],
} satisfies ProjectSummary;

// GET /projects/{id}/cashflow (§6, verbatim)
const CASHFLOW_FIXTURE = [
  {
    date: "2026-03-03",
    direction: "inbound",
    kind: "Deposit",
    description: "Initial project deposit (30%)",
    party: "Owner",
    amount_cents: 10200000,
  },
  {
    date: "2026-03-28",
    direction: "outbound",
    kind: "Vendor Bill Payment",
    description: "Demolition & dumpster",
    party: "Greenwich Demo Co",
    amount_cents: 2400000,
  },
] satisfies CashFlowEntry[];

// ProjectPayment response — §6 gives only the request example; the response
// keys below are the json tags of Go ProjectPayment (models.go), i.e. the §6
// POST /payments 201 body.
const PAYMENT_FIXTURE = {
  id: 31,
  project_id: 1,
  kind: "deposit",
  amount_cents: 10200000,
  received_on: "2026-03-03",
  reference: "Initial project deposit (30%)",
  deposit_account_qbo_id: null,
  qbo_payment_id: null,
  receipt_object_key: null,
  receipt_mime: null,
  receipt_filename: null,
  allocated_cents: 0,
  created_by_user_id: 3,
  created_at: "2026-03-03T15:00:00Z",
  voided_at: null,
  voided_by_user_id: null,
  void_reason: null,
} satisfies ProjectPayment;

/* ------------------------------------------------------------------------- *
 * §8 parity table, materialized: exact key sets the Go DTOs emit
 * (json tags in avm-backend/api/modules/projects/models.go)
 * ------------------------------------------------------------------------- */

const EXPECTED_KEYS = {
  Project: [
    "id", "property_id", "property_name", "property_address", "name",
    "description", "status", "original_budget_cents", "contract_amount_cents",
    "percent_complete", "start_date", "target_end_date", "actual_end_date",
    "manager_user_id", "manager_name", "manager_initials",
    "field_team_manager_ids", "collaborator_ids",
    "field_team_managers", "collaborators", "is_visible_to_client",
    "created_by_user_id", "last_edited_by_user_id", "created_at", "updated_at",
  ],
  ProjectFinancials: [
    "original_budget_cents", "approved_change_orders_cents",
    "current_budget_cents", "spent_cents", "committed_cents", "paid_cents",
    "unpaid_committed_cents", "remaining_budget_cents", "collected_cents",
    "billed_to_date_cents", "billed_vs_cost_cents", "outstanding_invoices_cents",
    "net_cash_cents", "contract_amount_cents", "projected_margin_cents",
    "margin_pct", "project_fee_income_cents", "pending_change_orders_cents",
    "pending_change_orders_count",
  ],
  ProjectCounts: ["tasks", "work_orders", "field_team_orders"],
  ProjectTaskRow: [
    "id", "name", "status", "priority", "milestone_id", "work_order_count",
    "fto_count", "spent_cents", "due_date", "assignee_initials",
  ],
  BudgetCategoryView: ["id", "name", "amount_cents", "spent_cents", "committed_cents", "sort_order", "sub_budgets"],
  BudgetSubItemView: ["id", "name", "amount_cents", "sort_order"],
  MilestoneView: [
    "id", "project_id", "name", "target_date", "status", "budget_item_id",
    "sort_order", "task_ids", "task_stats",
  ],
  MilestoneTaskStats: ["total", "done", "percent"],
  ProjectChangeOrder: [
    "id", "project_id", "co_number", "description", "reason", "amount_cents",
    "status", "approved_by_user_id", "approved_at", "created_by_user_id",
    "created_at", "updated_at",
  ],
  ProjectScheduleLine: [
    "id", "project_id", "description", "scheduled_value_cents",
    "percent_complete", "retainage_percent", "sort_order",
    "billed_to_date_cents",
  ],
  ProjectWorkOrderRow: [
    "id", "name", "task_id", "task_name", "vendor_id", "vendor_name", "status",
    "priority", "estimated_cost_cents", "billed_cents", "due_date",
  ],
  ProjectFTORow: [
    "id", "name", "task_id", "task_name", "member_names", "status",
    "hours_decimal", "amount_cents", "due_date",
  ],
  ProjectSummary: [
    "project", "financials", "counts", "tasks", "budget", "milestones",
    "change_orders", "schedule", "work_orders", "field_team_orders",
    "vendor_summary",
  ],
  VendorFinancialSummary: [
    "vendor_id", "vendor_name", "quoted_cents", "committed_cents",
    "paid_cents", "remaining_cents", "planned_cents",
  ],
  ProjectListItem: [
    "id", "name", "property_id", "property_name", "property_address", "status",
    "current_budget_cents", "spent_cents", "outstanding_invoices_cents",
    "percent_complete", "start_date", "target_end_date", "manager_name",
    "manager_initials", "task_count", "pending_change_orders_count",
    "pending_change_orders_cents",
  ],
  UnassignedTaskRow: [
    "id", "name", "property_id", "property_name", "status", "priority",
    "work_order_count", "fto_count", "due_date", "assignee_initials",
  ],
  CashFlowEntry: ["date", "direction", "kind", "description", "party", "amount_cents"],
  ProjectPayment: [
    "id", "project_id", "kind", "amount_cents", "received_on", "reference",
    "deposit_account_qbo_id", "qbo_payment_id",
    "receipt_object_key", "receipt_mime", "receipt_filename",
    "allocated_cents",
    "created_by_user_id", "created_at",
    "voided_at", "voided_by_user_id", "void_reason",
  ],
} as const;

function expectExactKeys(obj: Record<string, unknown>, expected: readonly string[]) {
  expect(Object.keys(obj).sort()).toEqual([...expected].sort());
}

describe("§8 parity: §6 response fixtures carry exactly the Go DTO json keys", () => {
  it("ProjectSummary and every nested DTO", () => {
    expectExactKeys(SUMMARY_FIXTURE, EXPECTED_KEYS.ProjectSummary);
    expectExactKeys(SUMMARY_FIXTURE.project, EXPECTED_KEYS.Project);
    expectExactKeys(SUMMARY_FIXTURE.financials, EXPECTED_KEYS.ProjectFinancials);
    expectExactKeys(SUMMARY_FIXTURE.counts, EXPECTED_KEYS.ProjectCounts);
    expectExactKeys(SUMMARY_FIXTURE.tasks[0], EXPECTED_KEYS.ProjectTaskRow);
    expectExactKeys(SUMMARY_FIXTURE.budget[0], EXPECTED_KEYS.BudgetCategoryView);
    expectExactKeys(SUMMARY_FIXTURE.budget[0].sub_budgets[0], EXPECTED_KEYS.BudgetSubItemView);
    expectExactKeys(SUMMARY_FIXTURE.milestones[0], EXPECTED_KEYS.MilestoneView);
    expectExactKeys(SUMMARY_FIXTURE.milestones[0].task_stats, EXPECTED_KEYS.MilestoneTaskStats);
    expectExactKeys(SUMMARY_FIXTURE.change_orders[0], EXPECTED_KEYS.ProjectChangeOrder);
    expectExactKeys(SUMMARY_FIXTURE.schedule[0], EXPECTED_KEYS.ProjectScheduleLine);
    expectExactKeys(SUMMARY_FIXTURE.work_orders[0], EXPECTED_KEYS.ProjectWorkOrderRow);
    expectExactKeys(SUMMARY_FIXTURE.field_team_orders[0], EXPECTED_KEYS.ProjectFTORow);
    expectExactKeys(SUMMARY_FIXTURE.vendor_summary[0], EXPECTED_KEYS.VendorFinancialSummary);
  });

  it("ProjectListItem / UnassignedTaskRow / CashFlowEntry / ProjectPayment", () => {
    expectExactKeys(LIST_FIXTURE[0], EXPECTED_KEYS.ProjectListItem);
    expectExactKeys(UNASSIGNED_FIXTURE[0], EXPECTED_KEYS.UnassignedTaskRow);
    expectExactKeys(CASHFLOW_FIXTURE[0], EXPECTED_KEYS.CashFlowEntry);
    expectExactKeys(PAYMENT_FIXTURE, EXPECTED_KEYS.ProjectPayment);
  });

  it("every *_cents field in every fixture is an exact integer (never dollars)", () => {
    const walk = (v: unknown, path: string) => {
      if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
      if (v && typeof v === "object") {
        for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
          if (/_cents$/.test(k)) {
            expect(typeof x, `${path}.${k}`).toBe("number");
            expect(Number.isInteger(x), `${path}.${k} must be integer cents`).toBe(true);
          }
          walk(x, `${path}.${k}`);
        }
      }
    };
    walk({ SUMMARY_FIXTURE, LIST_FIXTURE, CASHFLOW_FIXTURE, PAYMENT_FIXTURE }, "$");
  });
});

describe("enums match value-for-value (§8 divergences included)", () => {
  it("ProjectStatus includes cancelled (Decision: plan adds it)", () => {
    expect(Object.keys(PROJECT_STATUS_META).sort()).toEqual(
      ["planning", "active", "on_hold", "completed", "cancelled"].sort(),
    );
  });
  it("MilestoneStatus / ChangeOrderStatus", () => {
    expect(Object.keys(MILESTONE_STATUS_META).sort()).toEqual(
      ["not_started", "in_progress", "complete"].sort(),
    );
    expect(Object.keys(CHANGE_ORDER_STATUS_META).sort()).toEqual(
      ["draft", "pending_approval", "approved", "rejected"].sort(),
    );
  });
  it("WO/FTO metas cover the real enums (§8: FE meta maps gain extra states)", () => {
    expect(Object.keys(WORK_ORDER_STATUS_META).sort()).toEqual(
      ["new", "sent", "scheduled", "in_progress", "completed", "cancelled", "deferred", "closed"].sort(),
    );
    expect(Object.keys(FTO_STATUS_META).sort()).toEqual(
      ["new", "dispatched", "in_progress", "completed", "cancelled"].sort(),
    );
  });
});

/* ------------------------------------------------------------------------- *
 * §6 request DTOs — the client must emit exactly the spec's JSON
 * ------------------------------------------------------------------------- */

function lastCall() {
  const [path, init] = mockFetch.mock.calls[mockFetch.mock.calls.length - 1] as [
    string,
    RequestInit | undefined,
  ];
  return { path, method: init?.method, body: init?.body ? JSON.parse(init.body as string) : undefined };
}

describe("§6 request wire format", () => {
  it("POST /projects — verbatim §6 create example round-trips", async () => {
    // Verbatim §6 request example.
    const payload = {
      name: "Full Kitchen & Primary Bath Renovation",
      property_id: 42,
      status: "planning",
      manager_user_id: 7,
      start_date: "2026-03-02",
      target_end_date: "2026-09-30",
      description: "Gut renovation of the kitchen and primary bathroom.",
      budget: [
        {
          name: "Demolition & Site Prep",
          amount_cents: 0,
          sub_budgets: [
            { name: "Demo labor", amount_cents: 1600000 },
            { name: "Dumpster & haul-away", amount_cents: 900000 },
          ],
        },
        { name: "Appliances", amount_cents: 2000000 },
      ],
      milestones: [
        {
          name: "Demo & rough-ins complete",
          target_date: "2026-06-30",
          status: "not_started",
          budget_category_index: 0,
        },
        { name: "Finishes & punch list", target_date: "2026-09-25", status: "not_started" },
      ],
      tasks: [{ task_id: 7002, milestone_index: 0 }, { task_id: 7003 }],
    } satisfies CreateProjectPayload;

    mockFetch.mockResolvedValueOnce(SUMMARY_FIXTURE);
    const created = await createProject(payload);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects");
    expect(method).toBe("POST");
    expect(body).toEqual(payload);
    expect(created).toEqual(SUMMARY_FIXTURE);
  });

  it("GET /projects builds the §6 query string", async () => {
    mockFetch.mockResolvedValueOnce(LIST_FIXTURE);
    const rows = await listProjects({ status: "active", property_id: 42, limit: 50 });
    expect(lastCall().path).toBe("/projects?status=active&property_id=42&limit=50");
    expect(rows).toEqual(LIST_FIXTURE);
    // null body (edge) → []
    mockFetch.mockResolvedValueOnce(null);
    expect(await listProjects()).toEqual([]);
    expect(lastCall().path).toBe("/projects");
  });

  it("GET /projects/unassigned-tasks builds the §6 query string", async () => {
    mockFetch.mockResolvedValueOnce(UNASSIGNED_FIXTURE);
    const rows = await listUnassignedTasks({ property_id: 42, limit: 50 });
    expect(lastCall().path).toBe("/projects/unassigned-tasks?property_id=42&limit=50");
    expect(rows).toEqual(UNASSIGNED_FIXTURE);
  });

  it("GET /projects/{id} and /summary and /cashflow", async () => {
    mockFetch.mockResolvedValueOnce(SUMMARY_FIXTURE.project);
    await getProject(1);
    expect(lastCall().path).toBe("/projects/1");

    mockFetch.mockResolvedValueOnce(SUMMARY_FIXTURE);
    const s = await getProjectSummary(1);
    expect(lastCall().path).toBe("/projects/1/summary");
    expect(s).toEqual(SUMMARY_FIXTURE);

    mockFetch.mockResolvedValueOnce(CASHFLOW_FIXTURE);
    const cf = await getCashFlow(1);
    expect(lastCall().path).toBe("/projects/1/cashflow");
    expect(cf).toEqual(CASHFLOW_FIXTURE);
  });

  it("PATCH /projects/{id} — verbatim §6 example", async () => {
    mockFetch.mockResolvedValueOnce(SUMMARY_FIXTURE.project);
    await updateProject(1, { status: "on_hold", percent_complete: 60, manager_user_id: 9 });
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/1");
    expect(method).toBe("PATCH");
    expect(body).toEqual({ status: "on_hold", percent_complete: 60, manager_user_id: 9 });

    // §7 UpdateProjectPayload: manager_user_id is number | null — an explicit
    // null must be EMITTED (clears the manager via the backend's NullableInt64),
    // not dropped by serialization.
    mockFetch.mockResolvedValueOnce(SUMMARY_FIXTURE.project);
    await updateProject(1, { manager_user_id: null });
    expect(lastCall().body).toEqual({ manager_user_id: null });
    expect(Object.prototype.hasOwnProperty.call(lastCall().body, "manager_user_id")).toBe(true);
  });

  it("DELETE /projects/{id} → void on 204/null", async () => {
    mockFetch.mockResolvedValueOnce(null);
    await expect(deleteProject(1)).resolves.toBeUndefined();
    const { path, method } = lastCall();
    expect(path).toBe("/projects/1");
    expect(method).toBe("DELETE");
  });

  it("PUT /projects/{id}/budget — verbatim §6 full-replace example", async () => {
    const payload = {
      categories: [
        {
          id: 10,
          name: "Demolition & Site Prep",
          amount_cents: 0,
          sub_budgets: [
            { id: 15, name: "Demo labor", amount_cents: 1700000 },
            { name: "Permit fees", amount_cents: 150000 },
          ],
        },
        { name: "Appliances", amount_cents: 2000000 },
      ],
    };
    mockFetch.mockResolvedValueOnce(SUMMARY_FIXTURE.budget);
    await putBudget(1, payload);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/1/budget");
    expect(method).toBe("PUT");
    expect(body).toEqual(payload);
  });

  it("PUT /projects/{id}/milestones — verbatim §6 example", async () => {
    const payload = {
      milestones: [
        {
          id: 11,
          name: "Demo & rough-ins complete",
          target_date: "2026-06-30",
          status: "in_progress" as const,
          budget_item_id: 10,
        },
        { name: "Final walkthrough", target_date: "2026-09-28", status: "not_started" as const },
      ],
    };
    mockFetch.mockResolvedValueOnce(SUMMARY_FIXTURE.milestones);
    await putMilestones(1, payload);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/1/milestones");
    expect(method).toBe("PUT");
    expect(body).toEqual(payload);
  });

  it("POST /projects/{id}/tasks — verbatim §6 attach example (wrapped in {tasks})", async () => {
    mockFetch.mockResolvedValueOnce(SUMMARY_FIXTURE.tasks);
    await attachTasks(1, [{ task_id: 7002, milestone_id: 11 }, { task_id: 7003 }]);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/1/tasks");
    expect(method).toBe("POST");
    expect(body).toEqual({ tasks: [{ task_id: 7002, milestone_id: 11 }, { task_id: 7003 }] });
  });

  it("DELETE + PATCH /projects/{id}/tasks/{taskId} (§6, null clears milestone)", async () => {
    mockFetch.mockResolvedValueOnce(null);
    await detachTask(1, 7002);
    expect(lastCall()).toMatchObject({ path: "/projects/1/tasks/7002", method: "DELETE" });

    mockFetch.mockResolvedValueOnce({ ok: true });
    await setTaskMilestone(1, 7002, 12);
    expect(lastCall()).toMatchObject({
      path: "/projects/1/tasks/7002",
      method: "PATCH",
      body: { milestone_id: 12 },
    });

    mockFetch.mockResolvedValueOnce({ ok: true });
    await setTaskMilestone(1, 7002, null);
    // {"milestone_id": null} must be emitted explicitly, not omitted
    expect(lastCall().body).toEqual({ milestone_id: null });
  });

  it("POST + PATCH change orders — verbatim §6 examples", async () => {
    const co = SUMMARY_FIXTURE.change_orders[0];
    mockFetch.mockResolvedValueOnce(co);
    await createChangeOrder(1, {
      description: "Heated bathroom floor add-on",
      reason: "Owner request",
      amount_cents: 450000,
      status: "draft",
    });
    expect(lastCall()).toMatchObject({
      path: "/projects/1/change-orders",
      method: "POST",
      body: {
        description: "Heated bathroom floor add-on",
        reason: "Owner request",
        amount_cents: 450000,
        status: "draft",
      },
    });

    // §6 PATCH example: {"status": "approved"} — the full ChangeOrderStatus
    // union must be expressible on update (approve/reject transitions).
    mockFetch.mockResolvedValueOnce(co);
    await updateChangeOrder(1, 9001, { status: "approved" });
    expect(lastCall()).toMatchObject({
      path: "/projects/1/change-orders/9001",
      method: "PATCH",
      body: { status: "approved" },
    });
  });

  it("PUT /projects/{id}/schedule — verbatim §6 example; billed_to_date never sent", async () => {
    const payload = {
      lines: [
        {
          id: 21,
          description: "Demolition & site prep",
          scheduled_value_cents: 2500000,
          percent_complete: 100,
          retainage_percent: 0,
        },
        {
          description: "Plumbing",
          scheduled_value_cents: 4200000,
          percent_complete: 90,
          retainage_percent: 5,
        },
      ],
    };
    mockFetch.mockResolvedValueOnce(SUMMARY_FIXTURE.schedule);
    await putSchedule(1, payload);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/1/schedule");
    expect(method).toBe("PUT");
    expect(body).toEqual(payload);
    for (const line of body.lines) {
      expect(line).not.toHaveProperty("billed_to_date_cents");
      expect(line).not.toHaveProperty("billed_to_date");
    }
  });

  it("POST /projects/{id}/payments — verbatim §6 example", async () => {
    mockFetch.mockResolvedValueOnce(PAYMENT_FIXTURE);
    await createPayment(1, {
      kind: "deposit",
      amount_cents: 10200000,
      received_on: "2026-03-03",
      reference: "Initial project deposit (30%)",
    });
    expect(lastCall()).toMatchObject({
      path: "/projects/1/payments",
      method: "POST",
      body: {
        kind: "deposit",
        amount_cents: 10200000,
        received_on: "2026-03-03",
        reference: "Initial project deposit (30%)",
      },
    });
  });

  it("GET /accounting/qbo-items — item picker source, unwraps {items}", async () => {
    mockFetch.mockResolvedValueOnce({
      items: [{ qbo_item_id: "42", name: "DFO", fully_qualified_name: "DFO", type: "Service", parent_name: null }],
    });
    const items = await listQboItems();
    expect(lastCall().path).toBe("/accounting/qbo-items");
    expect(items).toHaveLength(1);
    expect(items[0].qbo_item_id).toBe("42");
    // Tolerates a missing items array.
    mockFetch.mockResolvedValueOnce({});
    expect(await listQboItems()).toEqual([]);
  });

  it("voidPayment posts to the void endpoint", async () => {
    mockFetch.mockResolvedValueOnce({ payment_id: 7, voided: true });
    await voidPayment(3, 7, "duplicate");
    expect(mockFetch).toHaveBeenCalledWith("/projects/3/payments/7/void", {
      method: "POST",
      body: JSON.stringify({ reason: "duplicate" }),
    });
  });
});

/* ------------------------------------------------------------------------- *
 * Itemized billables (bills + FTO) + vendor field — PROJECT_INVOICE_PDF_SPEC
 * ------------------------------------------------------------------------- */

describe("itemized project-invoice billables + FTO expansion contract", () => {
  // Response shape mirrors the Go billablesResponse (invoicing.go §3.1/§3.2).
  const BILLABLES_FIXTURE = {
    installments_due: [],
    change_orders_unbilled: [],
    vendor_bills: [
      { bill_id: 91, vendor_id: 12, vendor_name: "Acme Roofing", description: "Shingle replacement", amount_cents: 30000 },
    ],
    fto_items: [
      {
        submission_id: 55,
        date_of_work: "2026-07-10",
        work_description: "Pergola labor",
        labor_lines: [{ note: "Framing", hours_decimal: 2, emergency: false, amount_cents: 20000 }],
        expense_lines: [{ note: "Lumber", vendor_name: "HomeDepot", amount_cents: 5000, upcharge_cents: 0 }],
        labor_total_cents: 20000,
        expense_total_cents: 5000,
      },
    ],
  } satisfies Billables;

  it("GET /projects/{id}/billables returns the itemized shape (no lump field)", async () => {
    mockFetch.mockResolvedValueOnce(BILLABLES_FIXTURE);
    const b = await getBillables(9);
    expect(mockFetch).toHaveBeenCalledWith("/projects/9/billables");
    // Exactly the four itemized groups; the retired lump field is gone.
    expect(Object.keys(b).sort()).toEqual(
      ["change_orders_unbilled", "fto_items", "installments_due", "vendor_bills"].sort(),
    );
    expect(b).not.toHaveProperty("unreimbursed_spend_cents");
    expect(b.vendor_bills[0].vendor_name).toBe("Acme Roofing");
    expect(b.fto_items[0].labor_total_cents).toBe(20000);
  });

  it("POST create sends vendor_id on bill/manual lines + fto_submission_ids", async () => {
    const payload = {
      title: "Pergola Progress 1",
      lines: [
        { description: "Shingle replacement", amount_cents: 30000, source_type: "cost_reimbursement", source_id: 91, vendor_id: 12 },
        { description: "Site cleanup", amount_cents: 5000, source_type: "manual", vendor_id: null },
      ],
      fto_submission_ids: [55],
    } satisfies CreateInvoicePayload;
    mockFetch.mockResolvedValueOnce({ id: 1 });
    await createProjectInvoice(9, payload);
    const [path, opts] = mockFetch.mock.calls[0];
    expect(path).toBe("/projects/9/invoices");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body);
    expect(body.fto_submission_ids).toEqual([55]);
    expect(body.lines[0].vendor_id).toBe(12);
    expect(body.lines[0].source_type).toBe("cost_reimbursement");
  });
});

/* ------------------------------------------------------------------------- *
 * §7 binding rule: integer cents at the wire boundary
 * ------------------------------------------------------------------------- */

describe("§7 integer-cents converters (ProjectEditors)", () => {
  it("dollarsToCents never emits fractional cents", () => {
    expect(dollarsToCents("16.07")).toBe(1607); // the spec's float-math counterexample
    expect(dollarsToCents("0.1")).toBe(10);
    expect(dollarsToCents("1234.56")).toBe(123456);
    expect(dollarsToCents("1,234.56")).toBe(123456); // comma-grouped input
    expect(dollarsToCents("181,762.79")).toBe(18176279);
    expect(dollarsToCents("")).toBe(0);
    expect(dollarsToCents("garbage")).toBe(0);
    for (const s of ["16.07", "0.29", "1.15", "99999.99"]) {
      expect(Number.isInteger(dollarsToCents(s))).toBe(true);
    }
  });

  it("centsToInput preserves real cents (no truncation on edit round-trip)", () => {
    expect(centsToInput(1607)).toBe("16.07");
    expect(centsToInput(160000)).toBe("1,600");
    expect(centsToInput(18176279)).toBe("181,762.79");
    expect(centsToInput(1)).toBe("0.01");
    // save-without-editing round-trips byte-identically
    for (const cents of [1607, 160000, 1, 99, 123456789]) {
      expect(dollarsToCents(centsToInput(cents))).toBe(cents);
    }
  });

  it("draftsToBudgetPayload emits integer cents and id only for existing rows", () => {
    const drafts: CategoryDraft[] = [
      {
        id: 10,
        serverId: 10,
        name: "Demolition & Site Prep",
        amount: "",
        spentCents: 0,
        subBudgets: [
          { id: 15, serverId: 15, name: "Demo labor", amount: "16.07" },
          { id: 99, name: "Permit fees", amount: "1500" },
        ],
      },
      { id: 100, name: "Appliances", amount: "20000", spentCents: 0, subBudgets: [] },
    ];
    const payload = draftsToBudgetPayload(drafts);
    expect(payload).toEqual({
      categories: [
        {
          id: 10,
          name: "Demolition & Site Prep",
          amount_cents: 0, // ignored when sub_budgets non-empty (§2 DTO comment)
          sub_budgets: [
            { id: 15, name: "Demo labor", amount_cents: 1607 },
            { name: "Permit fees", amount_cents: 150000 },
          ],
        },
        { name: "Appliances", amount_cents: 2000000, sub_budgets: [] },
      ],
    });
    // JSON.stringify must not produce fractional numbers anywhere
    expect(JSON.stringify(payload)).not.toMatch(/\d+\.\d+/);
  });
});
