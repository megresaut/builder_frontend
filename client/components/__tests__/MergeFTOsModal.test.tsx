/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import MergeFTOsModal from "../MergeFTOsModal";

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function makeFTO(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    name: "Fix kitchen faucet",
    description: "Faucet is leaking",
    property: "22 Indian Chase Dr",
    property_id: 10,
    dueDate: "Oct 2, 2025",
    due_date: "2025-10-02T00:00:00Z",
    priority: "normal" as const,
    status: "Dispatched",
    timesheetStatus: "awaiting-submission",
    amount: 150,
    unit: "Unit A",
    fieldTeam: [
      { id: 1, initials: "CH", name: "Christopher Harris", color: "bg-blue-500" },
    ],
    hours: 4.5,
    task_id: null as number | null,
    bill_id: null as number | null,
    bill_draft_id: null as number | null,
    form_submission_status: "none" as "none" | "partial" | "complete",
    field_team_member_ids: [1],
    pm_assignee_ids: [],
    originalStatus: "dispatched",
    taskId: 1,
    event_start_at: null,
    event_end_at: null,
    ...overrides,
  };
}

const ftoA = makeFTO({ id: 1, name: "Fix kitchen faucet", hours: 4.5, amount: 150 });
const ftoB = makeFTO({ id: 2, name: "Kitchen faucet repair", hours: 2.0, amount: 75 });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderModal(
  props: Partial<React.ComponentProps<typeof MergeFTOsModal>> = {}
) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    selectedFTOs: [ftoA, ftoB],
    onConfirmMerge: vi.fn(),
    ...props,
  };
  return { ...render(<MergeFTOsModal {...defaultProps} />), props: defaultProps };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MergeFTOsModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Basic rendering ----

  it("renders the modal title and both FTO cards", () => {
    renderModal();
    // Title appears twice: sr-only DialogTitle + visible header
    expect(screen.getAllByText("Merge Field Team Orders").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("FTO #1")).toBeInTheDocument();
    expect(screen.getByText("FTO #2")).toBeInTheDocument();
  });

  it("renders FTO details in each card", () => {
    renderModal();
    expect(screen.getAllByText("Fix kitchen faucet").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Kitchen faucet repair").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("22 Indian Chase Dr").length).toBe(2);
  });

  // ---- Primary selection ----

  it("defaults primary to the first FTO", () => {
    renderModal();
    // First card should have the Primary badge
    const primaryBadges = screen.getAllByText("Primary");
    expect(primaryBadges).toHaveLength(1);
    // "Will be merged" should appear on the other card
    expect(screen.getByText("Will be merged")).toBeInTheDocument();
  });

  it("changes primary when clicking another card", () => {
    renderModal();
    // Click the second FTO card (FTO #2)
    fireEvent.click(screen.getByText("FTO #2"));
    // Now FTO #2 should be primary
    const fto2Card = screen.getByText("FTO #2").closest("button")!;
    expect(within(fto2Card).getByText("Primary")).toBeInTheDocument();
  });

  // ---- Confirm callback ----

  it("calls onConfirmMerge with correct primary and merged IDs", () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByText("Merge FTOs"));
    expect(props.onConfirmMerge).toHaveBeenCalledWith(1, [2]);
  });

  it("passes switched primary correctly after user changes selection", () => {
    const { props } = renderModal();
    // Switch primary to FTO #2
    fireEvent.click(screen.getByText("FTO #2"));
    fireEvent.click(screen.getByText("Merge FTOs"));
    expect(props.onConfirmMerge).toHaveBeenCalledWith(2, [1]);
  });

  // ---- 3+ FTO merge ----

  it("handles 3 FTOs — merges non-primary two into primary", () => {
    const ftoC = makeFTO({ id: 3, name: "Faucet maintenance", hours: 1.0, amount: 50 });
    const { props } = renderModal({ selectedFTOs: [ftoA, ftoB, ftoC] });

    expect(screen.getByText("FTO #3")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Merge FTOs"));
    expect(props.onConfirmMerge).toHaveBeenCalledWith(1, [2, 3]);
  });

  // ---- Merge summary ----

  it("shows merge summary with transferred hours and amount", () => {
    const ftoWithSubmissions = makeFTO({
      id: 2,
      name: "Kitchen faucet repair",
      hours: 2.0,
      amount: 75,
      form_submission_status: "complete",
    });
    renderModal({ selectedFTOs: [ftoA, ftoWithSubmissions] });

    expect(screen.getByText(/Merge summary/)).toBeInTheDocument();
    // Hours and amount appear in both the card and summary — just check summary section exists
    const summarySection = screen.getByText(/Merge summary/).closest("div")!;
    expect(summarySection.textContent).toContain("2h");
    expect(summarySection.textContent).toContain("$75");
  });

  it("shows 'permanently deleted' in summary", () => {
    renderModal();
    expect(screen.getByText(/permanently deleted/)).toBeInTheDocument();
  });

  // ---- Task association display ----

  it("shows task badge when FTO has a task_id", () => {
    const ftoWithTask = makeFTO({ id: 1, task_id: 42 });
    const ftoNoTask = makeFTO({ id: 2, name: "No task FTO", task_id: null });
    renderModal({ selectedFTOs: [ftoWithTask, ftoNoTask] });

    expect(screen.getByText("Task #42")).toBeInTheDocument();
  });

  it("does not show task badge when task_id is null", () => {
    renderModal(); // both ftoA and ftoB have task_id: null
    expect(screen.queryByText(/Task #/)).not.toBeInTheDocument();
  });

  // ---- Different-task conflict (BLOCKING) ----

  it("blocks merge when FTOs are linked to different tasks", () => {
    const fto1 = makeFTO({ id: 1, task_id: 10 });
    const fto2 = makeFTO({ id: 2, task_id: 20 });
    const { props } = renderModal({ selectedFTOs: [fto1, fto2] });

    expect(screen.getByText(/Cannot merge/)).toBeInTheDocument();
    expect(screen.getByText(/different tasks linked/)).toBeInTheDocument();

    // Confirm button should be disabled — clicking it should NOT call callback
    fireEvent.click(screen.getByText("Merge FTOs"));
    expect(props.onConfirmMerge).not.toHaveBeenCalled();
  });

  it("does not block when both FTOs share the same task", () => {
    const fto1 = makeFTO({ id: 1, task_id: 10 });
    const fto2 = makeFTO({ id: 2, task_id: 10 });
    renderModal({ selectedFTOs: [fto1, fto2] });

    expect(screen.queryByText(/Cannot merge/)).not.toBeInTheDocument();
  });

  it("does not block when only one FTO has a task", () => {
    const fto1 = makeFTO({ id: 1, task_id: 10 });
    const fto2 = makeFTO({ id: 2, task_id: null });
    renderModal({ selectedFTOs: [fto1, fto2] });

    expect(screen.queryByText(/Cannot merge/)).not.toBeInTheDocument();
  });

  // ---- Task loss warning (non-blocking) ----

  it("warns when non-primary FTO will lose its task link", () => {
    const fto1 = makeFTO({ id: 1, task_id: null }); // primary, no task
    const fto2 = makeFTO({ id: 2, task_id: 15 }); // will be merged, has task
    renderModal({ selectedFTOs: [fto1, fto2] });

    expect(screen.getByText(/Task link will be lost/)).toBeInTheDocument();
    // "Task #15" appears in both the card badge and the warning — just verify at least one
    expect(screen.getAllByText(/Task #15/).length).toBeGreaterThanOrEqual(1);
  });

  it("does not warn about task loss when primary has the same task", () => {
    const fto1 = makeFTO({ id: 1, task_id: 10 });
    const fto2 = makeFTO({ id: 2, task_id: 10 });
    renderModal({ selectedFTOs: [fto1, fto2] });

    expect(screen.queryByText(/Task link will be lost/)).not.toBeInTheDocument();
  });

  it("task loss warning disappears when user switches primary to the task-linked FTO", () => {
    const ftoNoTask = makeFTO({ id: 1, task_id: null });
    const ftoWithTask = makeFTO({ id: 2, task_id: 15 });
    renderModal({ selectedFTOs: [ftoNoTask, ftoWithTask] });

    // Warning visible initially (primary = FTO #1 which has no task)
    expect(screen.getByText(/Task link will be lost/)).toBeInTheDocument();

    // Switch primary to FTO #2 (has the task)
    fireEvent.click(screen.getByText("FTO #2"));
    // Now the non-primary (FTO #1) has no task — no loss warning
    expect(screen.queryByText(/Task link will be lost/)).not.toBeInTheDocument();
  });

  // ---- Bill association warning ----

  it("warns when an FTO has a bill_id", () => {
    const fto1 = makeFTO({ id: 1 });
    const fto2 = makeFTO({ id: 2, bill_id: 99 });
    renderModal({ selectedFTOs: [fto1, fto2] });

    expect(screen.getByText(/Bill association detected/)).toBeInTheDocument();
  });

  it("warns when an FTO has a bill_draft_id", () => {
    const fto1 = makeFTO({ id: 1 });
    const fto2 = makeFTO({ id: 2, bill_draft_id: 55 });
    renderModal({ selectedFTOs: [fto1, fto2] });

    expect(screen.getByText(/Bill association detected/)).toBeInTheDocument();
  });

  it("does not show bill warning when no bills are linked", () => {
    renderModal(); // both have bill_id: null
    expect(screen.queryByText(/Bill association detected/)).not.toBeInTheDocument();
  });

  // ---- Submissions badge ----

  it("shows 'Has submissions' badge when form_submission_status is not none", () => {
    const fto1 = makeFTO({ id: 1, form_submission_status: "complete" });
    const fto2 = makeFTO({ id: 2, form_submission_status: "none" });
    renderModal({ selectedFTOs: [fto1, fto2] });

    expect(screen.getAllByText("Has submissions")).toHaveLength(1);
  });

  // ---- Cancel ----

  it("calls onOpenChange(false) when Cancel is clicked", () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  // ---- Not rendered when closed ----

  it("does not render content when open is false", () => {
    renderModal({ open: false });
    expect(screen.queryByText("Merge Field Team Orders")).not.toBeInTheDocument();
  });
});
