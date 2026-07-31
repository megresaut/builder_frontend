/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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

const billables: Billables = {
  installments_due: [],
  change_orders_unbilled: [
    { id: 11, co_number: "CO-002", description: "Added footings", amount_cents: 1200000 },
    { id: 12, co_number: "CO-003", description: "Drain tile", amount_cents: 340000 },
  ],
  vendor_bills: [
    { bill_id: 21, vendor_id: 5, vendor_name: "Acme Concrete", description: "INV-8871", amount_cents: 2400000 },
  ],
  fto_items: [],
} as unknown as Billables;

// An invoice already carrying CO-002, the Acme bill, a manual line, a fee line,
// and one line type the builder does not model (installment) — which must be
// preserved verbatim rather than silently dropped.
const invoice = {
  id: 4,
  project_id: 1,
  invoice_number: "PI-1-004",
  status: "sent",
  title: "Foundation — phase 2",
  paid_cents: 0,
  total_amount_cents: 3792500,
  lines: [
    { id: 1, description: "CO-002 · Added footings", amount_cents: 1200000, sort_order: 0, source_type: "change_order", source_id: 11, vendor_id: null, vendor_name: "AVM" },
    { id: 2, description: "INV-8871", amount_cents: 2400000, sort_order: 1, source_type: "cost_reimbursement", source_id: 21, vendor_id: 5, vendor_name: "Acme Concrete" },
    { id: 3, description: "Permit reimbursement", amount_cents: 17500, sort_order: 2, source_type: "manual", source_id: null, vendor_id: null, vendor_name: "AVM" },
    { id: 4, description: "Management fee", amount_cents: 150000, sort_order: 3, source_type: "project_fee", source_id: null, vendor_id: null, vendor_name: "AVM" },
    { id: 5, description: "Deposit", amount_cents: 25000, sort_order: 4, source_type: "installment", source_id: 99, vendor_id: null, vendor_name: "AVM" },
  ],
  payments: [],
} as unknown as ProjectInvoice;

describe("ProjectInvoiceBuilderModal edit mode", () => {
  it("titles itself for the invoice and labels the CTA Save", () => {
    render(
      <ProjectInvoiceBuilderModal
        invoice={invoice}
        billables={billables}
        busy={false}
        onCreate={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/Edit PI-1-004/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Save/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Create draft/ })).not.toBeInTheDocument();
  });

  it("prefills the title and the existing selections", () => {
    render(
      <ProjectInvoiceBuilderModal
        invoice={invoice}
        billables={billables}
        busy={false}
        onCreate={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue("Foundation — phase 2")).toBeInTheDocument();
    // CO-002 is on the invoice → checked. CO-003 is newly available → unchecked.
    const co2 = screen.getByRole("checkbox", { name: /CO-002/ });
    const co3 = screen.getByRole("checkbox", { name: /CO-003/ });
    expect(co2).toBeChecked();
    expect(co3).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Acme Concrete/ })).toBeChecked();
    // Manual + fee rows prefill as editable inputs.
    expect(screen.getByDisplayValue("Permit reimbursement")).toBeInTheDocument();
    expect(screen.getByDisplayValue("175")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Management fee")).toBeInTheDocument();
  });

  it("round-trips every line, preserving types the builder does not model", () => {
    const onCreate = vi.fn();
    render(
      <ProjectInvoiceBuilderModal
        invoice={invoice}
        billables={billables}
        busy={false}
        onCreate={onCreate}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Save/ }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    const [title, lines] = onCreate.mock.calls[0];
    expect(title).toBe("Foundation — phase 2");
    const byType = (t: string) => lines.filter((l: { source_type: string }) => l.source_type === t);
    expect(byType("change_order")).toHaveLength(1);
    expect(byType("cost_reimbursement")).toHaveLength(1);
    expect(byType("manual")).toHaveLength(1);
    expect(byType("project_fee")).toHaveLength(1);
    // The installment line the builder has no picker for must survive verbatim.
    expect(byType("installment")).toEqual([
      { description: "Deposit", amount_cents: 25000, source_type: "installment", source_id: 99, vendor_id: null },
    ]);
    // Total must equal the original invoice.
    const total = lines.reduce((s: number, l: { amount_cents: number }) => s + l.amount_cents, 0);
    expect(total).toBe(invoice.total_amount_cents);
  });

  it("renders the carried-over installment line in a read-only block, not just in the save payload", () => {
    render(
      <ProjectInvoiceBuilderModal
        invoice={invoice}
        billables={billables}
        busy={false}
        onCreate={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Carried over from this invoice (not editable here)")).toBeInTheDocument();
    expect(screen.getByText("Deposit")).toBeInTheDocument();
    // $250.00 (25000 cents) — formatUSD drops whole-dollar cents.
    expect(screen.getByText("$250")).toBeInTheDocument();
  });
});

