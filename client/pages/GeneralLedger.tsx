import { useCallback, useEffect, useRef, useState } from "react";
import PageTemplate from "@/layout/PageTemplate";
import { PageHeader } from "@/components/BillsPageHeader";
import { QBOReportView, type QBORowClickPayload } from "@/components/QBOReportView";
import { QBOTransactionDrawer } from "@/components/QBOTransactionDrawer";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/SearchableSelect";
import { CreateJournalEntryModal } from "@/components/CreateJournalEntryModal";
import {
  fetchGeneralLedgerFiltered,
  fetchLiveAccounts,
  fetchLiveCustomers,
  fetchQBOItems,
  fetchQBOTransaction,
  isQBOOAuthExpired,
  type LiveAccount,
  type LiveCustomer,
  type QBOItem,
  type QBOReportEnvelope,
  type QBOTransactionDetail,
  type GLFilters,
} from "@/data/qboReports";

// ── date helpers ────────────────────────────────────────────────────────────

const ymd = (d: Date): string =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);

function last30(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { start: ymd(start), end: ymd(end) };
}

type DatePreset = "last_30" | "this_month" | "last_month" | "ytd" | "last_year" | "custom";

const DATE_PRESETS: { id: DatePreset; label: string; range: () => { start: string; end: string } }[] = [
  {
    id: "last_30",
    label: "Last 30 days",
    range: last30,
  },
  {
    id: "this_month",
    label: "This month",
    range: () => {
      const n = new Date();
      return { start: ymd(new Date(n.getFullYear(), n.getMonth(), 1)), end: ymd(new Date(n.getFullYear(), n.getMonth() + 1, 0)) };
    },
  },
  {
    id: "last_month",
    label: "Last month",
    range: () => {
      const n = new Date();
      return { start: ymd(new Date(n.getFullYear(), n.getMonth() - 1, 1)), end: ymd(new Date(n.getFullYear(), n.getMonth(), 0)) };
    },
  },
  {
    id: "ytd",
    label: "Year to date",
    range: () => {
      const n = new Date();
      return { start: ymd(new Date(n.getFullYear(), 0, 1)), end: ymd(n) };
    },
  },
  {
    id: "last_year",
    label: "Last year",
    range: () => {
      const y = new Date().getFullYear() - 1;
      return { start: ymd(new Date(y, 0, 1)), end: ymd(new Date(y, 11, 31)) };
    },
  },
];

function detectPreset(start: string, end: string): DatePreset {
  for (const p of DATE_PRESETS) {
    const r = p.range();
    if (r.start === start && r.end === end) return p.id;
  }
  return "custom";
}

// ── simple native select ─────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold text-[#717179] uppercase tracking-widest block mb-1">
      {children}
    </span>
  );
}

function NativeSelect({
  value,
  onChange,
  disabled,
  className,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "border border-[#E5E5E5] rounded-md px-2 py-1 text-xs bg-white text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764] disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-6",
        className,
      )}
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23717179' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
    >
      {children}
    </select>
  );
}

// ── main component ───────────────────────────────────────────────────────────

