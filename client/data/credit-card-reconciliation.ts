import { fetchJSON } from "@/api/fetchJSON";

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
  since_date: string;
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
  sinceDate: string,
  refresh = false,
): Promise<CreditCardActivityResponse> {
  const params = new URLSearchParams({ since: sinceDate });
  if (refresh) params.set("refresh", "1");
  return await fetchJSON(
    `/reconciliation/credit-cards/${coaID}/activity?${params.toString()}`,
  );
}

// qboReconcileURL is the deep-link to QBO's reconcile screen for a given
// account. QBO routes to the banking center if the URL fails to match its
// internal pattern; either landing is one click from the reconcile flow.
export function qboReconcileURL(qboAccountID: string): string {
  return `https://qbo.intuit.com/app/reconcile?accountId=${encodeURIComponent(qboAccountID)}`;
}
