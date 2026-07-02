import { useEffect, useMemo, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJSON, authFetch } from "@/api/fetchJSON";
import { toast } from "sonner";

// Same shapes as PayBillModal — kept in sync intentionally.
interface PaymentAccount {
  qbo_account_id: string;
  name: string;
  qbo_account_type: string; // "Bank" or "Credit Card"
}

interface BuildiumPaymentAccount {
  buildium_account_id: number;
  name: string;
  type: string;
}

export interface BatchPayBill {
  id: number;
  vendorName: string;
  propertyName: string;
  referenceNumber?: string;
  // Outstanding balance to pay in full — no per-bill amount editing in batch mode.
  amountDueCents: number;
  // All bills passed in must share the same group ('C' vs anything else) —
  // the caller (Bills.tsx) enforces this via the row-selection lock.
  propertyType?: string | null;
  vendorId?: number;
}

interface BatchPayResult {
  status: "pending" | "success" | "error";
  message?: string;
}

interface BatchPayBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bills: BatchPayBill[];
  // Called once the user dismisses the modal after a run completes — the
  // caller should clear its selection and refetch the bill list.
  onDone?: () => void;
}

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function BatchPayBillModal({
  open,
  onOpenChange,
  bills,
  onDone,
}: BatchPayBillModalProps) {
  const isConcierge = bills[0]?.propertyType === "C";
  const totalCents = useMemo(
    () => bills.reduce((sum, b) => sum + b.amountDueCents, 0),
    [bills],
  );

  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [buildiumAccounts, setBuildiumAccounts] = useState<BuildiumPaymentAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountQBOID, setAccountQBOID] = useState<string | null>(null);
  const [buildiumAccountID, setBuildiumAccountID] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "check">("transfer");
  const [txnDate, setTxnDate] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<Map<number, BatchPayResult>>(new Map());

  useEffect(() => {
    if (!open) {
      setAccountQBOID(null);
      setBuildiumAccountID(null);
      setPaymentMethod("transfer");
      setTxnDate("");
      setMemo("");
      setError(null);
      setSubmitting(false);
      setDone(false);
      setResults(new Map());
      return;
    }
    setTxnDate(todayISO());

    let cancelled = false;
    setLoadingAccounts(true);
    const endpoint = isConcierge ? "/payment-accounts" : "/buildium/payment-accounts";
    fetchJSON(endpoint)
      .then((res) => {
        if (cancelled) return;
        const raw = Array.isArray(res?.accounts) ? res.accounts : [];
        if (isConcierge) {
          const list = raw as PaymentAccount[];
          setAccounts(list);
          if (list.length === 1) setAccountQBOID(list[0].qbo_account_id);
        } else {
          const list = raw as BuildiumPaymentAccount[];
          setBuildiumAccounts(list);
          if (list.length === 1) setBuildiumAccountID(list[0].buildium_account_id);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError("Failed to load payment accounts: " + (err?.message ?? String(err)));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingAccounts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, isConcierge]);

  // Check payments require a Bank account (backend enforces this too) — only
  // offer Bank-type accounts in the picker once "check" is selected so a
  // whole batch doesn't fail one-by-one on a bad account pick.
  const usingCheck = isConcierge && paymentMethod === "check";
  const selectableAccounts = usingCheck
    ? accounts.filter((a) => a.qbo_account_type === "Bank")
    : accounts;

  const successCount = useMemo(
    () => Array.from(results.values()).filter((r) => r.status === "success").length,
    [results],
  );
  const errorCount = useMemo(
    () => Array.from(results.values()).filter((r) => r.status === "error").length,
    [results],
  );

  const handleSubmit = async () => {
    setError(null);
    if (isConcierge && !accountQBOID) {
      setError("Please choose a Pay From account.");
      return;
    }
    if (!isConcierge && !buildiumAccountID) {
      setError("Please choose a Pay From account.");
      return;
    }
    if (!txnDate) {
      setError("Payment date is required.");
      return;
    }

    setSubmitting(true);
    const initial = new Map<number, BatchPayResult>();
    bills.forEach((b) => initial.set(b.id, { status: "pending" }));
    setResults(new Map(initial));

    for (const bill of bills) {
      try {
        const res = await authFetch(`/vendors/bills/${bill.id}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(isConcierge
              ? { payment_account_qbo_id: accountQBOID }
              : { buildium_account_id: buildiumAccountID }),
            amount_cents: bill.amountDueCents,
            txn_date: txnDate,
            memo: memo || undefined,
            payment_method: usingCheck ? "check" : "transfer",
          }),
        });
        if (!res.ok) {
          let message = `Payment failed (status ${res.status}).`;
          try {
            const body = await res.json();
            if (body?.error) message = String(body.error);
          } catch {
            const text = await res.text().catch(() => "");
            if (text) message = text;
          }
          setResults((prev) => new Map(prev).set(bill.id, { status: "error", message }));
          continue;
        }
        setResults((prev) =>
          new Map(prev).set(bill.id, {
            status: "success",
            message: usingCheck ? "Queued for printing" : "Paid",
          }),
        );
      } catch (err: any) {
        setResults((prev) =>
          new Map(prev).set(bill.id, {
            status: "error",
            message: err?.message ?? String(err),
          }),
        );
      }
    }

    setSubmitting(false);
    setDone(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    if (done) onDone?.();
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
      title={`Pay ${bills.length} Bill${bills.length === 1 ? "" : "s"}`}
      size="sm"
      footer={
        done ? (
          <button
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-button-primary)" }}
          >
            Done
          </button>
        ) : (
          <ModalButtons
            onCancel={() => onOpenChange(false)}
            onConfirm={handleSubmit}
            cancelLabel="Cancel"
            confirmLabel={submitting ? "Paying…" : `Pay ${bills.length} Bill${bills.length === 1 ? "" : "s"}`}
            cancelDisabled={submitting}
            confirmDisabled={submitting}
          />
        )
      }
    >
      <div className="text-sm text-[#717179] mb-4">
        {isConcierge ? "Concierge bills — will post to QBO + Buildium." : "Non-concierge bills — will post to Buildium only."}
      </div>

      <div className="rounded-md border border-[#DADADA] divide-y divide-[#DADADA] mb-4 max-h-48 overflow-y-auto">
        {bills.map((b) => {
          const result = results.get(b.id);
          return (
            <div key={b.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="text-[#303030] font-medium truncate">
                  {b.vendorName}
                  {b.referenceNumber ? <span className="text-[#717179] font-normal"> · Ref {b.referenceNumber}</span> : null}
                </div>
                <div className="text-xs text-[#717179] truncate">{b.propertyName}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[#303030]">${(b.amountDueCents / 100).toFixed(2)}</span>
                {result?.status === "pending" && <span className="text-xs text-[#717179]">Paying…</span>}
                {result?.status === "success" && <span className="text-xs text-green-600">{result.message ?? "Paid"}</span>}
                {result?.status === "error" && (
                  <span className="text-xs text-red-600" title={result.message}>
                    Failed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-sm text-[#303030] mb-4 flex justify-between">
        <span>Total due</span>
        <span className="font-medium">${(totalCents / 100).toFixed(2)}</span>
      </div>

      {done ? (
        <div className="rounded-md border border-[#DADADA] bg-gray-50 px-3 py-2 text-sm text-[#303030]">
          {successCount} of {bills.length} paid.
          {errorCount > 0 && (
            <div className="text-red-600 mt-1">
              {errorCount} failed — see details above. Failed bills stay unpaid and can be retried.
            </div>
          )}
        </div>
      ) : (
        <>
          {isConcierge && (
            <div style={{ marginBottom: 12 }}>
              <FieldShell label="Payment Method" htmlFor="batch-pay-method">
                <div id="batch-pay-method" className="flex items-center gap-4 text-sm">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="batch-pay-method"
                      value="transfer"
                      checked={paymentMethod === "transfer"}
                      onChange={() => setPaymentMethod("transfer")}
                      disabled={submitting}
                    />
                    <span>Bank transfer / Card</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="batch-pay-method"
                      value="check"
                      checked={paymentMethod === "check"}
                      onChange={() => setPaymentMethod("check")}
                      disabled={submitting}
                    />
                    <span>Check (print later)</span>
                  </label>
                </div>
                {paymentMethod === "check" && (
                  <div className="text-xs text-[#717179] mt-1">
                    Each bill will be queued for printing. Bills show as paid once printed from Accounting → Print Checks.
                  </div>
                )}
              </FieldShell>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <FieldShell label="Pay From" htmlFor="batch-pay-account">
              {isConcierge ? (
                <select
                  id="batch-pay-account"
                  value={accountQBOID ?? ""}
                  onChange={(e) => setAccountQBOID(e.target.value || null)}
                  disabled={loadingAccounts || submitting}
                  className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm outline-none focus:border-[#013764]"
                >
                  <option value="">{loadingAccounts ? "Loading…" : "Select an account"}</option>
                  {selectableAccounts.map((a) => (
                    <option key={a.qbo_account_id} value={a.qbo_account_id}>
                      {a.name} ({a.qbo_account_type})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  id="batch-pay-account"
                  value={buildiumAccountID ?? ""}
                  onChange={(e) => setBuildiumAccountID(e.target.value ? Number(e.target.value) : null)}
                  disabled={loadingAccounts || submitting}
                  className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm outline-none focus:border-[#013764]"
                >
                  <option value="">{loadingAccounts ? "Loading…" : "Select an account"}</option>
                  {buildiumAccounts.map((a) => (
                    <option key={a.buildium_account_id} value={a.buildium_account_id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              )}
              {isConcierge && usingCheck && selectableAccounts.length === 0 && !loadingAccounts && (
                <div className="text-xs text-red-600 mt-1">
                  No Bank accounts available for check payments.
                </div>
              )}
            </FieldShell>
          </div>

          <div style={{ marginBottom: 12 }}>
            <FieldShell label="Payment Date" htmlFor="batch-pay-date">
              <Input
                id="batch-pay-date"
                type="date"
                value={txnDate}
                onChange={(e) => setTxnDate(e.target.value)}
                disabled={submitting}
              />
            </FieldShell>
          </div>

          <div style={{ marginBottom: 12 }}>
            <FieldShell label="Memo (optional)" htmlFor="batch-pay-memo">
              <Textarea
                id="batch-pay-memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Applied to every bill in this batch"
                autoGrow
                disabled={submitting}
              />
            </FieldShell>
          </div>
        </>
      )}

      {error && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </ModalTemplate>
  );
}
