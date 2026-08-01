import { fetchJSON } from "@/api/fetchJSON";

/**
 * "Sync" on the bill detail page.
 *
 * Backs POST /vendors/bills/{id}/sync, which reconciles one bill against the
 * accounting systems: it creates the bill wherever it's missing (concierge
 * bills in QuickBooks + Buildium, everything else Buildium-only) and pulls
 * payments back into local bill_payments.
 *
 * Everything except that create is read-only — Sync never books a payment into
 * QuickBooks or Buildium, and never deletes a local payment row. Where the two
 * books disagree it reports the discrepancy in `drift` rather than guessing.
 *
 * Replaces the page's "Mark as paid" and "Refresh from QBO" actions. The Bills
 * list page keeps its own row-level "Mark as paid" (see buildiumPaymentSync).
 *
 * Not offered for scraped utility bills — those publish through the scraper
 * pipeline, and the endpoint rejects them with code "sync_not_supported".
 */
export interface BillSyncSystemResult {
  /** The bill exists in this system (after any create this sync performed). */
  present: boolean;
  /** This sync is what created it. */
  created: boolean;
  /** Payments newly written to local bill_payments. */
  payments_imported: number;
  /** Payments already known locally that were refreshed in place. */
  payments_updated: number;
  /** Non-fatal: the other system's half of the sync still ran. */
  error?: string;
}

export interface BillSyncResult {
  ok: boolean;
  bill_id: number;
  property_type: string;
  is_concierge: boolean;
  qbo: BillSyncSystemResult;
  buildium: BillSyncSystemResult;
  /**
   * "paid"    — local payments cover the bill.
   * "partial" — some payment found, a balance remains.
   * "none"    — no payment recorded anywhere.
   */
  status: "paid" | "partial" | "none";
  amount_cents: number;
  paid_cents: number;
  outstanding_cents: number;
  paid_on: string | null;
  /** Disagreements between the books that Sync reports rather than repairs. */
  drift: string[];
  warnings: string[];
}

export function syncBill(billId: number | string): Promise<BillSyncResult> {
  return fetchJSON(`/vendors/bills/${billId}/sync`, { method: "POST" });
}

const money = (c: number) => `$${(c / 100).toFixed(2)}`;

// paid_on arrives as YYYY-MM-DD. Split rather than new Date() so a UTC-midnight
// date doesn't render as the previous day in western timezones.
const fmtDay = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${Number(m)}/${Number(d)}/${y}` : iso;
};

/** Toast copy: what the sync changed, then where the bill now stands. */
export function describeBillSync(r: BillSyncResult): string {
  const parts: string[] = [];

  const created = [
    r.qbo.created && "QuickBooks",
    r.buildium.created && "Buildium",
  ].filter(Boolean) as string[];
  if (created.length) {
    parts.push(`Created in ${created.join(" and ")}.`);
  }

  // Only genuinely new rows count. A re-sync that refreshed payments it had
  // already imported hasn't found anything, and shouldn't say it did.
  const imported = r.qbo.payments_imported + r.buildium.payments_imported;
  if (imported > 0) {
    parts.push(`Imported ${imported} payment${imported === 1 ? "" : "s"}.`);
  }

  switch (r.status) {
    case "paid":
      parts.push(
        r.paid_on
          ? `Bill is fully paid — ${money(r.paid_cents)} (${fmtDay(r.paid_on)}).`
          : `Bill is fully paid — ${money(r.paid_cents)}.`,
      );
      break;
    case "partial":
      parts.push(
        `${money(r.paid_cents)} paid; ${money(r.outstanding_cents)} still outstanding.`,
      );
      break;
    default:
      parts.push("No payments found.");
  }

  return parts.join(" ");
}

/**
 * Everything that went wrong or looks inconsistent, for a secondary warning
 * toast. Per-system errors are non-fatal by design — one system being down
 * doesn't stop the other half of the sync — so they surface here rather than
 * as a thrown error.
 */
export function billSyncProblems(r: BillSyncResult): string[] {
  const problems: string[] = [];
  if (r.qbo.error) problems.push(`QuickBooks: ${r.qbo.error}`);
  if (r.buildium.error) problems.push(`Buildium: ${r.buildium.error}`);
  problems.push(...(r.drift ?? []));
  problems.push(...(r.warnings ?? []));
  return problems;
}
