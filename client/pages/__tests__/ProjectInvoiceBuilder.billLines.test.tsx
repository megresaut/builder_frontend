/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// A vendor bill for a whole job is itemized deposit / progress / final, and the
// client is billed one item at a time. These tests pin the picker's per-line
// behaviour: which rows are selectable, what the running total does, and exactly
// what onCreate receives.

vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: vi.fn().mockResolvedValue([]),
  authFetch: vi.fn(),
  API_BASE: "http://localhost:8080",
}));

vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "1" }),
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/PropertyBreadcrumbContext", () => ({
  usePropertyBreadcrumb: () => ({ setPropertyName: vi.fn() }),
}));

vi.mock("@/layout/PageTemplate", () => ({
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

import { ProjectInvoiceBuilderModal } from "../ProjectDetail";
import type { Billables, ProjectInvoice } from "@/data/projects";

// One itemizable bill: $6,000 cost in three $2,000 lines, $200 markup each. The
// deposit is already on PI-3-001.
const billables: Billables = {
  installments_due: [],
  change_orders_unbilled: [],
  vendor_bills: [
    {
      bill_id: 21,
      vendor_id: 5,
      vendor_name: "RG White Painting LLC",
      description: "Exterior painting contract",
      amount_cents: 600000,
      upcharge_cents: 60000,
      billed_cents: 220000,
      remaining_cents: 440000,
      lines: [
        { line_id: 0, description: "50% Deposit", amount_cents: 200000, upcharge_cents: 20000, billed_on_invoice_id: 9, billed_on_invoice_number: "PI-3-001" },
        { line_id: 1, description: "Progress payment", amount_cents: 200000, upcharge_cents: 20000, billed_on_invoice_id: null, billed_on_invoice_number: null },
        { line_id: 2, description: "Final payment", amount_cents: 200000, upcharge_cents: 20000, billed_on_invoice_id: null, billed_on_invoice_number: null },
      ],
    },
  ],
  fto_items: [],
} as unknown as Billables;

// A legacy bill with no usable line items — must render exactly as before.
const wholeBillOnly: Billables = {
  installments_due: [],
  change_orders_unbilled: [],
  vendor_bills: [
    {
      bill_id: 30, vendor_id: 7, vendor_name: "Prado Construction LLC",
      description: "Shower framing", amount_cents: 162000, upcharge_cents: 18000,
      billed_cents: 0, remaining_cents: 180000, lines: [],
    },
  ],
  fto_items: [],
} as unknown as Billables;

function renderModal(b: Billables, onCreate = vi.fn()) {
  render(<ProjectInvoiceBuilderModal billables={b} busy={false} onCreate={onCreate} onClose={vi.fn()} />);
  return onCreate;
}

describe("ProjectInvoiceBuilderModal — vendor bill line items", () => {
  it("offers one checkbox per un-billed line and disables the billed one", () => {
    renderModal(billables);
    expect(screen.getByRole("checkbox", { name: /Progress payment/ })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: /Final payment/ })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: /50% Deposit/ })).toBeDisabled();
    expect(screen.getByText(/billed on PI-3-001/)).toBeInTheDocument();
  });

  it("shows how much of the bill is billed and what remains", () => {
    renderModal(billables);
    expect(screen.getByText(/Billed \$2,200 of \$6,600 · remaining \$4,400/)).toBeInTheDocument();
  });

  it("adds only the selected line to the running total", () => {
    renderModal(billables);
    fireEvent.click(screen.getByRole("checkbox", { name: /Progress payment/ }));
    // $2,000 cost + $200 markup — NOT the whole $6,600 bill.
    expect(screen.getByRole("button", { name: /Create draft — \$2,200/ })).toBeInTheDocument();
  });

  it("emits one cost_reimbursement line per selected bill line, carrying source_line_id", () => {
    const onCreate = renderModal(billables);
    fireEvent.click(screen.getByRole("checkbox", { name: /Progress payment/ }));
    fireEvent.click(screen.getByRole("button", { name: /Create draft/ }));

    const lines = onCreate.mock.calls[0][1];
    expect(lines).toEqual([
      {
        description: "Progress payment",
        amount_cents: 220000,
        source_type: "cost_reimbursement",
        source_id: 21,
        source_line_id: 1,
        vendor_id: 5,
      },
    ]);
  });

  it("select-all on the bill takes every REMAINING line, not the billed one", () => {
    const onCreate = renderModal(billables);
    fireEvent.click(screen.getByRole("checkbox", { name: /Select all remaining lines/ }));
    fireEvent.click(screen.getByRole("button", { name: /Create draft/ }));

    const lines = onCreate.mock.calls[0][1];
    expect(lines.map((l: { source_line_id: number }) => l.source_line_id)).toEqual([1, 2]);
    expect(lines.reduce((s: number, l: { amount_cents: number }) => s + l.amount_cents, 0)).toBe(440000);
  });

  it("select-all goes indeterminate when only some remaining lines are picked", () => {
    renderModal(billables);
    const all = screen.getByRole("checkbox", { name: /Select all remaining lines/ }) as HTMLInputElement;
    expect(all.indeterminate).toBe(false);

    fireEvent.click(screen.getByRole("checkbox", { name: /Progress payment/ }));
    expect(all.indeterminate).toBe(true);
    expect(all.checked).toBe(false);

    fireEvent.click(screen.getByRole("checkbox", { name: /Final payment/ }));
    expect(all.indeterminate).toBe(false);
    expect(all.checked).toBe(true);
  });

  it("a bill with no usable line items still bills whole, with no source_line_id", () => {
    const onCreate = renderModal(wholeBillOnly);
    expect(screen.queryByRole("checkbox", { name: /Select all remaining lines/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: /Shower framing/ }));
    expect(screen.getByRole("button", { name: /Create draft — \$1,800/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Create draft/ }));
    expect(onCreate.mock.calls[0][1]).toEqual([
      {
        description: "Shower framing",
        amount_cents: 180000,
        source_type: "cost_reimbursement",
        source_id: 30,
        source_line_id: null,
        vendor_id: 7,
      },
    ]);
  });
});

