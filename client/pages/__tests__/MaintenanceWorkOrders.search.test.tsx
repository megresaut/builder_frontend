/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TabContext } from "@/hooks/useTabContext";
import MaintenanceWorkOrders from "../MaintenanceWorkOrders";

// API shape matches `APIWorkOrder` in MaintenanceWorkOrders.tsx. The page's
// default status filter is ["In Progress"], so every fixture is in_progress —
// otherwise it would be filtered out before search ever ran.
const mockApiWorkOrders = [
  {
    id: 11,
    task_id: 1,
    property_id: 100,
    name: "HVAC",
    description: "Replace Drain Pan Air Handler",
    status: "in_progress",
    priority: "normal",
    due_date: "2026-07-31",
    created_at: "2026-07-24T12:00:00Z",
    updated_at: "2026-07-24T12:00:00Z",
    property_name: "(C) 65 Peaceable Ridge Road Ridgefield, CT 06877",
    vendor_name: "Encon Heating & AC",
  },
  {
    id: 12,
    task_id: 2,
    property_id: 200,
    name: "HVAC",
    description: "Replace Blower Motor & Module",
    status: "in_progress",
    priority: "normal",
    due_date: "2026-07-31",
    created_at: "2026-07-24T12:00:00Z",
    updated_at: "2026-07-24T12:00:00Z",
    property_name: "(C) 51 Willowmere Circle, Riverside CT 06878",
    vendor_name: "Edgerton Inc.",
  },
  {
    id: 13,
    task_id: 3,
    property_id: 300,
    name: "Electrical",
    description: "Electrical — Frank Clark Electric LLC",
    status: "in_progress",
    priority: "normal",
    created_at: "2026-07-24T12:00:00Z",
    updated_at: "2026-07-24T12:00:00Z",
    property_name: "(R) 2 Pratt Island, Darien, CT 06820",
    vendor_name: "Frank Clark Electric LLC",
  },
];

vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: vi.fn((url: string) => {
    if (url.includes("/maintenance/work-orders")) {
      return Promise.resolve(mockApiWorkOrders);
    }
    return Promise.resolve([]);
  }),
  API_BASE: "http://localhost:8080",
}));

// The create/edit modal drags in auth + upload contexts that are irrelevant
// here, and it's never open during these tests.
vi.mock("@/components/CreateWorkOrderModalV2", () => ({
  default: () => null,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function makeTabContextValue() {
  return {
    selectedTab: "work-orders",
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

function renderWorkOrders() {
  return render(
    <MemoryRouter initialEntries={["/work-orders"]}>
      <TabContext.Provider value={makeTabContextValue()}>
        <MaintenanceWorkOrders />
      </TabContext.Provider>
    </MemoryRouter>,
  );
}

describe("MaintenanceWorkOrders page — search bar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the GlobalTable search input", async () => {
    renderWorkOrders();
    const input = await waitFor(() =>
      screen.getByRole("textbox", { name: /search/i }),
    );
    expect(input).toBeInTheDocument();
  });

  it("keeps what the user types (the input is not frozen at empty)", async () => {
    renderWorkOrders();
    const input = (await waitFor(() =>
      screen.getByRole("textbox", { name: /search/i }),
    )) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "blower" } });
    await waitFor(() => expect(input.value).toBe("blower"));
  });

  it("filters the visible work orders by name when the user types in search", async () => {
    renderWorkOrders();

    await waitFor(() => {
      expect(
        screen.getByText("Replace Drain Pan Air Handler"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Replace Blower Motor & Module")).toBeInTheDocument();

    const input = screen.getByRole("textbox", { name: /search/i });
    fireEvent.change(input, { target: { value: "blower" } });

    await waitFor(() => {
      expect(
        screen.queryByText("Replace Drain Pan Air Handler"),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText("Replace Blower Motor & Module")).toBeInTheDocument();
  });

  it("matches case-insensitively and against the vendor and property columns", async () => {
    renderWorkOrders();
    await waitFor(() => {
      expect(
        screen.getByText("Replace Drain Pan Air Handler"),
      ).toBeInTheDocument();
    });

    const input = screen.getByRole("textbox", { name: /search/i });

    // Vendor name, different case than the fixture.
    fireEvent.change(input, { target: { value: "ENCON" } });
    await waitFor(() => {
      expect(
        screen.queryByText("Replace Blower Motor & Module"),
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByText("Replace Drain Pan Air Handler"),
    ).toBeInTheDocument();

    // Property address.
    fireEvent.change(input, { target: { value: "pratt island" } });
    await waitFor(() => {
      expect(
        screen.getByText("Electrical — Frank Clark Electric LLC"),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText("Replace Drain Pan Air Handler"),
    ).not.toBeInTheDocument();
  });

  it("restores every row when the search input is cleared", async () => {
    renderWorkOrders();
    await waitFor(() => {
      expect(
        screen.getByText("Replace Drain Pan Air Handler"),
      ).toBeInTheDocument();
    });

    const input = screen.getByRole("textbox", { name: /search/i });
    fireEvent.change(input, { target: { value: "blower" } });
    await waitFor(() => {
      expect(
        screen.queryByText("Replace Drain Pan Air Handler"),
      ).not.toBeInTheDocument();
    });

    fireEvent.change(input, { target: { value: "" } });
    await waitFor(() => {
      expect(
        screen.getByText("Replace Drain Pan Air Handler"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Replace Blower Motor & Module")).toBeInTheDocument();
    expect(
      screen.getByText("Electrical — Frank Clark Electric LLC"),
    ).toBeInTheDocument();
  });
});
