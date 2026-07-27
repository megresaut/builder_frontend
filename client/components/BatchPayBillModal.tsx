import { useEffect, useMemo, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJSON, authFetch } from "@/api/fetchJSON";
import { toast } from "sonner";
import {
  allocateCredits,
  allocatedCentsForBill,
  maxApplicableCents,
  setCreditAmount,
  toggleCredit,
  totalUnallocatedCents,
  type CreditAllocation,
} from "./batchPayCreditAllocation";

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

// Spendable vendor credit as returned by GET /vendor-credits?status=available,
// which is open plus partially applied. Credits are concierge-only — the pay
// endpoint rejects them for non-Concierge bills.
interface OpenCredit {
  id: number;
  vendor_id: number;
  // Face value. What is actually spendable is remaining_cents.
  amount_cents: number;
  remaining_cents: number;
  date: string;
  memo: string;
}

export interface BatchPayBill {
  id: number;
  vendorName: string;
  propertyName: string;
  referenceNumber?: string;
  // Outstanding balance to pay in full — no per-bill amount editing in batch mode.
  amountDueCents: number;
  // Platform total (bills.amount_cents) and cached QBO bill total. When they
  // disagree on a concierge bill, the systems have diverged — the backend
  // refuses the payment (409 qbo_total_mismatch), so surface it up front and
  // block the batch instead of failing one row mid-run.
  amountCents?: number;
  qboTotalCents?: number;
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
  // Concierge bills whose platform total disagrees with the QBO bill total.
  // The backend rejects these (409 qbo_total_mismatch); block the whole batch
  // so one bad bill doesn't fail silently in the middle of a run.
  const mismatchedBills = useMemo(
    () =>
      isConcierge
        ? bills.filter(
            (b) =>
              b.amountCents != null &&
              b.qboTotalCents != null &&
              b.amountCents !== b.qboTotalCents,
          )
        : [],
    [bills, isConcierge],
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
  // Vendor credits (concierge-only). A credit may be split across several bills,
  // so allocations are (credit, bill, amount) rows rather than a single mapping.
  const [openCredits, setOpenCredits] = useState<OpenCredit[]>([]);
  const [allocations, setAllocations] = useState<CreditAllocation[]>([]);

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
      setOpenCredits([]);
      setAllocations([]);
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

    // One request covers every vendor in the batch — the endpoint returns all
    // open credits with their vendor_id, so filter down to the batch here and
    // seed the allocation in the same pass (keeps `bills` out of the deps).
    if (isConcierge) {
      const vendorIDs = new Set(
        bills.map((b) => b.vendorId).filter((v): v is number => v != null),
      );
      fetchJSON("/vendor-credits?status=available")
        .then((res) => {
          if (cancelled) return;
          const all: OpenCredit[] = Array.isArray(res?.credits) ? res.credits : [];
          const mine = all.filter(
            (c) => vendorIDs.has(c.vendor_id) && c.remaining_cents > 0,
          );
          setOpenCredits(mine);
          setAllocations(allocateCredits(bills, mine));
        })
        // Credits are an optimisation, not a prerequisite — a failure here must
        // not block the batch. Same posture as PayBillModal.
        .catch(() => {});
    }

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

  const creditsAppliedCents = useMemo(
    () => allocations.reduce((sum, a) => sum + a.amountCents, 0),
    [allocations],
  );
  const netCashCents = totalCents - creditsAppliedCents;
  // Credit this batch cannot absorb — the bills simply don't owe enough. Shown so
  // a leftover balance reads as expected rather than as a silent drop.
  const unallocatedCents = useMemo(
    () => totalUnallocatedCents(allocations, openCredits),
    [allocations, openCredits],
  );
  // Credits that actually got consumed — a failed bill leaves its credits
  // untouched, so the run summary must not count them.
  const creditsPaidCents = useMemo(
    () =>
      bills.reduce(
        (sum, b) =>
          results.get(b.id)?.status === "success"
            ? sum + allocatedCentsForBill(allocations, b.id)
            : sum,
        0,
      ),
    [bills, results, allocations],
  );

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
    if (mismatchedBills.length > 0) {
      setError(
        "Some bills have a QBO total that differs from the platform amount — resolve the mismatch before paying.",
      );
      return;
    }
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

    // Set when any bill fails because our cached QBO balance was stale — the
    // backend refreshes the cache as part of the rejected attempt, so a retry
    // after reload will submit the corrected amount.
    let staleBalanceFailure = false;
    // Set when a credit was consumed elsewhere between load and submit.
    let staleCreditFailure = false;

    // Freeze the allocation for the run so per-row results describe what the
    // user actually saw when they hit Pay.
    const frozen = allocations;

    for (const bill of bills) {
      const billCredits = frozen.filter((a) => a.billId === bill.id);
      const creditCents = billCredits.reduce((sum, a) => sum + a.amountCents, 0);
      // Net cash after credits. May legitimately be 0 when credits cover the
      // bill outright — the pay endpoint permits amount_cents=0 whenever
      // applied_credits is non-empty.
      const cashCents = bill.amountDueCents - creditCents;
      try {
        const res = await authFetch(`/vendors/bills/${bill.id}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(isConcierge
              ? { payment_account_qbo_id: accountQBOID }
              : { buildium_account_id: buildiumAccountID }),
            amount_cents: cashCents,
            txn_date: txnDate,
            memo: memo || undefined,
            payment_method: usingCheck ? "check" : "transfer",
            ...(billCredits.length > 0
              ? {
                  applied_credits: billCredits.map((a) => ({
                    vendor_credit_id: a.creditId,
                    amount_cents: a.amountCents,
                  })),
                }
              : {}),
          }),
        });
        if (!res.ok) {
          let message = `Payment failed (status ${res.status}).`;
          let code: string | null = null;
          try {
            const body = await res.json();
            if (body?.error) message = String(body.error);
            if (body?.code) code = String(body.code);
          } catch {
            const text = await res.text().catch(() => "");
            if (text) message = text;
          }
          if (code === "amount_exceeds_balance" || code === "qbo_total_mismatch") {
            staleBalanceFailure = true;
          }
          if (code === "credit_not_open") {
            staleCreditFailure = true;
          }
          // The handler validates and consumes credits inside the same request,
          // so a rejected bill leaves its credits open and re-appliable.
          if (billCredits.length > 0) {
            message += " Credits were not consumed.";
          }
          setResults((prev) => new Map(prev).set(bill.id, { status: "error", message }));
          continue;
        }
        const paidLabel = usingCheck ? "Queued for printing" : "Paid";
        setResults((prev) =>
          new Map(prev).set(bill.id, {
            status: "success",
            message:
              creditCents > 0
                ? `${paidLabel} · $${(creditCents / 100).toFixed(2)} credit applied`
                : paidLabel,
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

    if (staleBalanceFailure) {
      toast.info(
        "Some bills had an out-of-date QBO balance — it has been refreshed. Close this dialog and retry the failed bills; the amounts will be up to date.",
        { duration: 8000 },
      );
    }
    if (staleCreditFailure) {
      toast.info(
        "A vendor credit was already applied elsewhere. Close this dialog and retry the failed bills — the available credits will be reloaded.",
        { duration: 8000 },
      );
    }
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
            confirmDisabled={submitting || mismatchedBills.length > 0}
          />
        )
      }
    >
      <div className="text-sm text-[#717179] mb-4">
        {isConcierge ? "Concierge bills — will post to QBO + Buildium." : "Non-concierge bills — will post to Buildium only."}
      </div>

      <div className="rounded-md border border-[#DADADA] divide-y divide-[#DADADA] mb-4 max-h-72 overflow-y-auto">
        {bills.map((b) => {
          const result = results.get(b.id);
          const mismatch =
            isConcierge &&
            b.amountCents != null &&
            b.qboTotalCents != null &&
            b.amountCents !== b.qboTotalCents;
          // Every open credit for this bill's vendor — assigned here, assigned to
          // a sibling bill, or unassigned. All three are shown so a credit can be
          // moved without hunting for it.
          const vendorCredits =
            b.vendorId != null ? openCredits.filter((c) => c.vendor_id === b.vendorId) : [];
          const billCreditCents = allocatedCentsForBill(allocations, b.id);
          return (
            <div key={b.id} className="px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[#303030] font-medium truncate">
                    {b.vendorName}
                    {b.referenceNumber ? <span className="text-[#717179] font-normal"> · Ref {b.referenceNumber}</span> : null}
                  </div>
                  <div className="text-xs text-[#717179] truncate">{b.propertyName}</div>
                  {mismatch && (
                    <div className="text-xs text-amber-700">
                      QBO total ${((b.qboTotalCents ?? 0) / 100).toFixed(2)} ≠ platform ${((b.amountCents ?? 0) / 100).toFixed(2)}
                    </div>
                  )}
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

              {vendorCredits.length > 0 && !done && (
                <div className="mt-2 pl-3 border-l-2 border-[#EDEDED] space-y-1">
                  {vendorCredits.map((c) => {
                    const applied = allocations.find(
                      (a) => a.creditId === c.id && a.billId === b.id,
                    );
                    const max = maxApplicableCents(allocations, openCredits, b, c.id);
                    // Nothing left to give this bill, and nothing already on it.
                    const selectable = max > 0 || applied != null;
                    // Where else this credit is being spent in the batch.
                    const elsewhereCents = allocations
                      .filter((a) => a.creditId === c.id && a.billId !== b.id)
                      .reduce((sum, a) => sum + a.amountCents, 0);
                    return (
                      <div key={c.id} className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={applied != null}
                          disabled={submitting || !selectable}
                          onChange={() =>
                            setAllocations((prev) =>
                              toggleCredit(prev, openCredits, bills, c.id, b.id),
                            )
                          }
                        />
                        <span className={selectable ? "text-[#303030]" : "text-[#A0A0A0]"}>
                          ${(c.remaining_cents / 100).toFixed(2)} credit
                        </span>
                        {applied != null && (
                          <span className="flex items-center gap-1">
                            <span className="text-[#717179]">apply</span>
                            <Input
                              type="text"
                              inputMode="decimal"
                              aria-label={`Amount of credit ${c.id} to apply to bill ${b.id}`}
                              className="h-6 w-24 px-2 py-0 text-xs"
                              value={(applied.amountCents / 100).toFixed(2)}
                              disabled={submitting}
                              onChange={(e) => {
                                const parsed = Number(e.target.value.replace(/[^0-9.]/g, ""));
                                const cents = Number.isFinite(parsed)
                                  ? Math.round(parsed * 100)
                                  : 0;
                                setAllocations((prev) =>
                                  setCreditAmount(prev, openCredits, bills, c.id, b.id, cents),
                                );
                              }}
                            />
                          </span>
                        )}
                        <span className="text-[#717179] truncate">
                          {c.date}
                          {c.memo ? ` · ${c.memo}` : ""}
                          {elsewhereCents > 0
                            ? ` · $${(elsewhereCents / 100).toFixed(2)} on other bills`
                            : ""}
                        </span>
                      </div>
                    );
                  })}
                  {billCreditCents > 0 && (
                    <div className="text-xs text-[#717179]">
                      → net cash ${((b.amountDueCents - billCreditCents) / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-sm text-[#303030] mb-4 space-y-1">
        <div className="flex justify-between">
          <span>Total due</span>
          <span className={creditsAppliedCents > 0 ? "" : "font-medium"}>
            ${(totalCents / 100).toFixed(2)}
          </span>
        </div>
        {creditsAppliedCents > 0 && (
          <>
            <div className="flex justify-between text-[#717179]">
              <span>Credits applied</span>
              <span>−${(creditsAppliedCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Net cash</span>
              <span className="font-medium">${(netCashCents / 100).toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {isConcierge && unallocatedCents > 0 && !done && (
        <div className="mb-4 rounded-md border border-[#DADADA] bg-gray-50 px-3 py-2 text-xs text-[#717179]">
          ${(unallocatedCents / 100).toFixed(2)} of available credit was not applied — these
          bills don't owe enough to absorb it. It stays on the vendor for next time.
        </div>
      )}

      {mismatchedBills.length > 0 && !done && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {mismatchedBills.length === 1 ? "1 bill has" : `${mismatchedBills.length} bills have`} a QBO
          total that doesn't match the platform amount. Payment is blocked until the totals agree —
          fix the bill in QBO (or re-edit it here), then use “Refresh from QBO” and retry.
        </div>
      )}

      {done ? (
        <div className="rounded-md border border-[#DADADA] bg-gray-50 px-3 py-2 text-sm text-[#303030]">
          {successCount} of {bills.length} paid.
          {creditsPaidCents > 0 && (
            <span> ${(creditsPaidCents / 100).toFixed(2)} in credits applied.</span>
          )}
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
