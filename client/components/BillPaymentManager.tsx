import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ModalTemplate,
  ModalField,
} from "@/components/ui/ModalTemplate";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { accountingAPI } from "@/api/accounting";
import { fetchJSON } from "@/api/fetchJSON";

type PaymentMethod = "check" | "ach" | "credit_card" | "cash" | "other";
type AccountCategory =
  | ""
  | "company_credit_card"
  | "company_checking"
  | "hoa_operating"
  | "hoa_reserve"
  | "property_operating";

interface PaymentRow {
  id: number;
  bill_id: number;
  amount_cents: number;
  payment_date: string;
  payment_method: string;
  paid_from_account_id: string | null;
  account_name: string | null;
  account_category: string | null;
  reference_number: string | null;
  memo: string | null;
  qbo_bill_payment_id: string | null;
  qbo_synced_at: string | null;
  qbo_sync_error: string | null;
  buildium_bill_payment_id: string | null;
  buildium_synced_at: string | null;
  check_number: string | null;
  voided_at: string | null;
  voided_buildium_je_id: string | null;
  created_at: string;
}

interface BillStatus {
  bill_id: number;
  amount_cents: number;
  paid_amount_cents: number;
  remaining_cents: number;
  payment_status: "unpaid" | "partial" | "paid" | "void";
  invoice_amount_cents: number;
  markup_percent: number;
}

interface BankAccount {
  // QBO account id (string). Sent to backend as paid_from_account_id.
  id: string;
  name: string;
  account_type?: string;
  active?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billId: number | null;
  // Optional starting context the parent already knows; saves a fetch.
  billLabel?: string;
  // Optional property id; if supplied we pre-fill the bank dropdown from the
  // property's operating bank account (mirrors Buildium's auto-allocation).
  propertyId?: number | null;
  onUpdated?: (status: BillStatus) => void;
}

const formatCents = (cents: number) =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const today = () => new Date().toISOString().slice(0, 10);

const STATUS_STYLES: Record<string, string> = {
  unpaid: "bg-gray-100 text-gray-700 border-gray-200",
  partial: "bg-amber-100 text-amber-800 border-amber-200",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  void: "bg-red-100 text-red-800 border-red-200",
};

function StatusChip({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? STATUS_STYLES.unpaid;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}
    >
      {status === "unpaid"
        ? "Unpaid"
        : status === "partial"
          ? "Partial"
          : status === "paid"
            ? "Paid"
            : "Void"}
    </span>
  );
}

