import { fetchJSON } from "@/api/fetchJSON";

export interface SystemTotals {
  count: number;
  total_cents: number;
}

export interface ReconciliationSummary {
  platform: SystemTotals;
  qbo: SystemTotals;
  buildium: SystemTotals;
  start_date: string;
  end_date: string;
}

export type DiscrepancyType =
  | "missing_qbo_id"
  | "missing_buildium_id"
  | "qbo_id_not_found"
  | "buildium_id_not_found"
  | "qbo_orphan"
  | "buildium_orphan"
  | "amount_mismatch_qbo"
  | "amount_mismatch_buildium"
  | "payment_unpaid_qbo"
  | "payment_unpaid_buildium";

export type Severity = "error" | "warning";

export interface Discrepancy {
  type: DiscrepancyType;
  severity: Severity;
  description: string;
  bill_id?: number;
  qbo_bill_id?: string;
  buildium_bill_id?: string;
  vendor_name?: string;
  platform_amount_cents?: number;
  qbo_amount_cents?: number;
  buildium_amount_cents?: number;
  statement_date?: string;
}

// "matched" | "amount_drift" | "missing" | "not_found" come from the Bills tab.
// "unpaid" is added by the Payments tab when the bill exists+amount-matches
// but the external system isn't showing it as paid.
export type SystemStatus =
  | "matched"
  | "amount_drift"
  | "missing"
  | "not_found"
  | "unpaid";

export interface BillRow {
  bill_id: number;
  statement_date: string;
  vendor_name: string | null;
  amount_cents: number;
  is_reimbursement: boolean;

  qbo_bill_id: string | null;
  qbo_amount_cents?: number;
  qbo_status: SystemStatus;

  buildium_bill_id: string | null;
  buildium_amount_cents?: number;
  buildium_status: SystemStatus;

  // Payments tab only.
  paid_on?: string;
  qbo_paid?: boolean;
  buildium_paid?: boolean;
  qbo_raw_status?: string;
  buildium_raw_status?: string;
  platform_paid_from_account?: string;
  qbo_paid_from_account?: string;
  buildium_paid_from_account?: string;
  paid_doc_number?: string;
  paid_memo?: string;
  buildium_bill_payment_id?: string;
}

export type LinkStatus = "linked" | "qbo_only" | "buildium_only" | "neither";

export interface ReimbursementBillRow {
  bill_id: number;
  vendor_name: string | null;
  amount_cents: number;
  qbo_bill_payment_id: string | null;
  buildium_bill_payment_id: string | null;
  link_status: LinkStatus;
  bill_paid: boolean;
}

export interface ReimbursementRow {
  reimbursement_payment_id: number;
  employee_name: string | null;
  employee_email: string;
  payment_date: string;
  total_amount_cents: number;
  source_account_name: string | null;
  memo: string | null;
  status: "pending" | "completed" | "failed" | "failed_partial";
  failure_message?: string | null;
  bills: ReimbursementBillRow[];
}

export interface ReimbursementResult {
  start_date: string;
  end_date: string;
  rows: ReimbursementRow[];
  completed_count: number;
  failed_count: number;
  partial_count: number;
  pending_count: number;
  cached_at?: string;
}

export interface ReconciliationResult {
  summary: ReconciliationSummary;
  bills: BillRow[];
  discrepancies: Discrepancy[];
  cached_at?: string;
}

function rangeQS(startDate: string, endDate: string, refresh?: boolean): string {
  const params: Record<string, string> = {
    start_date: startDate,
    end_date: endDate,
  };
  if (refresh) params.refresh = "1";
  return new URLSearchParams(params).toString();
}

export async function fetchReconciliation(
  startDate: string,
  endDate: string,
  refresh = false,
): Promise<ReconciliationResult> {
  return await fetchJSON(
    `/reconciliation/bills?${rangeQS(startDate, endDate, refresh)}`,
  );
}

export async function fetchPaymentsReconciliation(
  startDate: string,
  endDate: string,
  refresh = false,
): Promise<ReconciliationResult> {
  return await fetchJSON(
    `/reconciliation/payments?${rangeQS(startDate, endDate, refresh)}`,
  );
}

export async function fetchReimbursementsReconciliation(
  startDate: string,
  endDate: string,
  refresh = false,
): Promise<ReimbursementResult> {
  return await fetchJSON(
    `/reconciliation/reimbursements?${rangeQS(startDate, endDate, refresh)}`,
  );
}
