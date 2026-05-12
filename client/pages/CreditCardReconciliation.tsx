import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  fetchCreditCardAccounts,
  fetchCreditCardActivity,
  qboReconcileURL,
  uploadStatementForMatch,
  type CCActivityStatus,
  type CreditCardAccount,
  type CreditCardActivityResponse,
  type CreditCardActivityRow,
  type MatchPair,
  type StatementMatchResponse,
  type StatementRow,
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
  const [matchResult, setMatchResult] = useState<StatementMatchResponse | null>(
    null,
  );
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Clear the match result whenever the account or date range changes — the
  // match is only valid for the parameters it was computed against.
  useEffect(() => {
    setMatchResult(null);
    setMatchError(null);
  }, [selectedID, startDate, endDate]);

  const handleFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    // Reset the input so re-selecting the same file fires onChange.
    e.target.value = "";
    if (!file || selectedID == null) return;
    setMatchLoading(true);
    setMatchError(null);
    setMatchResult(null);
    try {
      const res = await uploadStatementForMatch(
        selectedID,
        startDate,
        endDate,
        file,
      );
      setMatchResult(res);
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setMatchLoading(false);
    }
  };

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
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={matchLoading || selectedID == null}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md border border-[#E5E5E5] bg-white pb-1.5",
            matchLoading || selectedID == null
              ? "text-[#717179] cursor-not-allowed"
              : "text-[#303030] hover:bg-[#F8F8F8]",
          )}
          title="Upload a CSV or XLSX statement to auto-match against QBO activity"
        >
          {matchLoading ? "Matching…" : "Upload statement (CSV / XLSX)"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileSelected}
          className="hidden"
        />
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

      {matchError && (
        <div className="text-sm text-rose-600">{matchError}</div>
      )}

      {matchResult && <MatchResults result={matchResult} />}

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

function MatchResults({ result }: { result: StatementMatchResponse }) {
  const totalsAgree =
    result.statement_total_cents === result.qbo_total_cents;
  return (
    <div className="flex flex-col gap-4 mt-2">
      <div className="border border-[#E5E5E5] rounded-md bg-white">
        <div className="px-4 py-3 border-b border-[#E5E5E5] flex flex-wrap gap-4 items-baseline">
          <h2 className="text-base font-semibold text-[#303030]">
            Statement match
          </h2>
          <span className="text-xs text-[#717179]">
            {result.matched.length} matched ·{" "}
            <span className="text-rose-700">
              {result.unmatched_statement.length} missing from QBO
            </span>{" "}
            ·{" "}
            <span className="text-amber-800">
              {result.unmatched_qbo.length} missing from statement
            </span>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#E5E5E5]">
          <SumCell label="Statement total" cents={result.statement_total_cents} />
          <SumCell label="QBO total" cents={result.qbo_total_cents} />
          <SumCell
            label="Difference"
            cents={result.statement_total_cents - result.qbo_total_cents}
            tone={totalsAgree ? "text-emerald-700" : "text-rose-700"}
          />
        </div>
      </div>

      {result.warnings && result.warnings.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 text-amber-900 rounded-md px-4 py-3 text-sm">
          <div className="font-medium mb-1">
            Parser warnings ({result.warnings.length})
          </div>
          <ul className="list-disc ml-5 space-y-0.5">
            {result.warnings.slice(0, 10).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
            {result.warnings.length > 10 && (
              <li className="text-xs">
                …and {result.warnings.length - 10} more
              </li>
            )}
          </ul>
        </div>
      )}

      {result.unmatched_statement.length > 0 && (
        <Section
          title="Missing from QBO"
          subtitle="On your statement but not in QBO — someone needs to enter these (or push the bill through the platform) before reconciling."
          tone="rose"
        >
          <StatementOnlyTable rows={result.unmatched_statement} />
        </Section>
      )}

      {result.unmatched_qbo.length > 0 && (
        <Section
          title="Missing from statement"
          subtitle="In QBO but not on your statement — usually pending charges, or charges entered with a wrong date/amount in QBO."
          tone="amber"
        >
          <QBOOnlyTable rows={result.unmatched_qbo} />
        </Section>
      )}

      {result.matched.length > 0 && (
        <Section
          title={`Matched (${result.matched.length})`}
          subtitle="Statement lines that lined up with a QBO transaction by amount and date (±3 days)."
          tone="emerald"
        >
          <MatchedTable rows={result.matched} />
        </Section>
      )}
    </div>
  );
}

