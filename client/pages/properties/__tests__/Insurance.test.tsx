/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Insurance } from "../Insurance";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSummary = {
  active_policies: 3,
  expiring_soon: 1,
  units_with_renters_active: 5,
};

const mockPolicies = [
  {
    id: 1,
    property_id: 10,
    policy_type: "general_liability",
    policy_layer: "owner",
    carrier_name: "State Farm",
    policy_number: "SF-12345",
    agent_name: "Jane Smith",
    agent_firm: "Smith Insurance Group",
    agent_phone: "555-123-4567",
    agent_email: "jane@smithinsurance.com",
    premium_cents: 120000,
    coverage_amount_cents: 100000000,
    effective_date: "2026-01-01",
    expiration_date: "2027-01-01",
    renewal_status: "active" as const,
    avm_master_policy: false,
    policy_object_key: "insurance/policies/10/sf-12345.pdf",
    policy_mime: "application/pdf",
    coi_object_key: "insurance/coi/10/sf-12345-coi.pdf",
    coi_mime: "application/pdf",
    notes: null,
    last_edited_by_user_id: 5,
    created_at: "2026-03-15T12:00:00Z",
    updated_at: "2026-03-15T12:00:00Z",
  },
  {
    id: 2,
    property_id: 10,
    policy_type: "property",
    policy_layer: "owner",
    carrier_name: "Allstate",
    policy_number: "AL-99999",
    agent_name: null,
    agent_firm: null,
    agent_phone: null,
    agent_email: null,
    premium_cents: 80000,
    coverage_amount_cents: 50000000,
    effective_date: "2026-02-01",
    expiration_date: "2026-04-01",
    renewal_status: "expiring" as const,
    avm_master_policy: false,
    policy_object_key: null,
    policy_mime: null,
    coi_object_key: null,
    coi_mime: null,
    notes: null,
    last_edited_by_user_id: null,
    created_at: "2026-03-15T12:00:00Z",
    updated_at: "2026-03-15T12:00:00Z",
  },
  {
    id: 3,
    property_id: 10,
    policy_type: "umbrella",
    policy_layer: "owner",
    carrier_name: "Geico",
    policy_number: "GE-11111",
    agent_name: null,
    agent_firm: null,
    agent_phone: null,
    agent_email: null,
    premium_cents: 60000,
    coverage_amount_cents: 200000000,
    effective_date: "2025-01-01",
    expiration_date: "2025-12-31",
    renewal_status: "lapsed" as const,
    avm_master_policy: false,
    policy_object_key: null,
    policy_mime: null,
    coi_object_key: null,
    coi_mime: null,
    notes: null,
    last_edited_by_user_id: null,
    created_at: "2026-03-15T12:00:00Z",
    updated_at: "2026-03-15T12:00:00Z",
  },
];

const mockRenters = [
  {
    id: 1,
    unit_id: 5,
    property_id: 10,
    tenant_name: "John Doe",
    carrier_name: "Lemonade",
    policy_number: "LEM-99887",
    effective_date: "2026-02-01",
    expiration_date: "2027-02-01",
    status: "active" as const,
    document_object_key: "insurance/renters/5/lemonade.pdf",
    document_mime: "application/pdf",
    notes: null,
    last_edited_by_user_id: 5,
    created_at: "2026-03-15T12:00:00Z",
    updated_at: "2026-03-15T12:00:00Z",
    unit_name: "Unit 101",
  },
  {
    id: 2,
    unit_id: 6,
    property_id: 10,
    tenant_name: "Alice Wonderland",
    carrier_name: "Progressive",
    policy_number: "PRG-55555",
    effective_date: "2026-01-15",
    expiration_date: "2026-04-15",
    status: "expiring" as const,
    document_object_key: null,
    document_mime: null,
    notes: null,
    last_edited_by_user_id: null,
    created_at: "2026-03-15T12:00:00Z",
    updated_at: "2026-03-15T12:00:00Z",
    unit_name: "Unit 102",
  },
  {
    id: 3,
    unit_id: 7,
    property_id: 10,
    tenant_name: "Bob Builder",
    carrier_name: "Nationwide",
    policy_number: "NW-77777",
    effective_date: "2025-01-01",
    expiration_date: "2025-12-31",
    status: "lapsed" as const,
    document_object_key: null,
    document_mime: null,
    notes: null,
    last_edited_by_user_id: null,
    created_at: "2026-03-15T12:00:00Z",
    updated_at: "2026-03-15T12:00:00Z",
    unit_name: "Unit 103",
  },
];

