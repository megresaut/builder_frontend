import { Fragment, useEffect, useState } from "react";
import PageTemplate from "@/layout/PageTemplate";
import { PageHeader } from "@/components/BillsPageHeader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  fetchReimbursementSummaries,
  fetchReimbursementBillsForUser,
  fetchReimbursementHistory,
  fetchReimbursementPayment,
  fetchPaymentAccounts,
  payReimbursement,
  type EmployeeOwedSummary,
  type ReimbursementBill,
  type ReimbursementPayment,
  type PaymentAccount,
  type PayReimbursementResult,
  type PaymentHistoryRow,
} from "@/data/reimbursements";

type TabKey = "outstanding" | "history";

const TABS: { id: TabKey; label: string }[] = [
  { id: "outstanding", label: "Outstanding" },
  { id: "history", label: "History" },
];

const STATUS_BADGE: Record<PaymentHistoryRow["status"], string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed_partial: "bg-amber-50 text-amber-800 border-amber-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  pending: "bg-slate-50 text-slate-700 border-slate-200",
};

const STATUS_LABEL: Record<PaymentHistoryRow["status"], string> = {
  completed: "Completed",
  failed_partial: "Partial failure",
  failed: "Failed",
  pending: "Pending",
};

const formatCents = (cents: number): string =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const formatDate = (iso: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const daysBetween = (iso: string): number => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  const ms = Date.now() - d.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
};

const todayYMD = (): string => new Date().toISOString().slice(0, 10);

