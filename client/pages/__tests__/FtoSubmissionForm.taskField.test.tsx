/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FtoSubmissionForm from "../FtoSubmissionForm";

/**
 * The Hours/Expenses "Task" dropdown was really the field team order picker
 * (HourEntry.taskId holds an FTO id). It is now labelled "Field Team Order",
 * and a separate optional "Task" field links that FTO to a task —
 * field_team_orders.task_id, written with PATCH /maintenance/ftos/{id}.
 */

const PROPERTY_ID = 496;

const mockProperties = [
  {
    id: PROPERTY_ID,
    name: "544 Oenoke Ridge",
    buildium_property_id: "1",
    property_type: "C", // concierge -> unit defaults to Property Level
    address_line1: "544 Oenoke Ridge",
    address_line2: "",
    city: "New Canaan",
    state: "CT",
    postal_code: "06840",
    management_fee_cents: null,
    hourly_rate_cents: 10000,
    emergency_hourly_rate_cents: 15000,
    active: true,
    created_at: "2026-01-01T00:00:00Z",
    manager_names: [],
  },
];

// FTO 734 already points at task 142 ("AC Repair"); 735 has no task at all.
// The FTO and task names differ on purpose so queries can't confuse them.
const mockFtos = [
  {
    id: 734,
    name: "AC Repair Visit",
    description: "",
    property_id: PROPERTY_ID,
    property_name: "544 Oenoke Ridge",
    status: "dispatched",
    priority: "normal",
    approval_status: "pending",
    form_submission_status: "none",
    task_id: 142,
  },
  {
    id: 735,
    name: "Plumbing visit",
    description: "",
    property_id: PROPERTY_ID,
    property_name: "544 Oenoke Ridge",
    status: "dispatched",
    priority: "normal",
    approval_status: "pending",
    form_submission_status: "none",
    task_id: null,
  },
];

// Two of these must never reach the dropdown: 900 (closed) and 901 (cancelled).
// 48 is in_progress and MUST appear — "open" means "not finished", not
// literally status='open'.
const mockTasks = [
  { id: 48, name: "Optimum Fiber Internet Installation", status: "in_progress" },
  { id: 137, name: "Replace Valves & Insulate Pipes", status: "open" },
  { id: 142, name: "AC Repair", status: "open" },
  { id: 900, name: "Old Closed Task", status: "closed" },
  { id: 901, name: "Abandoned Task", status: "cancelled" },
];

const fetchMock = vi.fn((url: string, _opts?: any) => {
  if (url === "/properties") return Promise.resolve(mockProperties);
  if (url.startsWith("/maintenance/ftos?")) return Promise.resolve(mockFtos);
  if (url.startsWith("/maintenance/tasks?")) return Promise.resolve(mockTasks);
  if (url.startsWith(`/properties/${PROPERTY_ID}/units`)) return Promise.resolve([]);
  if (url.startsWith("/maintenance/ftos/")) return Promise.resolve({ ok: true });
  if (url === "/maintenance/submissions") return Promise.resolve({ id: 1 });
  return Promise.resolve([]);
});

vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: (url: string, opts?: any) => fetchMock(url, opts),
  authFetch: vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })),
  API_BASE: "http://localhost:8080",
}));

vi.mock("@/auth/useAuth", () => ({
  useAuth: () => ({ userId: 5, role: "admin", name: "Test User" }),
}));

