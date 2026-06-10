import { fetchJSON } from "@/api/fetchJSON";

// QBO Report shape (Header + Columns + Rows). The backend forwards the QBO
// response verbatim under `report`, so we mirror QBO's native types. Refs:
// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/report

export interface QBOReportHeader {
  Time?: string;
  ReportName?: string;
  DateMacro?: string;
  StartPeriod?: string;
  EndPeriod?: string;
  Currency?: string;
  Option?: Array<{ Name: string; Value: string }>;
}

export interface QBOReportColumn {
  ColTitle?: string;
  ColType?: string;
  MetaData?: Array<{ Name: string; Value: string }>;
}

export interface QBOReportColumns {
  Column?: QBOReportColumn[];
}

export interface QBOColDatum {
  value?: string;
  id?: string;
  href?: string;
}

// A QBO row is either a "Section" (group with nested rows) or a "Data" row.
// They share the field set but most fields are optional. We model both with
// the same interface and let the renderer branch on `type`.
export interface QBOReportRow {
  type?: "Section" | "Data";
  group?: string;
  // Section rows have a nested header row + nested Rows + a Summary row.
  Header?: { ColData: QBOColDatum[] };
  Rows?: { Row?: QBOReportRow[] };
  Summary?: { ColData: QBOColDatum[] };
  // Data rows put their cells directly here.
  ColData?: QBOColDatum[];
}

export interface QBOReport {
  Header?: QBOReportHeader;
  Columns?: QBOReportColumns;
  Rows?: { Row?: QBOReportRow[] };
}

export interface QBOReportEnvelope {
  start_date: string;
  end_date: string;
  report: QBOReport;
}

export interface ConciergeProperty {
  id: number;
  name: string;
  qbo_customer_id: string | null;
}

export interface QBOItem {
  qbo_item_id: string;
  name: string;
  fully_qualified_name: string;
  type: string;
  parent_name: string | null;
}

export interface GLFilters {
  startDate: string;
  endDate: string;
  account?: string;
  customer?: string;
  item?: string;
  accountingMethod?: "Cash" | "Accrual";
}

function rangeQS(startDate: string, endDate: string): string {
  return new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  }).toString();
}

export async function fetchGeneralLedger(
  startDate: string,
  endDate: string,
): Promise<QBOReportEnvelope> {
  return await fetchJSON(
    `/accounting/reports/general-ledger?${rangeQS(startDate, endDate)}`,
  );
}

export async function fetchGeneralLedgerFiltered(
  filters: GLFilters,
): Promise<QBOReportEnvelope> {
  const params = new URLSearchParams({
    start_date: filters.startDate,
    end_date: filters.endDate,
  });
  if (filters.account) params.set("account", filters.account);
  if (filters.customer) params.set("customer", filters.customer);
  if (filters.item) params.set("item", filters.item);
  if (filters.accountingMethod) params.set("accounting_method", filters.accountingMethod);
  return await fetchJSON(`/accounting/reports/general-ledger?${params.toString()}`);
}

export async function fetchQBOItems(): Promise<QBOItem[]> {
  const res = await fetchJSON(`/accounting/qbo-items`);
  return (res?.items ?? []) as QBOItem[];
}

export async function fetchConciergeProperties(): Promise<ConciergeProperty[]> {
  const res = await fetchJSON(`/accounting/concierge-properties`);
  return (res?.properties ?? []) as ConciergeProperty[];
}

export interface LiveAccount {
  id: string;
  name: string;
  account_type: string;
}

export interface LiveCustomer {
  id: string;
  display_name: string;
}

export async function fetchLiveAccounts(): Promise<LiveAccount[]> {
  const res = await fetchJSON(`/accounting/live-accounts`);
  return (res?.accounts ?? []) as LiveAccount[];
}

export async function fetchLiveCustomers(): Promise<LiveCustomer[]> {
  const res = await fetchJSON(`/accounting/live-customers`);
  return (res?.customers ?? []) as LiveCustomer[];
}

export interface JELine {
  account_id: string;
  description: string;
  debit: number;
  credit: number;
  customer_id: string;
}

export interface CreateJEPayload {
  txn_date: string;
  doc_number?: string;
  memo?: string;
  lines: JELine[];
}

export async function createJournalEntry(payload: CreateJEPayload): Promise<{ id: string }> {
  const res = await fetchJSON(`/accounting/journal-entry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { id: res.id as string };
}

export interface QBOTransactionDetail {
  txn_id: string;
  txn_type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: Record<string, any>;
}

export async function fetchQBOTransaction(
  txnId: string,
  txnType: string,
): Promise<QBOTransactionDetail> {
  const params = new URLSearchParams({ txn_id: txnId, txn_type: txnType });
  return await fetchJSON(`/accounting/transaction?${params.toString()}`);
}

export async function voidQBOTransaction(txnId: string, txnType: string, syncToken: string): Promise<void> {
  await fetchJSON(`/accounting/transaction/void`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txn_id: txnId, txn_type: txnType, sync_token: syncToken }),
  });
}

export async function deleteQBOTransaction(txnId: string, txnType: string, syncToken: string): Promise<void> {
  await fetchJSON(`/accounting/transaction/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txn_id: txnId, txn_type: txnType, sync_token: syncToken }),
  });
}

export async function updateQBOTransactionMemo(
  txnId: string,
  txnType: string,
  syncToken: string,
  memo: string,
): Promise<QBOTransactionDetail> {
  const res = await fetchJSON(`/accounting/transaction/memo`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txn_id: txnId, txn_type: txnType, sync_token: syncToken, memo }),
  });
  return { txn_id: txnId, txn_type: txnType, transaction: res.transaction };
}

export interface TransactionResolution {
  found: boolean;
  entity_type?: "bill" | "bill_payment" | "invoice";
  bill_id?: number;
  invoice_id?: number;
}

export async function resolveTransaction(
  txnId: string,
  txnType: string,
): Promise<TransactionResolution> {
  const params = new URLSearchParams({ txn_id: txnId, txn_type: txnType });
  return await fetchJSON(`/accounting/resolve-transaction?${params.toString()}`);
}

export async function fetchTransactionList(
  startDate: string,
  endDate: string,
): Promise<QBOReportEnvelope> {
  return await fetchJSON(
    `/accounting/reports/transaction-list?${rangeQS(startDate, endDate)}`,
  );
}

// The backend error message for an expired refresh token is stable enough
// to substring-match in the UI. The handler explicitly emits this phrase.
export function isQBOOAuthExpired(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /QBO authorization has expired/i.test(err.message);
}
