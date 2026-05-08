import { Fragment, useEffect, useMemo, useState } from "react";
import PageTemplate from "@/layout/PageTemplate";
import { PageHeader } from "@/components/BillsPageHeader";
import { cn } from "@/lib/utils";
import {
  fetchReconciliation,
  fetchPaymentsReconciliation,
  fetchReimbursementsReconciliation,
  type BillRow,
  type Discrepancy,
  type DiscrepancyType,
  type LinkStatus,
  type ReconciliationResult,
  type ReimbursementBillRow,
  type ReimbursementResult,
  type ReimbursementRow,
  type Severity,
  type SystemStatus,
  type SystemTotals,
} from "@/data/reconciliation";

type TabKey = "bills" | "payments" | "reimbursements";

const TABS: { id: TabKey; label: string }[] = [
  { id: "bills", label: "Bills" },
  { id: "payments", label: "Payments" },
  { id: "reimbursements", label: "Reimbursements" },
];

const RP_STATUS_BADGE: Record<ReimbursementRow["status"], string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed_partial: "bg-amber-50 text-amber-800 border-amber-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  pending: "bg-slate-50 text-slate-700 border-slate-200",
};

const RP_STATUS_LABEL: Record<ReimbursementRow["status"], string> = {
  completed: "✓ Completed",
  failed_partial: "⚠ Partial failure",
  failed: "✗ Failed",
  pending: "Pending",
};

const LINK_STATUS_BADGE: Record<LinkStatus, string> = {
  linked: "bg-emerald-50 text-emerald-700 border-emerald-200",
  qbo_only: "bg-amber-50 text-amber-800 border-amber-200",
  buildium_only: "bg-amber-50 text-amber-800 border-amber-200",
  neither: "bg-rose-50 text-rose-700 border-rose-200",
};

const LINK_STATUS_LABEL: Record<LinkStatus, string> = {
  linked: "✓ Linked",
  qbo_only: "⚠ QBO only",
  buildium_only: "⚠ Buildium only",
  neither: "✗ Neither",
};

const formatCents = (cents: number): string =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const monthStartYMD = (): string => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const monthEndYMD = (): string => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
};

const TYPE_LABEL: Record<DiscrepancyType, string> = {
  missing_qbo_id: "Missing in QBO",
  missing_buildium_id: "Missing in Buildium",
  qbo_id_not_found: "QBO id not found",
  buildium_id_not_found: "Buildium id not found",
  qbo_orphan: "QBO orphan",
  buildium_orphan: "Buildium orphan",
  amount_mismatch_qbo: "Amount mismatch (QBO)",
  amount_mismatch_buildium: "Amount mismatch (Buildium)",
  payment_unpaid_qbo: "Unpaid in QBO",
  payment_unpaid_buildium: "Unpaid in Buildium",
};

const SEVERITY_BADGE: Record<Severity, string> = {
  error: "bg-rose-50 text-rose-700 border-rose-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
};

