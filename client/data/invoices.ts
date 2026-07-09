import { fetchJSON } from "@/api/fetchJSON";

// Mirrors backend invoicing.PortfolioInvoiceRow. Status is the *derived*
// status — drafts whose passthrough lines are fully paid arrive as 'ready'.
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
