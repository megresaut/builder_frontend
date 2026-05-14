import { authFetch, fetchJSON } from "@/api/fetchJSON";

export interface CreditCardAccount {
  id: number;
  qbo_id: string;
  qbo_name: string;
  qbo_account_type: string;
}

export type CCActivityStatus = "Reconciled" | "Cleared" | "Uncleared";

export interface CreditCardActivityRow {
  txn_date: string;
  txn_type: string;
  qbo_txn_id?: string;
  doc_num?: string;
  vendor?: string;
  memo?: string;
  amount_cents: number;
  status: CCActivityStatus;
}

export interface CreditCardActivityResponse {
  account: CreditCardAccount;
  start_date: string;
  end_date: string;
  rows: CreditCardActivityRow[];
  // QBO-native bucketing (kept for backward compat; UI no longer renders).
  uncleared_count: number;
  uncleared_cents: number;
  cleared_count: number;
  cleared_cents: number;
  reconciled_count: number;
  reconciled_cents: number;
  // Platform-side bucketing — drives the KPI strip on the CC page.
  platform_reconciled_count: number;
  platform_reconciled_cents: number;
  platform_in_progress_count: number;
  platform_in_progress_cents: number;
  platform_open_count: number;
  platform_open_cents: number;
  running_total_cents: number;
  cached_at?: string;
}

export async function fetchCreditCardAccounts(): Promise<CreditCardAccount[]> {
  const res = (await fetchJSON("/reconciliation/credit-cards")) as {
    accounts?: CreditCardAccount[];
  };
  return res.accounts ?? [];
}

export async function fetchCreditCardActivity(
  coaID: number,
  startDate: string,
  endDate: string,
  refresh = false,
): Promise<CreditCardActivityResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  if (refresh) params.set("refresh", "1");
  return await fetchJSON(
    `/reconciliation/credit-cards/${coaID}/activity?${params.toString()}`,
  );
}

export interface StatementRow {
  date: string;
  description: string;
  amount_cents: number;
  source_row: number;
  // Optional explicit resolution set by the operator for a row that won't be
  // matched against a QBO transaction in this rec. Decided rows are excluded
  // from the pair view + suggestions and surfaced in the Resolved section so
  // Finalize knows every row is accounted for.
  action?: "defer" | "dispute";
  action_note?: string;
  action_by_user_id?: number;
  action_at?: string;
}

export interface MatchPair {
  statement: StatementRow;
  qbo: CreditCardActivityRow;
  confidence: "exact" | "fuzzy_date";
}

export interface StatementMatchResponse {
  account: CreditCardAccount;
  start_date: string;
  end_date: string;
  statement_total_cents: number;
  qbo_total_cents: number;
  matched: MatchPair[];
  unmatched_statement: StatementRow[];
  unmatched_qbo: CreditCardActivityRow[];
  warnings?: string[];
}

export async function uploadStatementForMatch(
  coaID: number,
  startDate: string,
  endDate: string,
  file: File,
): Promise<StatementMatchResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("start_date", startDate);
  form.append("end_date", endDate);
  const res = await authFetch(
    `/reconciliation/credit-cards/${coaID}/statement-match`,
    {
      method: "POST",
      body: form,
    },
  );
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        message = parsed.error || parsed.message || text;
      }
    } catch {
      // raw text fallback
    }
    throw new Error(message || `Upload failed (${res.status})`);
  }
  return (await res.json()) as StatementMatchResponse;
}

// qboReconcileURL is the deep-link to QBO's reconcile screen for a given
// account. QBO routes to the banking center if the URL fails to match its
// internal pattern; either landing is one click from the reconcile flow.
export function qboReconcileURL(qboAccountID: string): string {
  return `https://qbo.intuit.com/app/reconcile?accountId=${encodeURIComponent(qboAccountID)}`;
}

// ---------------------------------------------------------------------------
// Persistent reconciliation engine (Phase 1).
// ---------------------------------------------------------------------------

export type ReconciliationStatus = "in_progress" | "finalized" | "needs_review";

