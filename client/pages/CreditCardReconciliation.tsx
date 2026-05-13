import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import StartReconciliationModal from "@/components/StartReconciliationModal";
import {
  discardReconciliation,
  fetchCreditCardAccounts,
  fetchCreditCardActivity,
  listReconciliations,
  type CCActivityStatus,
  type CreditCardAccount,
  type CreditCardActivityResponse,
  type CreditCardActivityRow,
  type ReconciliationSummary,
} from "@/data/credit-card-reconciliation";

const formatCents = (cents: number): string =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

// formatDateOnly renders an ISO timestamp (or YYYY-MM-DD) as "YYYY-MM-DD".
// We avoid `toLocaleDateString` because we want server-rendered dates to land
// in the user's wall clock day deterministically regardless of locale + TZ.
const formatDateOnly = (s: string | undefined | null): string => {
  if (!s) return "—";
  // ISO timestamps come back as "2026-05-13T17:32:11Z" — we only need the
  // date prefix. YYYY-MM-DD strings pass through unchanged.
  return s.slice(0, 10);
};

const daysAgoYMD = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    .toISOString()
    .slice(0, 10);
};

const todayYMD = (): string => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    .toISOString()
    .slice(0, 10);
};

const STATUS_BADGE: Record<CCActivityStatus, string> = {
  Reconciled: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cleared: "bg-sky-50 text-sky-700 border-sky-200",
  Uncleared: "bg-slate-50 text-slate-700 border-slate-200",
};

const STATUS_LABEL: Record<CCActivityStatus, string> = {
  Reconciled: "Reconciled",
  Cleared: "Cleared",
  Uncleared: "Uncleared",
};

