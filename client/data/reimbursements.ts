import { fetchJSON } from "@/api/fetchJSON";

export interface EmployeeOwedSummary {
  user_id: number;
  name: string | null;
  email: string;
  bill_count: number;
  total_owed_cents: number;
  oldest_bill_date: string;
}

export interface ReimbursementBill {
  bill_id: number;
  amount_cents: number;
  statement_date: string;
  due_date: string | null;
  invoice_number: string | null;
  memo: string | null;
  vendor_id: number | null;
  vendor_name: string | null;
  property_id: number | null;
  property_name: string | null;
  property_type: string | null;
}

export interface ReimbursementPaymentBill {
  bill_id: number;
  amount_cents: number;
  vendor_name: string | null;
  qbo_bill_payment_id: string | null;
  buildium_bill_payment_id: string | null;
}

export interface ReimbursementPayment {
  id: number;
  reimbursee_user_id: number;
  employee_name: string | null;
  employee_email: string;
  payment_date: string;
  total_amount_cents: number;
  source_qbo_account_id: string;
  source_account_name: string | null;
  memo: string | null;
  status: "pending" | "completed" | "failed" | "failed_partial";
  partial_state?: unknown;
  failure_message?: string | null;
  created_at: string;
  completed_at: string | null;
  created_by_user_id: number | null;
  bills: ReimbursementPaymentBill[];
}

export async function fetchReimbursementSummaries(): Promise<EmployeeOwedSummary[]> {
  const res = await fetchJSON("/reimbursements");
  return res.employees ?? [];
}

export async function fetchReimbursementBillsForUser(
  userID: number,
): Promise<ReimbursementBill[]> {
  const res = await fetchJSON(`/reimbursements/users/${userID}`);
  return res.bills ?? [];
}

export async function fetchReimbursementPayment(
  paymentID: number,
): Promise<ReimbursementPayment> {
  return await fetchJSON(`/reimbursements/payments/${paymentID}`);
}

export interface PaymentHistoryRow {
  id: number;
  reimbursee_user_id: number;
  employee_name: string | null;
  employee_email: string;
  payment_date: string;
  total_amount_cents: number;
  source_account_name: string | null;
  memo: string | null;
  status: "pending" | "completed" | "failed" | "failed_partial";
  failure_message?: string | null;
  bill_count: number;
  created_at: string;
  completed_at: string | null;
}

export async function fetchReimbursementHistory(): Promise<PaymentHistoryRow[]> {
  const res = await fetchJSON("/reimbursements/payments");
  return res.payments ?? [];
}

export interface PaymentAccount {
  qbo_account_id: string;
  name: string;
  qbo_account_type: "Bank" | "Credit Card";
  buildium_account_id: number;
}

export async function fetchPaymentAccounts(): Promise<PaymentAccount[]> {
  const res = await fetchJSON("/payment-accounts");
  return res.accounts ?? [];
}

export interface PayReimbursementInput {
  reimbursee_user_id: number;
  bill_ids: number[];
  payment_date: string; // YYYY-MM-DD
  source_qbo_account_id: string;
  memo?: string;
}

export interface PayReimbursementResult {
  reimbursement_payment_id: number;
  status: "completed" | "failed_partial" | "failed";
  bills_paid: number[];
  bills_failed?: number[];
  failure_message?: string;
}

export async function payReimbursement(
  input: PayReimbursementInput,
): Promise<PayReimbursementResult> {
  return await fetchJSON("/reimbursements/pay", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
