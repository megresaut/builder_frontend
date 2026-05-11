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