describe("ProjectInvoiceBuilderModal edit mode — a modelled line whose source left the billables set", () => {
  // Reachable with no error at all: the vendor-bill billables query joins
  // `tasks t ... WHERE t.project_id = $1`, and DetachTask sets
  // tasks.project_id = NULL. So invoice a vendor bill, detach its task, then
  // edit — the bill is gone from the picker. Rebuilding the line set from the
  // pickers alone would silently delete the cost_reimbursement line and drop
  // the invoice total. It must be carried over verbatim instead. (Same shape
  // for a change order that leaves status='approved'.)
  const billablesMissingBill: Billables = {
    installments_due: [],
    change_orders_unbilled: [
      { id: 11, co_number: "CO-002", description: "Added footings", amount_cents: 1200000 },
    ],
    vendor_bills: [], // bill 21's task was detached from the project
    fto_items: [],
  } as unknown as Billables;

  it("renders the orphaned cost_reimbursement line in the carried-over block", () => {
    render(
      <ProjectInvoiceBuilderModal
        invoice={invoice}
        billables={billablesMissingBill}
        busy={false}
        onCreate={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const block = screen.getByText("Carried over from this invoice (not editable here)").parentElement!;
    // The bill's line is discoverable, not silently vanished.
    expect(block).toHaveTextContent("INV-8871");
    expect(block).toHaveTextContent("$24,000");
    // The unmodelled installment is still carried too.
    expect(block).toHaveTextContent("Deposit");
  });

  it("sends the orphaned line verbatim in the save payload and keeps the total whole", () => {
    const onCreate = vi.fn();
    render(
      <ProjectInvoiceBuilderModal
        invoice={invoice}
        billables={billablesMissingBill}
        busy={false}
        onCreate={onCreate}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Save/ }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    const lines = onCreate.mock.calls[0][1];
    expect(lines.filter((l: { source_type: string }) => l.source_type === "cost_reimbursement")).toEqual([
      {
        description: "INV-8871",
        amount_cents: 2400000,
        source_type: "cost_reimbursement",
        source_id: 21,
        vendor_id: 5,
      },
    ]);
    // Exactly once — carried over, not also rebuilt from the picker.
    expect(lines).toHaveLength(invoice.lines.length);
    const total = lines.reduce((s: number, l: { amount_cents: number }) => s + l.amount_cents, 0);
    expect(total).toBe(invoice.total_amount_cents);
  });

  it("does not treat anything as orphaned while billables is still loading", () => {
    render(
      <ProjectInvoiceBuilderModal
        invoice={invoice}
        billables={null}
        busy={false}
        onCreate={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Loading billable items…")).toBeInTheDocument();
    expect(screen.queryByText("Carried over from this invoice (not editable here)")).not.toBeInTheDocument();
  });
});

describe("ProjectInvoiceBuilderModal edit mode — Save gate while billables is absent", () => {
  // In edit mode every modelled line is rebuilt by intersecting the prefilled
  // selections against the billables arrays. With billables === null those are
  // all empty, so a Save would gut a sent invoice (and push the gutted line set
  // to QuickBooks for a concierge property). Save must be inert until it loads.
  it("disables Save when billables has not loaded", () => {
    render(
      <ProjectInvoiceBuilderModal
        invoice={invoice}
        billables={null}
        busy={false}
        onCreate={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /^Save/ })).toBeDisabled();
  });

  it("does not call onCreate even if Save is somehow clicked with no billables", () => {
    const onCreate = vi.fn();
    render(
      <ProjectInvoiceBuilderModal
        invoice={invoice}
        billables={null}
        busy={false}
        onCreate={onCreate}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Save/ }));
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("still enables the create-mode CTA with no invoice (billables null is only a Save hazard)", () => {
    render(
      <ProjectInvoiceBuilderModal
        billables={null}
        busy={false}
        onCreate={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /Create draft/ })).not.toBeDisabled();
  });
});

describe("ProjectInvoiceBuilderModal edit mode — FTO submission dedup", () => {
  // The backend stamps the SUBMISSION id as source_id on all three of
  // fto_labor, fto_expense and materials_markup, so an invoice with all
  // three from one submission must collapse to a single selected item —
  // otherwise saving would re-bill the submission three times over.
  const ftoBillables: Billables = {
    installments_due: [],
    change_orders_unbilled: [],
    vendor_bills: [],
    fto_items: [
      {
        submission_id: 77,
        date_of_work: "2026-07-01",
        work_description: "Punch list touch-ups",
        labor_lines: [],
        expense_lines: [],
        labor_total_cents: 30000,
        expense_total_cents: 6000,
      },
    ],
  } as unknown as Billables;

  const ftoInvoice = {
    id: 9,
    project_id: 1,
    invoice_number: "PI-1-009",
    status: "sent",
    title: "FTO billing",
    paid_cents: 0,
    total_amount_cents: 36000,
    lines: [
      { id: 1, description: "Labor · 2026-07-01", amount_cents: 30000, sort_order: 0, source_type: "fto_labor", source_id: 77, vendor_id: null, vendor_name: "AVM" },
      { id: 2, description: "Materials at cost", amount_cents: 4000, sort_order: 1, source_type: "fto_expense", source_id: 77, vendor_id: null, vendor_name: "AVM" },
      { id: 3, description: "Materials markup", amount_cents: 2000, sort_order: 2, source_type: "materials_markup", source_id: 77, vendor_id: null, vendor_name: "AVM" },
    ],
    payments: [],
  } as unknown as ProjectInvoice;

  it("checks the one matching FTO item exactly once", () => {
    render(
      <ProjectInvoiceBuilderModal
        invoice={ftoInvoice}
        billables={ftoBillables}
        busy={false}
        onCreate={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(1);
    expect(checkboxes[0]).toBeChecked();
  });

  it("passes the submission id once in ftoSubmissionIds on save, not three times", () => {
    const onCreate = vi.fn();
    render(
      <ProjectInvoiceBuilderModal
        invoice={ftoInvoice}
        billables={ftoBillables}
        busy={false}
        onCreate={onCreate}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Save/ }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    const ftoSubmissionIds = onCreate.mock.calls[0][2];
    expect(ftoSubmissionIds).toEqual([77]);
  });
});

describe("ProjectInvoiceBuilderModal — vendor-bill upcharge folded into the billed amount", () => {
  // bills.amount_cents is the vendor-owed figure and EXCLUDES the per-line
  // upcharge (it is what gets pushed to QBO/Buildium as the payable). The owner is
  // billed cost + markup, folded into the single cost_reimbursement line.
  const markedUp: Billables = {
    installments_due: [],
    change_orders_unbilled: [],
    vendor_bills: [
      // $24,000 cost + $2,400 markup = $26,400 billed.
      { bill_id: 21, vendor_id: 5, vendor_name: "Acme Concrete", description: "INV-8871", amount_cents: 2400000, upcharge_cents: 240000 },
      // No markup → row must look exactly as it did before this feature.
      { bill_id: 22, vendor_id: 6, vendor_name: "Bell Electric", description: "INV-9002", amount_cents: 500000, upcharge_cents: 0 },
    ],
    fto_items: [],
  } as unknown as Billables;

  const renderNew = (onCreate = vi.fn()) => {
    render(
      <ProjectInvoiceBuilderModal
        invoice={null}
        billables={markedUp}
        busy={false}
        onCreate={onCreate}
        onClose={vi.fn()}
      />,
    );
    return onCreate;
  };

  it("shows the blended total on the row and breaks the markup out in the caption", () => {
    renderNew();
    // Blended, not the $24,000 cost.
    expect(screen.getByText("$26,400")).toBeInTheDocument();
    expect(screen.queryByText("$24,000")).not.toBeInTheDocument();
    // The caption makes the blend legible rather than opaque.
    expect(screen.getByText(/cost \$24,000 \+ markup \$2,400/)).toBeInTheDocument();
  });

  it("leaves an unmarked-up bill's row showing just its cost and vendor", () => {
    renderNew();
    expect(screen.getByText("$5,000")).toBeInTheDocument();
    expect(screen.getByText(/Bell Electric/)).toBeInTheDocument();
    expect(screen.queryByText(/INV-9002.*markup/)).not.toBeInTheDocument();
  });

  it("sends cost + markup as the cost_reimbursement amount and totals the CTA on it", () => {
    const onCreate = renderNew();
    fireEvent.click(screen.getByRole("checkbox", { name: /Acme Concrete/ }));
    // CTA total reflects the blended figure.
    expect(screen.getByRole("button", { name: /Create draft — \$26,400/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Create draft/ }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate.mock.calls[0][1]).toEqual([
      {
        description: "INV-8871",
        amount_cents: 2640000, // 2400000 cost + 240000 markup
        source_type: "cost_reimbursement",
        source_id: 21,
        vendor_id: 5,
      },
    ]);
  });

  it("treats a missing upcharge_cents as zero rather than producing NaN", () => {
    const onCreate = vi.fn();
    render(
      <ProjectInvoiceBuilderModal
        invoice={null}
        billables={{
          installments_due: [],
          change_orders_unbilled: [],
          // Field absent entirely — a stale API response must not poison the math.
          vendor_bills: [{ bill_id: 31, vendor_id: 7, vendor_name: "Cole Paving", description: "INV-1", amount_cents: 100000 }],
          fto_items: [],
        } as unknown as Billables}
        busy={false}
        onCreate={onCreate}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /Cole Paving/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Create draft/ }));
    expect(onCreate.mock.calls[0][1][0].amount_cents).toBe(100000);
  });
});

describe("ProjectInvoiceBuilderModal — long descriptions must not wrap the amount", () => {
  // A flex item defaults to min-width:auto, so a long description refuses to
  // shrink and squeezes the amount until "$6,250" breaks across two lines. The
  // label side needs min-w-0 and the amount needs shrink-0 + whitespace-nowrap.
  // jsdom computes no layout, so assert the rules that make the layout impossible
  // to break rather than pixel positions.
  const longLabels: Billables = {
    installments_due: [],
    change_orders_unbilled: [
      { id: 11, co_number: "CO-002", description: "Added footings along the entire north elevation including drainage", amount_cents: 1200000 },
    ],
    vendor_bills: [
      {
        bill_id: 21,
        vendor_id: 5,
        vendor_name: "RG White Painting LLC",
        description: "50% Deposit: Smoke/CO Detectors, Wiring and Outlets across the property.",
        amount_cents: 562500,
        upcharge_cents: 62500,
      },
    ],
    fto_items: [
      {
        submission_id: 77,
        date_of_work: "2026-07-16",
        work_description: "Supply & deliver misc. demo materials & dump run for the upstairs bath",
        labor_lines: [{ note: "Labor", hours_decimal: 1, emergency: false, amount_cents: 12500 }],
        expense_lines: [],
        labor_total_cents: 12500,
        expense_total_cents: 0,
      },
    ],
  } as unknown as Billables;

  const amountFor = (text: string) => screen.getByText(text);

  it.each([
    ["vendor bill", "$6,250"],
    ["change order", "$12,000"],
    ["field team order", "$125"],
  ])("keeps the %s amount unshrinkable and on one line", (_label, amount) => {
    render(
      <ProjectInvoiceBuilderModal
        invoice={null}
        billables={longLabels}
        busy={false}
        onCreate={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const el = amountFor(amount);
    expect(el.className).toContain("shrink-0");
    expect(el.className).toContain("whitespace-nowrap");
    // Its sibling label side must be permitted to shrink instead.
    const label = el.previousElementSibling!;
    expect(label.className).toContain("min-w-0");
  });
});
