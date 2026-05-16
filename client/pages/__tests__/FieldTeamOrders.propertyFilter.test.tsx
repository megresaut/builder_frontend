/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TabContext } from "@/hooks/useTabContext";
import { fetchJSON } from "@/api/fetchJSON";
import FieldTeamOrders from "../FieldTeamOrders";

// Shape matches `APIFTOResponse` in FieldTeamOrders.tsx.
// Three FTOs:
//   - id=1 and id=2 share property_id=10 but have slightly DIFFERENT
//     property_name strings ("22 Indian Chase Dr" vs the dirty
//     "22 Indian Chase Dr (C)" variant). On main, the property filter
//     keyed off the human-readable string, so picking the canonical
//     name would silently drop id=2. After the fix, filtering keys on
//     property_id and both rows are returned.
//   - id=3 sits on a different property entirely.
const mockApiFtos = [
  {
    id: 1,
    name: "Fix Door Hinge",
    description: "Front door hinge is loose",
    property_id: 10,
    property_name: "22 Indian Chase Dr",
    task_id: undefined,
    field_team_member_ids: [],
    pm_assignee_ids: [],
    status: "dispatched",
    priority: "normal",
    due_date: "2026-06-01T00:00:00Z",
    approval_status: "pending",
    form_submission_status: "none",
    is_visible_to_client: true,
    hours_decimal: 0,
    total_amount: 0,
    created_at: "2026-05-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Replace Front Light",
    description: "Porch light out",
    property_id: 10,
    // Same property_id as id=1, but a drifted display name. This
    // is the exact scenario from the bug report — the table showed
    // both forms of the name, and the old string-keyed filter
    // treated them as different properties.
    property_name: "22 Indian Chase Dr (C)",
    task_id: undefined,
    field_team_member_ids: [],
    pm_assignee_ids: [],
    status: "dispatched",
    priority: "normal",
    due_date: "2026-06-02T00:00:00Z",
    approval_status: "pending",
    form_submission_status: "none",
    is_visible_to_client: true,
    hours_decimal: 0,
    total_amount: 0,
    created_at: "2026-05-02T00:00:00Z",
  },
  {
    id: 3,
    name: "Patch Drywall",
    description: "Hallway drywall patch",
    property_id: 20,
    property_name: "100 Elm Street",
    task_id: undefined,
    field_team_member_ids: [],
    pm_assignee_ids: [],
    status: "dispatched",
    priority: "low",
    due_date: "2026-06-03T00:00:00Z",
    approval_status: "pending",
    form_submission_status: "none",
    is_visible_to_client: true,
    hours_decimal: 0,
    total_amount: 0,
    created_at: "2026-05-03T00:00:00Z",
  },
];

vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: vi.fn((url: string) => {
    if (url.startsWith("/maintenance/ftos") && !url.includes("merge")) {
      return Promise.resolve(mockApiFtos);
    }
    if (url.startsWith("/maintenance/submissions/misc")) {
      return Promise.resolve([]);
    }
    if (url.startsWith("/users/")) {
      return Promise.resolve(null);
    }
    return Promise.resolve([]);
  }),
  API_BASE: "http://localhost:8080",
}));