export default function Reimbursements() {
  const [tab, setTab] = useState<TabKey>("outstanding");

  const [summaries, setSummaries] = useState<EmployeeOwedSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedUserID, setExpandedUserID] = useState<number | null>(null);
  const [billsByUser, setBillsByUser] = useState<
    Record<number, ReimbursementBill[]>
  >({});
  const [billsLoading, setBillsLoading] = useState<Record<number, boolean>>({});
  const [billsError, setBillsError] = useState<Record<number, string | null>>(
    {},
  );

  const [reimburseTarget, setReimburseTarget] = useState<{
    summary: EmployeeOwedSummary;
    bills: ReimbursementBill[];
  } | null>(null);

  const refreshSummaries = () => {
    setLoading(true);
    setError(null);
    fetchReimbursementSummaries()
      .then((rows) => setSummaries(rows))
      .catch((err) =>
        setError(err?.message || "Failed to load reimbursements"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshSummaries();
  }, []);

  const loadBillsForUser = async (
    userID: number,
  ): Promise<ReimbursementBill[]> => {
    setBillsLoading((s) => ({ ...s, [userID]: true }));
    setBillsError((s) => ({ ...s, [userID]: null }));
    try {
      const bills = await fetchReimbursementBillsForUser(userID);
      setBillsByUser((s) => ({ ...s, [userID]: bills }));
      return bills;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load bills";
      setBillsError((s) => ({ ...s, [userID]: msg }));
      return [];
    } finally {
      setBillsLoading((s) => ({ ...s, [userID]: false }));
    }
  };

  const toggleExpand = (userID: number) => {
    if (expandedUserID === userID) {
      setExpandedUserID(null);
      return;
    }
    setExpandedUserID(userID);
    if (billsByUser[userID] || billsLoading[userID]) return;
    void loadBillsForUser(userID);
  };

  const openReimburseModal = async (s: EmployeeOwedSummary) => {
    let bills = billsByUser[s.user_id];
    if (!bills) {
      bills = await loadBillsForUser(s.user_id);
    }
    if (bills.length === 0) {
      toast.error("No bills to reimburse for this employee.");
      return;
    }
    setReimburseTarget({ summary: s, bills });
  };

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        <PageHeader
          title="Reimbursements"
          description="Field-team expenses fronted on personal cards, awaiting reimbursement from AVMRE Management"
        />

        <div className="flex gap-1 border-b border-[#E5E5E5]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors relative",
                tab === t.id
                  ? "text-[#013764]"
                  : "text-[#717179] hover:text-[#303030]",
              )}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-[#013764]" />
              )}
            </button>
          ))}
        </div>

        {tab === "history" ? (
          <HistoryTab />
        ) : (
          <>
        {loading && (
          <div className="text-sm text-[#717179]">Loading…</div>
        )}
        {error && !loading && (
          <div className="text-sm text-rose-600">{error}</div>
        )}

        {!loading && !error && summaries.length === 0 && (
          <div className="text-sm text-[#717179] py-8 text-center">
            No outstanding reimbursements.
          </div>
        )}

        {!loading && !error && summaries.length > 0 && (
          <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F8F8] text-[#717179] text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Employee</th>
                  <th className="text-right px-4 py-3 font-medium">Bills</th>
                  <th className="text-right px-4 py-3 font-medium">Total Owed</th>
                  <th className="text-right px-4 py-3 font-medium">Oldest</th>
                  <th className="px-4 py-3 w-32"></th>
                  <th className="px-4 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => {
                  const expanded = expandedUserID === s.user_id;
                  const bills = billsByUser[s.user_id];
                  const isLoadingBills = billsLoading[s.user_id];
                  const billsErr = billsError[s.user_id];
                  return (
                    <Fragment key={s.user_id}>
                      <tr
                        onClick={() => toggleExpand(s.user_id)}
                        className={cn(
                          "border-t border-[#E5E5E5] cursor-pointer hover:bg-[#F8F8F8]",
                          expanded && "bg-[#F8F8F8]",
                        )}
                      >
                        <td className="px-4 py-3 font-medium text-[#303030]">
                          {s.name || s.email}
                          {s.name && (
                            <span className="ml-2 text-[#717179] font-normal">
                              {s.email}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {s.bill_count}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">
                          {formatCents(s.total_owed_cents)}
                        </td>
                        <td className="px-4 py-3 text-right text-[#717179]">
                          {daysBetween(s.oldest_bill_date)}d ago
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void openReimburseModal(s);
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#013764] text-white hover:bg-[#012a4f]"
                          >
                            Reimburse
                          </button>
                        </td>
                        <td className="px-4 py-3 text-[#717179]">
                          {expanded ? "▾" : "▸"}
                        </td>
                      </tr>
                      {expanded && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 bg-white">
                            {isLoadingBills && (
                              <div className="text-xs text-[#717179]">
                                Loading bills…
                              </div>
                            )}
                            {billsErr && (
                              <div className="text-xs text-rose-600">{billsErr}</div>
                            )}
                            {!isLoadingBills && !billsErr && bills && (
                              <BillTable bills={bills} />
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}
      </div>

      {reimburseTarget && (
        <ReimburseModal
          summary={reimburseTarget.summary}
          bills={reimburseTarget.bills}
          onClose={() => setReimburseTarget(null)}
          onSuccess={(res) => {
            setReimburseTarget(null);
            if (res.status === "completed") {
              toast.success(
                `Reimbursed ${res.bills_paid.length} bill(s) (RP-${res.reimbursement_payment_id})`,
              );
            } else if (res.status === "failed_partial") {
              toast.error(
                `Partial failure (RP-${res.reimbursement_payment_id}): ${res.failure_message || "see admin"}`,
              );
            } else {
              toast.error(
                `Reimbursement failed: ${res.failure_message || "unknown error"}`,
              );
            }
            // Refresh; the user's owed total may now be 0 (drops off the list).
            refreshSummaries();
            setBillsByUser({});
            setExpandedUserID(null);
          }}
        />
      )}
    </PageTemplate>
  );
}

function HistoryTab() {
  const [rows, setRows] = useState<PaymentHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [expandedID, setExpandedID] = useState<number | null>(null);
  const [detailByID, setDetailByID] = useState<
    Record<number, ReimbursementPayment | undefined>
  >({});
  const [detailLoading, setDetailLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchReimbursementHistory()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((e) => {
        if (!cancelled)
          setErr(e instanceof Error ? e.message : "Failed to load history");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleExpand = (id: number) => {
    if (expandedID === id) {
      setExpandedID(null);
      return;
    }
    setExpandedID(id);
    if (detailByID[id] || detailLoading[id]) return;
    setDetailLoading((s) => ({ ...s, [id]: true }));
    fetchReimbursementPayment(id)
      .then((p) => setDetailByID((s) => ({ ...s, [id]: p })))
      .catch(() => {
        // soft-fail; user can re-click
      })
      .finally(() => setDetailLoading((s) => ({ ...s, [id]: false })));
  };

  if (loading) return <div className="text-sm text-[#717179]">Loading…</div>;
  if (err) return <div className="text-sm text-rose-600">{err}</div>;
  if (rows.length === 0) {
    return (
      <div className="text-sm text-[#717179] py-8 text-center">
        No reimbursements yet.
      </div>
    );
  }

  return (
    <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-[#F8F8F8] text-[#717179] text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Date</th>
            <th className="text-left px-4 py-3 font-medium">Employee</th>
            <th className="text-right px-4 py-3 font-medium">Bills</th>
            <th className="text-left px-4 py-3 font-medium">Source</th>
            <th className="text-right px-4 py-3 font-medium">Total</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-left px-4 py-3 font-medium">Memo</th>
            <th className="px-4 py-3 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const expanded = expandedID === r.id;
            const detail = detailByID[r.id];
            const isLoadingDetail = detailLoading[r.id];
            const memo = r.memo || "—";
            return (
              <Fragment key={r.id}>
                <tr
                  onClick={() => toggleExpand(r.id)}
                  className={cn(
                    "border-t border-[#E5E5E5] cursor-pointer hover:bg-[#F8F8F8]",
                    expanded && "bg-[#F8F8F8]",
                  )}
                >
                  <td className="px-4 py-3 text-[#717179] whitespace-nowrap">
                    {formatDate(r.payment_date)}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#303030]">
                    {r.employee_name || r.employee_email}
                    <span className="ml-2 text-xs text-[#717179] font-normal">
                      RP-{r.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.bill_count}
                  </td>
                  <td className="px-4 py-3 text-[#717179]">
                    {r.source_account_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatCents(r.total_amount_cents)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 text-xs rounded-full border",
                        STATUS_BADGE[r.status],
                      )}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#717179] truncate max-w-[260px]">
                    {memo}
                  </td>
                  <td className="px-4 py-3 text-[#717179]">
                    {expanded ? "▾" : "▸"}
                  </td>
                </tr>
                {expanded && (
                  <tr>
                    <td colSpan={8} className="px-4 py-4 bg-white">
                      {isLoadingDetail && (
                        <div className="text-xs text-[#717179]">
                          Loading detail…
                        </div>
                      )}
                      {!isLoadingDetail && detail && (
                        <div className="flex flex-col gap-3">
                          {r.failure_message && (
                            <div className="text-xs text-rose-700 border border-rose-200 bg-rose-50 rounded-md px-3 py-2">
                              <strong>Failure:</strong> {r.failure_message}
                            </div>
                          )}
                          <PaymentDetailTable bills={detail.bills} />
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PaymentDetailTable({
  bills,
}: {
  bills: ReimbursementPayment["bills"];
}) {
  if (bills.length === 0) {
    return <div className="text-xs text-[#717179]">No bills.</div>;
  }
  return (
    <table className="min-w-full text-xs border border-[#E5E5E5] rounded">
      <thead className="bg-[#F8F8F8] text-[#717179] uppercase tracking-wide">
        <tr>
          <th className="text-left px-3 py-2 font-medium">Bill ID</th>
          <th className="text-left px-3 py-2 font-medium">Vendor</th>
          <th className="text-right px-3 py-2 font-medium">Amount</th>
          <th className="text-left px-3 py-2 font-medium">QBO Payment</th>
          <th className="text-left px-3 py-2 font-medium">Buildium Payment</th>
        </tr>
      </thead>
      <tbody>
        {bills.map((b) => (
          <tr key={b.bill_id} className="border-t border-[#E5E5E5]">
            <td className="px-3 py-2 text-[#303030]">#{b.bill_id}</td>
            <td className="px-3 py-2 text-[#303030]">
              {b.vendor_name || "—"}
            </td>
            <td className="px-3 py-2 text-right tabular-nums font-medium">
              {formatCents(b.amount_cents)}
            </td>
            <td className="px-3 py-2 text-[#717179] font-mono text-[11px]">
              {b.qbo_bill_payment_id || "—"}
            </td>
            <td className="px-3 py-2 text-[#717179] font-mono text-[11px]">
              {b.buildium_bill_payment_id || "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BillTable({ bills }: { bills: ReimbursementBill[] }) {
  if (bills.length === 0) {
    return <div className="text-xs text-[#717179]">No bills.</div>;
  }
  return (
    <table className="min-w-full text-xs border border-[#E5E5E5] rounded">
      <thead className="bg-[#F8F8F8] text-[#717179] uppercase tracking-wide">
        <tr>
          <th className="text-left px-3 py-2 font-medium">Date</th>
          <th className="text-left px-3 py-2 font-medium">Vendor</th>
          <th className="text-left px-3 py-2 font-medium">Property</th>
          <th className="text-left px-3 py-2 font-medium">Memo</th>
          <th className="text-right px-3 py-2 font-medium">Amount</th>
        </tr>
      </thead>
      <tbody>
        {bills.map((b) => (
          <tr key={b.bill_id} className="border-t border-[#E5E5E5]">
            <td className="px-3 py-2 text-[#717179] whitespace-nowrap">
              {formatDate(b.statement_date)}
            </td>
            <td className="px-3 py-2 text-[#303030]">
              {b.vendor_name || "—"}
            </td>
            <td className="px-3 py-2 text-[#303030]">
              {b.property_name || "—"}
            </td>
            <td className="px-3 py-2 text-[#717179] truncate max-w-[280px]">
              {b.memo || b.invoice_number || "—"}
            </td>
            <td className="px-3 py-2 text-right tabular-nums font-medium">
              {formatCents(b.amount_cents)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface ReimburseModalProps {
  summary: EmployeeOwedSummary;
  bills: ReimbursementBill[];
  onClose: () => void;
  onSuccess: (result: PayReimbursementResult) => void;
}

function ReimburseModal({ summary, bills, onClose, onSuccess }: ReimburseModalProps) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(bills.map((b) => b.bill_id)),
  );
  const [paymentDate, setPaymentDate] = useState(todayYMD());
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountID, setAccountID] = useState<number | null>(null);
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPaymentAccounts()
      .then((rows) => {
        if (cancelled) return;
        setAccounts(rows);
        // Default: first row whose name mentions "AVMRE Management",
        // otherwise the first Bank, otherwise the first row.
        const mgmt = rows.find((r) =>
          r.name.toLowerCase().includes("avmre management"),
        );
        const firstBank = rows.find((r) => r.qbo_account_type === "Bank");
        const pick = mgmt || firstBank || rows[0];
        if (pick) setAccountID(pick.coa_id);
      })
      .catch((err) =>
        setSubmitErr(err?.message || "Failed to load payment accounts"),
      )
      .finally(() => {
        if (!cancelled) setAccountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleBill = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const total = bills
    .filter((b) => selected.has(b.bill_id))
    .reduce((sum, b) => sum + b.amount_cents, 0);

  const memoPreview = `Reimbursement to ${summary.name || summary.email} — RP-{new}${memo ? " — " + memo : ""}`;

  const canSubmit =
    !submitting && selected.size > 0 && accountID != null && paymentDate;

  const onSubmit = async () => {
    if (!canSubmit || accountID == null) return;
    setSubmitting(true);
    setSubmitErr(null);
    try {
      const result = await payReimbursement({
        reimbursee_user_id: summary.user_id,
        bill_ids: Array.from(selected),
        payment_date: paymentDate,
        source_account_id: accountID,
        memo: memo.trim() || undefined,
      });
      onSuccess(result);
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : "Reimbursement failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[#E5E5E5]">
          <h2 className="text-lg font-semibold text-[#303030]">
            Reimburse {summary.name || summary.email}
          </h2>
          <p className="text-xs text-[#717179] mt-1">
            Pays the selected bills via QBO + Buildium. One payment per bill,
            correlated by an RP-id memo prefix.
          </p>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4">
          <div>
            <div className="text-xs font-medium text-[#525252] mb-2">
              Bills to reimburse
            </div>
            <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
              <table className="min-w-full text-xs">
                <thead className="bg-[#F8F8F8] text-[#717179] uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 w-8"></th>
                    <th className="text-left px-3 py-2 font-medium">Date</th>
                    <th className="text-left px-3 py-2 font-medium">Vendor</th>
                    <th className="text-right px-3 py-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((b) => (
                    <tr key={b.bill_id} className="border-t border-[#E5E5E5]">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(b.bill_id)}
                          onChange={() => toggleBill(b.bill_id)}
                        />
                      </td>
                      <td className="px-3 py-2 text-[#717179] whitespace-nowrap">
                        {formatDate(b.statement_date)}
                      </td>
                      <td className="px-3 py-2 text-[#303030]">
                        {b.vendor_name || "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">
                        {formatCents(b.amount_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[#525252]">
                Payment date
              </span>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="border border-[#E5E5E5] rounded-md px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[#525252]">
                Source account
              </span>
              <select
                value={accountID ?? ""}
                onChange={(e) => setAccountID(Number(e.target.value))}
                disabled={accountsLoading}
                className="border border-[#E5E5E5] rounded-md px-2 py-1.5 text-sm bg-white"
              >
                {accountsLoading && <option>Loading…</option>}
                {!accountsLoading && accounts.length === 0 && (
                  <option>No payment accounts found</option>
                )}
                {accounts.map((a) => (
                  <option key={a.coa_id} value={a.coa_id}>
                    {a.name} ({a.qbo_account_type})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#525252]">
              Memo (optional)
            </span>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="e.g. ACH 5/14"
              className="border border-[#E5E5E5] rounded-md px-2 py-1.5 text-sm"
            />
            <span className="text-xs text-[#717179] mt-1">
              QBO/Buildium memo: <code>{memoPreview}</code>
            </span>
          </label>

          <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-3">
            <div className="text-sm text-[#717179]">
              {selected.size} bill{selected.size === 1 ? "" : "s"} selected
            </div>
            <div className="text-lg font-semibold text-[#303030] tabular-nums">
              {formatCents(total)}
            </div>
          </div>

          {submitErr && (
            <div className="text-sm text-rose-600 border border-rose-200 bg-rose-50 rounded-md px-3 py-2">
              {submitErr}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-[#E5E5E5] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-[#717179] hover:text-[#303030]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md text-white",
              canSubmit
                ? "bg-[#013764] hover:bg-[#012a4f]"
                : "bg-[#013764]/50 cursor-not-allowed",
            )}
          >
            {submitting ? "Reimbursing…" : `Reimburse ${formatCents(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