const STATUS_BADGE: Record<SystemStatus, string> = {
  matched: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amount_drift: "bg-amber-50 text-amber-800 border-amber-200",
  missing: "bg-rose-50 text-rose-700 border-rose-200",
  not_found: "bg-rose-50 text-rose-700 border-rose-200",
  unpaid: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_LABEL: Record<SystemStatus, string> = {
  matched: "✓ Match",
  amount_drift: "⚠ Amount drift",
  missing: "✗ Missing",
  not_found: "✗ Not found",
  unpaid: "✗ Unpaid",
};

export default function Reconciliation() {
  const [tab, setTab] = useState<TabKey>("bills");
  const [startDate, setStartDate] = useState(monthStartYMD());
  const [endDate, setEndDate] = useState(monthEndYMD());
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [reimbResult, setReimbResult] = useState<ReimbursementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // refreshTick: incrementing counter forces the effect to re-run (and pass
  // refresh=1 to the backend, bypassing the cache).
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const isRefresh = refreshTick > 0;
    setLoading(true);
    setError(null);
    setResult(null);
    setReimbResult(null);

    const handleErr = (err: unknown) => {
      if (!cancelled)
        setError(err instanceof Error ? err.message : "Failed to load");
    };
    const finish = () => {
      if (!cancelled) setLoading(false);
    };

    if (tab === "bills") {
      fetchReconciliation(startDate, endDate, isRefresh)
        .then((r) => !cancelled && setResult(r))
        .catch(handleErr)
        .finally(finish);
    } else if (tab === "payments") {
      fetchPaymentsReconciliation(startDate, endDate, isRefresh)
        .then((r) => !cancelled && setResult(r))
        .catch(handleErr)
        .finally(finish);
    } else {
      fetchReimbursementsReconciliation(startDate, endDate, isRefresh)
        .then((r) => !cancelled && setReimbResult(r))
        .catch(handleErr)
        .finally(finish);
    }
    return () => {
      cancelled = true;
    };
    // refreshTick must be in deps so clicking Refresh re-fetches even with
    // unchanged tab/date.
  }, [tab, startDate, endDate, refreshTick]);

  const cachedAt =
    tab === "reimbursements" ? reimbResult?.cached_at : result?.cached_at;

  const errorCount = useMemo(
    () => result?.discrepancies.filter((d) => d.severity === "error").length ?? 0,
    [result],
  );
  const warningCount = useMemo(
    () => result?.discrepancies.filter((d) => d.severity === "warning").length ?? 0,
    [result],
  );

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        <PageHeader
          title="Reconciliation"
          description="Compare concierge bills across the platform, QBO, and Buildium for a given date range. Surfaces sync drift only — does not auto-fix."
        />

        <div className="border border-amber-200 bg-amber-50 text-amber-900 rounded-md px-4 py-3 text-sm">
          Comparing concierge transactions only. QBO bank balances will not
          match the actual bank account during the cutover transition.
        </div>

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

        <div className="flex flex-wrap gap-4 items-end">
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
            disabled={loading}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md border border-[#E5E5E5] bg-white pb-1.5",
              loading
                ? "text-[#717179] cursor-not-allowed"
                : "text-[#303030] hover:bg-[#F8F8F8]",
            )}
            title="Bypass the 5-minute cache and re-pull from QBO + Buildium"
          >
            ↻ Refresh
          </button>
          {loading && (
            <div className="text-sm text-[#717179] pb-1.5">Reconciling…</div>
          )}
          {!loading && cachedAt && (
            <div className="text-xs text-[#717179] pb-1.5">
              <CacheAgeIndicator iso={cachedAt} />
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-rose-600">{error}</div>
        )}

        {(tab === "bills" || tab === "payments") && result && (
          <>
            <SummarySection result={result} tab={tab} />

            {result.bills.length === 0 && (
              <div className="text-sm text-[#717179] py-8 text-center">
                {tab === "bills"
                  ? "No platform bills in this date range."
                  : "No platform bills paid in this date range."}
              </div>
            )}

            {result.bills.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-base font-semibold text-[#303030]">
                  {tab === "bills" ? "Bills" : "Payments"}
                </h2>
                <BillsTable rows={result.bills} tab={tab} />
              </div>
            )}

            {result.discrepancies.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-[#303030]">
                    Discrepancies
                  </h2>
                  <span className="text-xs text-[#717179]">
                    {errorCount} error{errorCount === 1 ? "" : "s"} ·{" "}
                    {warningCount} warning{warningCount === 1 ? "" : "s"}
                  </span>
                </div>
                <DiscrepancyTable rows={result.discrepancies} />
              </div>
            )}
          </>
        )}

        {tab === "reimbursements" && reimbResult && (
          <ReimbursementsView result={reimbResult} />
        )}
      </div>
    </PageTemplate>
  );
}

