import { describe, it, expect, vi } from "vitest";

// Importing the page module runs its import graph; heic2any spins up a Web
// Worker at import time, which jsdom has no shim for.
vi.mock("@/utils/convertFiletoPdf", () => ({ convertFiletoPdf: vi.fn() }));
vi.mock("@/utils/parseMsgFile", () => ({ parseMsgFile: vi.fn() }));

import {
  buildTaskOptions,
  planFtoTaskLinkWrites,
} from "../FtoSubmissionForm";

/**
 * The Hours/Expenses "Task" dropdown was really the field team order picker
 * (HourEntry.taskId holds an FTO id). It is now labelled "Field Team Order",
 * and a separate optional "Task" field links that FTO to a task —
 * field_team_orders.task_id, written with PATCH /maintenance/ftos/{id}.
 *
 * These cover the two decisions that logic makes: which tasks are offered, and
 * which FTOs actually get written.
 */

const tasks = [
  { id: 48, name: "Fiber Internet Installation", status: "in_progress" },
  { id: 137, name: "Replace Valves", status: "open" },
  { id: 140, name: "Waiting on plumber", status: "pending_vendor" },
  { id: 141, name: "Booked for Tuesday", status: "scheduled" },
  { id: 145, name: "Punted to next quarter", status: "deferred" },
  { id: 900, name: "Old Closed Task", status: "closed" },
  { id: 901, name: "Abandoned Task", status: "cancelled" },
];

const labels = (opts: { label: string }[]) => opts.map((o) => o.label);

describe("buildTaskOptions", () => {
  it("offers every non-finished status, not just status='open'", () => {
    const got = labels(buildTaskOptions(tasks, null));
    expect(got).toEqual([
      "— None —",
      "Fiber Internet Installation", // in_progress
      "Replace Valves", // open
      "Waiting on plumber", // pending_vendor
      "Booked for Tuesday", // scheduled
      "Punted to next quarter", // deferred
    ]);
  });

  it("excludes closed and cancelled tasks", () => {
    const got = labels(buildTaskOptions(tasks, null));
    expect(got).not.toContain("Old Closed Task");
    expect(got).not.toContain("Abandoned Task");
  });

  it("keeps a finished task that the FTO is already linked to", () => {
    // Opening an old submission must not silently drop its existing link.
    const got = labels(buildTaskOptions(tasks, 900));
    expect(got).toContain("Old Closed Task");
    expect(got).not.toContain("Abandoned Task");
  });

  it("leads with a clearing option so the optional field can be emptied", () => {
    expect(buildTaskOptions(tasks, 137)[0]).toEqual({
      value: "",
      label: "— None —",
    });
  });

  it("falls back to an id label for a nameless task", () => {
    const got = buildTaskOptions([{ id: 7, name: "", status: "open" }], null);
    expect(got[1]).toEqual({ value: "7", label: "Task #7" });
  });
});

describe("planFtoTaskLinkWrites", () => {
  // FTO 734 is linked to task 142; FTO 735 has no task.
  const ftosByProperty = {
    "496": [
      { id: 734, task_id: 142 },
      { id: 735, task_id: null },
    ],
  };
  const hourEntry = (over: Record<string, any> = {}) => ({
    taskId: "734",
    propertyId: "496",
    customTaskName: "",
    ...over,
  });

  it("writes nothing when the Task field was never touched", () => {
    // No key in taskByFtoKey means the user never opened the field. Seeding
    // alone must not be mistaken for an edit.
    const plan = planFtoTaskLinkWrites([hourEntry()], {}, ftosByProperty);
    expect(plan.size).toBe(0);
  });

  it("writes nothing when the pick equals what the FTO already stores", () => {
    // Avoids churning updated_at and triggering a pointless Outlook re-sync.
    const plan = planFtoTaskLinkWrites(
      [hourEntry()],
      { "fto:734": 142 },
      ftosByProperty
    );
    expect(plan.size).toBe(0);
  });

  it("writes the new task when the pick differs", () => {
    const plan = planFtoTaskLinkWrites(
      [hourEntry()],
      { "fto:734": 137 },
      ftosByProperty
    );
    expect([...plan]).toEqual([[734, 137]]);
  });

  it("links a task onto an FTO that had none", () => {
    const plan = planFtoTaskLinkWrites(
      [hourEntry({ taskId: "735" })],
      { "fto:735": 137 },
      ftosByProperty
    );
    expect([...plan]).toEqual([[735, 137]]);
  });

  it("sends 0 to unlink when the user clears the field", () => {
    // field_team_orders' UPDATE maps a task_id of 0 to NULL.
    const plan = planFtoTaskLinkWrites(
      [hourEntry()],
      { "fto:734": null },
      ftosByProperty
    );
    expect([...plan]).toEqual([[734, 0]]);
  });

  it("collapses entries sharing an FTO into one write", () => {
    // The link lives on the FTO, so two hour lines on one FTO are one write.
    const plan = planFtoTaskLinkWrites(
      [hourEntry(), hourEntry(), hourEntry({ taskId: "735" })],
      { "fto:734": 137, "fto:735": 137 },
      ftosByProperty
    );
    expect(plan.size).toBe(2);
    expect(plan.get(734)).toBe(137);
    expect(plan.get(735)).toBe(137);
  });

  it("skips misc expense lines, which have no FTO to attach to", () => {
    const plan = planFtoTaskLinkWrites(
      [hourEntry({ taskId: "0" })], // MISC_EXPENSE_TASK_VALUE
      { "fto:0": 137 },
      ftosByProperty
    );
    expect(plan.size).toBe(0);
  });

  it("skips inline FTOs, whose task rides along in the create payload", () => {
    const plan = planFtoTaskLinkWrites(
      [hourEntry({ taskId: "__custom_fto__", customTaskName: "Fix gate" })],
      { "custom:496::Fix gate": 137 },
      ftosByProperty
    );
    expect(plan.size).toBe(0);
  });

  it("skips entries with no field team order selected", () => {
    const plan = planFtoTaskLinkWrites(
      [hourEntry({ taskId: null })],
      { "fto:734": 137 },
      ftosByProperty
    );
    expect(plan.size).toBe(0);
  });
});
