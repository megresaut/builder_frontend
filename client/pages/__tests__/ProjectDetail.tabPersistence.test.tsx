/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useCallback, useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TabContext, TabMetadata } from "@/hooks/useTabContext";
import ProjectDetail from "../ProjectDetail";

/**
 * Regression: opening a second in-app tab and coming back to a project reset
 * the project's sub-tab to Dashboard (and the Work tab's sub-tab to Tasks).
 *
 * Switching in-app tabs unmounts the route, so any sub-tab held in plain
 * `useState` is lost. The fix routes it through `usePageState`, which persists
 * per in-app tab in `tabMetadata`. This test asserts the sub-tab survives an
 * unmount/remount cycle — exactly what a tab switch does.
 */

const summary = {
  project: {
    id: 7,
    property_id: 3,
    property_name: "(R) 2 Pratt Island, Darien, CT 06820",
    property_address: "2 Pratt Island, Darien, CT 06820",
    name: "Rental Renovations",
    description: "",
    status: "active",
    original_budget_cents: 7137000,
    contract_amount_cents: null,
    percent_complete: 0,
    start_date: null,
    target_end_date: null,
    actual_end_date: null,
    manager_user_id: null,
    manager_name: "",
    manager_initials: "",
    field_team_manager_ids: [],
    collaborator_ids: [],
    field_team_managers: [],
    collaborators: [],
    is_visible_to_client: true,
    created_by_user_id: null,
    last_edited_by_user_id: null,
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
  },
  financials: {
    original_budget_cents: 7137000,
    approved_change_orders_cents: 0,
    current_budget_cents: 7137000,
    spent_cents: 0,
    committed_cents: 1032300,
    paid_cents: 0,
    unpaid_committed_cents: 1032300,
    remaining_budget_cents: 6104700,
    collected_cents: 0,
    billed_to_date_cents: 516150,
    billed_vs_cost_cents: -516150,
    outstanding_invoices_cents: 0,
    net_cash_cents: -516150,
    contract_amount_cents: null,
    projected_margin_cents: null,
    margin_pct: null,
    project_fee_income_cents: 0,
    pending_change_orders_cents: 0,
    pending_change_orders_count: 0,
  },
  counts: { tasks: 0, work_orders: 0, field_team_orders: 0 },
  tasks: [],
  budget: [],
  milestones: [],
  change_orders: [],
  schedule: [],
  work_orders: [],
  field_team_orders: [],
  vendor_summary: [],
};

vi.mock("@/data/projects", async () => {
  const actual = await vi.importActual<typeof import("@/data/projects")>("@/data/projects");
  return {
    ...actual,
    getProjectSummary: vi.fn(() => Promise.resolve(summary)),
    listPayments: vi.fn(() => Promise.resolve([])),
    getCashFlow: vi.fn(() => Promise.resolve([])),
    listProjectInvoices: vi.fn(() => Promise.resolve([])),
    listProjectBills: vi.fn(() => Promise.resolve([])),
    listQuotes: vi.fn(() => Promise.resolve([])),
    listProjectFiles: vi.fn(() => Promise.resolve([])),
    listUnassignedTasks: vi.fn(() => Promise.resolve([])),
  };
});

vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: vi.fn(() => Promise.resolve([])),
  API_BASE: "http://localhost:8080",
}));

// Heavy modal subtrees are never opened here; stubbing keeps the render light.
vi.mock("@/components/CreateTaskModal", () => ({ default: () => null }));
vi.mock("@/components/CreateWorkOrderModalV2", () => ({ default: () => null }));
vi.mock("@/components/CreateFTOModal", () => ({ default: () => null }));
vi.mock("@/components/ColumnFilterModal", () => ({ default: () => null }));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

/**
 * Real TabContext provider mirroring App.tsx's deep-merging `setTabMetadata`,
 * hoisted ABOVE the component under test so its state survives unmounting
 * ProjectDetail — the same way App.tsx's provider outlives a route swap.
 */
function makeHarness() {
  let mounted = true;
  const setMounted = (v: boolean) => {
    mounted = v;
  };
  let rerender: () => void = () => {};

  function Harness() {
    const [tabMetadata, setTabMetadataState] = useState<Record<string, TabMetadata>>({});
    const [, force] = useState(0);
    rerender = () => force((n) => n + 1);
    const setTabMetadata = useCallback((tabId: string, metadata: Partial<TabMetadata>) => {
      setTabMetadataState((prev) => {
        const existing = prev[tabId] || { label: "" };
        return {
          ...prev,
          [tabId]: {
            ...existing,
            ...metadata,
            pageState: { ...(existing.pageState || {}), ...(metadata.pageState || {}) },
          },
        };
      });
    }, []);
    const value = {
      selectedTab: "project-7",
      setSelectedTab: () => {},
      tabMetadata,
      setTabMetadata,
      tabs: [],
      setTabs: () => {},
      openTabs: [],
      setOpenTabs: () => {},
      nextNewTabId: 0,
      setNextNewTabId: () => {},
    } as any;
    return (
      <TabContext.Provider value={value}>
        {mounted ? (
          <MemoryRouter initialEntries={["/projects/7"]}>
            <Routes>
              <Route path="/projects/:projectId" element={<ProjectDetail />} />
            </Routes>
          </MemoryRouter>
        ) : (
          <div>other tab</div>
        )}
      </TabContext.Provider>
    );
  }

  return { Harness, setMounted, rerender: () => rerender() };
}

function activeTabLabel(): string | null {
  const current = document.querySelector('[aria-current="page"]');
  return current?.textContent?.trim() ?? null;
}

describe("ProjectDetail — sub-tab survives an in-app tab switch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the selected top-level sub-tab after unmount/remount", async () => {
    const { Harness, setMounted, rerender } = makeHarness();
    render(<Harness />);

    await waitFor(() => expect(screen.getByText("Rental Renovations")).toBeInTheDocument());
    expect(activeTabLabel()).toBe("Dashboard");

    fireEvent.click(screen.getByRole("button", { name: "Financials" }));
    await waitFor(() => expect(activeTabLabel()).toBe("Financials"));

    // Simulate switching to another in-app tab and back.
    setMounted(false);
    rerender();
    await waitFor(() => expect(screen.getByText("other tab")).toBeInTheDocument());
    setMounted(true);
    rerender();

    await waitFor(() => expect(screen.getByText("Rental Renovations")).toBeInTheDocument());
    expect(activeTabLabel()).toBe("Financials");
  });

  it("keeps the Work tab's sub-tab (Tasks/Work Orders/Field Team) after unmount/remount", async () => {
    const { Harness, setMounted, rerender } = makeHarness();
    render(<Harness />);

    await waitFor(() => expect(screen.getByText("Rental Renovations")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Work" }));
    await waitFor(() => expect(activeTabLabel()).toBe("Work"));

    fireEvent.click(screen.getByRole("tab", { name: /work orders/i }));
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: /work orders/i })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );

    setMounted(false);
    rerender();
    await waitFor(() => expect(screen.getByText("other tab")).toBeInTheDocument());
    setMounted(true);
    rerender();

    await waitFor(() => expect(screen.getByText("Rental Renovations")).toBeInTheDocument());
    expect(activeTabLabel()).toBe("Work");
    expect(screen.getByRole("tab", { name: /work orders/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