function SumCell({
  label,
  cents,
  tone,
}: {
  label: string;
  cents: number;
  tone?: string;
}) {
  return (
    <div className="bg-white px-4 py-3">
      <div className="text-xs text-[#717179] uppercase tracking-wide">
        {label}
      </div>
      <div className={cn("text-lg font-semibold mt-1", tone ?? "text-[#303030]")}>
        {formatCents(cents)}
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  tone,
  children,
}: {
  title: string;
  subtitle: string;
  tone: "rose" | "amber" | "emerald";
  children: React.ReactNode;
}) {
  const dot =
    tone === "rose"
      ? "bg-rose-500"
      : tone === "amber"
        ? "bg-amber-500"
        : "bg-emerald-500";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className={cn("inline-block w-2 h-2 rounded-full", dot)} />
        <h3 className="text-sm font-semibold text-[#303030]">{title}</h3>
      </div>
      <p className="text-xs text-[#717179]">{subtitle}</p>
      {children}
    </div>
  );
}

function StatementOnlyTable({ rows }: { rows: StatementRow[] }) {
  return (
    <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-[#F8F8F8] text-[#717179] text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Date</th>
            <th className="text-left px-4 py-3 font-medium">Description</th>
            <th className="text-right px-4 py-3 font-medium">Amount</th>
            <th className="text-right px-4 py-3 font-medium">Statement row</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.source_row} className="border-t border-[#F0F0F0]">
              <td className="px-4 py-2.5 whitespace-nowrap">{r.date}</td>
              <td className="px-4 py-2.5">{r.description || "—"}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {formatCents(r.amount_cents)}
              </td>
              <td className="px-4 py-2.5 text-right text-[#717179] tabular-nums">
                {r.source_row}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QBOOnlyTable({ rows }: { rows: CreditCardActivityRow[] }) {
  return (
    <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-[#F8F8F8] text-[#717179] text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Date</th>
            <th className="text-left px-4 py-3 font-medium">Type</th>
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
              <td className="px-4 py-2.5 whitespace-nowrap">{r.txn_date}</td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                {r.txn_type || "—"}
              </td>
              <td className="px-4 py-2.5">{r.vendor || "—"}</td>
              <td className="px-4 py-2.5 text-[#525252] max-w-[280px] truncate">
                {r.memo || "—"}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">
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

function MatchedTable({ rows }: { rows: MatchPair[] }) {
  return (
    <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-[#F8F8F8] text-[#717179] text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Statement date</th>
            <th className="text-left px-4 py-3 font-medium">Description</th>
            <th className="text-left px-4 py-3 font-medium">QBO date</th>
            <th className="text-left px-4 py-3 font-medium">QBO vendor</th>
            <th className="text-right px-4 py-3 font-medium">Amount</th>
            <th className="text-left px-4 py-3 font-medium">Match</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m, i) => (
            <tr key={i} className="border-t border-[#F0F0F0]">
              <td className="px-4 py-2.5 whitespace-nowrap">
                {m.statement.date}
              </td>
              <td className="px-4 py-2.5 max-w-[260px] truncate">
                {m.statement.description || "—"}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">{m.qbo.txn_date}</td>
              <td className="px-4 py-2.5">{m.qbo.vendor || "—"}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {formatCents(m.statement.amount_cents)}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={cn(
                    "inline-block border rounded-full px-2 py-0.5 text-xs font-medium",
                    m.confidence === "exact"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-200",
                  )}
                >
                  {m.confidence === "exact" ? "Exact" : "±date"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
