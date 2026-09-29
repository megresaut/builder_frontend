import { fetchJSON } from "@/api/fetchJSON";

// Effective-dated property rates (backend migration 169). Every rate change is
// a history entry effective from a month; invoices bill the rate in effect for
// the month they cover.

export interface PropertyRates {
  management_fee_cents: number | null;
  hourly_rate_cents: number | null;
  emergency_hourly_rate_cents: number | null;
  late_fee_pct: number | null;
  late_fee_flat_cents: number | null;
  late_fee_grace_days: number | null;
}

export interface RateEdit {
  edited_by: string | null;
  edited_at: string;
  before: PropertyRates & { effective_month: string; note: string | null };
  after: PropertyRates & { effective_month: string; note: string | null };
}

export interface RateHistoryEntry extends PropertyRates {
  id: number;
  property_id: number;
  effective_month: string; // RFC 3339, first of the month, UTC
  is_baseline: boolean;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
  superseded: boolean;
  deletable: boolean;
  edits: RateEdit[];
}

export interface RatesResponse extends PropertyRates {
  upcoming_rate_change: RateHistoryEntry | null;
}

export interface RateHistoryResponse {
  entries: RateHistoryEntry[];
  current: PropertyRates;
  upcoming_rate_change: RateHistoryEntry | null;
}

export interface ImpactedInvoice {
  id: number;
  invoice_month: string;
  status: string;
  total_amount: number;
}

export interface RateChangeImpact {
  effective_month: string;
  until_month: string | null;
  impact: {
    locked: ImpactedInvoice[];
    drafts: ImpactedInvoice[];
    snapshotted_fto_submissions: number;
  };
}

// Dollar-denominated write shape shared by "record a change" and "correct an
// entry". null clears a field.
export interface RatesInput {
  management_fee: number | null;
  hourly_rate: number | null;
  emergency_hourly_rate: number | null;
  late_fee_pct: number | null;
  late_fee_flat: number | null;
  late_fee_grace_days: number | null;
}

export async function fetchRateHistory(propertyId: number): Promise<RateHistoryResponse> {
  return fetchJSON(`/properties/${propertyId}/rate-history`);
}

export async function recordRateChange(
  propertyId: number,
  req: Partial<RatesInput> & { late_fee_set?: boolean; effective_month: string; note?: string },
): Promise<RatesResponse> {
  return fetchJSON(`/properties/patch-rates/${propertyId}/rates`, {
    method: "PATCH",
    body: JSON.stringify(req),
  });
}

export async function updateRateEntry(
  propertyId: number,
  entryId: number,
  req: RatesInput & { effective_month: string; note: string },
): Promise<RatesResponse> {
  return fetchJSON(`/properties/${propertyId}/rate-history/${entryId}`, {
    method: "PUT",
    body: JSON.stringify(req),
  });
}

export async function deleteRateEntry(propertyId: number, entryId: number): Promise<RatesResponse> {
  return fetchJSON(`/properties/${propertyId}/rate-history/${entryId}`, { method: "DELETE" });
}

export async function fetchRateChangeImpact(
  propertyId: number,
  effectiveMonth: string,
  entryId?: number,
): Promise<RateChangeImpact> {
  const qs = new URLSearchParams({ effective_month: effectiveMonth });
  if (entryId) qs.set("entry_id", String(entryId));
  return fetchJSON(`/properties/${propertyId}/rate-history/impact?${qs}`);
}

// ---------------------------------------------------------------------------
// Formatting. Months come back as UTC midnights; formatting in local time
// would show Nov 1 as "October" anywhere west of UTC.
// ---------------------------------------------------------------------------

export const BASELINE_MONTH = "2000-01";

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // "2026-11-01T00:00:00Z" -> "2026-11"
}

export function currentMonthKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(isoOrKey: string): string {
  const [y, m] = monthKey(isoOrKey).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const RATE_FIELDS: {
  key: keyof PropertyRates;
  label: string;
  format: (v: number | null) => string;
}[] = [
  { key: "management_fee_cents", label: "Monthly rate", format: (v) => (v == null ? "N/A" : `$${(v / 100).toFixed(2)}`) },
  { key: "hourly_rate_cents", label: "Default rate", format: (v) => (v == null ? "N/A" : `$${(v / 100).toFixed(2)}/hr`) },
  { key: "emergency_hourly_rate_cents", label: "Emergency rate", format: (v) => (v == null ? "N/A" : `$${(v / 100).toFixed(2)}/hr`) },
  { key: "late_fee_pct", label: "Late fee %", format: (v) => (v == null ? "N/A" : `${v}%`) },
  { key: "late_fee_flat_cents", label: "Late fee flat", format: (v) => (v == null ? "N/A" : `$${(v / 100).toFixed(2)}`) },
  { key: "late_fee_grace_days", label: "Grace period", format: (v) => (v == null ? "N/A" : `${v} days`) },
];

export interface RateFieldChange {
  label: string;
  from: string;
  to: string;
}

// Fields that differ between two snapshots, formatted for display.
export function diffRates(prev: PropertyRates | null, next: PropertyRates): RateFieldChange[] {
  return RATE_FIELDS.filter((f) => !prev || prev[f.key] !== next[f.key]).map((f) => ({
    label: f.label,
    from: prev ? f.format(prev[f.key]) : "",
    to: f.format(next[f.key]),
  }));
}

export function toRatesInput(r: PropertyRates): RatesInput {
  return {
    management_fee: r.management_fee_cents == null ? null : r.management_fee_cents / 100,
    hourly_rate: r.hourly_rate_cents == null ? null : r.hourly_rate_cents / 100,
    emergency_hourly_rate: r.emergency_hourly_rate_cents == null ? null : r.emergency_hourly_rate_cents / 100,
    late_fee_pct: r.late_fee_pct,
    late_fee_flat: r.late_fee_flat_cents == null ? null : r.late_fee_flat_cents / 100,
    late_fee_grace_days: r.late_fee_grace_days,
  };
}
