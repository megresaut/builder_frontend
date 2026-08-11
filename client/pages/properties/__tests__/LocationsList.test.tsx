/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LocationsList, type LocationRow } from "../LocationsList";

// Locations were read-only until the row action menu was added: the API had no
// create/update/delete at all. These tests pin the parts that are easy to get
// wrong -- the delete that must be blocked rather than attempted, and the
// role gating that mirrors the server.

vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: vi.fn(),
  authFetch: vi.fn(),
  API_BASE: "http://localhost:8080",
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    loading: vi.fn(() => "toast-id"),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

let mockRole = "admin";
vi.mock("@/auth/useAuth", () => ({
  useAuth: () => ({ role: mockRole, token: "t", userId: 1, loading: false, isAuthenticated: true }),
}));

import { fetchJSON, authFetch } from "@/api/fetchJSON";

const mockFetchJSON = fetchJSON as unknown as ReturnType<typeof vi.fn>;
const mockAuthFetch = authFetch as unknown as ReturnType<typeof vi.fn>;

const noUsage = {
  tasks: 0,
  work_orders: 0,
  field_team_orders: 0,
  fto_submissions: 0,
  inspections: 0,
  recurring_task_series: 0,
};

function loc(over: Partial<LocationRow> = {}): LocationRow {
  return {
    id: 1,
    property_id: 505,
    address_line1: "1018 High Ridge Road",
    address_line2: null,
    city: "Stamford",
    state: "CT",
    postal_code: "06905",
    created_at: "2026-01-01T00:00:00Z",
    is_admin: false,
    usage: { ...noUsage },
    ...over,
  };
}

function renderList() {
  return render(
    <MemoryRouter>
      <LocationsList propertyAddress="Palm Ventures LLC" propertyType="C" propertyId={505} />
    </MemoryRouter>,
  );
}

/** Opens the row action menu for the given accessible label. */
async function openMenu(label: string) {
  const trigger = await screen.findByLabelText(`Actions for ${label}`);
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  fireEvent.click(trigger);
  return trigger;
}

