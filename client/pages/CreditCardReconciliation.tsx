import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import StartReconciliationModal from "@/components/StartReconciliationModal";
import GlobalActionsDropdown from "@/components/GlobalActionsDropdown";
import { PageHeader } from "@/components/BillsPageHeader";
import { toast } from "sonner";
import {
  discardReconciliation,
  fetchCreditCardAccounts,
  listReconciliations,
  reopen as reopenReconciliation,
  type CreditCardAccount,
  type ReconciliationSummary,
} from "@/data/credit-card-reconciliation";

const fmt = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

const fmtDate = (s: string | undefined | null): string => {
  if (!s) return "—";
  const [y, m, d] = s.slice(0, 10).split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
};

const fmtPeriod = (start: string, end: string): string => {
  const [sy, sm, sd] = start.slice(0, 10).split("-");
  const [ey, em, ed] = end.slice(0, 10).split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const startStr = `${months[parseInt(sm) - 1]} ${parseInt(sd)}`;
  const endStr = `${months[parseInt(em) - 1]} ${parseInt(ed)}, ${ey}`;
  return sy === ey ? `${startStr} – ${endStr}` : `${startStr}, ${sy} – ${endStr}`;
};

interface RecWithAccount extends ReconciliationSummary {
  account: CreditCardAccount;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  in_progress:  { label: "In progress",  dot: "bg-amber-400" },
  finalized:    { label: "Finalized",     dot: "bg-emerald-500" },
  needs_review: { label: "Needs review",  dot: "bg-rose-500" },
};

// Icons matching the GlobalTable / Bills page style
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 2v4"/><path d="M16 2v4"/>
    <rect width="18" height="18" x="3" y="4" rx="2"/>
    <path d="M3 10h18"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>
    <path d="M9 21V9"/><path d="M9 9V3"/>
  </svg>
);
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconDollar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" x2="12" y1="2" y2="22"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconCheckCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
  </svg>
);
const IconStatus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v4"/><path d="M12 16h.01"/>
  </svg>
);
const IconDotsH = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
  </svg>
);
const IconDotsV = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
  </svg>
);
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.724 12.3895C13.6451 13.5732 13.6057 14.165 13.35 14.6138C13.1249 15.0088 12.7854 15.3265 12.3762 15.5248C11.9115 15.75 11.3183 15.75 10.132 15.75H7.86799C6.68168 15.75 6.08852 15.75 5.62375 15.5248C5.21457 15.3265 4.87507 15.0088 4.64999 14.6138C4.39433 14.165 4.35488 13.5732 4.27596 12.3895L3.75 4.5M7.5 7.875V11.625M10.5 7.875V11.625"
      stroke="var(--color-status-error)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconStart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="m8 12 4-4 4 4"/>
  </svg>
);