// Mock fetchJSON
vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: vi.fn((url: string) => {
    if (url.includes("/insurance/summary")) return Promise.resolve(mockSummary);
    if (url.includes("/insurance/policies")) return Promise.resolve(mockPolicies);
    if (url.includes("/insurance/renters")) return Promise.resolve(mockRenters);
    return Promise.resolve(null);
  }),
  API_BASE: "http://localhost:8080",
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function renderInsurance() {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/properties/10/Insurance"]}>
        <Routes>
          <Route
            path="/properties/:propertyId/:tab"
            element={
              <Insurance
                propertyAddress="123 Main St"
                propertyType="Rental"
                propertyUnits={8}
                propertyId={10}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Insurance tab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders summary cards with correct data", async () => {
    renderInsurance();

    // Wait for the summary data to load (cards initially show 0)
    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    expect(screen.getByText("Active Policies")).toBeInTheDocument();
    expect(screen.getByText("Expiring Soon")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Renters Coverage")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders policies table rows", async () => {
    renderInsurance();

    await waitFor(() => {
      expect(screen.getByText("State Farm")).toBeInTheDocument();
    });

    expect(screen.getByText("General Liability")).toBeInTheDocument();
    expect(screen.getByText("SF-12345")).toBeInTheDocument();
    expect(screen.getByText("Allstate")).toBeInTheDocument();
    expect(screen.getByText("Property")).toBeInTheDocument();
    expect(screen.getByText("Geico")).toBeInTheDocument();
    expect(screen.getByText("Umbrella")).toBeInTheDocument();
  });

  it("renders renters insurance table rows", async () => {
    renderInsurance();

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    expect(screen.getByText("Unit 101")).toBeInTheDocument();
    expect(screen.getByText("Lemonade")).toBeInTheDocument();
    expect(screen.getByText("Alice Wonderland")).toBeInTheDocument();
    expect(screen.getByText("Unit 102")).toBeInTheDocument();
    expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    expect(screen.getByText("Unit 103")).toBeInTheDocument();
  });

  it("applies yellow background to expiring policy rows", async () => {
    renderInsurance();

    await waitFor(() => {
      expect(screen.getByTestId("policy-row-2")).toBeInTheDocument();
    });

    const expiringRow = screen.getByTestId("policy-row-2");
    expect(expiringRow.className).toContain("bg-yellow-50");
  });

  it("applies red background to lapsed policy rows", async () => {
    renderInsurance();

    await waitFor(() => {
      expect(screen.getByTestId("policy-row-3")).toBeInTheDocument();
    });

    const lapsedRow = screen.getByTestId("policy-row-3");
    expect(lapsedRow.className).toContain("bg-red-50");
  });

  it("applies yellow background to expiring renters rows", async () => {
    renderInsurance();

    await waitFor(() => {
      expect(screen.getByTestId("renters-row-2")).toBeInTheDocument();
    });

    const expiringRow = screen.getByTestId("renters-row-2");
    expect(expiringRow.className).toContain("bg-yellow-50");
  });

  it("applies red background to lapsed renters rows", async () => {
    renderInsurance();

    await waitFor(() => {
      expect(screen.getByTestId("renters-row-3")).toBeInTheDocument();
    });

    const lapsedRow = screen.getByTestId("renters-row-3");
    expect(lapsedRow.className).toContain("bg-red-50");
  });

  it("opens renewal panel when Renew button is clicked", async () => {
    renderInsurance();

    await waitFor(() => {
      expect(screen.getByTestId("policy-row-1")).toBeInTheDocument();
    });

    // Click the three-dot action menu (last button in the row) on the first policy row, then click Renew
    const policyRow = screen.getByTestId("policy-row-1");
    const allButtons = policyRow.querySelectorAll("button");
    const menuButton = allButtons[allButtons.length - 1]; // action menu is the last button
    fireEvent.click(menuButton!);

    await waitFor(() => {
      expect(screen.getByText("Renew")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Renew"));

    await waitFor(() => {
      expect(screen.getByTestId("renewal-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    expect(screen.getByText(/Smith Insurance Group/)).toBeInTheDocument();
  });

  it("renders policy document and COI as separate buttons", async () => {
    renderInsurance();

    await waitFor(() => {
      expect(screen.getByText("State Farm")).toBeInTheDocument();
    });

    const policyRow = screen.getByTestId("policy-row-1");
    const buttons = policyRow.querySelectorAll("button");
    const policyBtn = Array.from(buttons).find((b) => b.textContent?.includes("Policy"));
    const coiBtn = Array.from(buttons).find((b) => b.textContent?.includes("COI"));

    expect(policyBtn).toBeTruthy();
    expect(coiBtn).toBeTruthy();
  });
});
