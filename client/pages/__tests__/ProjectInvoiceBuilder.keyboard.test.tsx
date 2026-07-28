/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";

// The new-project-invoice modal is a keyboard-first billing worksheet: an
// operator tabs down it and commits every field with Enter, never touching the
// mouse. Native HTML doesn't give that for free — checkboxes ignore Enter (only
// Space toggles them), and there is no built-in "open another row" affordance.
// These tests pin the two shims that close that gap.

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
import type { Billables } from "@/data/projects";

const billables: Billables = {
  installments_due: [],
  change_orders_unbilled: [
    { id: 11, co_number: "CO-001", description: "Extra tile", amount_cents: 250_00 },
  ],
  vendor_bills: [
    {
      bill_id: 21,
      description: "Demo, prep, install shower tile",
      amount_cents: 10_323_00,
      vendor_id: 5,
      vendor_name: "Braha Marbel & Tiles Inc",
    },
  ],
  fto_items: [],
} as unknown as Billables;

function renderModal(onCreate = vi.fn()) {
  render(
    <ProjectInvoiceBuilderModal
      billables={billables}
      busy={false}
      onCreate={onCreate}
      onClose={vi.fn()}
    />,
  );
  return onCreate;
}

/** The description inputs of the Manual lines section, in visual order. */
function manualDescriptions(): HTMLInputElement[] {
  return screen.queryAllByPlaceholderText("Description") as HTMLInputElement[];
}

describe("New project invoice — keyboard entry", () => {
  beforeEach(() => vi.clearAllMocks());

  it("toggles a vendor-bill checkbox on Enter (native checkboxes only answer to Space)", () => {
    renderModal();
    const box = screen.getAllByRole("checkbox")[1] as HTMLInputElement; // vendor bill row
    expect(box.checked).toBe(false);

    fireEvent.keyDown(box, { key: "Enter" });
    expect(box.checked).toBe(true);
  });

  it("un-checks the same box on a second Enter", () => {
    renderModal();
    const box = screen.getAllByRole("checkbox")[1] as HTMLInputElement;

    fireEvent.keyDown(box, { key: "Enter" });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(box.checked).toBe(false);
  });

  it("Enter on a checkbox feeds the running total and the created lines", () => {
    const onCreate = renderModal();
    const [co, bill] = screen.getAllByRole("checkbox") as HTMLInputElement[];

    fireEvent.keyDown(co, { key: "Enter" });
    fireEvent.keyDown(bill, { key: "Enter" });

    // $250 change order + $10,323 vendor bill (formatUSD drops whole-dollar cents)
    expect(screen.getByRole("button", { name: /Create draft — \$10,573/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Create draft/ }));
    const lines = onCreate.mock.calls[0][1];
    expect(lines.map((l: { source_type: string }) => l.source_type)).toEqual([
      "change_order",
      "cost_reimbursement",
    ]);
  });

  it("Shift+Enter on a manual row's ✕ adds a row below instead of deleting it", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "+ Add line" }));
    expect(manualDescriptions()).toHaveLength(1);

    fireEvent.keyDown(screen.getByRole("button", { name: /Remove line/ }), {
      key: "Enter",
      shiftKey: true,
    });

    expect(manualDescriptions()).toHaveLength(2);
  });

  it("focuses the new row's description so entry continues without Tab", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "+ Add line" }));
    fireEvent.keyDown(screen.getByRole("button", { name: /Remove line/ }), {
      key: "Enter",
      shiftKey: true,
    });

    expect(document.activeElement).toBe(manualDescriptions()[1]);
  });

  it("inserts directly beneath the row acted on, not at the end of the list", () => {
    renderModal();
    const add = screen.getByRole("button", { name: "+ Add line" });
    fireEvent.click(add);
    fireEvent.click(add);

    // Label the two rows so position is observable.
    fireEvent.change(manualDescriptions()[0], { target: { value: "first" } });
    fireEvent.change(manualDescriptions()[1], { target: { value: "second" } });

    // Shift+Enter from row ONE's ✕.
    fireEvent.keyDown(screen.getAllByRole("button", { name: /Remove line/ })[0], {
      key: "Enter",
      shiftKey: true,
    });

    expect(manualDescriptions().map((el) => el.value)).toEqual(["first", "", "second"]);
  });

  it("still deletes the row on a plain Enter (the ✕'s own affordance)", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "+ Add line" }));

    // A browser turns plain Enter on a focused button into a click; jsdom does
    // not synthesise that, so assert on the click the Shift branch must not eat.
    fireEvent.click(screen.getByRole("button", { name: /Remove line/ }));
    expect(manualDescriptions()).toHaveLength(0);
  });

  it("applies the same Shift+Enter rule to project-fee rows", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "+ Add fee" }));

    fireEvent.keyDown(screen.getByRole("button", { name: /Remove fee line/ }), {
      key: "Enter",
      shiftKey: true,
    });

    expect(screen.queryAllByPlaceholderText(/Management fee/)).toHaveLength(2);
  });

  it("leaves the payment-schedule section gone — nothing is pre-checked on open", () => {
    renderModal();
    for (const box of screen.getAllByRole("checkbox")) {
      expect((box as HTMLInputElement).checked).toBe(false);
    }
    expect(screen.queryByText(/payment schedule/i)).not.toBeInTheDocument();
  });
});