// Edit mode is called with ?exclude_invoice_id=<this invoice>, so the lines this
// invoice already carries come back from the backend as AVAILABLE (not annotated).
const editBillables: Billables = {
  installments_due: [],
  change_orders_unbilled: [],
  vendor_bills: [
    {
      bill_id: 21, vendor_id: 5, vendor_name: "RG White Painting LLC",
      description: "Exterior painting contract",
      amount_cents: 600000, upcharge_cents: 60000, billed_cents: 0, remaining_cents: 660000,
      lines: [
        { line_id: 0, description: "50% Deposit", amount_cents: 200000, upcharge_cents: 20000, billed_on_invoice_id: null, billed_on_invoice_number: null },
        { line_id: 1, description: "Progress payment", amount_cents: 200000, upcharge_cents: 20000, billed_on_invoice_id: null, billed_on_invoice_number: null },
        { line_id: 2, description: "Final payment", amount_cents: 200000, upcharge_cents: 20000, billed_on_invoice_id: null, billed_on_invoice_number: null },
      ],
    },
  ],
  fto_items: [],
} as unknown as Billables;

const depositInvoice = {
  id: 9, project_id: 1, invoice_number: "PI-3-001", status: "sent",
  title: "Deposit", paid_cents: 0, total_amount_cents: 220000,
  lines: [
    { id: 1, description: "50% Deposit", amount_cents: 220000, sort_order: 0, source_type: "cost_reimbursement", source_id: 21, source_line_id: 0, vendor_id: 5, vendor_name: "RG White Painting LLC" },
  ],
  payments: [],
} as unknown as ProjectInvoice;

describe("ProjectInvoiceBuilderModal — editing a line-level invoice", () => {
  it("pre-checks exactly the line the invoice carries", () => {
    render(<ProjectInvoiceBuilderModal invoice={depositInvoice} billables={editBillables} busy={false} onCreate={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: /50% Deposit/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Progress payment/ })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Final payment/ })).not.toBeChecked();
    expect(screen.getByRole("button", { name: /Save — \$2,200/ })).toBeInTheDocument();
  });

  it("round-trips the line unchanged on Save", () => {
    const onCreate = vi.fn();
    render(<ProjectInvoiceBuilderModal invoice={depositInvoice} billables={editBillables} busy={false} onCreate={onCreate} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /^Save/ }));
    expect(onCreate.mock.calls[0][1]).toEqual([
      { description: "50% Deposit", amount_cents: 220000, source_type: "cost_reimbursement", source_id: 21, source_line_id: 0, vendor_id: 5 },
    ]);
  });

  it("adds a second line to the same bill without disturbing the first", () => {
    const onCreate = vi.fn();
    render(<ProjectInvoiceBuilderModal invoice={depositInvoice} billables={editBillables} busy={false} onCreate={onCreate} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Progress payment/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Save/ }));

    const lines = onCreate.mock.calls[0][1];
    expect(lines.map((l: { source_line_id: number }) => l.source_line_id).sort()).toEqual([0, 1]);
  });

  // line_id is client-supplied and PATCH /bills/{id} rewrites line_items
  // wholesale, so a stored reference can stop matching. Such a line must be
  // carried over verbatim, never silently deleted (Save full-replaces the lines
  // and pushes them to QuickBooks for a concierge property).
  it("carries over a line whose bill line has vanished", () => {
    const orphan = {
      ...depositInvoice,
      lines: [
        { id: 1, description: "50% Deposit", amount_cents: 220000, sort_order: 0, source_type: "cost_reimbursement", source_id: 21, source_line_id: 99, vendor_id: 5, vendor_name: "RG White Painting LLC" },
      ],
    } as unknown as ProjectInvoice;
    const onCreate = vi.fn();
    render(<ProjectInvoiceBuilderModal invoice={orphan} billables={editBillables} busy={false} onCreate={onCreate} onClose={vi.fn()} />);

    expect(screen.getByText(/Carried over from this invoice/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Save/ }));
    const lines = onCreate.mock.calls[0][1];
    expect(lines).toHaveLength(1);
    expect(lines[0].source_line_id).toBe(99);
    expect(lines[0].amount_cents).toBe(220000);
  });

  // A whole-bill line written before migration 155 must keep working after the
  // bill becomes itemizable: it has no line to match, so it is carried over
  // rather than dropped.
  it("carries over a legacy whole-bill line on a now-itemizable bill", () => {
    const legacy = {
      ...depositInvoice,
      lines: [
        { id: 1, description: "Exterior painting contract", amount_cents: 660000, sort_order: 0, source_type: "cost_reimbursement", source_id: 21, source_line_id: null, vendor_id: 5, vendor_name: "RG White Painting LLC" },
      ],
    } as unknown as ProjectInvoice;
    const onCreate = vi.fn();
    render(<ProjectInvoiceBuilderModal invoice={legacy} billables={editBillables} busy={false} onCreate={onCreate} onClose={vi.fn()} />);

    expect(screen.getByText(/Carried over from this invoice/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Save/ }));
    const lines = onCreate.mock.calls[0][1];
    expect(lines).toHaveLength(1);
    expect(lines[0].amount_cents).toBe(660000);
  });
});
