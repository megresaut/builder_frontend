import { describe, expect, it } from "vitest";
import { toInvoicePaymentDetailProps } from "@/data/invoices";

// The API speaks snake_case and the modal props are camelCase. The mapper is the
// only place that knows both, so it is the only place a rename can silently drop
// a field — hence asserting every one that the modal renders.
describe("toInvoicePaymentDetailProps", () => {
  it("maps both halves of a settled payment", () => {
    const props = toInvoicePaymentDetailProps({
      local: {
        status: "paid",
        recorded_at: "2026-08-14T18:22:11Z",
        amount_cents: 103736,
        reference: "Credit Card #4021",
        qbo_payment_id: "1187",
        invoice_total_cents: 103736,
        credit_cents: 0,
      },
      qbo: {
        payment_id: "1187",
        txn_date: "2026-08-14",
        total_cents: 103736,
        unapplied_cents: 0,
        customer_name: "24 Brush Island Road",
        payment_method: "Credit Card",
        ref_num: "4021",
        deposit_account: "Chase Business Checking",
        private_note: "Paid online via QuickBooks invoice link.",
        invoice_balance_cents: 0,
        linked_invoices: [
          { qbo_invoice_id: "1042", doc_number: "INV-1042", applied_cents: 103736 },
        ],
      },
    });

    expect(props.local.status).toBe("paid");
    expect(props.local.amountCents).toBe(103736);
    expect(props.local.reference).toBe("Credit Card #4021");
    expect(props.local.qboPaymentId).toBe("1187");
    expect(props.local.invoiceTotalCents).toBe(103736);
    expect(props.local.creditCents).toBe(0);

    expect(props.qbo?.paymentId).toBe("1187");
    expect(props.qbo?.txnDate).toBe("2026-08-14");
    expect(props.qbo?.totalCents).toBe(103736);
    expect(props.qbo?.unappliedCents).toBe(0);
    expect(props.qbo?.customerName).toBe("24 Brush Island Road");
    expect(props.qbo?.paymentMethod).toBe("Credit Card");
    expect(props.qbo?.depositAccount).toBe("Chase Business Checking");
    expect(props.qbo?.privateNote).toBe("Paid online via QuickBooks invoice link.");
    expect(props.qbo?.invoiceBalanceCents).toBe(0);
    expect(props.qbo?.linkedInvoices).toEqual([
      { qboInvoiceId: "1042", docNumber: "INV-1042", appliedCents: 103736 },
    ]);
    expect(props.qboUnavailableReason).toBeNull();
  });

  // A QBO outage comes back 200 with the local half and a reason. The modal has
  // to receive qbo as null — not undefined-and-hope — so it renders the notice
  // rather than an empty right-hand column.
  it("passes the unavailable reason through with a null qbo half", () => {
    const props = toInvoicePaymentDetailProps({
      local: {
        status: "paid",
        recorded_at: null,
        amount_cents: 9500,
        reference: null,
        qbo_payment_id: null,
        invoice_total_cents: 10000,
        credit_cents: 500,
      },
      qbo: null,
      qbo_unavailable_reason: "no QuickBooks payment is linked to this invoice",
    });

    expect(props.qbo).toBeNull();
    expect(props.qboUnavailableReason).toBe(
      "no QuickBooks payment is linked to this invoice",
    );
    expect(props.local.creditCents).toBe(500);
    expect(props.local.recordedAt).toBeNull();
  });

  // linked_invoices is omitted by Go's encoder when the slice is nil, and
  // `.map` on undefined is a blank modal.
  it("tolerates a missing linked_invoices array", () => {
    const props = toInvoicePaymentDetailProps({
      local: {
        status: "paid",
        recorded_at: null,
        amount_cents: 100,
        reference: null,
        qbo_payment_id: "9",
        invoice_total_cents: 100,
        credit_cents: 0,
      },
      qbo: {
        payment_id: "9",
        txn_date: "2026-01-01",
        total_cents: 100,
        unapplied_cents: 0,
        customer_name: "x",
        payment_method: "",
        ref_num: "",
        deposit_account: "",
        private_note: "",
        invoice_balance_cents: 0,
      } as any,
    });

    expect(props.qbo?.linkedInvoices).toEqual([]);
  });
});