// CacheAgeIndicator displays "fresh" / "Xs ago" / "Xm ago" relative to the
// server-side cache timestamp. Re-renders every 30s while mounted so it
// stays accurate without a hard refresh.
function CacheAgeIndicator({ iso }: { iso: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const cachedTime = new Date(iso).getTime();
  if (Number.isNaN(cachedTime)) return null;
  const ageSec = Math.max(0, Math.floor((Date.now() - cachedTime) / 1000));
  let label: string;
  if (ageSec < 5) label = "just now";
  else if (ageSec < 60) label = `${ageSec}s ago`;
  else label = `${Math.floor(ageSec / 60)}m ago`;
  return <span>last updated: {label}</span>;
}

function SummarySection({
  result,
  tab,
}: {
  result: ReconciliationResult;
  tab: TabKey;
}) {
  const { platform, qbo, buildium } = result.summary;
  const countsAgree =
    platform.count === qbo.count && qbo.count === buildium.count;
  const totalsAgree =
    platform.total_cents === qbo.total_cents &&
    qbo.total_cents === buildium.total_cents;
  const countLabel = tab === "payments" ? "Paid bills" : "Bill count";
  const totalLabel = tab === "payments" ? "Paid total" : "Total amount";

  return (
    <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-[#F8F8F8] text-[#717179] text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Metric</th>
            <th className="text-right px-4 py-3 font-medium">Platform</th>
            <th className="text-right px-4 py-3 font-medium">QBO</th>
            <th className="text-right px-4 py-3 font-medium">Buildium</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          <SummaryRow
            label={countLabel}
            platform={platform.count}
            qbo={qbo.count}
            buildium={buildium.count}
            agree={countsAgree}
            kind="count"
          />
          <SummaryRow
            label={totalLabel}
            platform={platform.total_cents}
            qbo={qbo.total_cents}
            buildium={buildium.total_cents}
            agree={totalsAgree}
            kind="cents"
          />
        </tbody>
      </table>
    </div>
  );
}

function SummaryRow({
  label,
  platform,
  qbo,
  buildium,
  agree,
  kind,
}: {
  label: string;
  platform: number;
  qbo: number;
  buildium: number;
  agree: boolean;
  kind: "count" | "cents";
}) {
  const fmt = (n: number) => (kind === "cents" ? formatCents(n) : n.toString());
  return (
    <tr className="border-t border-[#E5E5E5]">
      <td className="px-4 py-3 font-medium text-[#303030]">{label}</td>
      <td className="px-4 py-3 text-right tabular-nums">{fmt(platform)}</td>
      <td className="px-4 py-3 text-right tabular-nums">{fmt(qbo)}</td>
      <td className="px-4 py-3 text-right tabular-nums">{fmt(buildium)}</td>
      <td className="px-4 py-3">
        {agree ? (
          <span className="inline-block px-2 py-0.5 text-xs rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
            ✓ Match
          </span>
        ) : (
          <span className="inline-block px-2 py-0.5 text-xs rounded-full border bg-rose-50 text-rose-700 border-rose-200">
            ✗ Drift
          </span>
        )}
      </td>
    </tr>
  );
}

function BillsTable({ rows, tab }: { rows: BillRow[]; tab: TabKey }) {
  const showPaidOn = tab === "payments";
  return (
    <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-[#F8F8F8] text-[#717179] text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Bill</th>
            <th className="text-left px-4 py-3 font-medium">
              {showPaidOn ? "Paid on" : "Date"}
            </th>
            <th className="text-left px-4 py-3 font-medium">Vendor</th>
            <th className="text-right px-4 py-3 font-medium">Platform</th>
            <th className="text-left px-4 py-3 font-medium">QBO</th>
            <th className="text-left px-4 py-3 font-medium">Buildium</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.bill_id} className="border-t border-[#E5E5E5] align-top">
              <td className="px-4 py-3 text-[#303030] whitespace-nowrap">
                #{b.bill_id}
                {b.is_reimbursement && (
                  <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] uppercase tracking-wide rounded bg-violet-50 text-violet-700 border border-violet-200">
                    Reimbursement
                  </span>
                )}
                {showPaidOn && (b.paid_doc_number || b.paid_memo) && (
                  <div className="mt-1 text-[11px] text-[#717179] font-normal">
                    {b.paid_doc_number && <div>Doc {b.paid_doc_number}</div>}
                    {b.paid_memo && (
                      <div className="max-w-[180px] truncate" title={b.paid_memo}>
                        {b.paid_memo}
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-[#717179] whitespace-nowrap">
                {showPaidOn ? b.paid_on || "—" : b.statement_date}
              </td>
              <td className="px-4 py-3 text-[#303030]">
                {b.vendor_name || "—"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-medium">
                {formatCents(b.amount_cents)}
                {showPaidOn && b.platform_paid_from_account && (
                  <div className="mt-1 text-[11px] text-[#717179] font-normal text-right">
                    from {b.platform_paid_from_account}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <SystemStatusCell
                  status={b.qbo_status}
                  externalID={b.qbo_bill_id}
                  externalAmount={b.qbo_amount_cents}
                  platformAmount={b.amount_cents}
                  externalLabel="QBO"
                  rawStatus={b.qbo_raw_status}
                  paidFromAccount={showPaidOn ? b.qbo_paid_from_account : undefined}
                />
              </td>
              <td className="px-4 py-3">
                <SystemStatusCell
                  status={b.buildium_status}
                  externalID={b.buildium_bill_id}
                  externalAmount={b.buildium_amount_cents}
                  platformAmount={b.amount_cents}
                  externalLabel="Buildium"
                  rawStatus={b.buildium_raw_status}
                  paidFromAccount={showPaidOn ? b.buildium_paid_from_account : undefined}
                  paymentID={showPaidOn ? b.buildium_bill_payment_id : undefined}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReimbursementsView({ result }: { result: ReimbursementResult }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (result.rows.length === 0) {
    return (
      <div className="text-sm text-[#717179] py-8 text-center">
        No reimbursement payments in this date range.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3 text-xs text-[#717179]">
        <span>
          <span className="text-emerald-700 font-medium">
            {result.completed_count}
          </span>{" "}
          completed
        </span>
        {result.partial_count > 0 && (
          <span>
            ·{" "}
            <span className="text-amber-800 font-medium">
              {result.partial_count}
            </span>{" "}
            partial failure
          </span>
        )}
        {result.failed_count > 0 && (
          <span>
            ·{" "}
            <span className="text-rose-700 font-medium">
              {result.failed_count}
            </span>{" "}
            failed
          </span>
        )}
        {result.pending_count > 0 && (
          <span>
            · {result.pending_count} pending
          </span>
        )}
      </div>

      <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F8F8F8] text-[#717179] text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 font-medium">RP</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Employee</th>
              <th className="text-left px-4 py-3 font-medium">Source</th>
              <th className="text-right px-4 py-3 font-medium">Bills</th>
              <th className="text-right px-4 py-3 font-medium">Total</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r) => {
              const open = expanded === r.reimbursement_payment_id;
              return (
                <Fragment key={r.reimbursement_payment_id}>
                  <tr
                    onClick={() =>
                      setExpanded(open ? null : r.reimbursement_payment_id)
                    }
                    className={cn(
                      "border-t border-[#E5E5E5] cursor-pointer hover:bg-[#F8F8F8]",
                      open && "bg-[#F8F8F8]",
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-[#303030] whitespace-nowrap">
                      RP-{r.reimbursement_payment_id}
                    </td>
                    <td className="px-4 py-3 text-[#717179] whitespace-nowrap">
                      {r.payment_date}
                    </td>
                    <td className="px-4 py-3 text-[#303030]">
                      {r.employee_name || r.employee_email}
                    </td>
                    <td className="px-4 py-3 text-[#717179]">
                      {r.source_account_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.bills.length}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatCents(r.total_amount_cents)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 text-xs rounded-full border whitespace-nowrap",
                          RP_STATUS_BADGE[r.status],
                        )}
                      >
                        {RP_STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#717179]">
                      {open ? "▾" : "▸"}
                    </td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 bg-white">
                        {r.failure_message && (
                          <div className="mb-3 text-xs text-rose-700 border border-rose-200 bg-rose-50 rounded-md px-3 py-2">
                            <strong>Failure:</strong> {r.failure_message}
                          </div>
                        )}
                        <ReimbursementBillsTable bills={r.bills} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReimbursementBillsTable({
  bills,
}: {
  bills: ReimbursementBillRow[];
}) {
  if (bills.length === 0) {
    return <div className="text-xs text-[#717179]">No bills.</div>;
  }
  return (
    <table className="min-w-full text-xs border border-[#E5E5E5] rounded">
      <thead className="bg-[#F8F8F8] text-[#717179] uppercase tracking-wide">
        <tr>
          <th className="text-left px-3 py-2 font-medium">Bill</th>
          <th className="text-left px-3 py-2 font-medium">Vendor</th>
          <th className="text-right px-3 py-2 font-medium">Amount</th>
          <th className="text-left px-3 py-2 font-medium">QBO Payment</th>
          <th className="text-left px-3 py-2 font-medium">Buildium Payment</th>
          <th className="text-left px-3 py-2 font-medium">Link</th>
          <th className="text-left px-3 py-2 font-medium">Bill paid?</th>
        </tr>
      </thead>
      <tbody>
        {bills.map((b) => (
          <tr key={b.bill_id} className="border-t border-[#E5E5E5]">
            <td className="px-3 py-2 text-[#303030]">#{b.bill_id}</td>
            <td className="px-3 py-2 text-[#303030]">{b.vendor_name || "—"}</td>
            <td className="px-3 py-2 text-right tabular-nums font-medium">
              {formatCents(b.amount_cents)}
            </td>
            <td className="px-3 py-2 text-[#717179] font-mono text-[11px]">
              {b.qbo_bill_payment_id || "—"}
            </td>
            <td className="px-3 py-2 text-[#717179] font-mono text-[11px]">
              {b.buildium_bill_payment_id || "—"}
            </td>
            <td className="px-3 py-2">
              <span
                className={cn(
                  "inline-block px-2 py-0.5 text-xs rounded-full border whitespace-nowrap",
                  LINK_STATUS_BADGE[b.link_status],
                )}
              >
                {LINK_STATUS_LABEL[b.link_status]}
              </span>
            </td>
            <td className="px-3 py-2">
              {b.bill_paid ? (
                <span className="text-emerald-700">✓ Paid</span>
              ) : (
                <span className="text-rose-700">✗ Unpaid</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SystemStatusCell({
  status,
  externalID,
  externalAmount,
  platformAmount,
  externalLabel,
  rawStatus,
  paidFromAccount,
  paymentID,
}: {
  status: SystemStatus;
  externalID: string | null;
  externalAmount?: number;
  platformAmount: number;
  externalLabel: string;
  rawStatus?: string;
  paidFromAccount?: string;
  paymentID?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={cn(
          "inline-block self-start px-2 py-0.5 text-xs rounded-full border whitespace-nowrap",
          STATUS_BADGE[status],
        )}
      >
        {STATUS_LABEL[status]}
      </span>
      {status === "amount_drift" && externalAmount != null && (
        <span className="text-xs text-amber-800 tabular-nums">
          {externalLabel}: {formatCents(externalAmount)} (platform{" "}
          {formatCents(platformAmount)})
        </span>
      )}
      {externalID && (
        <span className="text-[11px] text-[#717179] font-mono">
          {externalLabel} bill {externalID}
        </span>
      )}
      {paymentID && (
        <span className="text-[11px] text-[#717179] font-mono">
          payment {paymentID}
        </span>
      )}
      {paidFromAccount && (
        <span className="text-[11px] text-[#303030]">
          from {paidFromAccount}
        </span>
      )}
    </div>
  );
}

function DiscrepancyTable({ rows }: { rows: Discrepancy[] }) {
  return (
    <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-[#F8F8F8] text-[#717179] text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Type</th>
            <th className="text-left px-4 py-3 font-medium">Bill</th>
            <th className="text-left px-4 py-3 font-medium">Vendor</th>
            <th className="text-left px-4 py-3 font-medium">Date</th>
            <th className="text-right px-4 py-3 font-medium">Platform</th>
            <th className="text-right px-4 py-3 font-medium">QBO</th>
            <th className="text-right px-4 py-3 font-medium">Buildium</th>
            <th className="text-left px-4 py-3 font-medium">Detail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr key={i} className="border-t border-[#E5E5E5] align-top">
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-block px-2 py-0.5 text-xs rounded-full border whitespace-nowrap",
                    SEVERITY_BADGE[d.severity],
                  )}
                >
                  {TYPE_LABEL[d.type]}
                </span>
              </td>
              <td className="px-4 py-3 text-[#303030] whitespace-nowrap">
                {d.bill_id != null && <span>#{d.bill_id}</span>}
                {d.qbo_bill_id && (
                  <div className="text-xs text-[#717179] font-mono">
                    QBO {d.qbo_bill_id}
                  </div>
                )}
                {d.buildium_bill_id && (
                  <div className="text-xs text-[#717179] font-mono">
                    Buildium {d.buildium_bill_id}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-[#303030]">
                {d.vendor_name || "—"}
              </td>
              <td className="px-4 py-3 text-[#717179] whitespace-nowrap">
                {d.statement_date || "—"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-[#717179]">
                {d.platform_amount_cents != null
                  ? formatCents(d.platform_amount_cents)
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-[#717179]">
                {d.qbo_amount_cents != null
                  ? formatCents(d.qbo_amount_cents)
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-[#717179]">
                {d.buildium_amount_cents != null
                  ? formatCents(d.buildium_amount_cents)
                  : "—"}
              </td>
              <td className="px-4 py-3 text-xs text-[#717179] max-w-[320px]">
                {d.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
