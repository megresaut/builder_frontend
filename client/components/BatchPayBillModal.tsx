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
  buildBatchPaymentPlan,
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
  // Outstanding balance. Prefills the row's amount and caps it — a row may be
  // paid down to any amount at or below this.
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
  status: "pending" | "success" | "error" | "skipped";
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

const dollars = (cents: number) => (Math.max(0, cents) / 100).toFixed(2);

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
  // Net cash per bill as typed, keyed by bill id. Held as strings so a
  // half-typed "58." isn't rewritten under the user's cursor.
  const [amounts, setAmounts] = useState<Map<number, string>>(new Map());

  // What this run will actually send: per-bill cash, credits, skips and errors.
  const plan = useMemo(
    () => buildBatchPaymentPlan(bills, amounts, allocations),
    [bills, amounts, allocations],
  );
  const rowsByBill = useMemo(
    () => new Map(plan.rows.map((r) => [r.billId, r])),
    [plan],
  );
  const payableCount = plan.payable.length;

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
      setAmounts(new Map());
      return;
    }
    setTxnDate(todayISO());
    // Prefill every row with its full balance — paying in full stays the
    // one-click default, and any row can be typed down from there.
    setAmounts(new Map(bills.map((b) => [b.id, dollars(b.amountDueCents)])));

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
          // Seeding credits lowers what has to be paid in cash, so the amount
          // fields have to follow — same reflex as the single-bill modal.
          const seeded = allocateCredits(bills, mine);
          setAllocations(seeded);
          setAmounts(
            new Map(
              bills.map((b) => [
                b.id,
                dollars(b.amountDueCents - allocatedCentsForBill(seeded, b.id)),
              ]),
            ),
          );
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

  // What the run settles in total — cash plus credits, across payable rows only.
  const payingCents = plan.totalCashCents + plan.totalCreditCents;
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
  const skippedCount = useMemo(
    () => Array.from(results.values()).filter((r) => r.status === "skipped").length,
    [results],
  );
  // Bills that were paid but not closed out — worth calling out, since "paid"
  // on its own reads as settled.
  const partialCount = useMemo(
    () =>
      plan.rows.filter(
        (r) =>
          results.get(r.billId)?.status === "success" &&
          r.totalCents < r.amountDueCents,
      ).length,
    [plan, results],
  );

  // Applying a credit reduces what has to be paid in cash. Rewrite just that
  // row's cash to the new net; the user can type it down further afterwards.
  const applyAllocations = (billId: number, next: CreditAllocation[]) => {
    setAllocations(next);
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return;
    const credited = allocatedCentsForBill(next, billId);
    setAmounts((prev) =>
      new Map(prev).set(billId, dollars(bill.amountDueCents - credited)),
    );
  };

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
    const invalid = plan.rows.find((r) => r.error !== null);
    if (invalid) {
      setError(invalid.error);
      return;
    }
    if (plan.payable.length === 0) {
      setError("Nothing to pay — every bill has been zeroed out.");
      return;
    }

    setSubmitting(true);
    const initial = new Map<number, BatchPayResult>();
    plan.rows.forEach((r) =>
      initial.set(r.billId, r.skip ? { status: "skipped" } : { status: "pending" }),
    );
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

    const rowFor = (billId: number) => plan.payable.find((r) => r.billId === billId);
    const markResult = (billId: number, result: BatchPayResult) =>
      setResults((prev) => new Map(prev).set(billId, result));
    const successMessage = (billId: number, creditCents: number) => {
      const row = rowFor(billId);
      const paidLabel = usingCheck ? "Queued for printing" : "Paid";
      const partial = row ? row.totalCents < row.amountDueCents : false;
      const parts = [
        partial && row
          ? `${paidLabel} $${dollars(row.totalCents)} of $${dollars(row.amountDueCents)}`
          : paidLabel,
      ];
      if (creditCents > 0) parts.push(`$${dollars(creditCents)} credit applied`);
      return parts.join(" · ");
    };

    // Queued/printed checks are a separate, more involved flow
    // (handlePayBillByCheck) that the batch endpoint deliberately doesn't
    // cover yet — those bills still go through the existing per-bill loop.
    // Everything else (the common case) goes through one call to
    // /vendors/bills/pay-batch, which groups same-vendor bills into one QBO
    // payment and — for whichever of those are paid in full cash — one
    // Buildium bulk payment, instead of N/N individual calls.
    if (usingCheck) {
      for (const row of plan.payable) {
        const bill = bills.find((b) => b.id === row.billId);
        if (!bill) continue;
        const billCredits = frozen.filter((a) => a.billId === bill.id);
        try {
          const res = await authFetch(`/vendors/bills/${bill.id}/pay`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payment_account_qbo_id: accountQBOID,
              amount_cents: row.cashCents,
              txn_date: txnDate,
              memo: memo || undefined,
              payment_method: "check",
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
            try {
              const body = await res.json();
              if (body?.error) message = String(body.error);
            } catch {
              const text = await res.text().catch(() => "");
              if (text) message = text;
            }
            if (billCredits.length > 0) message += " Credits were not consumed.";
            markResult(bill.id, { status: "error", message });
            continue;
          }
          markResult(bill.id, { status: "success", message: successMessage(bill.id, row.creditCents) });
        } catch (err: any) {
          markResult(bill.id, { status: "error", message: err?.message ?? String(err) });
        }
      }
    } else {
      try {
        const res = await authFetch(`/vendors/bills/pay-batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(isConcierge
              ? { payment_account_qbo_id: accountQBOID }
              : { buildium_account_id: buildiumAccountID }),
            txn_date: txnDate,
            memo: memo || undefined,
            bills: plan.payable.map((row) => {
              const billCredits = frozen.filter((a) => a.billId === row.billId);
              return {
                bill_id: row.billId,
                amount_cents: row.cashCents,
                ...(billCredits.length > 0
                  ? {
                      applied_credits: billCredits.map((a) => ({
                        vendor_credit_id: a.creditId,
                        amount_cents: a.amountCents,
                      })),
                    }
                  : {}),
              };
            }),
          }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          let message = text || `Batch payment failed (status ${res.status}).`;
          try {
            const body = JSON.parse(text);
            if (body?.error) message = String(body.error);
          } catch {
            // not JSON — keep the raw text
          }
          for (const row of plan.payable) markResult(row.billId, { status: "error", message });
        } else {
          const body = await res.json().catch(() => ({}));
          const results: Array<{ bill_id: number; status: string; message?: string }> = Array.isArray(
            body?.results,
          )
            ? body.results
            : [];
          const byBillId = new Map(results.map((r) => [r.bill_id, r]));
          for (const row of plan.payable) {
            const r = byBillId.get(row.billId);
            if (!r) {
              markResult(row.billId, { status: "error", message: "No result returned for this bill." });
              continue;
            }
            if (r.status !== "success") {
              const message = r.message ?? "Payment failed.";
              if (message.includes("amount_exceeds_balance") || message.includes("qbo_total_mismatch")) {
                staleBalanceFailure = true;
              }
              if (message.includes("credit_not_open")) {
                staleCreditFailure = true;
              }
              markResult(row.billId, { status: "error", message });
              continue;
            }
            // r.message carries a warning even on success — e.g. paid in
            // QuickBooks but Buildium wasn't updated and needs a manual
            // push. Never drop that in favor of the generic "Paid" line.
            const base = successMessage(row.billId, row.creditCents);
            markResult(row.billId, {
              status: "success",
              message: r.message ? `${base} · ${r.message}` : base,
            });
          }
        }
      } catch (err: any) {
        for (const row of plan.payable) {
          markResult(row.billId, { status: "error", message: err?.message ?? String(err) });
        }
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
            confirmLabel={
              submitting
                ? "Paying…"
                : `Pay ${payableCount} Bill${payableCount === 1 ? "" : "s"}`
            }
            cancelDisabled={submitting}
            confirmDisabled={submitting || mismatchedBills.length > 0 || plan.blocked}
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
          const row = rowsByBill.get(b.id);
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
                  {row?.error && !done && (
                    <div className="text-xs text-red-600">{row.error}</div>
                  )}
                  {row?.skip && !done && (
                    <div className="text-xs text-[#717179]">
                      Won't be paid — set an amount to include it.
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {done ? (
                    <span className="text-[#303030]">
                      ${dollars(row?.totalCents ?? b.amountDueCents)}
                    </span>
                  ) : (
                    <div className="text-right">
                      <Input
                        type="text"
                        inputMode="decimal"
                        aria-label={`Amount to pay on bill ${b.id}`}
                        className="h-7 w-24 px-2 py-0 text-sm text-right"
                        value={amounts.get(b.id) ?? ""}
                        disabled={submitting}
                        onChange={(e) =>
                          setAmounts((prev) => new Map(prev).set(b.id, e.target.value))
                        }
                      />
                      <div className="text-xs text-[#717179] mt-0.5">
                        of ${dollars(b.amountDueCents)}
                      </div>
                    </div>
                  )}
                  {result?.status === "pending" && <span className="text-xs text-[#717179]">Paying…</span>}
                  {result?.status === "skipped" && <span className="text-xs text-[#717179]">Skipped</span>}
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
                            applyAllocations(
                              b.id,
                              toggleCredit(allocations, openCredits, bills, c.id, b.id),
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
                                applyAllocations(
                                  b.id,
                                  setCreditAmount(
                                    allocations,
                                    openCredits,
                                    bills,
                                    c.id,
                                    b.id,
                                    cents,
                                  ),
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
                  {billCreditCents > 0 && row && (
                    <div className="text-xs text-[#717179]">
                      → ${dollars(row.cashCents)} cash + ${dollars(billCreditCents)} credit
                      {" = "}${dollars(row.totalCents)} of ${dollars(b.amountDueCents)}
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
          <span className={payingCents === totalCents ? "font-medium" : ""}>
            ${dollars(totalCents)}
          </span>
        </div>
        {plan.totalCreditCents > 0 && (
          <>
            <div className="flex justify-between text-[#717179]">
              <span>Credits applied</span>
              <span>−${dollars(plan.totalCreditCents)}</span>
            </div>
            <div className="flex justify-between text-[#717179]">
              <span>Net cash</span>
              <span>${dollars(plan.totalCashCents)}</span>
            </div>
          </>
        )}
        {payingCents !== totalCents && (
          <div className="flex justify-between">
            <span>Paying</span>
            <span className="font-medium">${dollars(payingCents)}</span>
          </div>
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
          {successCount} of {bills.length - skippedCount} paid
          {partialCount > 0 && ` (${partialCount} partially)`}.
          {skippedCount > 0 && ` ${skippedCount} skipped.`}
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
