import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { QBOTransactionDetail } from "@/data/qboReports";
import {
  voidQBOTransaction,
  deleteQBOTransaction,
  updateQBOTransactionMemo,
} from "@/data/qboReports";

interface Props {
  open: boolean;
  loading: boolean;
  error: string | null;
  detail: QBOTransactionDetail | null;
  onClose: () => void;
  onMutated: () => void; // caller refreshes GL after void/delete/memo save
}

// ── amount formatting ────────────────────────────────────────────────────────

function fmtAmt(v: unknown): string {
  const n = Number(v);
  if (isNaN(n)) return v != null ? String(v) : "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmtDate(v: unknown): string {
  if (!v) return "—";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split("-");
    return `${m}/${d}/${y}`;
  }
  return s;
}

// ── entity parsing ───────────────────────────────────────────────────────────

interface ParsedTxn {
  type: string;
  date: string;
  num?: string;
  name: string;
  nameLabel: string;
  account?: string;
  payType?: string;
  memo: string;
  total: number | null;
  lines: ParsedLine[];
  /** QBO entity Id for mutations */
  id: string;
  /** QBO SyncToken for mutations */
  syncToken: string;
  /** What mutations QBO allows for this type */
  canVoid: boolean;
  canDelete: boolean;
  voided: boolean;
}

interface ParsedLine {
  description: string;
  account?: string;
  customer?: string;
  debitCredit?: string;
  amount: number | null;
  linkedTxn?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rootEntity(txn: Record<string, any>): Record<string, any> {
  // QBO wraps in a key like "Bill", "BillPayment", "Invoice", etc.
  for (const key of Object.keys(txn)) {
    if (key !== "time" && typeof txn[key] === "object" && txn[key] !== null) {
      return txn[key];
    }
  }
  return txn;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEntity(txnType: string, txn: Record<string, any>): ParsedTxn {
  const t = txnType.toLowerCase();
  const e = rootEntity(txn);
  const id = String(e.Id ?? e.id ?? "");
  const syncToken = String(e.SyncToken ?? "");
  const voided = e.status === "Voided" || e.PrivateNote?.includes("Voided");

  const base = {
    id, syncToken, voided,
    canVoid: false, canDelete: false,
    date: fmtDate(e.TxnDate),
    num: e.DocNumber ?? undefined,
    memo: e.PrivateNote ?? "",
    total: e.TotalAmt ?? null,
    lines: [] as ParsedLine[],
    type: txnType,
    name: "—",
    nameLabel: "Name",
    account: undefined as string | undefined,
    payType: undefined as string | undefined,
  };

  if (t.startsWith("bill payment")) {
    const lines: ParsedLine[] = (e.Line ?? []).map((l: any) => {
      const linked = (l.LinkedTxn ?? []).map((lt: any) => `${lt.TxnType} #${lt.TxnId}`).join(", ");
      return { description: linked || "Payment line", amount: l.Amount ?? null, linkedTxn: linked };
    });
    return { ...base, type: "Bill Payment", name: e.VendorRef?.name ?? "—", nameLabel: "Vendor",
      account: e.CheckPayment?.BankAccountRef?.name ?? e.CreditCardPayment?.CCAccountRef?.name,
      payType: e.PayType, lines, canVoid: true };
  }

  if (t === "bill") {
    const lines: ParsedLine[] = (e.Line ?? [])
      .filter((l: any) => l.DetailType !== "SubTotalLine")
      .map((l: any) => {
        const acct = l.AccountBasedExpenseLineDetail;
        const item = l.ItemBasedExpenseLineDetail;
        let account: string | undefined;
        let customer: string | undefined;
        if (acct) {
          account = acct.AccountRef?.name;
          customer = acct.CustomerRef?.name;
        } else if (item) {
          account = item.ItemRef?.name;
          customer = item.CustomerRef?.name;
        }
        const det = acct ?? item ?? {};
        return {
          description: l.Description || det.AccountRef?.name || det.ItemRef?.name || "Line",
          account,
          customer,
          amount: l.Amount ?? null,
        };
      });
    return { ...base, type: "Bill", name: e.VendorRef?.name ?? "—", nameLabel: "Vendor", lines, canVoid: true, canDelete: true };
  }

  if (t === "invoice") {
    const lines: ParsedLine[] = (e.Line ?? [])
      .filter((l: any) => l.DetailType !== "SubTotalLine")
      .map((l: any) => {
        const det = l.SalesItemLineDetail ?? {};
        return { description: l.Description || det.ItemRef?.name || "Line", account: det.ItemRef?.name, amount: l.Amount ?? null };
      });
    return { ...base, type: "Invoice", name: e.CustomerRef?.name ?? "—", nameLabel: "Customer",
      memo: e.PrivateNote || e.CustomerMemo?.value || "", lines, canVoid: true };
  }

  if (t === "journal entry") {
    const lines: ParsedLine[] = (e.Line ?? []).map((l: any) => {
      const det = l.JournalEntryLineDetail ?? {};
      return { description: l.Description || det.AccountRef?.name || "JE line",
        account: det.AccountRef?.name, debitCredit: det.PostingType, amount: l.Amount ?? null };
    });
    return { ...base, type: "Journal Entry", name: "—", nameLabel: "Entity", lines, canDelete: true };
  }

  if (t === "payment") {
    const lines: ParsedLine[] = (e.Line ?? []).map((l: any) => {
      const linked = (l.LinkedTxn ?? []).map((lt: any) => `${lt.TxnType} #${lt.TxnId}`).join(", ");
      return { description: linked || "Payment line", amount: l.Amount ?? null };
    });
    return { ...base, type: "Payment", name: e.CustomerRef?.name ?? "—", nameLabel: "Customer",
      account: e.DepositToAccountRef?.name, payType: e.PaymentRefNum ? `Ref: ${e.PaymentRefNum}` : undefined,
      lines, canVoid: true };
  }

  if (t === "check" || t === "expense") {
    const lines: ParsedLine[] = (e.Line ?? [])
      .filter((l: any) => l.DetailType !== "SubTotalLine")
      .map((l: any) => {
        const det = l.AccountBasedExpenseLineDetail ?? l.ItemBasedExpenseLineDetail ?? {};
        return { description: l.Description || det.AccountRef?.name || "Line", account: det.AccountRef?.name, amount: l.Amount ?? null };
      });
    return { ...base, type: "Check / Expense", name: e.EntityRef?.name ?? "—", nameLabel: "Payee",
      account: e.AccountRef?.name, memo: e.PrivateNote || e.Memo || "", lines, canDelete: true };
  }

  if (t === "vendor credit") {
    return { ...base, type: "Vendor Credit", name: e.VendorRef?.name ?? "—", nameLabel: "Vendor", canDelete: true };
  }
  if (t === "credit memo") {
    return { ...base, type: "Credit Memo", name: e.CustomerRef?.name ?? "—", nameLabel: "Customer", canVoid: true };
  }

  return { ...base };
}

// ── sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{label}</span>
      <span className="text-sm text-[#111827]">{children}</span>
    </div>
  );
}