describe("LocationsList row actions", () => {
  beforeEach(() => {
    mockRole = "admin";
    mockFetchJSON.mockReset();
    mockAuthFetch.mockReset();
    mockFetchJSON.mockResolvedValue([loc()]);
  });

  it("renders an action menu on every row", async () => {
    mockFetchJSON.mockResolvedValue([
      loc({ id: 1, address_line1: "1018 High Ridge Road" }),
      loc({ id: 2, address_line1: "15 Corbin Drive" }),
    ]);
    renderList();
    expect(await screen.findByLabelText("Actions for 1018 High Ridge Road")).toBeInTheDocument();
    expect(await screen.findByLabelText("Actions for 15 Corbin Drive")).toBeInTheDocument();
  });

  it("hides the menu and Add button from field team members", async () => {
    mockRole = "field_team_member";
    renderList();
    await screen.findByText("1018 High Ridge Road");
    expect(screen.queryByLabelText(/^Actions for/)).not.toBeInTheDocument();
    expect(screen.queryByText("Add location")).not.toBeInTheDocument();
  });

  it("shows Add but not Delete for a property manager", async () => {
    mockRole = "property_manager";
    renderList();
    expect(await screen.findByText("Add location")).toBeInTheDocument();
    await openMenu("1018 High Ridge Road");
    expect(await screen.findByText("Edit")).toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  // The whole point of the usage counts: a referenced location must never even
  // attempt the DELETE, because the answer is a 409 the user cannot act on from
  // a confirm dialog.
  it("blocks delete for a referenced location without calling the API", async () => {
    mockFetchJSON.mockResolvedValue([
      loc({ usage: { ...noUsage, tasks: 3, work_orders: 1 } }),
    ]);
    renderList();
    await openMenu("1018 High Ridge Road");
    fireEvent.click(await screen.findByText("Delete"));

    // ModalTemplate renders its title twice: once visibly and once as an
    // sr-only DialogTitle, so match all rather than exactly one.
    expect((await screen.findAllByText("Can't delete this location")).length).toBeGreaterThan(0);
    expect(await screen.findByText("3 tasks")).toBeInTheDocument();
    expect(await screen.findByText("1 work order")).toBeInTheDocument();
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  it("confirms then deletes an unreferenced location", async () => {
    mockAuthFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ deleted: 1 }) });
    renderList();
    await openMenu("1018 High Ridge Road");
    fireEvent.click(await screen.findByText("Delete"));

    expect((await screen.findAllByText("Delete location?")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Delete", { selector: "button" }));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    const [url, opts] = mockAuthFetch.mock.calls[0];
    expect(url).toBe("/properties/505/locations/1");
    expect(opts.method).toBe("DELETE");
    await waitFor(() =>
      expect(screen.queryByText("1018 High Ridge Road")).not.toBeInTheDocument(),
    );
  });

  // The server is the authority on whether a delete is allowed: the cached
  // counts can be stale, so a 409 must still render the blocking dialog.
  it("renders the blocking dialog when the server answers 409", async () => {
    mockAuthFetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: "location_in_use",
        usage: { ...noUsage, field_team_orders: 2 },
      }),
    });
    renderList();
    await openMenu("1018 High Ridge Road");
    fireEvent.click(await screen.findByText("Delete"));
    fireEvent.click(screen.getByText("Delete", { selector: "button" }));

    expect((await screen.findAllByText("Can't delete this location")).length).toBeGreaterThan(0);
    expect(await screen.findByText("2 field team orders")).toBeInTheDocument();
  });

  it("disables Delete on the admin location", async () => {
    mockFetchJSON.mockResolvedValue([loc({ is_admin: true })]);
    renderList();
    await openMenu("1018 High Ridge Road");
    const del = await screen.findByText("Delete");
    // Radix marks a disabled item with data-disabled rather than the attribute.
    expect(del.closest("[role='menuitem']")).toHaveAttribute("data-disabled");
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  it("sends a PUT with the full address when an edit is saved", async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => loc({ address_line1: "1018 High Ridge Rd" }),
    });
    renderList();
    await openMenu("1018 High Ridge Road");
    fireEvent.click(await screen.findByText("Edit"));

    const line1 = await screen.findByDisplayValue("1018 High Ridge Road");
    fireEvent.change(line1, { target: { value: "1018 High Ridge Rd" } });
    fireEvent.click(screen.getByText("Save changes"));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    const [url, opts] = mockAuthFetch.mock.calls[0];
    expect(url).toBe("/properties/505/locations/1");
    expect(opts.method).toBe("PUT");
    expect(JSON.parse(opts.body)).toEqual({
      address_line1: "1018 High Ridge Rd",
      address_line2: null,
      city: "Stamford",
      state: "CT",
      postal_code: "06905",
    });
  });

  it("posts to the collection when adding a location", async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => loc({ id: 99, address_line1: "99 Test Lane" }),
    });
    renderList();
    fireEvent.click(await screen.findByText("Add location"));

    fireEvent.change(await screen.findByPlaceholderText("19 West Elm Street"), {
      target: { value: "99 Test Lane" },
    });
    fireEvent.change(screen.getByPlaceholderText("Greenwich"), { target: { value: "Darien" } });
    fireEvent.change(screen.getByPlaceholderText("CT"), { target: { value: "CT" } });
    fireEvent.change(screen.getByPlaceholderText("06830"), { target: { value: "06820" } });
    fireEvent.click(screen.getByText("Create location"));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    const [url, opts] = mockAuthFetch.mock.calls[0];
    expect(url).toBe("/properties/505/locations");
    expect(opts.method).toBe("POST");
  });

  it("does not submit an add with a blank required field", async () => {
    renderList();
    fireEvent.click(await screen.findByText("Add location"));
    fireEvent.change(await screen.findByPlaceholderText("19 West Elm Street"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByText("Create location"));

    expect(await screen.findByText("Address line 1 is required")).toBeInTheDocument();
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });
});
