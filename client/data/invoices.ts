import { fetchJSON } from "@/api/fetchJSON";

// Mirrors backend invoicing.PortfolioInvoiceRow. Status is the *derived*
// status — a draft arrives as 'ready' unless a passthrough line has no
// vendor bill recorded at all; a merely-unpaid passthrough bill never blocks
// 'ready'.
export type InvoiceStatus = "draft" | "ready" | "sent" | "paid" | "void";
export type QBOPushStatus = "pushed" | "failed" | "not_pushed";

export interface PortfolioInvoiceRow {
  id: number;
  property_id: number;
  property_address: string;
  invoice_month: string; // YYYY-MM-DDT00:00:00Z
  status: InvoiceStatus;
  total_amount_cents: number;
  issued_at: string | null;
  sent_at: string | null;
  payment_recorded_at: string | null;
  payment_amount_cents: number | null;
  payment_reference: string | null;
  qbo_invoice_id: string | null;
  qbo_push_status: QBOPushStatus;
  qbo_pushed_at: string | null;
  qbo_last_error: string | null;
  qbo_payment_id: string | null;
  qbo_payment_push_status: QBOPushStatus;
  // Running total from invoice_payment_refunds (migration 164). Non-zero on a
  // 'paid' invoice means it's been fully or partially refunded — status stays
  // 'paid', this drives the "Refunded" badge instead.
  refunded_cents: number;
}

export interface PortfolioFilter {
  // YYYY-MM or YYYY-MM-DD — server only looks at year+month.
  month?: string;
  status?: InvoiceStatus;
}

export async function fetchPortfolioInvoices(
  filter: PortfolioFilter = {},
): Promise<PortfolioInvoiceRow[]> {
  const params = new URLSearchParams();
  if (filter.month) params.set("month", filter.month);
  if (filter.status) params.set("status", filter.status);
  const qs = params.toString();
  const path = qs ? `/invoicing/portfolio?${qs}` : `/invoicing/portfolio`;
  const rows = await fetchJSON(path);
  return Array.isArray(rows) ? rows : [];
}

// Void transitions an invoice to status='void'. Backend rejects voiding a
// paid invoice. Note: this does NOT propagate to QBO — if the invoice was
// already pushed, the QBO copy stays in its prior state.
export async function voidInvoice(invoiceID: number): Promise<void> {
  await fetchJSON(`/invoicing/void?id=${invoiceID}`, { method: "POST" });
}

// Mirrors backend repository.InvoiceRefund (invoicing/repository/invoice_payment_refunds.go).
export interface InvoicePaymentRefund {
  id: number;
  invoice_id: number;
  amount_cents: number;
  refund_date: string;
  refund_path: "accounting" | "payments";
  deposit_account_name: string;
  memo: string;
  qbo_refund_receipt_id: string | null;
  qbo_payments_refund_id: string | null;
  qbo_payments_txn_id: string | null;
  created_at: string;
}

export interface InvoiceRefundsResponse {
  refunds: InvoicePaymentRefund[];
  total_refunded_cents: number;
}

// getInvoiceRefunds lists every refund already recorded against an invoice
// plus the running total — used to cap the amount before opening the refund
// modal (mirrors the bill-side card refund's "remaining refundable" check).
export async function getInvoiceRefunds(
  invoiceID: number,
): Promise<InvoiceRefundsResponse> {
  return fetchJSON(`/invoicing/refunds?id=${invoiceID}`);
}

// refundInvoicePayment refunds the client who paid this invoice. No account
// picker: the backend derives the QBO account debited from the invoice's own
// recorded payment, and automatically detects whether this is a bookkeeping
// entry (payment was recorded manually) or a real QBO Payments refund (the
// original charge was processed by QBO itself).
export async function refundInvoicePayment(
  invoiceID: number,
  body: { amount_cents: number; date: string; memo?: string },
): Promise<InvoicePaymentRefund> {
  return fetchJSON(`/invoicing/refund-payment?id=${invoiceID}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// voidInvoiceLine voids a single line on a sent / partially-paid invoice. The
// backend soft-deletes the line, recomputes the total, and re-pushes the
// reduced invoice to QBO (which reverses the line's Due From Owners posting and
// reopens the underlying cost as unbilled). Returns the refreshed invoice +
// remaining active line items. Rejected on draft invoices (edit those directly)
// and when the new total would fall below an amount already paid.
export async function voidInvoiceLine(
  invoiceID: number,
  lineID: number,
  reason?: string,
): Promise<unknown> {
  return fetchJSON(`/invoicing/void-line`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invoice_id: invoiceID,
      line_id: lineID,
      reason: reason ?? "",
    }),
  });
}

// disputeInvoiceLine resolves a client dispute on a line — full or partial,
// before or after payment (mode derived server-side from whether the amount
// being removed fits the unpaid balance). clientCreditCents is how much less
// the client owes; vendorCreditCents is how much AVM recovers from the
// vendor (0 = none). Any gap between the two is recorded as AVM's loss.
export async function disputeInvoiceLine(
  invoiceID: number,
  lineID: number,
  clientCreditCents: number,
  vendorCreditCents: number,
  reason?: string,
): Promise<unknown> {
  return fetchJSON(`/invoicing/dispute-line`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invoice_id: invoiceID,
      line_id: lineID,
      client_credit_cents: clientCreditCents,
      vendor_credit_cents: vendorCreditCents,
      reason: reason ?? "",
    }),
  });
}

// ---------------------------------------------------------------------------
// Per-line vendor/utility bill billing — "Edit line items" picker.
//
// A bill is billed to the owner whole by default (Generate() sums it into one
// invoice_line_items row). When a bill's own line_items[] reconcile to a real
// breakdown (Σ line amounts == bills.amount_cents), the picker lets the user
// choose a subset to bill THIS month; anything left out just isn't inserted —
// it stays available for a future month's invoice (no line trusted as a
// stable id beyond display/dedup; see backend comments on source_line_id).
// ---------------------------------------------------------------------------

export interface BillableBillLineAPI {
  line_id: number;
  description: string;
  amount_cents: number;
  upcharge_cents: number;
  selected_now: boolean;
  billed_on_invoice_id: number | null;
  billed_on_invoice_month: string | null;
}

export interface BillableBillLinesAPI {
  bill_id: number;
  itemizable: boolean;
  lines: BillableBillLineAPI[];
}

export async function fetchBillableBillLines(
  invoiceID: number,
  billID: number,
): Promise<BillableBillLinesAPI> {
  return fetchJSON(
    `/invoicing/bill-lines?invoice_id=${invoiceID}&bill_id=${billID}`,
  );
}

// editInvoiceLineItems replaces which of billID's own lines are billed on
// invoiceID this month. lineIDs is the FULL desired selection — an empty
// array drops the bill off this invoice entirely (its lines remain eligible
// for a future month). Works on draft/ready/sent invoices; the backend
// rejects this once the invoice is paid or void. Does NOT push to QBO — the
// caller re-syncs explicitly afterward via the existing retry endpoint.
export async function editInvoiceLineItems(
  invoiceID: number,
  billID: number,
  lineIDs: number[],
): Promise<unknown> {
  return fetchJSON(`/invoicing/edit-bill-lines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invoice_id: invoiceID,
      bill_id: billID,
      line_ids: lineIDs,
    }),
  });
}

