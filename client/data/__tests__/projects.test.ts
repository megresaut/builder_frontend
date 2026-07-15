/**
 * Contract tests for client/data/projects.ts against PROJECTS_TECHNICAL_SPEC.md
 * §6 (REST surface) + §7 (client signatures).
 *
 * Idiom: mock @/api/fetchJSON (same as RecordBill.upcharge.test.tsx /
 * AllTasks.search.test.tsx) and assert every function hits the exact
 * method + URL + query string, sends the spec JSON body, passes response
 * cents through untouched, and propagates fetchJSON errors.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: vi.fn(() => Promise.resolve(null)),
  API_BASE: "http://localhost:8080",
}));

import { fetchJSON } from "@/api/fetchJSON";
import {
  listProjects,
  getProject,
  getProjectSummary,
  createProject,
  updateProject,
  deleteProject,
  getBudget,
  putBudget,
  getMilestones,
  putMilestones,
  attachTasks,
  detachTask,
  setTaskMilestone,
  listUnassignedTasks,
  listChangeOrders,
  createChangeOrder,
  updateChangeOrder,
  getSchedule,
  putSchedule,
  listPayments,
  createPayment,
  getCashFlow,
  type CreateProjectPayload,
} from "@/data/projects";

const mockFetchJSON = vi.mocked(fetchJSON);

/** The single call fetchJSON received, decomposed. */
function lastCall() {
  expect(mockFetchJSON).toHaveBeenCalledTimes(1);
  const [path, options] = mockFetchJSON.mock.calls[0];
  return {
    path,
    method: options?.method,
    body: options?.body != null ? JSON.parse(options.body as string) : undefined,
  };
}

beforeEach(() => {
  mockFetchJSON.mockReset();
  mockFetchJSON.mockResolvedValue(null);
});

/* ------------------------------- GET routes ------------------------------- */

describe("GET routes — method, URL, query string (§6)", () => {
  it("listProjects() with no opts hits GET /projects with no query string", async () => {
    mockFetchJSON.mockResolvedValueOnce([]);
    await listProjects();
    const { path, method } = lastCall();
    expect(path).toBe("/projects");
    expect(method).toBeUndefined(); // fetchJSON default = GET
  });

  it("listProjects() builds ?status=&property_id=&limit= from opts", async () => {
    mockFetchJSON.mockResolvedValueOnce([]);
    await listProjects({ status: "active", property_id: 42, limit: 50 });
    expect(lastCall().path).toBe("/projects?status=active&property_id=42&limit=50");
  });

  it("listProjects() includes only the opts that were provided", async () => {
    mockFetchJSON.mockResolvedValueOnce([]);
    await listProjects({ property_id: 7 });
    expect(lastCall().path).toBe("/projects?property_id=7");
  });

  it("listProjects() keeps property_id=0 (numeric zero is a valid filter)", async () => {
    mockFetchJSON.mockResolvedValueOnce([]);
    await listProjects({ property_id: 0, limit: 0 });
    expect(lastCall().path).toBe("/projects?property_id=0&limit=0");
  });

  it("getProject(id) hits GET /projects/{id}", async () => {
    mockFetchJSON.mockResolvedValueOnce({ id: 5 });
    await getProject(5);
    const { path, method } = lastCall();
    expect(path).toBe("/projects/5");
    expect(method).toBeUndefined();
  });

  it("getProjectSummary(id) hits GET /projects/{id}/summary", async () => {
    mockFetchJSON.mockResolvedValueOnce({ project: { id: 5 } });
    await getProjectSummary(5);
    expect(lastCall().path).toBe("/projects/5/summary");
  });

  it("getBudget(projectId) hits GET /projects/{id}/budget", async () => {
    await getBudget(3);
    expect(lastCall().path).toBe("/projects/3/budget");
  });

  it("getMilestones(projectId) hits GET /projects/{id}/milestones", async () => {
    await getMilestones(3);
    expect(lastCall().path).toBe("/projects/3/milestones");
  });

  it("listUnassignedTasks() with no opts hits GET /projects/unassigned-tasks", async () => {
    await listUnassignedTasks();
    expect(lastCall().path).toBe("/projects/unassigned-tasks");
  });

  it("listUnassignedTasks() builds ?property_id=&limit=", async () => {
    await listUnassignedTasks({ property_id: 42, limit: 50 });
    expect(lastCall().path).toBe("/projects/unassigned-tasks?property_id=42&limit=50");
  });

  it("listChangeOrders(projectId) hits GET /projects/{id}/change-orders", async () => {
    await listChangeOrders(9);
    expect(lastCall().path).toBe("/projects/9/change-orders");
  });

  it("getSchedule(projectId) hits GET /projects/{id}/schedule", async () => {
    await getSchedule(9);
    expect(lastCall().path).toBe("/projects/9/schedule");
  });

  it("listPayments(projectId) hits GET /projects/{id}/payments", async () => {
    await listPayments(9);
    expect(lastCall().path).toBe("/projects/9/payments");
  });

  it("getCashFlow(projectId) hits GET /projects/{id}/cashflow", async () => {
    await getCashFlow(9);
    expect(lastCall().path).toBe("/projects/9/cashflow");
  });
});