// Out-of-scope subtrees: never opened by these tests.
vi.mock("@/components/CreateFTOModal", () => ({ default: () => null }));
vi.mock("@/components/PdfViewerModal", () => ({ default: () => null }));
vi.mock("@/components/MsgViewerModal", () => ({ default: () => null }));
vi.mock("@/layout/PageTemplate", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// heic2any spins up a Web Worker at import time, which jsdom has no shim for.
vi.mock("@/utils/convertFiletoPdf", () => ({
  convertFiletoPdf: vi.fn(async (f: File) => f),
}));
vi.mock("@/utils/parseMsgFile", () => ({
  parseMsgFile: vi.fn(async () => ({ subject: "", body: "", attachments: [] })),
}));

function renderForm() {
  return render(
    <MemoryRouter initialEntries={["/fto/submission"]}>
      <FtoSubmissionForm />
    </MemoryRouter>,
  );
}

/**
 * SelectField derives its trigger id from the label
 * ("Field Team Order" -> "field-team-order"). The Hours and Expenses sections
 * both render a field of each name, so `nth` picks the section: 0 = Hours.
 */
function fieldTrigger(labelText: string, nth = 0): HTMLElement {
  const id = labelText.toLowerCase().replace(/\s+/g, "-");
  const matches = document.querySelectorAll<HTMLElement>(`#${id}`);
  if (!matches[nth]) {
    throw new Error(
      `No control #${id}[${nth}] (found ${matches.length}) for "${labelText}"`,
    );
  }
  return matches[nth];
}

/** Radix opens on pointerdown, which fireEvent.click alone doesn't emit. */
function openDropdown(trigger: HTMLElement) {
  fireEvent.pointerDown(
    trigger,
    new PointerEvent("pointerdown", { bubbles: true, button: 0 }),
  );
  fireEvent.click(trigger);
}

async function selectProperty() {
  openDropdown(fieldTrigger("Property"));
  const option = await screen.findByText(/544 Oenoke Ridge/);
  fireEvent.click(option);
  await waitFor(() => {
    expect(
      fetchMock.mock.calls.some(([u]) => String(u).startsWith("/maintenance/tasks?")),
    ).toBe(true);
  });
}

beforeEach(() => {
  fetchMock.mockClear();
  localStorage.clear();
});

describe("FtoSubmissionForm — Field Team Order rename + new Task field", () => {
  it("labels the FTO picker 'Field Team Order' and offers a separate 'Task' field", async () => {
    renderForm();
    await waitFor(() => expect(screen.getAllByText("Property").length).toBeGreaterThan(0));

    // The old label was "Task" for what is really the FTO picker.
    expect(screen.getAllByText("Field Team Order").length).toBeGreaterThan(0);
    // And a distinct Task field now exists alongside it.
    expect(screen.getAllByText("Task").length).toBeGreaterThan(0);
  });

  it("enables the Task field on property alone, with no field team order picked", async () => {
    renderForm();
    await waitFor(() => expect(screen.getAllByText("Property").length).toBeGreaterThan(0));

    // Before a property: nothing to list yet.
    expect(fieldTrigger("Task")).toBeDisabled();

    await selectProperty();

    // After a property: usable immediately, even though Field Team Order is
    // still empty. The pick is applied to whichever FTO is chosen afterward.
    await waitFor(() => expect(fieldTrigger("Task")).not.toBeDisabled());
    expect(fieldTrigger("Field Team Order").textContent).toContain(
      "Select Field Team Order",
    );
    expect(fieldTrigger("Task").textContent).toContain("Select Task");
  });

  it("prefills the Task field from the task the selected FTO already links to", async () => {
    renderForm();
    await waitFor(() => expect(screen.getAllByText("Property").length).toBeGreaterThan(0));
    await selectProperty();

    openDropdown(fieldTrigger("Field Team Order"));
    fireEvent.click(await screen.findByText("AC Repair Visit"));

    // FTO 734 carries task_id 142 ("AC Repair"), so the Task trigger shows it
    // without the user picking anything.
    await waitFor(() => {
      const trigger = fieldTrigger("Task");
      expect(trigger.textContent).toContain("AC Repair");
    });
  });

  it("does not PATCH any FTO when the Task field is left untouched", async () => {
    renderForm();
    await waitFor(() => expect(screen.getAllByText("Property").length).toBeGreaterThan(0));
    await selectProperty();

    openDropdown(fieldTrigger("Field Team Order"));
    fireEvent.click(await screen.findByText("AC Repair Visit"));

    // Seeding alone must not be mistaken for a user edit.
    const patches = fetchMock.mock.calls.filter(
      ([u, o]) => String(u).startsWith("/maintenance/ftos/") && o?.method === "PATCH",
    );
    expect(patches).toHaveLength(0);
  });
});