export default function BillPaymentManager({
  open,
  onOpenChange,
  billId,
  billLabel,
  propertyId,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [status, setStatus] = useState<BillStatus | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(today());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("check");
  // qboBankId is the QBO account id (string) of the selected "Pay From" bank
  // or credit card account. Sent to backend as paid_from_account_id.
  const [qboBankId, setQboBankId] = useState<string>("");
  const [accountCategory, setAccountCategory] = useState<AccountCategory>("");
  const [reference, setReference] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset on close
  useEffect(() => {
    if (!open) {
      setPayments([]);
      setStatus(null);
      setShowForm(false);
      setAmount("");
      setPaymentDate(today());
      setPaymentMethod("check");
      setQboBankId("");
      setAccountCategory("");
      setReference("");
      setMemo("");
      setErrors({});
    }
  }, [open]);

  // Initial fetch when opened with a bill id. Pulls payment list + bill
  // status, plus the local bank accounts (sourced from the Buildium sync) for
  // the "Pay from" dropdown. If propertyId is known, also fetch the property
  // so we can pre-fill its operating bank account.
  useEffect(() => {
    if (!open || !billId) return;
    setLoading(true);
    Promise.all([
      accountingAPI.listBillPayments(billId),
      fetchJSON("/accounting/chart-of-accounts/bank-accounts").catch(() => ({
        accounts: [],
      })),
    ])
      .then(([list, banks]: any[]) => {
        setPayments(list?.payments ?? []);
        setStatus(list?.bill ?? null);
        const rawList = banks?.accounts ?? banks ?? [];
        // Use bank_accounts.id (surfaced as `local_account_id` — the API's
        // top-level `id` is the QBO account id, not a FK target). This is
        // what bill_payments.paid_from_account_id references.
        const bankList: BankAccount[] = (Array.isArray(rawList) ? rawList : [])
          .filter((a: any) => a.active !== false && (a.local_account_id || a.id))
          .map((a: any) => ({
            id: String(a.local_account_id || a.id),
            name: a.fully_qualified_name || a.name,
            account_type: a.account_type,
            active: a.active,
          }));
        setBankAccounts(bankList);
      })
      .catch((err: any) =>
        toast.error(err?.message || "Failed to load payments"),
      )
      .finally(() => setLoading(false));
  }, [open, billId, propertyId]);

  const remaining = status ? status.remaining_cents : 0;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const dollars = Number.parseFloat(amount);
    if (!amount || Number.isNaN(dollars) || dollars <= 0) {
      e.amount = "Enter a valid amount";
    } else if (Math.round(dollars * 100) > remaining) {
      e.amount = `Cannot exceed remaining ${formatCents(remaining)}`;
    } else if (Math.round(dollars * 100) !== remaining) {
      // v1 supports full-balance payments only; the Buildium endpoint we use
      // doesn't take per-line amounts. Block partial payments at the form so
      // we don't bother the server with rejections.
      e.amount = `v1 supports full-balance payments only (${formatCents(remaining)})`;
    }
    if (!paymentDate) e.paymentDate = "Required";
    if (!paymentMethod) e.paymentMethod = "Required";
    if (!qboBankId) {
      e.bank = "Select a bank or credit card account";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRecord = async () => {
    if (!billId || !validate()) return;
    setSubmitting(true);
    try {
      const cents = Math.round(Number.parseFloat(amount) * 100);
      const res: any = await accountingAPI.recordBillPayment(billId, {
        amount_cents: cents,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        // bank_accounts.id (int). The service uses this to look up the row's
        // qbo_account_id when pushing the BillPayment to QBO.
        paid_from_account_id: Number.parseInt(qboBankId, 10),
        account_category: accountCategory || undefined,
        reference_number: reference || undefined,
        memo: memo || undefined,
      });
      const bankName =
        bankAccounts.find((b) => b.id === qboBankId)?.name || "bank";
      const checkNo = res?.payment?.check_number;
      toast.success(
        checkNo
          ? `Payment recorded. Check #${checkNo} from ${bankName}.`
          : `Payment recorded from ${bankName}.`,
      );
      // Refresh
      const list: any = await accountingAPI.listBillPayments(billId);
      setPayments(list?.payments ?? []);
      setStatus(list?.bill ?? null);
      if (list?.bill && onUpdated) onUpdated(list.bill);
      // Reset form
      setShowForm(false);
      setAmount("");
      setReference("");
      setMemo("");
      setErrors({});
    } catch (err: any) {
      toast.error(err?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoid = async (paymentId: number) => {
    if (!billId) return;
    if (
      !window.confirm(
        "Void this payment? A reversing journal entry will be posted to Buildium. Note: the original bill will continue to show as 'Paid' in Buildium's bills list — adjust there if needed.",
      )
    )
      return;
    try {
      const res: any = await accountingAPI.voidBillPayment(billId, paymentId);
      toast.success("Payment voided. Reversing journal entry posted to Buildium.");
      const list: any = await accountingAPI.listBillPayments(billId);
      setPayments(list?.payments ?? []);
      setStatus(list?.bill ?? res?.bill ?? null);
      if ((list?.bill || res?.bill) && onUpdated) onUpdated(list?.bill ?? res.bill);
    } catch (err: any) {
      toast.error(err?.message || "Failed to void payment");
    }
  };

  const canRecord =
    status && status.payment_status !== "paid" && status.payment_status !== "void";

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={billLabel ? `Payments — ${billLabel}` : "Bill Payments"}
      size="xl"
    >
      {loading ? (
        <div className="py-12 flex items-center justify-center text-sm text-gray-500">
          <span className="w-4 h-4 mr-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          Loading payments…
        </div>
      ) : !status ? (
        <div className="py-12 text-center text-sm text-gray-500">
          No bill loaded.
        </div>
      ) : (
        <div className="space-y-5">
          {/* Status summary */}
          <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusChip status={status.payment_status} />
                {status.markup_percent > 0 && (
                  <span className="text-xs text-gray-500">
                    {status.markup_percent}% markup
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Remaining</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCents(status.remaining_cents)}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-gray-500">Bill total</div>
                <div className="font-medium text-gray-900">
                  {formatCents(status.amount_cents)}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Paid</div>
                <div className="font-medium text-gray-900">
                  {formatCents(status.paid_amount_cents)}
                </div>
              </div>
              {status.invoice_amount_cents !== status.amount_cents && (
                <div>
                  <div className="text-gray-500">Client invoice</div>
                  <div className="font-medium text-gray-900">
                    {formatCents(status.invoice_amount_cents)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payments list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">
                Payments ({payments.length})
              </h3>
              {canRecord && !showForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(true);
                    if (!amount && status.remaining_cents > 0) {
                      setAmount((status.remaining_cents / 100).toFixed(2));
                    }
                  }}
                  className="px-3 py-1.5 bg-[#013764] text-white text-xs font-medium rounded-md hover:bg-[#003a73]"
                >
                  Record Payment
                </button>
              )}
            </div>
            {payments.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-md">
                No payments recorded yet.
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-left">Method</th>
                      <th className="px-3 py-2 text-left">Bank</th>
                      <th className="px-3 py-2 text-left">Check #</th>
                      <th className="px-3 py-2 text-left">Buildium</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((p) => {
                      const voided = !!p.voided_at;
                      return (
                        <tr
                          key={p.id}
                          className={voided ? "text-gray-400 line-through" : ""}
                        >
                          <td className="px-3 py-2">
                            {p.payment_date?.slice(0, 10)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatCents(p.amount_cents)}
                          </td>
                          <td className="px-3 py-2 capitalize">
                            {p.payment_method.replace("_", " ")}
                          </td>
                          <td className="px-3 py-2">
                            {p.account_name || (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {p.check_number || "—"}
                          </td>
                          <td className="px-3 py-2">
                            {p.buildium_synced_at ? (
                              <span className="text-emerald-600 text-xs">
                                Synced
                              </span>
                            ) : p.buildium_bill_payment_id ? (
                              <span className="text-blue-600 text-xs">
                                Pulled
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {!voided && (
                              <button
                                type="button"
                                onClick={() => handleVoid(p.id)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Void
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Record-payment form */}
          {showForm && (
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-900">
                Record New Payment
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <ModalField label="Amount (USD)">
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={errors.amount ? "border-red-500" : ""}
                  />
                  {errors.amount && (
                    <p className="text-xs text-red-600 mt-1">{errors.amount}</p>
                  )}
                </ModalField>
                <ModalField label="Payment Date">
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className={errors.paymentDate ? "border-red-500" : ""}
                  />
                </ModalField>
                <ModalField label="Method">
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as PaymentMethod)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="check">Check</option>
                    <option value="ach">ACH</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </ModalField>
                <ModalField label="Pay From">
                  <select
                    value={qboBankId}
                    onChange={(e) => setQboBankId(e.target.value)}
                    className={
                      "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 " +
                      (errors.bank ? "border-red-500" : "border-gray-300")
                    }
                  >
                    <option value="">— Select QBO account —</option>
                    {bankAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                        {a.account_type ? ` (${a.account_type})` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.bank && (
                    <p className="text-xs text-red-600 mt-1">{errors.bank}</p>
                  )}
                  {bankAccounts.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No QBO bank or credit card accounts cached. Run "Sync
                      Chart of Accounts" on the QBO settings page.
                    </p>
                  )}
                </ModalField>
                <ModalField label="Reference Number (optional)">
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Used for non-check methods"
                  />
                </ModalField>
                <ModalField label="Check Number">
                  <Input
                    value="(not used in QBO mode)"
                    disabled
                    className="text-gray-400 italic"
                  />
                </ModalField>
              </div>
              <ModalField label="Memo">
                <Textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={2}
                />
              </ModalField>
            </div>
          )}
        </div>
      )}

      <div className="flex w-full items-center justify-between mt-6 gap-2.5">
        {showForm ? (
          <>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setErrors({});
              }}
              disabled={submitting}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 min-h-9 text-[#303030] hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRecord}
              disabled={submitting}
              className="rounded-lg bg-[#013764] px-3 py-2 min-h-9 text-white font-medium hover:bg-[#003a73] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Recording…" : "Record Payment"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 min-h-9 text-[#303030] hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg bg-[#013764] px-3 py-2 min-h-9 text-white font-medium hover:bg-[#003a73]"
            >
              Done
            </button>
          </>
        )}
      </div>
    </ModalTemplate>
  );
}