/* ---------------------------- mutating routes ----------------------------- */

describe("mutating routes — method, URL, spec JSON body (§6)", () => {
  it("createProject POSTs /projects with the full nested create body (indices)", async () => {
    const payload: CreateProjectPayload = {
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
    };
    mockFetchJSON.mockResolvedValueOnce({ project: { id: 1 } });
    await createProject(payload);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects");
    expect(method).toBe("POST");
    expect(body).toEqual(payload); // exact §6 request JSON, nested indices intact
  });

  it("updateProject PATCHes /projects/{id} with only the provided fields", async () => {
    const payload = { status: "on_hold" as const, percent_complete: 60, manager_user_id: 9 };
    mockFetchJSON.mockResolvedValueOnce({ id: 5 });
    await updateProject(5, payload);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/5");
    expect(method).toBe("PATCH");
    expect(body).toEqual(payload);
  });

  it("deleteProject DELETEs /projects/{id} and resolves void on 204/null", async () => {
    mockFetchJSON.mockResolvedValueOnce(null); // fetchJSON returns null on 204
    const result = await deleteProject(5);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/5");
    expect(method).toBe("DELETE");
    expect(body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it("putBudget PUTs the full-replace {categories:[...]} body (§6 mixed ids)", async () => {
    const payload = {
      categories: [
        {
          id: 10,
          name: "Demolition & Site Prep",
          amount_cents: 0,
          sub_budgets: [
            { id: 15, name: "Demo labor", amount_cents: 1700000 },
            { name: "Permit fees", amount_cents: 150000 }, // new row: no id
          ],
        },
        { name: "Appliances", amount_cents: 2000000 },
      ],
    };
    mockFetchJSON.mockResolvedValueOnce([]);
    await putBudget(1, payload);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/1/budget");
    expect(method).toBe("PUT");
    expect(body).toEqual(payload);
  });

  it("putMilestones PUTs the full-replace {milestones:[...]} body", async () => {
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
    mockFetchJSON.mockResolvedValueOnce([]);
    await putMilestones(1, payload);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/1/milestones");
    expect(method).toBe("PUT");
    expect(body).toEqual(payload);
  });

  it("attachTasks POSTs /projects/{id}/tasks with {tasks:[...]} (§6 example)", async () => {
    mockFetchJSON.mockResolvedValueOnce([]);
    await attachTasks(1, [{ task_id: 7002, milestone_id: 11 }, { task_id: 7003 }]);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/1/tasks");
    expect(method).toBe("POST");
    expect(body).toEqual({ tasks: [{ task_id: 7002, milestone_id: 11 }, { task_id: 7003 }] });
  });

  it("detachTask DELETEs /projects/{id}/tasks/{taskId}", async () => {
    await detachTask(1, 7002);
    const { path, method } = lastCall();
    expect(path).toBe("/projects/1/tasks/7002");
    expect(method).toBe("DELETE");
  });

  it("setTaskMilestone PATCHes /projects/{id}/tasks/{taskId} with {milestone_id}", async () => {
    mockFetchJSON.mockResolvedValueOnce({ ok: true });
    await setTaskMilestone(1, 7002, 12);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/1/tasks/7002");
    expect(method).toBe("PATCH");
    expect(body).toEqual({ milestone_id: 12 });
  });

  it('setTaskMilestone sends explicit {"milestone_id":null} for "— None —"', async () => {
    mockFetchJSON.mockResolvedValueOnce({ ok: true });
    await setTaskMilestone(1, 7002, null);
    const [, options] = mockFetchJSON.mock.calls[0];
    // null must survive serialization (JSON.stringify drops undefined, keeps null)
    expect(options?.body).toBe(JSON.stringify({ milestone_id: null }));
  });

  it("createChangeOrder POSTs /projects/{id}/change-orders with the §6 body", async () => {
    const payload = {
      description: "Heated bathroom floor add-on",
      reason: "Owner request",
      amount_cents: 450000,
      status: "draft" as const,
    };
    mockFetchJSON.mockResolvedValueOnce({ id: 9001 });
    await createChangeOrder(1, payload);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/1/change-orders");
    expect(method).toBe("POST");
    expect(body).toEqual(payload);
  });

  it("updateChangeOrder PATCHes /projects/{id}/change-orders/{coId} with a status transition", async () => {
    mockFetchJSON.mockResolvedValueOnce({ id: 9001, status: "approved" });
    await updateChangeOrder(1, 9001, { status: "approved" });
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/1/change-orders/9001");
    expect(method).toBe("PATCH");
    expect(body).toEqual({ status: "approved" });
  });

  it("updateChangeOrder also carries draft field edits", async () => {
    mockFetchJSON.mockResolvedValueOnce({ id: 9001 });
    await updateChangeOrder(1, 9001, { description: "Revised scope", amount_cents: 500000 });
    expect(lastCall().body).toEqual({ description: "Revised scope", amount_cents: 500000 });
  });

  it("putSchedule PUTs {lines:[...]} without billed_to_date (§6: not accepted)", async () => {
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
    mockFetchJSON.mockResolvedValueOnce([]);
    await putSchedule(1, payload);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/1/schedule");
    expect(method).toBe("PUT");
    expect(body).toEqual(payload);
    expect(JSON.stringify(body)).not.toContain("billed_to_date");
  });

  it("createPayment POSTs /projects/{id}/payments with the §6 body", async () => {
    const payload = {
      kind: "deposit" as const,
      amount_cents: 10200000,
      received_on: "2026-03-03",
      reference: "Initial project deposit (30%)",
    };
    mockFetchJSON.mockResolvedValueOnce({ id: 1 });
    await createPayment(1, payload);
    const { path, method, body } = lastCall();
    expect(path).toBe("/projects/1/payments");
    expect(method).toBe("POST");
    expect(body).toEqual(payload);
  });
});

/* --------------------------- response passthrough --------------------------- */

describe("response parsing — cents pass through untouched", () => {
  it("listProjects returns the API rows byte-identical (odd cents preserved)", async () => {
    const rows = [
      {
        id: 1,
        name: "Reno",
        property_id: 42,
        property_name: "(C) 544 Oenoke Ridge",
        property_address: "544 Oenoke Ridge, New Canaan, CT 06840",
        status: "active",
        current_budget_cents: 36600001, // odd cent — must not be rounded/scaled
        spent_cents: 17850003,
        outstanding_invoices_cents: 0,
        percent_complete: 50,
        start_date: "2026-03-02",
        target_end_date: "2026-09-30",
        manager_name: "Carter Hughes",
        manager_initials: "CH",
        task_count: 6,
        pending_change_orders_count: 2,
        pending_change_orders_cents: 1050007,
      },
    ];
    mockFetchJSON.mockResolvedValueOnce(rows);
    const result = await listProjects();
    expect(result).toBe(rows); // same reference: zero transformation
    expect(result[0].current_budget_cents).toBe(36600001);
    expect(result[0].spent_cents).toBe(17850003);
  });

  it("getProjectSummary passes the nested financial cents through untouched", async () => {
    const summary = {
      project: { id: 1, original_budget_cents: 34000000 },
      financials: {
        original_budget_cents: 34000000,
        approved_change_orders_cents: 2600000,
        current_budget_cents: 36600000,
        spent_cents: 17850001,
        remaining_budget_cents: 18749999,
        collected_cents: 20400000,
        billed_to_date_cents: 0,
        outstanding_invoices_cents: 0,
        net_cash_cents: 2550000,
        pending_change_orders_cents: 1050000,
        pending_change_orders_count: 2,
      },
      counts: { tasks: 6, work_orders: 8, field_team_orders: 2 },
      tasks: [{ id: 101, spent_cents: 2400001 }],
      budget: [{ id: 10, amount_cents: 2500000, spent_cents: 2500000, sub_budgets: [] }],
      milestones: [],
      change_orders: [{ id: 9001, amount_cents: 1400000 }],
      schedule: [{ id: 21, scheduled_value_cents: 2500000, billed_to_date_cents: 0 }],
      work_orders: [{ id: 501, estimated_cost_cents: 2500000, billed_cents: 2400000 }],
      field_team_orders: [{ id: 601, amount_cents: 68000 }],
    };
    mockFetchJSON.mockResolvedValueOnce(summary);
    const result = await getProjectSummary(1);
    expect(result).toBe(summary);
    expect(result.financials.spent_cents).toBe(17850001);
    expect(result.financials.remaining_budget_cents).toBe(18749999);
  });

  it("putBudget returns the refreshed categories exactly as sent by the API", async () => {
    const refreshed = [
      {
        id: 10,
        name: "Demolition & Site Prep",
        amount_cents: 1850000,
        spent_cents: 160707, // real cent value: must not truncate to whole dollars
        sort_order: 0,
        sub_budgets: [{ id: 15, name: "Demo labor", amount_cents: 1700000, sort_order: 0 }],
      },
    ];
    mockFetchJSON.mockResolvedValueOnce(refreshed);
    const result = await putBudget(1, { categories: [] });
    expect(result).toBe(refreshed);
    expect(result[0].spent_cents).toBe(160707);
  });

  it("createChangeOrder passes the server-assigned co_number through", async () => {
    const co = { id: 9005, project_id: 1, co_number: "CO-005", amount_cents: 450000 };
    mockFetchJSON.mockResolvedValueOnce(co);
    const result = await createChangeOrder(1, { description: "x", amount_cents: 450000 });
    expect(result).toBe(co);
  });

  it("getCashFlow passes entries through in API order", async () => {
    const entries = [
      { date: "2026-03-03", direction: "inbound", kind: "Deposit", description: "d", party: "Owner", amount_cents: 10200000 },
      { date: "2026-03-28", direction: "outbound", kind: "Vendor Bill Payment", description: "x", party: "Greenwich Demo Co", amount_cents: 2400000 },
    ];
    mockFetchJSON.mockResolvedValueOnce(entries);
    const result = await getCashFlow(1);
    expect(result).toBe(entries);
  });

  it("list functions coerce a null API body to [] (empty state, no derive-fallbacks)", async () => {
    // mockResolvedValue(null) is the beforeEach default for all of these
    expect(await listProjects()).toEqual([]);
    expect(await getBudget(1)).toEqual([]);
    expect(await getMilestones(1)).toEqual([]);
    expect(await listUnassignedTasks()).toEqual([]);
    expect(await listChangeOrders(1)).toEqual([]);
    expect(await getSchedule(1)).toEqual([]);
    expect(await listPayments(1)).toEqual([]);
    expect(await getCashFlow(1)).toEqual([]);
  });
});

/* ----------------------------- error propagation ---------------------------- */

describe("error propagation — fetchJSON rejections surface unchanged", () => {
  it.each([
    ["400 invalid status", listProjects, ["invalid status"]],
    ["404 project not found", () => getProject(999), ["project not found"]],
    ["403 forbidden", () => deleteProject(1), ["forbidden"]],
    ["409 task conflict", () => attachTasks(5, [{ task_id: 7002 }]), ["task 7002 already belongs to project 5"]],
  ] as const)("%s propagates as the same Error", async (_label, fn, [message]) => {
    mockFetchJSON.mockRejectedValueOnce(new Error(message));
    await expect(fn()).rejects.toThrow(message);
  });

  it("mutation errors propagate (create with bad index)", async () => {
    mockFetchJSON.mockRejectedValueOnce(new Error("budget_category_index 3 out of range"));
    await expect(
      createProject({ name: "X", property_id: 42 }),
    ).rejects.toThrow("budget_category_index 3 out of range");
  });
});