export interface Reconciliation {
  id: number;
  coa_id: number;
  account_type: string;
  period_start: string;
  period_end: string;
  statement_date?: string;
  beginning_balance_cents: number;
  ending_balance_cents: number;
  status: ReconciliationStatus;
  statement_object_key?: string;
  statement_mime?: string;
  statement_filename?: string;
  statement_uploaded_at?: string;
  notes?: string;
  created_by_user_id?: number;
  finalized_at?: string;
  finalized_by_user_id?: number;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationLine {
  id: number;
  reconciliation_id: number;
  qbo_txn_type: string;
  qbo_txn_id: string;
  txn_date: string;
  amount_cents: number;
  statement_row?: StatementRow;
  match_confidence: "exact" | "fuzzy_date" | "manual" | "forced";
  // Operator's audit reason for force-clear (match_confidence === "forced").
  // Always populated when forced; NULL otherwise.
  force_clear_reason?: string;
  added_by_user_id?: number;
  added_at: string;

  // Enriched from the workspace's fresh QBO pull. Read-only context fields
  // — not stored on reconciliation_lines.
  qbo_vendor?: string;
  qbo_memo?: string;
  qbo_doc_num?: string;
}

export interface ReconciliationSummary {
  id: number;
  period_start: string;
  period_end: string;
  statement_date?: string;
  ending_balance_cents: number;
  status: ReconciliationStatus;
  finalized_at?: string;
  created_at: string;
}

export interface Workspace {
  reconciliation: Reconciliation;
  account: CreditCardAccount;
  matched_lines: ReconciliationLine[];
  unmatched_qbo: CreditCardActivityRow[];
  // Statement fields hydrate from the persisted upload. Empty arrays when no
  // statement has been uploaded for this rec. statement_rows is the full set
  // parsed from the upload; unmatched_statement filters out any rows already
  // accepted as matched_lines; suggestions is matchRows(unmatched_statement,
  // unmatched_qbo) recomputed on every GET so accepted matches drop out.
  statement_rows: StatementRow[];
  unmatched_statement: StatementRow[];
  // resolved_statement is the subset of statement_rows whose action field is
  // set (deferred / disputed). Server-side these are also excluded from
  // unmatched_statement and suggestions so the pair view only renders
  // undecided rows.
  resolved_statement?: StatementRow[];
  suggestions: MatchPair[];
  cleared_total_cents: number;
  difference_cents: number;
}

export interface UploadStatementResult {
  rows: StatementRow[];
  warnings: string[];
  filename: string;
  mime: string;
}

export interface StartReconciliationRequest {
  period_start: string;
  period_end: string;
  statement_date?: string;
  beginning_balance_cents: number;
  ending_balance_cents: number;
  notes?: string;
}

export interface MatchLineRequest {
  qbo_txn_type: string;
  qbo_txn_id: string;
  txn_date: string;
  amount_cents: number;
  statement_row?: StatementRow;
  match_confidence: "exact" | "fuzzy_date" | "manual" | "forced";
}

export async function listReconciliations(
  coaID: number,
): Promise<ReconciliationSummary[]> {
  const res = (await fetchJSON(
    `/reconciliation/credit-cards/${coaID}/reconciliations`,
  )) as { reconciliations?: ReconciliationSummary[] };
  return res.reconciliations ?? [];
}

export async function startReconciliation(
  coaID: number,
  req: StartReconciliationRequest,
): Promise<Reconciliation> {
  return (await fetchJSON(
    `/reconciliation/credit-cards/${coaID}/reconciliations`,
    {
      method: "POST",
      body: JSON.stringify(req),
    },
  )) as Reconciliation;
}

export async function getReconciliationWorkspace(
  recID: number,
): Promise<Workspace> {
  return (await fetchJSON(`/reconciliations/${recID}`)) as Workspace;
}

// UpdateReconciliationRequest mirrors the backend's PATCH body. Every field is
// optional — only the keys present in the object are written through. Use to
// fix period dates / balances on an in_progress rec without losing matches.
export interface UpdateReconciliationRequest {
  period_start?: string;
  period_end?: string;
  statement_date?: string;
  beginning_balance_cents?: number;
  ending_balance_cents?: number;
  notes?: string;
}

export async function updateReconciliation(
  recID: number,
  partial: UpdateReconciliationRequest,
): Promise<Reconciliation> {
  return (await fetchJSON(`/reconciliations/${recID}`, {
    method: "PATCH",
    body: JSON.stringify(partial),
  })) as Reconciliation;
}

export async function matchReconciliationLine(
  recID: number,
  req: MatchLineRequest,
): Promise<ReconciliationLine> {
  return (await fetchJSON(`/reconciliations/${recID}/match`, {
    method: "POST",
    body: JSON.stringify(req),
  })) as ReconciliationLine;
}

export interface ForceClearRequest {
  qbo_txn_type: string;
  qbo_txn_id: string;
  txn_date: string;
  amount_cents: number;
  reason: string;
}

export async function forceClear(
  recID: number,
  req: ForceClearRequest,
): Promise<ReconciliationLine> {
  return (await fetchJSON(`/reconciliations/${recID}/force-clear`, {
    method: "POST",
    body: JSON.stringify(req),
  })) as ReconciliationLine;
}

export async function unmatchReconciliationLine(
  recID: number,
  lineID: number,
): Promise<void> {
  const res = await authFetch(
    `/reconciliations/${recID}/match/${lineID}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) message = parsed.error;
    } catch {
      // raw text fallback
    }
    throw new Error(message || `Unmatch failed (${res.status})`);
  }
}

export interface CreateChargeFromRowRequest {
  statement_row: StatementRow;
  vendor_id: number;
  coa_id: number;
  property_id?: number;
  invoice_number?: string;
  description?: string;
  pdf_object_key?: string;
  sha256_pdf?: string;
}

export async function createChargeFromStatementRow(
  recID: number,
  req: CreateChargeFromRowRequest,
): Promise<ReconciliationLine> {
  return (await fetchJSON(
    `/reconciliations/${recID}/create-charge-from-row`,
    {
      method: "POST",
      body: JSON.stringify(req),
    },
  )) as ReconciliationLine;
}

export interface UnpaidBillCandidate {
  id: number;
  statement_date: string;
  amount_cents: number;
  vendor_id?: number;
  vendor_name?: string;
  property_id?: number;
  property_name?: string;
  invoice_number?: string;
  memo?: string;
  qbo_bill_id?: string;
}

export async function listUnpaidBillCandidates(
  limit = 200,
): Promise<UnpaidBillCandidate[]> {
  const res = (await fetchJSON(
    `/reconciliation/unpaid-bills?limit=${limit}`,
  )) as { bills?: UnpaidBillCandidate[] };
  return res.bills ?? [];
}

export interface PayExistingBillRequest {
  statement_row: StatementRow;
  bill_id: number;
}

export async function payExistingBill(
  recID: number,
  req: PayExistingBillRequest,
): Promise<ReconciliationLine> {
  return (await fetchJSON(`/reconciliations/${recID}/pay-existing-bill`, {
    method: "POST",
    body: JSON.stringify(req),
  })) as ReconciliationLine;
}

export async function discardReconciliation(recID: number): Promise<void> {
  const res = await authFetch(`/reconciliations/${recID}`, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) message = parsed.error;
    } catch {
      // raw text fallback
    }
    throw new Error(message || `Discard failed (${res.status})`);
  }
}

// uploadStatement persists a CC statement upload on the reconciliation. The
// returned rows + warnings are surfaced by the upload UI; the reconciliation
// workspace endpoint hydrates suggestions/unmatched-statement from the same
// persisted source on subsequent loads.
export async function uploadStatement(
  recID: number,
  file: File,
): Promise<UploadStatementResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await authFetch(`/reconciliations/${recID}/statement`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) message = parsed.error;
    } catch {
      // raw text fallback
    }
    throw new Error(message || `Upload failed (${res.status})`);
  }
  return (await res.json()) as UploadStatementResult;
}

// SetStatementActionRequest is the body for POST /reconciliations/{id}/statement-action.
// action="clear" rolls a previously-set action back to undecided. "dispute"
// requires a non-empty note (the server rejects with 400 otherwise).
export interface SetStatementActionRequest {
  source_row: number;
  action: "defer" | "dispute" | "clear";
  note?: string;
}

// setStatementAction marks a statement row as deferred / disputed (or clears
// the action back to undecided). Returns void — the canonical state lives on
// the workspace, so the caller should reload after a successful call.
export async function setStatementAction(
  recID: number,
  body: SetStatementActionRequest,
): Promise<void> {
  const res = await authFetch(
    `/reconciliations/${recID}/statement-action`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) message = parsed.error;
    } catch {
      // raw text fallback
    }
    throw new Error(message || `Statement action failed (${res.status})`);
  }
}

// removeStatement clears the persisted statement on a reconciliation. The
// next workspace load returns no statement_rows / unmatched_statement /
// suggestions; matched_lines that were accepted from the statement remain
// (Unmatch is how you'd undo those).
export async function removeStatement(recID: number): Promise<void> {
  const res = await authFetch(`/reconciliations/${recID}/statement`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) message = parsed.error;
    } catch {
      // raw text fallback
    }
    throw new Error(message || `Remove statement failed (${res.status})`);
  }
}

// finalize flips an in_progress rec to finalized. The server gates on
// difference == 0 and every statement row decided (matched or actioned) —
// the 409 message carries the specific failure reason.
export async function finalize(recID: number): Promise<Reconciliation> {
  return (await fetchJSON(`/reconciliations/${recID}/finalize`, {
    method: "POST",
  })) as Reconciliation;
}

// reopen flips a finalized rec back to in_progress. Reason is required (the
// server rejects empty with 400) and gets appended to the rec's notes as an
// audit line so reviewers can see why the rec was unlocked.
export async function reopen(
  recID: number,
  reason: string,
): Promise<Reconciliation> {
  return (await fetchJSON(`/reconciliations/${recID}/reopen`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })) as Reconciliation;
}

// ---------------------------------------------------------------------------
// Report (read-only audit snapshot).
// ---------------------------------------------------------------------------

export interface ReportTotals {
  beginning_cents: number;
  cleared_cents: number;
  ending_cents: number;
  difference_cents: number;
}

export interface ReportStatementFile {
  object_key: string;
  filename: string;
  mime?: string;
  uploaded_at?: string;
}

export interface ReportSignoff {
  user_id?: number;
  at: string;
}

// Report is the audit-friendly snapshot returned by
// GET /reconciliations/{id}/report. Mirrors the backend's reconciliation.Report
// struct. Works for any status — in_progress recs preview the would-be report.
export interface Report {
  reconciliation: Reconciliation;
  account: CreditCardAccount;
  totals: ReportTotals;
  cleared_lines: ReconciliationLine[];
  resolved_statement_rows: StatementRow[];
  statement_file?: ReportStatementFile;
  created_by?: ReportSignoff;
  finalized_by?: ReportSignoff;
}

export async function getReport(recID: number): Promise<Report> {
  return (await fetchJSON(`/reconciliations/${recID}/report`)) as Report;
}