// Heavy modal subtrees pull in auth/data layers that are out of scope for a
// pure filter regression test. They're never opened during these tests, so a
// no-op stub keeps the render light and stable.
vi.mock("@/components/CreateFTOModal", () => ({ default: () => null }));
vi.mock("@/components/CreateMiscExpenseModal", () => ({ default: () => null }));
vi.mock("@/components/MergeFTOsModal", () => ({ default: () => null }));
vi.mock("@/components/HoursSummaryDrawer", () => ({ default: () => null }));
vi.mock("@/components/ColumnFilterModal", () => ({ default: () => null }));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function makeTabContextValue() {
  return {
    selectedTab: "field-team-orders",
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

function renderFieldTeamOrders() {
  return render(
    <MemoryRouter initialEntries={["/field-team-orders"]}>
      <TabContext.Provider value={makeTabContextValue()}>
        <FieldTeamOrders />
      </TabContext.Provider>
    </MemoryRouter>,
  );
}

async function waitForRowsLoaded() {
  await waitFor(() => {
    expect(screen.getByText("Fix Door Hinge")).toBeInTheDocument();
  });
}

describe("FieldTeamOrders page — Property filter (regression for bug #9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the FTO list with a limit well above 100 so the filter sees the full dataset", async () => {
    renderFieldTeamOrders();
    await waitForRowsLoaded();

    // The dropdown options are derived from the loaded `orders` list, so
    // the fetch URL's `limit=` value places an upper bound on which
    // properties can ever appear in the Property filter. The original bug
    // capped this at 100; the fix raises it well above that.
    const fetchMock = vi.mocked(fetchJSON);
    const ftoCall = fetchMock.mock.calls.find(
      (c) => typeof c[0] === "string" && (c[0] as string).startsWith("/maintenance/ftos"),
    );
    expect(ftoCall, "expected a /maintenance/ftos fetch call").toBeTruthy();
    const url = ftoCall![0] as string;
    const limitMatch = url.match(/[?&]limit=(\d+)/);
    expect(limitMatch, `expected a limit query param in ${url}`).toBeTruthy();
    const limitValue = Number(limitMatch![1]);
    expect(limitValue).toBeGreaterThan(100);
  });

  it("filtering by a property includes every FTO sharing that property_id, even when the display name varies", async () => {
    renderFieldTeamOrders();
    await waitForRowsLoaded();

    // Baseline: all three FTOs are present.
    expect(screen.getByText("Fix Door Hinge")).toBeInTheDocument();
    expect(screen.getByText("Replace Front Light")).toBeInTheDocument();
    expect(screen.getByText("Patch Drywall")).toBeInTheDocument();

    // Open the filter bar.
    fireEvent.click(screen.getByRole("button", { name: /^filter$/i }));

    // Open the Property dropdown. MultiSelectFilter renders its label
    // as a <label> element (distinct from the table's "Property" column
    // header, which is a <span> inside a <th>). The dropdown trigger is
    // the first <button> alongside that <label>.
    const propertyLabel = screen.getByText("Property", { selector: "label" });
    const propertyDropdownButton = propertyLabel.parentElement?.querySelector(
      "button",
    ) as HTMLButtonElement;
    expect(propertyDropdownButton).toBeTruthy();
    fireEvent.click(propertyDropdownButton);

    // Scope to the Property dropdown panel so we don't accidentally
    // grab the same property name from the table body.
    const dropdownPanel = propertyLabel.parentElement!.querySelector(
      "div.absolute",
    ) as HTMLElement;
    expect(dropdownPanel, "expected dropdown panel to be open").toBeTruthy();
    const optionLabelTexts = Array.from(
      dropdownPanel.querySelectorAll("label"),
    ).map((el) => el.textContent?.trim() ?? "");

    // Only ONE option per property_id should be shown — id=1 and id=2
    // share property_id=10, so they collapse into a single entry. The
    // label uses the first property_name encountered ("22 Indian Chase
    // Dr"); on main, two entries appeared (one per unique string).
    expect(optionLabelTexts).toContain("22 Indian Chase Dr");
    expect(optionLabelTexts).toContain("100 Elm Street");
    expect(optionLabelTexts).not.toContain("22 Indian Chase Dr (C)");

    // Select the canonical property. The label is wrapped around the
    // checkbox in MultiSelectFilter, so clicking it toggles it on.
    const indianChaseOption = Array.from(
      dropdownPanel.querySelectorAll("label"),
    ).find((el) => el.textContent?.trim() === "22 Indian Chase Dr")!;
    fireEvent.click(indianChaseOption);

    // After the fix: both FTOs sharing property_id=10 stay visible
    // regardless of name-string drift. The Elm Street FTO is hidden.
    await waitFor(() => {
      expect(screen.queryByText("Patch Drywall")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Fix Door Hinge")).toBeInTheDocument();
    expect(screen.getByText("Replace Front Light")).toBeInTheDocument();
  });
});

// Helpers shared with the UX regression block below. The Property dropdown
// must be opened the same way every test, and reaching into the panel without
// these helpers is verbose enough to obscure intent.
function openPropertyDropdown() {
  fireEvent.click(screen.getByRole("button", { name: /^filter$/i }));
  const propertyLabel = screen.getByText("Property", { selector: "label" });
  const button = propertyLabel.parentElement?.querySelector(
    "button",
  ) as HTMLButtonElement;
  fireEvent.click(button);
  const panel = propertyLabel.parentElement!.querySelector(
    "div.absolute",
  ) as HTMLElement;
  return { panel };
}

describe("FieldTeamOrders page — Property filter UX (regression for bug #9 reviewer feedback)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a search input inside the Property dropdown panel", async () => {
    renderFieldTeamOrders();
    await waitForRowsLoaded();

    const { panel } = openPropertyDropdown();
    expect(panel, "expected dropdown panel to be open").toBeTruthy();

    // The search input is the only non-checkbox input inside the panel
    // (each option label wraps a type=checkbox). On main, no text input
    // existed inside the panel at all — this assertion would fail there.
    const inputs = Array.from(panel.querySelectorAll("input"));
    const textInputs = inputs.filter(
      (el) => (el as HTMLInputElement).type === "text",
    );
    expect(textInputs.length).toBe(1);
    expect(
      (textInputs[0] as HTMLInputElement).placeholder.toLowerCase(),
    ).toContain("search");
  });

  it("typing in the search input filters the visible property options", async () => {
    renderFieldTeamOrders();
    await waitForRowsLoaded();

    const { panel } = openPropertyDropdown();
    const searchInput = Array.from(panel.querySelectorAll("input")).find(
      (el) => (el as HTMLInputElement).type === "text",
    ) as HTMLInputElement;
    expect(searchInput).toBeTruthy();

    // Baseline: both unique property labels are present before filtering.
    const baselineLabels = Array.from(panel.querySelectorAll("label")).map(
      (el) => el.textContent?.trim() ?? "",
    );
    expect(baselineLabels).toContain("22 Indian Chase Dr");
    expect(baselineLabels).toContain("100 Elm Street");

    // Filter to only Elm Street. Case-insensitive substring match per fix.
    fireEvent.change(searchInput, { target: { value: "elm" } });

    await waitFor(() => {
      const labels = Array.from(panel.querySelectorAll("label")).map(
        (el) => el.textContent?.trim() ?? "",
      );
      expect(labels).toContain("100 Elm Street");
      expect(labels).not.toContain("22 Indian Chase Dr");
    });
  });

  it("shows a 'No matches' hint when the search query filters out every option", async () => {
    renderFieldTeamOrders();
    await waitForRowsLoaded();

    const { panel } = openPropertyDropdown();
    const searchInput = Array.from(panel.querySelectorAll("input")).find(
      (el) => (el as HTMLInputElement).type === "text",
    ) as HTMLInputElement;
    expect(searchInput).toBeTruthy();

    fireEvent.change(searchInput, { target: { value: "zzz-no-match-zzz" } });

    await waitFor(() => {
      expect(panel.textContent).toMatch(/no matches/i);
      expect(panel.querySelectorAll("label").length).toBe(0);
    });
  });

  it("constrains the option list to a scrollable container so the page doesn't scroll on long lists", async () => {
    renderFieldTeamOrders();
    await waitForRowsLoaded();

    const { panel } = openPropertyDropdown();

    // The fix wraps the option list (not the search input) in a
    // `max-h-[280px] overflow-y-auto` div. On main, no such wrapper
    // existed and the panel grew unbounded, scrolling the page background.
    // We assert by querying for any descendant that carries both classes.
    const scrollContainer = panel.querySelector(
      "div.max-h-\\[280px\\].overflow-y-auto",
    );
    expect(
      scrollContainer,
      "expected a max-h-[280px] overflow-y-auto wrapper around the option list",
    ).toBeTruthy();

    // And the option <label>s should live inside that container, not as
    // direct siblings of the search input header.
    const labelsInside = scrollContainer!.querySelectorAll("label");
    expect(labelsInside.length).toBeGreaterThan(0);
  });
});