export default function CreditCardReconciliation() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<CreditCardAccount[]>([]);
  const [allRecs, setAllRecs] = useState<RecWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [startOpen, setStartOpen] = useState(false);
  const [startAccount, setStartAccount] = useState<CreditCardAccount | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [tab, setTab] = useState<"all" | "open" | "finalized">("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCreditCardAccounts()
      .then(async (accts) => {
        if (cancelled) return;
        setAccounts(accts);
        const lists = await Promise.all(
          accts.map(a =>
            listReconciliations(a.id)
              .then(recs => recs.map(r => ({ ...r, account: a })))
              .catch(() => [] as RecWithAccount[])
          )
        );
        if (!cancelled) {
          const merged = lists.flat().sort((a, b) => {
            const ad = a.finalized_at ?? a.created_at;
            const bd = b.finalized_at ?? b.created_at;
            return bd.localeCompare(ad);
          });
          setAllRecs(merged);
        }
      })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  const inProgress  = useMemo(() => allRecs.filter(r => r.status === "in_progress"),  [allRecs]);
  const finalized   = useMemo(() => allRecs.filter(r => r.status === "finalized"),    [allRecs]);
  const needsReview = useMemo(() => allRecs.filter(r => r.status === "needs_review"), [allRecs]);
  const lastFinalized = finalized[0];

  const handleStartClick = () => {
    const acct = accounts.find(a => !inProgress.some(r => r.account.id === a.id)) ?? accounts[0] ?? null;
    setStartAccount(acct);
    setStartOpen(true);
  };

  const handleDiscard = async (rec: RecWithAccount) => {
    if (!window.confirm(`Discard the in-progress reconciliation for ${fmtPeriod(rec.period_start, rec.period_end)}? All matches will be deleted.`)) return;
    try {
      await discardReconciliation(rec.id);
      setTick(t => t + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Discard failed");
    }
  };

  const handleReopen = async (rec: RecWithAccount) => {
    if (!window.confirm(`Reopen ${fmtPeriod(rec.period_start, rec.period_end)} for editing?`)) return;
    try {
      await reopenReconciliation(rec.id, "Reopened for editing");
      setTick(t => t + 1);
    } catch (err) {
      toast.error(err instanceof Error ? (err.message.replace(/_/g, " ").replace(/^[a-z]/, c => c.toUpperCase())) : "Reopen failed");
    }
  };

  // Row actions for GlobalActionsDropdown
  const getActions = (rec: RecWithAccount) => {
    const isInProgress = rec.status === "in_progress";
    const isFinalized = rec.status === "finalized";
    return [
      {
        label: isInProgress ? "Resume" : "View",
        icon: <IconEye />,
        onClick: () => navigate(`/reconciliations/${rec.id}`),
      },
      ...(isFinalized ? [{
        label: "Reopen",
        icon: <IconStart />,
        onClick: () => handleReopen(rec),
      }] : []),
      ...(isInProgress ? [{
        label: "Discard",
        icon: <IconTrash />,
        onClick: () => handleDiscard(rec),
        className: "text-red-600",
      }] : []),
    ];
  };

  const openRecs = useMemo(
    () => allRecs.filter(r => r.status === "in_progress" || r.status === "needs_review"),
    [allRecs],
  );

  const visibleRecs = useMemo(() => {
    if (tab === "open") return openRecs;
    if (tab === "finalized") return finalized;
    return allRecs;
  }, [tab, allRecs, openRecs, finalized]);

  const totalReconciledCents = useMemo(
    () => finalized.reduce((sum, r) => sum + r.ending_balance_cents, 0),
    [finalized],
  );

  const kpis = [
    {
      label: "IN PROGRESS",
      value: inProgress.length,
      sub: inProgress[0] ? fmtPeriod(inProgress[0].period_start, inProgress[0].period_end) : "—",
      valueColor: "text-amber-600",
    },
    {
      label: "FINALIZED",
      value: finalized.length,
      sub: lastFinalized ? `Last: ${fmtDate(lastFinalized.finalized_at)}` : "—",
      valueColor: "text-emerald-600",
    },
    {
      label: "TOTAL RECONCILED",
      value: fmt(totalReconciledCents),
      sub: `Across ${finalized.length} finalized period${finalized.length === 1 ? "" : "s"}`,
      valueColor: "text-emerald-700",
    },
  ];

  const cols: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: "period",    label: "Period",    icon: <IconCalendar /> },
    { key: "account",   label: "Account",   icon: <IconBuilding /> },
    { key: "status",    label: "Status",    icon: <IconStatus /> },
    { key: "balance",   label: "Balance",   icon: <IconDollar /> },
    { key: "finalized", label: "Finalized", icon: <IconCheckCircle /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ── */}
      <PageHeader
        title="Reconciliation"
        description={
          loading ? "Loading…"
            : lastFinalized
            ? `Last finalized: ${fmtPeriod(lastFinalized.period_start, lastFinalized.period_end)}`
            : "Finalize QBO credit-card reconciliations."
        }
        actions={[
          {
            id: "start",
            label: "Start reconciliation",
            icon: <IconStart />,
            onClick: handleStartClick,
            disabled: accounts.length === 0,
            variant: "primary",
          },
        ]}
      />

      {/* ── Underline tabs ── */}
      <div className="border-b border-gray-200">
        <div className="flex items-end gap-6">
          {(["all", "open", "finalized"] as const).map(t => {
            const count = t === "all" ? allRecs.length : t === "open" ? openRecs.length : finalized.length;
            const label = t === "all" ? "All" : t === "open" ? "Open" : "Finalized";
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  active
                    ? "border-[#013764] text-[#013764]"
                    : "border-transparent text-[#717179] hover:text-[#303030] hover:border-gray-300",
                )}
              >
                {label}
                <span className={cn("ml-1.5 text-xs", active ? "text-[#013764]" : "text-[#A1A1A1]")}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── KPI strip ── */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {kpis.map((kpi, i) => (
            <div
              key={kpi.label}
              className={cn(
                "relative flex flex-col gap-1 rounded-xl border border-gray-200 bg-white px-5 py-4",
                i === 0 && inProgress.length > 0 && "bg-amber-50/40",
              )}
            >
              <div className="flex items-start justify-between">
                <span
                  className="text-xs font-semibold tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {kpi.label}
                </span>
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 text-gray-400"
                  onClick={i === 0 && inProgress[0]
                    ? () => navigate(`/reconciliations/${inProgress[0].id}`)
                    : undefined}
                >
                  <IconDotsV />
                </button>
              </div>
              <div className={cn("font-bold leading-none mt-1", kpi.valueColor, typeof kpi.value === "string" ? "text-xl" : "text-3xl")}>
                {kpi.value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Reconciliations table ── */}
      <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
        {/* Table header bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <h2
              className="font-medium text-[22px] leading-6"
              style={{ color: "var(--color-text-primary)" }}
            >
              {tab === "open" ? "Open" : tab === "finalized" ? "Finalized" : "All"} Reconciliations
            </h2>
            {!loading && (
              <span className="text-sm font-normal" style={{ color: "var(--color-text-muted)" }}>
                {visibleRecs.length} total
              </span>
            )}
          </div>
        </div>

        {/* Table body */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className="h-12 bg-gray-50"
                style={{ borderBottomColor: "var(--color-border-light)", borderBottomWidth: "1px" }}
              >
                {cols.map(col => (
                  <th
                    key={col.key}
                    className="px-3 py-3 text-left whitespace-nowrap"
                    style={{ borderRightColor: "var(--color-border-light)", borderRightWidth: "1px" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{col.icon}</span>
                      <span className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>
                        {col.label}
                      </span>
                    </div>
                  </th>
                ))}
                <th
                  className="sticky right-0 px-2 py-3 text-center w-20 bg-white"
                  style={{ borderLeftWidth: "2px", borderLeftColor: "var(--color-border-default)" }}
                >
                  <span className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={cols.length + 1} className="px-6 py-12 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={cols.length + 1} className="px-6 py-10 text-center text-sm text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : visibleRecs.length === 0 ? (
                <tr>
                  <td colSpan={cols.length + 1} className="px-6 py-12 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                    {tab === "all"
                      ? <><span>No reconciliations yet. </span><button onClick={handleStartClick} className="text-[#013764] underline">Start one →</button></>
                      : `No ${tab === "open" ? "open" : "finalized"} reconciliations.`}
                  </td>
                </tr>
              ) : (
                visibleRecs.map(rec => {
                  const cfg = STATUS_CONFIG[rec.status] ?? STATUS_CONFIG.finalized;
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => navigate(`/reconciliations/${rec.id}`)}
                      className="h-12 cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderBottomColor: "var(--color-border-light)", borderBottomWidth: "1px" }}
                    >
                      {/* Period */}
                      <td
                        className="px-3 py-3 whitespace-nowrap font-medium text-sm"
                        style={{ color: "var(--color-text-primary)", borderRightColor: "var(--color-border-light)", borderRightWidth: "1px" }}
                      >
                        {fmtPeriod(rec.period_start, rec.period_end)}
                      </td>
                      {/* Account */}
                      <td
                        className="px-3 py-3 whitespace-nowrap text-sm"
                        style={{ color: "var(--color-text-primary)", borderRightColor: "var(--color-border-light)", borderRightWidth: "1px" }}
                      >
                        {rec.account.qbo_name}
                      </td>
                      {/* Status */}
                      <td
                        className="px-3 py-3 whitespace-nowrap"
                        style={{ borderRightColor: "var(--color-border-light)", borderRightWidth: "1px" }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                          <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                            {cfg.label}
                          </span>
                        </div>
                      </td>
                      {/* Balance */}
                      <td
                        className="px-3 py-3 whitespace-nowrap text-sm font-medium tabular-nums"
                        style={{ color: "var(--color-text-primary)", borderRightColor: "var(--color-border-light)", borderRightWidth: "1px" }}
                      >
                        {fmt(rec.ending_balance_cents)}
                      </td>
                      {/* Finalized at */}
                      <td
                        className="px-3 py-3 whitespace-nowrap text-sm"
                        style={{ color: "var(--color-text-muted)", borderRightColor: "var(--color-border-light)", borderRightWidth: "1px" }}
                      >
                        {fmtDate(rec.finalized_at)}
                      </td>
                      {/* Actions */}
                      <td
                        className="sticky right-0 bg-white px-2 py-3 text-center"
                        style={{ borderLeftWidth: "2px", borderLeftColor: "var(--color-border-default)" }}
                        data-global-table-actions-cell="true"
                        onClick={e => e.stopPropagation()}
                      >
                        <GlobalActionsDropdown
                          row={rec}
                          rowKey="id"
                          actions={getActions(rec)}
                          openMenuId={openMenuId}
                          setOpenMenuId={setOpenMenuId}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StartReconciliationModal
        open={startOpen}
        onOpenChange={setStartOpen}
        account={startAccount}
        defaultBeginningBalanceCents={lastFinalized?.ending_balance_cents ?? 0}
        defaultPeriodStart=""
        defaultPeriodEnd=""
        onCreated={(rec) => {
          setTick(t => t + 1);
          navigate(`/reconciliations/${rec.id}`);
        }}
      />
    </div>
  );
}
