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
  uncleared_count: number;
  uncleared_cents: number;
  cleared_count: number;
  cleared_cents: number;
  reconciled_count: number;
  reconciled_cents: number;
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
