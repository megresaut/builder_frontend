import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  fetchCreditCardAccounts,
  fetchCreditCardActivity,
  qboReconcileURL,
  type CCActivityStatus,
  type CreditCardAccount,
  type CreditCardActivityResponse,
  type CreditCardActivityRow,
} from "@/data/credit-card-reconciliation";

const formatCents = (cents: number): string =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const daysAgoYMD = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
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
  const [sinceDate, setSinceDate] = useState<string>(daysAgoYMD(35));
  const [activity, setActivity] = useState<CreditCardActivityResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

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

  // Load activity whenever the selection or since-date changes.
  useEffect(() => {
    if (selectedID == null) return;
    let cancelled = false;
    const isRefresh = refreshTick > 0;
    setLoading(true);
    setError(null);
    setActivity(null);
    fetchCreditCardActivity(selectedID, sinceDate, isRefresh)
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
  }, [selectedID, sinceDate, refreshTick]);

  const selected = useMemo(
    () => accounts.find((a) => a.id === selectedID) ?? null,
    [accounts, selectedID],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-sky-200 bg-sky-50 text-sky-900 rounded-md px-4 py-3 text-sm">
        QBO is the system of record for credit-card reconciliation. This view
        mirrors QBO's transaction list and lets you eyeball activity since your
        last reconcile. The actual <em>mark as reconciled</em> step happens in
        QBO — click "Reconcile in QBO" when you're ready.
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
          <span className="text-xs font-medium text-[#525252]">Since</span>
          <input
            type="date"
            value={sinceDate}
            onChange={(e) => setSinceDate(e.target.value)}
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
        {selected && (
          <a
            href={qboReconcileURL(selected.qbo_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-[#013764] bg-[#013764] text-white hover:bg-[#012a4e] pb-1.5"
          >
            Reconcile in QBO ↗
          </a>
        )}
        {loading && (
          <div className="text-sm text-[#717179] pb-1.5">Loading…</div>
        )}
      </div>

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
    </div>
  );
}

function SummaryGrid({ activity }: { activity: CreditCardActivityResponse }) {
  const items: Array<{ label: string; count: number; cents: number; tone: string }> = [
    {
      label: "Uncleared",
      count: activity.uncleared_count,
      cents: activity.uncleared_cents,
      tone: "text-slate-700",
    },
    {
      label: "Cleared",
      count: activity.cleared_count,
      cents: activity.cleared_cents,
      tone: "text-sky-700",
    },
    {
      label: "Reconciled",
      count: activity.reconciled_count,
      cents: activity.reconciled_cents,
      tone: "text-emerald-700",
    },
    {
      label: "Running total",
      count: activity.rows.length,
      cents: activity.running_total_cents,
      tone: "text-[#303030]",
    },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => (
        <div
          key={it.label}
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
