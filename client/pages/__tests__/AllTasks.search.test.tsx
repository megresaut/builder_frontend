/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TabContext } from "@/hooks/useTabContext";
import AllTasks from "../AllTasks";

// API shape matches `ApiTask` in AllTasks.tsx
const mockApiTasks = [
  {
    id: 1,
    name: "Fix leaky kitchen faucet",
    description: "",
    property_id: 100,
    property_name: "Sunset Apartments",
    property_address: "100 Sunset Blvd",
    unit_id: 1,
    unit_name: "Unit A",
    status: "open",
    priority: "high",
    category: "plumbing",
    due_date: "2026-06-01",
    date_requested: "2026-05-01T12:00:00Z",
    last_updated: "2026-05-10T12:00:00Z",
    requested_by: 1,
    assignees: [{ id: 1, name: "Alice Anderson", email: "alice@example.com" }],
    collaborators: [],
  },
  {
    id: 2,
    name: "Replace HVAC filter",
    description: "",
    property_id: 200,
    property_name: "Oak Grove Complex",
    property_address: "200 Oak Avenue",
    unit_id: 2,
    unit_name: "Unit B",
    status: "in_progress",
    priority: "medium",
    category: "hvac",
    due_date: "2026-06-05",
    date_requested: "2026-05-02T12:00:00Z",
    last_updated: "2026-05-11T12:00:00Z",
    requested_by: 1,
    assignees: [{ id: 2, name: "Bob Builder", email: "bob@example.com" }],
    collaborators: [],
  },
  {
    id: 3,
    name: "Patch drywall in hallway",
    description: "",
    property_id: 300,
    property_name: "Elm Tower",
    property_address: "300 Elm Road",
    unit_id: 3,
    unit_name: "Unit C",
    status: "in_progress",
    priority: "low",
    category: "general",
    due_date: "2026-06-10",
    date_requested: "2026-05-03T12:00:00Z",
    last_updated: "2026-05-12T12:00:00Z",
    requested_by: 1,
    assignees: [{ id: 3, name: "Carol Carter", email: "carol@example.com" }],
    collaborators: [],
  },
];

vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: vi.fn((url: string) => {
    if (url.includes("/maintenance/tasks")) {
      return Promise.resolve(mockApiTasks);
    }
    return Promise.resolve([]);
  }),
  API_BASE: "http://localhost:8080",
}));

// CreateTaskModal pulls in useAuth and other contexts that aren't relevant to
// this regression test. It's never open during these tests, so a no-op is
// sufficient.
vi.mock("@/components/CreateTaskModal", () => ({
  default: () => null,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function makeTabContextValue() {
  return {
    selectedTab: "all-tasks",
    setSelectedTab: () => {},
    tabMetadata: {} as Record<string, any>,
    setTabMetadata: () => {},
    tabs: [],
    setTabs: () => {},
    openTabs: [],
    setOpenTabs: () => {},
    nextNewTabId: 0,
    setNextNewTabId: () => {},
  } as any;
}

function renderAllTasks() {
  return render(
    <MemoryRouter initialEntries={["/all-tasks"]}>
      <TabContext.Provider value={makeTabContextValue()}>
        <AllTasks />
      </TabContext.Provider>
    </MemoryRouter>,
  );
}

describe("AllTasks page — search bar (regression for bug #7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the GlobalTable search input", async () => {
    renderAllTasks();
    const input = await waitFor(() =>
      screen.getByRole("textbox", { name: /search/i }),
    );
    expect(input).toBeInTheDocument();
  });

  it("filters the visible tasks by title when the user types in search", async () => {
    renderAllTasks();

    await waitFor(() => {
      expect(
        screen.getByText("Fix leaky kitchen faucet"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Replace HVAC filter")).toBeInTheDocument();
    expect(screen.getByText("Patch drywall in hallway")).toBeInTheDocument();

    const input = screen.getByRole("textbox", { name: /search/i });
    fireEvent.change(input, { target: { value: "drywall" } });

    await waitFor(() => {
      expect(
        screen.queryByText("Fix leaky kitchen faucet"),
      ).not.toBeInTheDocument();
    });
    expect(screen.queryByText("Replace HVAC filter")).not.toBeInTheDocument();
    expect(screen.getByText("Patch drywall in hallway")).toBeInTheDocument();
  });

  it("matches the search query case-insensitively", async () => {
    renderAllTasks();
    await waitFor(() => {
      expect(screen.getByText("Replace HVAC filter")).toBeInTheDocument();
    });

    const input = screen.getByRole("textbox", { name: /search/i });

    fireEvent.change(input, { target: { value: "HVAC" } });
    await waitFor(() => {
      expect(
        screen.queryByText("Fix leaky kitchen faucet"),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText("Replace HVAC filter")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "hvac" } });
    await waitFor(() => {
      expect(screen.getByText("Replace HVAC filter")).toBeInTheDocument();
    });
    expect(
      screen.queryByText("Fix leaky kitchen faucet"),
    ).not.toBeInTheDocument();
  });

  it("matches against property name and assignee name, not just title", async () => {
    renderAllTasks();
    await waitFor(() => {
      expect(
        screen.getByText("Fix leaky kitchen faucet"),
      ).toBeInTheDocument();
    });

    const input = screen.getByRole("textbox", { name: /search/i });

    // Match by property name "Oak Grove Complex"
    fireEvent.change(input, { target: { value: "oak grove" } });
    await waitFor(() => {
      expect(
        screen.queryByText("Fix leaky kitchen faucet"),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText("Replace HVAC filter")).toBeInTheDocument();
    expect(
      screen.queryByText("Patch drywall in hallway"),
    ).not.toBeInTheDocument();

    // Match by assignee name "Carol Carter"
    fireEvent.change(input, { target: { value: "carol" } });
    await waitFor(() => {
      expect(screen.getByText("Patch drywall in hallway")).toBeInTheDocument();
    });
    expect(screen.queryByText("Replace HVAC filter")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Fix leaky kitchen faucet"),
    ).not.toBeInTheDocument();
  });

  it("restores all matching tasks when the search input is cleared", async () => {
    renderAllTasks();
    await waitFor(() => {
      expect(
        screen.getByText("Fix leaky kitchen faucet"),
      ).toBeInTheDocument();
    });

    const input = screen.getByRole("textbox", { name: /search/i });
    fireEvent.change(input, { target: { value: "drywall" } });
    await waitFor(() => {
      expect(
        screen.queryByText("Fix leaky kitchen faucet"),
      ).not.toBeInTheDocument();
    });

    fireEvent.change(input, { target: { value: "" } });
    await waitFor(() => {
      expect(
        screen.getByText("Fix leaky kitchen faucet"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Replace HVAC filter")).toBeInTheDocument();
    expect(screen.getByText("Patch drywall in hallway")).toBeInTheDocument();
  });
});
