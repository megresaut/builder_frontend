import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AccountingAccountsReceivable from "../AccountingAccountsReceivable";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetARaging = vi.fn();
const mockGetAROutstandingInvoices = vi.fn();

vi.mock("@/api/accounting", () => ({
  accountingAPI: {
    getARaging: (...args: any[]) => mockGetARaging(...args),
    getAROutstandingInvoices: (...args: any[]) =>
      mockGetAROutstandingInvoices(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock usePageState to avoid TabProvider dependency.
// usePageState normally reads from a TabContext; we replace it with plain useState.
vi.mock("@/hooks/usePageState", () => {
  // We can't import React at module scope inside vi.mock because it's hoisted.
  // Instead, use the require-style dynamic import that vitest supports.
  return {
    usePageState: (_key: string, initialValue: any) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { useState: useStateFn } = require("react");
      return useStateFn(initialValue);
    },
  };
});

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => ({
  BarChart: ({ children }: any) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Cell: () => null,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const outstandingResponse = {
  total_balance_cents: 350000,
  invoice_count: 2,
  invoices: [
    {
      invoice_id: 1,
      invoice_number: "INV-001",
      property_id: 10,
      property_name: "Sunset Apartments",
      invoice_date: "2026-02-01",
      total_cents: 200000,
      paid_cents: 50000,
      balance_cents: 150000,
      days_outstanding: 45,
      status: "sent",
    },
    {
      invoice_id: 2,
      invoice_number: "INV-002",
      property_id: 11,
      property_name: "Oakwood Residences",
      invoice_date: "2026-01-15",
      total_cents: 300000,
      paid_cents: 100000,
      balance_cents: 200000,
      days_outstanding: 70,
      status: "sent",
    },
  ],
};

const agingResponse = {
  current_cents: 100000,
  days_30_cents: 200000,
  days_60_cents: 50000,
  days_90_plus_cents: 0,
  total_cents: 350000,
  invoices: [
    {
      invoice_id: 1,
      invoice_number: "INV-001",
      property_id: 10,
      property_name: "Sunset Apartments",
      total_cents: 200000,
      due_date: "2026-01-15",
      days_overdue: 45,
      aging_bucket: "31-60",
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountingAccountsReceivable />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AccountingAccountsReceivable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAROutstandingInvoices.mockResolvedValue(outstandingResponse);
    mockGetARaging.mockResolvedValue(agingResponse);
  });

  it("renders Outstanding Balances tab by default", async () => {
    renderPage();

    // Header is present
    expect(screen.getByText("Accounts Receivable")).toBeInTheDocument();

    // Both tab labels are present
    expect(screen.getByText("Outstanding Balances")).toBeInTheDocument();
    expect(screen.getByText("Aging Report")).toBeInTheDocument();

    // Outstanding Balances tab is active (the button has the blue classes)
    const outstandingTab = screen.getByText("Outstanding Balances");
    expect(outstandingTab.className).toContain("border-blue-500");

    // Wait for data to load
    await waitFor(() => {
      expect(mockGetAROutstandingInvoices).toHaveBeenCalled();
    });

    // Should show summary cards for outstanding
    await waitFor(() => {
      expect(screen.getByText("Total Outstanding")).toBeInTheDocument();
      expect(screen.getByText("Unpaid Invoices")).toBeInTheDocument();
    });
  });

  it("switches to Aging Report tab", async () => {
    renderPage();

    // Wait for outstanding data to load first
    await waitFor(() => {
      expect(mockGetAROutstandingInvoices).toHaveBeenCalled();
    });

    // Click the Aging Report tab
    const agingTab = screen.getByText("Aging Report");
    fireEvent.click(agingTab);

    // Aging Report tab should now be active
    expect(agingTab.className).toContain("border-blue-500");

    // Outstanding Balances tab should be inactive
    const outstandingTab = screen.getByText("Outstanding Balances");
    expect(outstandingTab.className).toContain("border-transparent");

    // Wait for aging data to load
    await waitFor(() => {
      expect(mockGetARaging).toHaveBeenCalled();
    });

    // Aging-specific summary cards should appear
    await waitFor(() => {
      expect(screen.getByText("Current (0-30 days)")).toBeInTheDocument();
      expect(screen.getByText("31-60 Days")).toBeInTheDocument();
      expect(screen.getByText("61-90 Days")).toBeInTheDocument();
      expect(screen.getByText("90+ Days")).toBeInTheDocument();
    });
  });

  it("displays invoice data in outstanding tab", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("$3,500.00")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Invoice table should show invoice numbers
    await waitFor(() => {
      expect(screen.getByText("INV-001")).toBeInTheDocument();
      expect(screen.getByText("INV-002")).toBeInTheDocument();
    });

    // Property names
    expect(screen.getByText("Sunset Apartments")).toBeInTheDocument();
    expect(screen.getByText("Oakwood Residences")).toBeInTheDocument();
  });
});
