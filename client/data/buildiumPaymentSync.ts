import { fetchJSON } from "@/api/fetchJSON";

/**
 * "Mark as paid" for bills settled directly inside Buildium.
 *
 * Backs POST /vendors/bills/{id}/sync-buildium-payments, which pulls Buildium's
 * payment records for the bill into local bill_payments. The call is read-only
 * against Buildium — it never books a payment there — so a bill the PM already
 * paid in Buildium can be closed out in the platform without paying twice.
 *
 * Surfaced only on non-Concierge bills; Concierge bills settle through QBO and
 * use "Refresh from QBO" instead.
 */
export interface BuildiumSyncResult {
  ok: boolean;
  bill_id: number;
  buildium_bill_id: string;
  /**
   * "paid"    — Buildium's payments cover the bill; nothing left to do.
   * "partial" — some payment found, a balance remains.
   * "none"    — Buildium has no payment on this bill.
   */
  status: "paid" | "partial" | "none";
  buildium_payment_count: number;
  amount_cents: number;
  paid_cents: number;
  outstanding_cents: number;
  paid_on: string | null;
  /**
   * Things the sync found but couldn't resolve on its own — an over-paid bill,
   * for instance, where the excess sits in a payment row Buildium doesn't know
   * about. Non-fatal: the sync still ran. Show them alongside the result.
   */
  warnings?: string[];
}

export function syncBuildiumPayments(
  billId: number | string,
): Promise<BuildiumSyncResult> {
  return fetchJSON(`/vendors/bills/${billId}/sync-buildium-payments`, {
    method: "POST",
  });
}

const money = (c: number) => `$${(c / 100).toFixed(2)}`;

// paid_on arrives as YYYY-MM-DD. Split rather than new Date() so a UTC-midnight
// date doesn't render as the previous day in western timezones.
const fmtDay = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${Number(m)}/${Number(d)}/${y}` : iso;
};

/** Toast copy for a sync result. */
export function describeBuildiumSync(r: BuildiumSyncResult): string {
  switch (r.status) {
    case "paid":
      return r.paid_on
        ? `Marked paid — ${money(r.paid_cents)} found in Buildium (${fmtDay(r.paid_on)}).`
        : `Marked paid — ${money(r.paid_cents)} found in Buildium.`;
    case "partial":
      return `Found ${money(r.paid_cents)} paid in Buildium; ${money(
        r.outstanding_cents,
      )} still outstanding.`;
    default:
      return "No payment record found in Buildium.";
  }
}