function Badge({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "amber" | "rose" | "green" }) {
  const cls = {
    blue: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    green: "bg-green-50 text-green-700 border-green-200",
  }[color];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border", cls)}>
      {children}
    </span>
  );
}

// ── main component ───────────────────────────────────────────────────────────

export function QBOTransactionDrawer({ open, loading, error, detail, onClose, onMutated }: Props) {
  const [memoEditing, setMemoEditing] = useState(false);
  const [memoValue, setMemoValue] = useState("");
  const [actionLoading, setActionLoading] = useState<"void" | "delete" | "memo" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const memoRef = useRef<HTMLTextAreaElement>(null);

  // Reset edit state when drawer closes or detail changes
  useEffect(() => {
    if (!open || !detail) {
      setMemoEditing(false);
      setActionError(null);
      setActionSuccess(null);
    }
    if (detail) {
      const parsed = parseEntity(detail.txn_type, detail.transaction);
      setMemoValue(parsed.memo);
    }
  }, [open, detail]);

  useEffect(() => {
    if (memoEditing) memoRef.current?.focus();
  }, [memoEditing]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const parsed = detail ? parseEntity(detail.txn_type, detail.transaction) : null;

  const handleVoid = async () => {
    if (!parsed || !detail) return;
    if (!confirm(`Void this ${parsed.type} in QuickBooks? This cannot be undone.`)) return;
    setActionLoading("void");
    setActionError(null);
    try {
      await voidQBOTransaction(detail.txn_id, detail.txn_type, parsed.syncToken);
      setActionSuccess(`${parsed.type} voided successfully.`);
      onMutated();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to void transaction.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!parsed || !detail) return;
    if (!confirm(`Permanently delete this ${parsed.type} in QuickBooks? This cannot be undone.`)) return;
    setActionLoading("delete");
    setActionError(null);
    try {
      await deleteQBOTransaction(detail.txn_id, detail.txn_type, parsed.syncToken);
      setActionSuccess(`${parsed.type} deleted.`);
      onMutated();
      setTimeout(onClose, 1200);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to delete transaction.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveMemo = async () => {
    if (!parsed || !detail) return;
    setActionLoading("memo");
    setActionError(null);
    try {
      await updateQBOTransactionMemo(detail.txn_id, detail.txn_type, parsed.syncToken, memoValue);
      setMemoEditing(false);
      setActionSuccess("Memo updated.");
      onMutated();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update memo.");
    } finally {
      setActionLoading(null);
    }
  };

  const hasLines = (parsed?.lines.length ?? 0) > 0;
  const showDrCr = parsed?.lines.some((l) => l.debitCredit);
  const showAccount = parsed?.lines.some((l) => l.account);

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 bg-black/25 z-40" onClick={onClose} />

      {/* drawer */}
      <div className="fixed top-0 right-0 h-full w-[520px] max-w-full bg-white shadow-2xl z-50 flex flex-col">

        {/* ── header ── */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#E5E5E5] bg-[#F8F9FB]">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
              QBO Transaction
            </span>
            {parsed && (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[#111827]">{parsed.type}</h2>
                {parsed.voided && <Badge color="amber">Voided</Badge>}
                {!parsed.voided && parsed.type.startsWith("Bill Payment") && <Badge color="green">Paid</Badge>}
              </div>
            )}
            {parsed?.num && (
              <span className="text-xs text-[#6B7280]">#{parsed.num}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 text-[#9CA3AF] hover:text-[#374151] transition-colors rounded p-1 hover:bg-[#F3F4F6]"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── body ── */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-20 text-sm text-[#9CA3AF]">
              <span className="animate-pulse">Fetching from QuickBooks…</span>
            </div>
          )}

          {!loading && error && (
            <div className="m-5 border border-rose-200 bg-rose-50 text-rose-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && parsed && (
            <div className="flex flex-col">

              {/* ── summary card ── */}
              <div className="px-6 py-5 grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoRow label="Date">{parsed.date}</InfoRow>
                {parsed.num && <InfoRow label="Reference #">{parsed.num}</InfoRow>}
                <InfoRow label={parsed.nameLabel} className="col-span-2">{parsed.name}</InfoRow>
                {parsed.account && (
                  <InfoRow label="Account" className="col-span-2">{parsed.account}</InfoRow>
                )}
                {parsed.payType && (
                  <InfoRow label="Pay Type">{parsed.payType}</InfoRow>
                )}
                {parsed.total !== null && (
                  <InfoRow label="Total" className={parsed.num ? undefined : "col-span-2"}>
                    <span className="text-base font-semibold text-[#013764]">
                      {fmtAmt(parsed.total)}
                    </span>
                  </InfoRow>
                )}
              </div>

              {/* ── memo ── */}
              <div className="px-6 pb-5 border-b border-[#F3F4F6]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Memo</span>
                  {!memoEditing && !parsed.voided && (
                    <button
                      type="button"
                      onClick={() => setMemoEditing(true)}
                      className="text-xs text-[#013764] hover:underline font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {memoEditing ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      ref={memoRef}
                      value={memoValue}
                      onChange={(e) => setMemoValue(e.target.value)}
                      rows={3}
                      className="w-full border border-[#013764] rounded-md px-3 py-2 text-sm text-[#111827] resize-none focus:outline-none focus:ring-2 focus:ring-[#013764]/20"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSaveMemo()}
                        disabled={actionLoading === "memo"}
                        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#013764] text-white hover:bg-[#012a4d] disabled:opacity-60 transition-colors"
                      >
                        {actionLoading === "memo" ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMemoEditing(false); setMemoValue(parsed.memo); }}
                        className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#E5E5E5] text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#374151] whitespace-pre-wrap">
                    {parsed.memo || <span className="italic text-[#9CA3AF]">No memo</span>}
                  </p>
                )}
              </div>

              {/* ── line items ── */}
              {hasLines && (
                <div className="px-6 py-5 border-b border-[#F3F4F6]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] block mb-3">
                    Line Items
                  </span>
                  <div className="border border-[#E5E5E5] rounded-lg overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-[#F8F9FB]">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#6B7280] whitespace-nowrap">
                            Description
                          </th>
                          {showAccount && (
                            <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#6B7280] whitespace-nowrap">
                              Account
                            </th>
                          )}
                          {showDrCr && (
                            <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#6B7280] whitespace-nowrap">
                              Dr/Cr
                            </th>
                          )}
                          <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-[#6B7280] whitespace-nowrap">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.lines.map((line, i) => (
                          <tr key={i} className={cn("border-t border-[#F3F4F6]", i % 2 === 1 && "bg-[#FAFAFA]")}>
                            <td className="px-3 py-2.5 text-[#374151] max-w-[200px]">
                              <span className="line-clamp-2 leading-snug" title={line.description}>
                                {line.description}
                              </span>
                              {line.linkedTxn && (
                                <span className="block text-xs text-[#9CA3AF] mt-0.5">{line.linkedTxn}</span>
                              )}
                            </td>
                            {showAccount && (
                              <td className="px-3 py-2.5 text-[#6B7280] max-w-[160px]">
                                <span className="block line-clamp-2 text-xs leading-snug" title={line.account ?? ""}>
                                  {line.account ?? "—"}
                                </span>
                                {line.customer && (
                                  <span className="block text-xs text-[#013764] mt-0.5 leading-snug" title={line.customer}>
                                    {line.customer}
                                  </span>
                                )}
                              </td>
                            )}
                            {showDrCr && (
                              <td className="px-3 py-2.5">
                                <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded",
                                  line.debitCredit === "Debit" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700")}>
                                  {line.debitCredit ?? ""}
                                </span>
                              </td>
                            )}
                            <td className={cn("px-3 py-2.5 text-right tabular-nums font-medium whitespace-nowrap",
                              line.amount !== null && line.amount < 0 ? "text-rose-600" : "text-[#111827]")}>
                              {line.amount !== null ? fmtAmt(line.amount) : "—"}
                            </td>
                          </tr>
                        ))}
                        {parsed.total !== null && (
                          <tr className="border-t-2 border-[#E5E5E5] bg-[#F8F9FB]">
                            <td colSpan={(showAccount ? 1 : 0) + (showDrCr ? 1 : 0) + 1}
                              className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                              Total
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-[#013764] tabular-nums whitespace-nowrap">
                              {fmtAmt(parsed.total)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── feedback messages ── */}
              {(actionError || actionSuccess) && (
                <div className="px-6 pt-4">
                  {actionError && (
                    <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-2.5">
                      {actionError}
                    </div>
                  )}
                  {actionSuccess && !actionError && (
                    <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                      {actionSuccess}
                    </div>
                  )}
                </div>
              )}

              {/* ── source footer ── */}
              <div className="px-6 py-4 text-xs text-[#9CA3AF]">
                Source: QuickBooks Online · ID {detail?.txn_id}
              </div>
            </div>
          )}
        </div>

        {/* ── action bar ── */}
        {!loading && !error && parsed && !parsed.voided && (
          <div className="border-t border-[#E5E5E5] px-6 py-4 bg-[#F8F9FB] flex items-center gap-3">
            {parsed.canVoid && (
              <button
                type="button"
                onClick={() => void handleVoid()}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm font-medium rounded-md border border-amber-300 bg-white text-amber-700 hover:bg-amber-50 disabled:opacity-60 transition-colors"
              >
                {actionLoading === "void" ? "Voiding…" : "Void"}
              </button>
            )}
            {parsed.canDelete && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm font-medium rounded-md border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-60 transition-colors"
              >
                {actionLoading === "delete" ? "Deleting…" : "Delete"}
              </button>
            )}
            {!parsed.canVoid && !parsed.canDelete && (
              <span className="text-xs text-[#9CA3AF]">No mutations available for this transaction type.</span>
            )}
          </div>
        )}
      </div>
    </>
  );
}