export default function CreditCardReconciliation() {
  const [accounts, setAccounts] = useState<CreditCardAccount[]>([]);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [selectedID, setSelectedID] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>(daysAgoYMD(35));
  const [endDate, setEndDate] = useState<string>(todayYMD());
  const [activity, setActivity] = useState<CreditCardActivityResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Persistent reconciliation engine (Phase 1).
  const [reconciliations, setReconciliations] = useState<ReconciliationSummary[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [recsTick, setRecsTick] = useState(0);
  const navigate = useNavigate();

  // Load the account list once on mount.
  useEffect(() => {
    let cancelled = false;
    fetchCreditCardAccounts()
      .then((list) => {
        if (cancelled) return;
        setAccounts(list);
        if (list.length > 0) setSelectedID((id) => id ?? list[0].id);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setAccountsError(
            err instanceof Error ? err.message : "Failed to load accounts",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load reconciliations list whenever the selected account changes.
  useEffect(() => {
    if (selectedID == null) {
      setReconciliations([]);
      return;
    }
    let cancelled = false;
    setRecsLoading(true);
    listReconciliations(selectedID)
      .then((list) => !cancelled && setReconciliations(list))
      .catch(() => {
        // Non-fatal — Phase 1 surface is additive. Activity view still works.
        if (!cancelled) setReconciliations([]);
      })
      .finally(() => !cancelled && setRecsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedID, recsTick]);

  const inProgressRec = useMemo(
    () => reconciliations.find((r) => r.status === "in_progress"),
    [reconciliations],
  );
  // History covers anything that's not in-progress — both `finalized` and
  // `needs_review`. Sort newest-first so the most recently finalized rec
  // sits at the top of the list. We assume the API ordering may not be
  // stable, so we explicitly sort by finalized_at desc, falling back to
  // created_at when finalized_at is missing.
  const historyRecs = useMemo(() => {
    const rows = reconciliations.filter(
      (r) => r.status === "finalized" || r.status === "needs_review",
    );
    return rows.slice().sort((a, b) => {
      const ad = a.finalized_at || a.created_at;
      const bd = b.finalized_at || b.created_at;
      return bd.localeCompare(ad);
    });
  }, [reconciliations]);
  const finalizedRecs = useMemo(
    () => reconciliations.filter((r) => r.status === "finalized"),
    [reconciliations],
  );
  const lastFinalized = finalizedRecs[0];
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // Load activity whenever the selection or date range changes.
  useEffect(() => {
    if (selectedID == null) return;
    let cancelled = false;
    const isRefresh = refreshTick > 0;
    setLoading(true);
    setError(null);
    setActivity(null);
    fetchCreditCardActivity(selectedID, startDate, endDate, isRefresh)
      .then((r) => !cancelled && setActivity(r))
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedID, startDate, endDate, refreshTick]);

  const selected = useMemo(
    () => accounts.find((a) => a.id === selectedID) ?? null,
    [accounts, selectedID],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-sky-200 bg-sky-50 text-sky-900 rounded-md px-4 py-3 text-sm">
        Pick an account and a date range to eyeball recent QBO activity. To
        actually reconcile a statement, start a reconciliation from the section
        below — that opens a workspace where you can upload the statement,
        auto-match against QBO, and persist matches.
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#525252]">Account</span>
          <select
            value={selectedID ?? ""}
            onChange={(e) => setSelectedID(Number(e.target.value) || null)}
            disabled={accounts.length === 0}
            className="border border-[#E5E5E5] rounded-md px-2 py-1.5 text-sm min-w-[220px] bg-white"
          >
            {accounts.length === 0 && <option value="">No CC accounts</option>}
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.qbo_name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#525252]">Start date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-[#E5E5E5] rounded-md px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#525252]">End date</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-[#E5E5E5] rounded-md px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => setRefreshTick((t) => t + 1)}
          disabled={loading || selectedID == null}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md border border-[#E5E5E5] bg-white pb-1.5",
            loading || selectedID == null
              ? "text-[#717179] cursor-not-allowed"
              : "text-[#303030] hover:bg-[#F8F8F8]",
          )}
          title="Bypass the 5-minute cache and re-pull from QBO"
        >
          ↻ Refresh
        </button>
        {loading && (
          <div className="text-sm text-[#717179] pb-1.5">Loading…</div>
        )}
      </div>

      {selected && (
        <section className="border border-[#E5E5E5] rounded-md bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#303030]">
                Reconciliations · {selected.qbo_name}
              </div>
              <div className="text-xs text-[#717179] mt-0.5">
                {recsLoading && "Loading…"}
                {!recsLoading && inProgressRec && (
                  <>
                    In progress: {inProgressRec.period_start} → {inProgressRec.period_end}
                  </>
                )}
                {!recsLoading && !inProgressRec && lastFinalized && (
                  <>
                    Last finalized: {lastFinalized.period_end}
                    {finalizedRecs.length > 1 && ` (${finalizedRecs.length} total)`}
                  </>
                )}
                {!recsLoading && !inProgressRec && !lastFinalized && (
                  <>No reconciliations yet for this account.</>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {inProgressRec ? (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Discard the in-progress reconciliation for ${inProgressRec.period_start} → ${inProgressRec.period_end}? Persisted matches will be deleted. This cannot be undone.`,
                        )
                      ) {
                        return;
                      }
                      try {
                        await discardReconciliation(inProgressRec.id);
                        setRecsTick((t) => t + 1);
                      } catch (err) {
                        alert(
                          err instanceof Error
                            ? err.message
                            : "Discard failed",
                        );
                      }
                    }}
                    className="text-xs text-[#717179] hover:text-rose-700 underline"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/reconciliations/${inProgressRec.id}`)}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-[#013764] bg-[#013764] text-white hover:bg-[#012a4e]"
                  >
                    Resume reconciliation →
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setStartOpen(true)}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-[#013764] bg-[#013764] text-white hover:bg-[#012a4e]"
                >
                  Start reconciliation
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {selected && (
        <section className="border border-[#E5E5E5] rounded-md bg-white">
          <button
            type="button"
            onClick={() => setHistoryExpanded((v) => !v)}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#F8F8F8] border-b border-[#F0F0F0]"
            aria-expanded={historyExpanded}
          >
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-[#303030]">
                History
              </div>
              <span className="text-xs text-[#717179]">
                {recsLoading
                  ? "Loading…"
                  : `${historyRecs.length} reconciliation${
                      historyRecs.length === 1 ? "" : "s"
                    }`}
              </span>
            </div>
            <span className="text-xs text-[#717179]">
              {historyExpanded ? "Collapse" : "Expand"}
            </span>
          </button>
          {historyExpanded && (
            <>
              {historyRecs.length === 0 ? (
                <div className="p-6 text-sm text-[#717179] text-center">
                  No finalized reconciliations yet.
                </div>
              ) : (
                <ul className="divide-y divide-[#F0F0F0]">
                  {historyRecs.map((r) => {
                    const isNeedsReview = r.status === "needs_review";
                    return (
                      <li
                        key={r.id}
                        onClick={() => navigate(`/reconciliations/${r.id}`)}
                        className="px-4 py-3 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center cursor-pointer hover:bg-[#F8F8F8]"
                      >
                        <div className="min-w-0">
                          <div className="text-sm text-[#303030] truncate">
                            {r.period_start} → {r.period_end}
                          </div>
                          <div className="text-xs text-[#717179]">
                            Finalized {formatDateOnly(r.finalized_at)}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-[#303030] tabular-nums shrink-0">
                          {formatCents(r.ending_balance_cents)}
                        </div>
                        <span
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium border rounded-full shrink-0",
                            isNeedsReview
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-slate-50 text-slate-700 border-slate-200",
                          )}
                        >
                          {isNeedsReview ? "Needs review" : "Finalized"}
                        </span>
                        <span className="text-xs text-[#013764] shrink-0">
                          View →
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>
      )}

      {accountsError && (
        <div className="text-sm text-rose-600">{accountsError}</div>
      )}
      {error && <div className="text-sm text-rose-600">{error}</div>}

      {!loading && accounts.length === 0 && !accountsError && (
        <div className="text-sm text-[#717179] py-8 text-center">
          No QBO credit-card accounts found in the chart of accounts.
        </div>
      )}

      {activity && <SummaryGrid activity={activity} />}
      {activity && <ActivityTable rows={activity.rows} />}

      <StartReconciliationModal
        open={startOpen}
        onOpenChange={setStartOpen}
        account={selected ?? null}
        defaultBeginningBalanceCents={lastFinalized?.ending_balance_cents ?? 0}
        defaultPeriodStart={startDate}
        defaultPeriodEnd={endDate}
        onCreated={(rec) => {
          setRecsTick((t) => t + 1);
          navigate(`/reconciliations/${rec.id}`);
        }}
      />
    </div>
  );
}

function SummaryGrid({ activity }: { activity: CreditCardActivityResponse }) {
  // Platform-side bucketing — what OUR reconciliation engine knows. Replaces
  // the older QBO-native Uncleared/Cleared/Reconciled bucket, which reflected
  // QBO's own reconcile flow (we don't drive that flow, so those KPIs never
  // moved when the user finalized a rec on the platform).
  const items: Array<{ label: string; count: number; cents: number; tone: string; help: string }> = [
    {
      label: "Open",
      count: activity.platform_open_count,
      cents: activity.platform_open_cents,
      tone: "text-slate-700",
      help: "Transactions not yet part of any reconciliation.",
    },
    {
      label: "In progress",
      count: activity.platform_in_progress_count,
      cents: activity.platform_in_progress_cents,
      tone: "text-amber-700",
      help: "Transactions matched in a reconciliation that's still in progress.",
    },
    {
      label: "Reconciled",
      count: activity.platform_reconciled_count,
      cents: activity.platform_reconciled_cents,
      tone: "text-emerald-700",
      help: "Transactions cleared as part of a finalized reconciliation.",
    },
    {
      label: "Total activity",
      count: activity.rows.length,
      cents: activity.running_total_cents,
      tone: "text-[#303030]",
      help: "All QBO transactions on this account in the date range.",
    },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => (
        <div
          key={it.label}
          title={it.help}
          className="border border-[#E5E5E5] rounded-md bg-white px-4 py-3"
        >
          <div className="text-xs text-[#717179] uppercase tracking-wide">
            {it.label}
          </div>
          <div className={cn("text-lg font-semibold mt-1", it.tone)}>
            {formatCents(it.cents)}
          </div>
          <div className="text-xs text-[#717179] mt-0.5">
            {it.count} {it.count === 1 ? "txn" : "txns"}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityTable({ rows }: { rows: CreditCardActivityRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-sm text-[#717179] py-8 text-center">
        No transactions on this account in the selected period.
      </div>
    );
  }
  return (
    <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-[#F8F8F8] text-[#717179] text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Date</th>
            <th className="text-left px-4 py-3 font-medium">Type</th>
            <th className="text-left px-4 py-3 font-medium">Doc #</th>
            <th className="text-left px-4 py-3 font-medium">Vendor</th>
            <th className="text-left px-4 py-3 font-medium">Memo</th>
            <th className="text-right px-4 py-3 font-medium">Amount</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={`${r.txn_date}-${r.doc_num ?? ""}-${i}`}
              className="border-t border-[#F0F0F0]"
            >
              <td className="px-4 py-2.5 text-[#303030] whitespace-nowrap">
                {r.txn_date}
              </td>
              <td className="px-4 py-2.5 text-[#303030] whitespace-nowrap">
                {r.txn_type || "—"}
              </td>
              <td className="px-4 py-2.5 text-[#525252]">{r.doc_num || "—"}</td>
              <td className="px-4 py-2.5 text-[#303030]">{r.vendor || "—"}</td>
              <td className="px-4 py-2.5 text-[#525252] max-w-[280px] truncate">
                {r.memo || "—"}
              </td>
              <td className="px-4 py-2.5 text-right text-[#303030] whitespace-nowrap tabular-nums">
                {formatCents(r.amount_cents)}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={cn(
                    "inline-block border rounded-full px-2 py-0.5 text-xs font-medium",
                    STATUS_BADGE[r.status],
                  )}
                >
                  {STATUS_LABEL[r.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