export default function GeneralLedger() {
  const defaultRange = last30();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [datePreset, setDatePreset] = useState<DatePreset>("last_30");

  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [accountingMethod, setAccountingMethod] = useState<"Cash" | "Accrual">("Cash");

  const [customers, setCustomers] = useState<LiveCustomer[]>([]);
  const [accounts, setAccounts] = useState<LiveAccount[]>([]);
  const [qboItems, setQboItems] = useState<QBOItem[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  const [data, setData] = useState<QBOReportEnvelope | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthExpired, setOauthExpired] = useState(false);

  // Load filter options live from QBO on mount
  useEffect(() => {
    setLoadingFilters(true);
    Promise.all([
      fetchLiveCustomers(),
      fetchLiveAccounts(),
      fetchQBOItems(),
    ])
      .then(([custs, accts, items]) => {
        setCustomers(custs);
        setAccounts(accts);
        setQboItems(items);
      })
      .catch(console.error)
      .finally(() => setLoadingFilters(false));
  }, []);

  const handleDatePreset = (id: DatePreset) => {
    const preset = DATE_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const r = preset.range();
    setStartDate(r.start);
    setEndDate(r.end);
    setDatePreset(id);
  };

  const handleStartDate = (v: string) => {
    setStartDate(v);
    setDatePreset(detectPreset(v, endDate));
  };

  const handleEndDate = (v: string) => {
    setEndDate(v);
    setDatePreset(detectPreset(startDate, v));
  };

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOauthExpired(false);
    setSearched(true);
    try {
      const filters: GLFilters = {
        startDate,
        endDate,
        accountingMethod,
      };
      if (selectedCustomer) filters.customer = selectedCustomer;
      if (selectedAccount) filters.account = selectedAccount;
      if (selectedItems.length > 0) filters.item = selectedItems.join(",");
      const res = await fetchGeneralLedgerFiltered(filters);
      setData(res);
    } catch (e) {
      if (isQBOOAuthExpired(e)) setOauthExpired(true);
      setError(e instanceof Error ? e.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedCustomer, selectedAccount, selectedItems, accountingMethod]);

  const [jeModalOpen, setJeModalOpen] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [drawerDetail, setDrawerDetail] = useState<QBOTransactionDetail | null>(null);

  const handleRowClick = useCallback(async ({ txnId, txnType }: QBORowClickPayload) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerError(null);
    setDrawerDetail(null);
    try {
      const detail = await fetchQBOTransaction(txnId, txnType);
      setDrawerDetail(detail);
    } catch (e) {
      setDrawerError(e instanceof Error ? e.message : "Could not load transaction from QBO.");
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  // Run initial search on mount once filters are loaded
  const didInit = useRef(false);
  useEffect(() => {
    if (!loadingFilters && !didInit.current) {
      didInit.current = true;
      void search();
    }
  }, [loadingFilters, search]);

  return (
    <PageTemplate>
      <div className="flex flex-col gap-3 w-fit min-w-full print:hidden">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title="General Ledger"
            description="Live QBO general ledger — concierge properties only. Pulled directly from QuickBooks on each search."
          />
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {data && (
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-[#013764] text-[#013764] hover:bg-[#F4F7FA] transition-colors"
              >
                Generate report
              </button>
            )}
            <button
              type="button"
              onClick={() => setJeModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#013764] text-white hover:bg-[#012a4d] transition-colors"
            >
              + Journal Entry
            </button>
          </div>
        </div>

        {/* ── Filter panel ─────────────────────────────────────────────── */}
        <div className="border border-[#E5E5E5] rounded-lg bg-white shadow-sm px-3 py-2.5">
          <div className="flex flex-wrap gap-2 items-end">
            {/* Property or Company */}
            <div className="flex flex-col">
              <FieldLabel>Property or Company</FieldLabel>
              <SearchableSelect
                value={selectedCustomer}
                onChange={setSelectedCustomer}
                options={customers.map((c) => ({ value: c.id, label: c.display_name }))}
                allLabel="All"
                disabled={loadingFilters}
                className="min-w-[150px]"
                popoverWidth={360}
              />
            </div>

            {/* Accounts */}
            <div className="flex flex-col">
              <FieldLabel>Accounts</FieldLabel>
              <SearchableSelect
                value={selectedAccount}
                onChange={setSelectedAccount}
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                allLabel="All accounts"
                disabled={loadingFilters}
                className="min-w-[150px]"
              />
            </div>

            {/* QBO Items (passthrough categories) */}
            <div className="flex flex-col">
              <FieldLabel>Item / Category</FieldLabel>
              <SearchableSelect
                multiSelect
                value={selectedItems}
                onChange={setSelectedItems}
                options={qboItems.map((item) => ({ value: item.qbo_item_id, label: item.fully_qualified_name }))}
                allLabel="All items"
                disabled={loadingFilters}
                className="min-w-[150px]"
              />
            </div>

            {/* Date Range preset */}
            <div className="flex flex-col">
              <FieldLabel>Date Range</FieldLabel>
              <NativeSelect
                value={datePreset}
                onChange={(v) => {
                  if (v === "custom") {
                    setDatePreset("custom");
                  } else {
                    handleDatePreset(v as DatePreset);
                  }
                }}
                className="min-w-[110px]"
              >
                {DATE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
                <option value="custom">Custom</option>
              </NativeSelect>
            </div>

            {/* From date */}
            <div className="flex flex-col">
              <FieldLabel>From</FieldLabel>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDate(e.target.value)}
                className="border border-[#E5E5E5] rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764]"
              />
            </div>

            {/* To date */}
            <div className="flex flex-col">
              <FieldLabel>To</FieldLabel>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDate(e.target.value)}
                className="border border-[#E5E5E5] rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764]"
              />
            </div>

            {/* Accounting Basis — pill toggle */}
            <div className="flex flex-col">
              <FieldLabel>Basis</FieldLabel>
              <div className="flex rounded-md border border-[#E5E5E5] overflow-hidden">
                {(["Cash", "Accrual"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAccountingMethod(m)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium transition-colors",
                      accountingMethod === m
                        ? "bg-[#013764] text-white"
                        : "bg-white text-[#525252] hover:bg-[#F4F7FA]",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="flex flex-col justify-end ml-auto">
              <button
                type="button"
                onClick={() => void search()}
                disabled={loading}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  loading
                    ? "bg-[#013764]/60 text-white cursor-not-allowed"
                    : "bg-[#013764] text-white hover:bg-[#012a4d]",
                )}
              >
                {loading ? "Loading…" : "Search"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Error / OAuth states ──────────────────────────────────────── */}
        {error && !oauthExpired && (
          <div className="border border-rose-200 bg-rose-50 text-rose-700 rounded-md px-4 py-3 text-sm flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void search()}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-rose-300 bg-white text-rose-700 hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        )}

        {oauthExpired && (
          <div className="border border-amber-200 bg-amber-50 text-amber-900 rounded-md px-4 py-3 text-sm">
            QBO authorization has expired. Reconnect the QBO integration to continue viewing reports.
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-sm text-[#717179]">
            Pulling from QuickBooks…
          </div>
        )}

        {!loading && searched && !error && data && (
          <QBOReportView
            report={data.report}
            onRowClick={(payload) => void handleRowClick(payload)}
          />
        )}

        <QBOTransactionDrawer
          open={drawerOpen}
          loading={drawerLoading}
          error={drawerError}
          detail={drawerDetail}
          onClose={() => setDrawerOpen(false)}
          onMutated={() => void search()}
        />

        {!loading && !searched && (
          <div className="border border-dashed border-[#E5E5E5] rounded-lg py-12 text-center text-sm text-[#717179]">
            Select your filters and click Search to load the general ledger.
          </div>
        )}
      </div>

      {/* Print-only root — outside print:hidden wrapper so it renders during window.print() */}
      {!loading && searched && !error && data && (
        <div id="gl-print-root" style={{ display: "none" }}>
          <div className="gl-print-header">
            <h1>General Ledger</h1>
            <p>
              {data.start_date} → {data.end_date}
              {selectedCustomer
                ? ` · ${customers.find((c) => c.id === selectedCustomer)?.display_name ?? selectedCustomer}`
                : ""}
              {selectedAccount
                ? ` · Account: ${accounts.find((a) => a.id === selectedAccount)?.name ?? selectedAccount}`
                : ""}
              {" · "}{accountingMethod} basis
              {" · "}Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <QBOReportView
            report={data.report}
            onRowClick={() => {}}
          />
        </div>
      )}

      <CreateJournalEntryModal
        open={jeModalOpen}
        accounts={accounts}
        customers={customers}
        onClose={() => setJeModalOpen(false)}
        onCreated={() => void search()}
      />
    </PageTemplate>
  );
}
