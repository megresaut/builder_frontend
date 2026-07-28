/// <reference types="@testing-library/jest-dom" />
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

// html2pdf.js touches canvas APIs jsdom doesn't implement — stub the whole
// chain so the commit path resolves with a Blob. ExcelJS is only reachable
// from the Export-to-Excel button, which these tests never press.
vi.mock("html2pdf.js", () => {
  const chain: any = {
    set: () => chain,
    from: () => chain,
    outputPdf: () =>
      Promise.resolve(new Blob(["pdf"], { type: "application/pdf" })),
  };
  return { default: () => chain };
});
vi.mock("exceljs", () => ({ default: { Workbook: class {} } }));

import InvoicePreviewModal, {
  type UnpaidPassthroughLine,
} from "../InvoicePreviewModal";

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function makeUnpaidLine(
  overrides: Partial<UnpaidPassthroughLine> = {},
): UnpaidPassthroughLine {
  return {
    vendor: "Dolce Plumbing",
    description: "Repair main stack",
    amount: 500,
    billInvoiceNumber: "INV-9001",
    payeeName: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Props = React.ComponentProps<typeof InvoicePreviewModal>;

function renderModal(props: Partial<Props> = {}) {
  const resolved: Props = {
    open: true,
    onOpenChange: vi.fn(),
    propertyAddress: "22 Indian Chase Dr",
    propertyLocation: "Greenwich, CT",
    billTo: "Indian Chase Holdings LLC",
    invoiceDate: "2026-07-01",
    lineItems: [
      {
        id: 1,
        vendor: "Dolce Plumbing",
        description: "Repair main stack",
        amount: "500.00",
        sourceType: "vendor",
      },
    ],
    showCommitButton: true,
    onCommit: vi.fn(),
    derivedStatus: "ready",
    ...props,
  };
  render(<InvoicePreviewModal {...resolved} />);
  return resolved;
}

/** Presses the modal-footer "Send to QBO" button (the only one before the
 *  confirmation opens). */
function clickSend() {
  fireEvent.click(screen.getByRole("button", { name: /send to qbo/i }));
}

/** The pre-send confirmation, scoped so preview-body text can't leak in. */
function presendDialog(): HTMLElement {
  const title = screen.getByText("Review before sending");
  const dialog = title.closest("[role='alertdialog']");
  if (!dialog) throw new Error("pre-send confirmation not rendered");
  return dialog as HTMLElement;
}

function confirmSend(dialog: HTMLElement) {
  // `hidden: true` is required, not cosmetic: the preview Dialog stays mounted
  // underneath, so Radix marks the alert-dialog portal's ancestors
  // aria-hidden. jsdom has no layout engine to undo that, and Testing
  // Library's default accessibility filter would therefore find no button at
  // all. Don't copy this into tests that render a single dialog.
  fireEvent.click(
    within(dialog).getByRole("button", { name: /send to qbo/i, hidden: true }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("InvoicePreviewModal — pre-send review", () => {
  // The preview's outer DialogContent has no <DialogDescription>, so Radix
  // warns once per mount. Pre-existing and outside this task's scope — filter
  // just that one message so real warnings stay visible.
  const realWarn = console.warn;
  beforeAll(() => {
    vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("Missing `Description`")
      ) {
        return;
      }
      (realWarn as (...a: unknown[]) => void)(...args);
    });
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Section gating ----

  it("renders only the unpaid section when nothing is unapproved", () => {
    renderModal({
      unpaidPassthroughLines: [makeUnpaidLine()],
      pendingUnapprovedCount: 0,
    });

    clickSend();
    const dialog = presendDialog();

    expect(
      within(dialog).getByText("Passthrough lines with unpaid bills"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/AVMRE hasn't paid these vendor bills yet/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/later changes need a credit memo/),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Unapproved lines"),
    ).not.toBeInTheDocument();
  });

  it("renders only the unapproved section when nothing is unpaid", () => {
    renderModal({
      unpaidPassthroughLines: [],
      pendingUnapprovedCount: 2,
    });

    clickSend();
    const dialog = presendDialog();

    expect(within(dialog).getByText("Unapproved lines")).toBeInTheDocument();
    expect(
      within(dialog).getByText(/sending now will lock those amounts in/),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Passthrough lines with unpaid bills"),
    ).not.toBeInTheDocument();
  });

  it("renders both sections in a single dialog when both apply", () => {
    renderModal({
      unpaidPassthroughLines: [makeUnpaidLine()],
      pendingUnapprovedCount: 1,
    });

    clickSend();
    const dialog = presendDialog();

    expect(
      within(dialog).getByText("Passthrough lines with unpaid bills"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Unapproved lines")).toBeInTheDocument();
    // Exactly one confirmation — never two sequential dialogs.
    expect(screen.getAllByText("Review before sending")).toHaveLength(1);
  });

  // ---- No warnings: straight through ----

  it("commits without a dialog when there is nothing to review", async () => {
    const props = renderModal({
      unpaidPassthroughLines: [],
      pendingUnapprovedCount: 0,
    });

    clickSend();

    await waitFor(() => expect(props.onCommit).toHaveBeenCalledTimes(1));
    expect(props.onCommit).toHaveBeenCalledWith(expect.any(Blob));
    expect(screen.queryByText("Review before sending")).not.toBeInTheDocument();
  });

  it("commits after confirming the review dialog", async () => {
    const props = renderModal({
      unpaidPassthroughLines: [makeUnpaidLine()],
    });

    clickSend();
    confirmSend(presendDialog());

    await waitFor(() => expect(props.onCommit).toHaveBeenCalledTimes(1));
    expect(props.onCommit).toHaveBeenCalledWith(expect.any(Blob));
  });

  // ---- Double-submit guard (in-flight window) ----

  it("disables Send to QBO while the direct-commit path is in flight, so a second click can't fire onCommit twice", async () => {
    const props = renderModal({
      unpaidPassthroughLines: [],
      pendingUnapprovedCount: 0,
    });

    const button = screen.getByRole("button", { name: /send to qbo/i });
    fireEvent.click(button);
    // Synchronous part of handleCommit (setCommitting(true)) has run before
    // the awaited generatePdfBlob() resolves — the button must already be
    // disabled so a second click in this window is inert.
    expect(button).toBeDisabled();
    fireEvent.click(button);

    await waitFor(() => expect(props.onCommit).toHaveBeenCalledTimes(1));
  });

  it("disables Send to QBO while the reviewed-commit path is in flight, so a second click can't fire onCommit twice", async () => {
    const props = renderModal({
      unpaidPassthroughLines: [makeUnpaidLine()],
    });

    clickSend();
    confirmSend(presendDialog());

    // The confirm dialog closes immediately, re-exposing the modal-footer
    // "Send to QBO" button while generatePdfBlob()/onCommit are still in
    // flight — it must be disabled, not just re-enabled once the review
    // dialog is gone.
    const sendButton = screen.getByRole("button", {
      name: /send to qbo/i,
      hidden: true,
    });
    expect(sendButton).toBeDisabled();
    fireEvent.click(sendButton);

    await waitFor(() => expect(props.onCommit).toHaveBeenCalledTimes(1));
  });

  // ---- Itemized table ----

  it("itemizes each unpaid line and totals them", () => {
    renderModal({
      unpaidPassthroughLines: [
        makeUnpaidLine({
          vendor: "Dolce Plumbing",
          billInvoiceNumber: "INV-9001",
          amount: 500,
        }),
        makeUnpaidLine({
          vendor: "Lighthouse Electric",
          billInvoiceNumber: "INV-9002",
          amount: 1250.5,
        }),
      ],
    });

    clickSend();
    const dialog = presendDialog();

    expect(within(dialog).getByText("Dolce Plumbing")).toBeInTheDocument();
    expect(within(dialog).getByText("INV-9001")).toBeInTheDocument();
    expect(within(dialog).getByText("$500.00")).toBeInTheDocument();
    expect(within(dialog).getByText("Lighthouse Electric")).toBeInTheDocument();
    expect(within(dialog).getByText("INV-9002")).toBeInTheDocument();
    expect(within(dialog).getByText("$1,250.50")).toBeInTheDocument();

    // Total row — labelled "invoiced", not "owed": these are merged
    // (base + markup) amounts billed to the owner, not vendor payables.
    const totalRow = within(dialog).getByText("Total invoiced").closest("tr")!;
    expect(within(totalRow).getByText("$1,750.50")).toBeInTheDocument();
  });

  it("falls back to the description when a line has no invoice number", () => {
    renderModal({
      unpaidPassthroughLines: [
        // A line with no invoice number recorded (e.g. a scraped utility bill
        // with no account-number fallback, or an fto_expense not yet linked
        // to a bill) — bill_invoice_number can be absent for any passthrough
        // source type, not just utility/fto_expense specifically.
        makeUnpaidLine({
          vendor: "Optimum",
          description: "Internet — June 2026",
          billInvoiceNumber: null,
          amount: 89.99,
        }),
        makeUnpaidLine({
          vendor: "Dolce Plumbing",
          description: "Repair main stack",
          billInvoiceNumber: "INV-9001",
          amount: 500,
        }),
      ],
    });

    clickSend();
    const dialog = presendDialog();

    const utilityRow = within(dialog).getByText("Optimum").closest("tr")!;
    expect(
      within(utilityRow).getByText("Internet — June 2026"),
    ).toBeInTheDocument();

    // The vendor row still shows its invoice number, not its description.
    const vendorRow = within(dialog).getByText("Dolce Plumbing").closest("tr")!;
    expect(within(vendorRow).getByText("INV-9001")).toBeInTheDocument();
    expect(
      within(vendorRow).queryByText("Repair main stack"),
    ).not.toBeInTheDocument();
  });

  // ---- Reimbursement note ----

  it("omits the reimbursement note when no line has a payee", () => {
    renderModal({
      unpaidPassthroughLines: [makeUnpaidLine({ payeeName: null })],
    });

    clickSend();
    expect(
      within(presendDialog()).queryByText(/unreimbursed expense/),
    ).not.toBeInTheDocument();
  });

  it("shows one reimbursement note per payee, even when that payee has multiple lines", () => {
    renderModal({
      unpaidPassthroughLines: [
        makeUnpaidLine({
          vendor: "Home Depot",
          billInvoiceNumber: "INV-1",
          amount: 120,
          payeeName: "Christopher Harris",
        }),
        makeUnpaidLine({
          vendor: "Ace Hardware",
          billInvoiceNumber: "INV-2",
          amount: 80,
          payeeName: "Christopher Harris",
        }),
        makeUnpaidLine({
          vendor: "Dolce Plumbing",
          billInvoiceNumber: "INV-3",
          amount: 500,
          payeeName: null,
        }),
      ],
    });

    clickSend();
    const dialog = presendDialog();

    // No dollar figure: the merged/billed amount can include markup the
    // payee isn't owed, so the note states the fact without a number.
    expect(
      within(dialog).getByText(
        "Christopher Harris has an unreimbursed expense on this invoice.",
      ),
    ).toBeInTheDocument();
    // Only the one payee gets a note, deduped across their two lines.
    expect(within(dialog).getAllByText(/unreimbursed expense/)).toHaveLength(1);
  });

  it("shows one reimbursement note per distinct payee", () => {
    renderModal({
      unpaidPassthroughLines: [
        makeUnpaidLine({
          vendor: "Home Depot",
          billInvoiceNumber: "INV-1",
          amount: 120,
          payeeName: "Christopher Harris",
        }),
        makeUnpaidLine({
          vendor: "Ace Hardware",
          billInvoiceNumber: "INV-2",
          amount: 45.25,
          payeeName: "Dana Whitfield",
        }),
        makeUnpaidLine({
          vendor: "Home Depot",
          billInvoiceNumber: "INV-3",
          amount: 80,
          payeeName: "Christopher Harris",
        }),
      ],
    });

    clickSend();
    const dialog = presendDialog();

    // Two distinct payees each produce their own note — no amounts, since
    // the underlying figure is the merged/billed amount, not what's owed.
    expect(
      within(dialog).getByText(
        "Christopher Harris has an unreimbursed expense on this invoice.",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Dana Whitfield has an unreimbursed expense on this invoice.",
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getAllByText(/unreimbursed expense/)).toHaveLength(2);
  });

  // ---- Hard blocker (missing bill) ----

  it("disables the send button and explains missing bills when status is draft", () => {
    renderModal({ derivedStatus: "draft" });

    const button = screen.getByRole("button", { name: /send to qbo/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute(
      "title",
      "Cannot send — a line item has no vendor bill recorded. Resolve the underlying bills first.",
    );
  });

  // ---- Status banner copy ----
  //
  // The banner is the loudest statement of the rule in the UI, so it must not
  // describe the retired "everything must be paid before sending" behaviour.

  it("frames the DRAFT banner as a missing bill, never as unpaid", () => {
    // A draft invoice can also carry unpaid lines; the banner must still name
    // the missing bill as the blocker.
    renderModal({
      derivedStatus: "draft",
      unpaidPassthroughLines: [makeUnpaidLine()],
    });

    expect(
      screen.getByText(/A line item has no vendor bill recorded/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/passthrough line item/)).not.toBeInTheDocument();
    expect(screen.queryByText(/not yet paid/)).not.toBeInTheDocument();
  });

  it("reports READY as sendable with unpaid bills as a secondary note", () => {
    renderModal({
      derivedStatus: "ready",
      unpaidPassthroughLines: [makeUnpaidLine(), makeUnpaidLine()],
    });

    expect(
      screen.getByText(
        /Ready to send\. 2 passthrough bills not yet paid by AVMRE — review before sending\./,
      ),
    ).toBeInTheDocument();
    // Sending is not blocked.
    expect(
      screen.getByRole("button", { name: /send to qbo/i }),
    ).not.toBeDisabled();
  });

  it("reports READY with all passthroughs paid when no line is unpaid", () => {
    renderModal({ derivedStatus: "ready", unpaidPassthroughLines: [] });

    expect(
      screen.getByText(/Ready to send\. All passthrough bills paid\./),
    ).toBeInTheDocument();
  });
});