// ---------------------------------------------------------------------------
// Payment detail — GET /invoicing/payment-detail?id=X
//
// Returns what the platform recorded next to a LIVE read of the QBO Payment and
// the invoice's current QBO balance, because the two can legitimately disagree
// (a payment deleted in QBO, a platform-side manual credit, a partial payment).
// Paid invoices only — the server answers 409 otherwise.
// ---------------------------------------------------------------------------

// Wire shapes, snake_case as the API sends them.
export interface InvoicePaymentDetailAPI {
  local: {
    status: string;
    recorded_at: string | null;
    amount_cents: number | null;
    reference: string | null;
    qbo_payment_id: string | null;
    invoice_total_cents: number;
    credit_cents: number;
  };
  qbo?: {
    payment_id: string;
    txn_date: string;
    total_cents: number;
    unapplied_cents: number;
    customer_name: string;
    payment_method: string;
    ref_num: string;
    deposit_account: string;
    private_note: string;
    invoice_balance_cents: number;
    linked_invoices?: {
      qbo_invoice_id: string;
      doc_number: string;
      applied_cents: number;
    }[];
  } | null;
  qbo_unavailable_reason?: string;
}

// Props shape InvoicePaymentDetailModal consumes.
export interface InvoicePaymentDetailProps {
  local: {
    status: string;
    recordedAt: string | null;
    amountCents: number | null;
    reference: string | null;
    qboPaymentId: string | null;
    invoiceTotalCents: number;
    creditCents: number;
  };
  qbo: {
    paymentId: string;
    txnDate: string;
    totalCents: number;
    unappliedCents: number;
    customerName: string;
    paymentMethod: string;
    refNum: string;
    depositAccount: string;
    privateNote: string;
    invoiceBalanceCents: number;
    linkedInvoices: {
      qboInvoiceId: string;
      docNumber: string;
      appliedCents: number;
    }[];
  } | null;
  qboUnavailableReason: string | null;
}

// toInvoicePaymentDetailProps is the single snake_case → camelCase boundary.
// `qbo` normalizes to null (never undefined) so the modal's "unavailable" branch
// is reachable, and linked_invoices defaults to [] because Go omits an empty
// slice and `.map` on undefined is a blank modal.
export function toInvoicePaymentDetailProps(
  api: InvoicePaymentDetailAPI,
): InvoicePaymentDetailProps {
  return {
    local: {
      status: api.local.status,
      recordedAt: api.local.recorded_at,
      amountCents: api.local.amount_cents,
      reference: api.local.reference,
      qboPaymentId: api.local.qbo_payment_id,
      invoiceTotalCents: api.local.invoice_total_cents,
      creditCents: api.local.credit_cents ?? 0,
    },
    qbo: api.qbo
      ? {
          paymentId: api.qbo.payment_id,
          txnDate: api.qbo.txn_date,
          totalCents: api.qbo.total_cents,
          unappliedCents: api.qbo.unapplied_cents,
          customerName: api.qbo.customer_name,
          paymentMethod: api.qbo.payment_method,
          refNum: api.qbo.ref_num,
          depositAccount: api.qbo.deposit_account,
          privateNote: api.qbo.private_note,
          invoiceBalanceCents: api.qbo.invoice_balance_cents,
          linkedInvoices: (api.qbo.linked_invoices ?? []).map((li) => ({
            qboInvoiceId: li.qbo_invoice_id,
            docNumber: li.doc_number,
            appliedCents: li.applied_cents,
          })),
        }
      : null,
    qboUnavailableReason: api.qbo_unavailable_reason ?? null,
  };
}

// fetchInvoicePaymentDetail reaches QuickBooks live, so expect a second or two.
export async function fetchInvoicePaymentDetail(
  invoiceID: number,
): Promise<InvoicePaymentDetailProps> {
  const api = (await fetchJSON(
    `/invoicing/payment-detail?id=${invoiceID}`,
  )) as InvoicePaymentDetailAPI;
  return toInvoicePaymentDetailProps(api);
}
