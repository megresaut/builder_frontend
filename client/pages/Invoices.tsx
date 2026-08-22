import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import { PageHeader } from "@/components/BillsPageHeader";
import GlobalTable from "@/components/GlobalTable";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import { useSortingTable } from "@/hooks/useSortingTable";
import { usePageState } from "@/hooks/usePageState";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  fetchPortfolioInvoices,
  voidInvoice,
  getInvoiceRefunds,
  type InvoiceStatus,
  type PortfolioInvoiceRow,
  type QBOPushStatus,
} from "@/data/invoices";
import RefundInvoiceModal from "@/components/RefundInvoiceModal";

type TabKey = "all" | "outstanding" | "paid" | "draft" | "void";

const TABS: { id: TabKey; label: string }[] = [
  { id: "all", label: "All" },
  { id: "outstanding", label: "Outstanding" },
  { id: "paid", label: "Paid" },
  { id: "draft", label: "Drafts" },
  { id: "void", label: "Void" },
];

const TAB_TITLE: Record<TabKey, string> = {
  all: "All Invoices",
  outstanding: "Outstanding Invoices",
  paid: "Paid Invoices",
  draft: "Draft Invoices",
  void: "Void Invoices",
};

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft: "bg-slate-50 text-slate-700 border-slate-200",
  ready: "bg-sky-50 text-sky-700 border-sky-200",
  sent: "bg-amber-50 text-amber-800 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  void: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  sent: "Sent",
  paid: "Paid",
  void: "Void",
};

const QBO_BADGE: Record<QBOPushStatus, string> = {
  pushed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  not_pushed: "bg-slate-50 text-slate-700 border-slate-200",
};

const QBO_LABEL: Record<QBOPushStatus, string> = {
  pushed: "✓ Synced",
  failed: "✗ Failed",
  not_pushed: "— Not synced",
};

const formatCents = (cents: number): string =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatMonth = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
};

const formatMonthShort = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
};

// Coerce invoice_month (ISO date) → "YYYY-MM" key, used both as the month
// filter value and to populate the month dropdown.
const monthKey = (iso: string): string => iso.slice(0, 7);

// Mirrors the backend portfolioCutoff in invoicing/repository/postgres.go.
// The portfolio view ignores invoices dated before this — they live in the
// per-property history page instead. Update both in sync if the cutoff moves.
const PORTFOLIO_CUTOFF_LABEL = "May 2026";

// Column icons mirror the Bills table styling (16px stroked lucide-style SVGs).
const IconHash = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" x2="20" y1="9" y2="9" />
    <line x1="4" x2="20" y1="15" y2="15" />
    <line x1="10" x2="8" y1="3" y2="21" />
    <line x1="16" x2="14" y1="3" y2="21" />
  </svg>
);

const IconHome = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconCalendar = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </svg>
);

const IconCircleCheck = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconSync = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.4 2.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.4-2.7L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

const IconDollar = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const COLUMNS = [
  { key: "invoice", label: "Invoice", icon: IconHash },
  { key: "property", label: "Property", icon: IconHome },
  { key: "month", label: "Month", icon: IconCalendar },
  { key: "status", label: "Status", icon: IconCircleCheck },
  { key: "qboSync", label: "QBO Sync", icon: IconSync },
  { key: "total", label: "Total", icon: IconDollar },
  { key: "paid", label: "Paid", icon: IconDollar },
  { key: "paymentDate", label: "Payment Date", icon: IconCalendar },
  { key: "reference", label: "Reference", icon: IconHash },
];

const COLUMN_KEYS = COLUMNS.map((c) => c.key);

// Augmented row: the GlobalTable sorting hook reads `row[columnKey]`, so we
// expose a sortable alias for each column key alongside the original invoice
// fields (which renderCell reads from).
type InvoiceTableRow = PortfolioInvoiceRow & {
  invoice: number;
  property: string;
  month: string;
  qboSync: QBOPushStatus;
  total: number;
  paid: number;
  paymentDate: string;
  reference: string;
};

export default function Invoices() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [showFilterBar, setShowFilterBar] = usePageState(
    "invoicesShowFilterBar",
    false,
  );

  const [currentPage, setCurrentPage] = usePageState("invoicesCurrentPage", 1);
  const [itemsPerPage, setItemsPerPage] = usePageState("invoicesItemsPerPage", 50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = usePageState(
    "invoicesShowPageSizeDropdown",
    false,
  );
  const [openMenuId, setOpenMenuId] = usePageState<number | null>(
    "invoicesOpenMenuId",
    null,
  );

  const [rows, setRows] = useState<PortfolioInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumped to force a refetch after mutations (e.g. voiding an invoice).
  const [refreshTick, setRefreshTick] = useState(0);

  // Refetch whenever the month filter changes — pushed to the server so the
  // SQL is filtered at the DB level. Tab + search stay client-side because
  // they're cheap and don't impact the request shape.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPortfolioInvoices(monthFilter === "all" ? {} : { month: monthFilter })
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load invoices");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [monthFilter, refreshTick]);

  // Distinct months from the data so the dropdown reflects what actually
  // exists. When a month filter is active the dropdown still shows the full
  // set from the last "all months" fetch — we cache by accumulating.
  const [monthOptions, setMonthOptions] = useState<string[]>([]);
  useEffect(() => {
    if (monthFilter !== "all") return;
    const set = new Set<string>();
    rows.forEach((r) => set.add(monthKey(r.invoice_month)));
    setMonthOptions(Array.from(set).sort((a, b) => b.localeCompare(a)));
  }, [rows, monthFilter]);

  // Reset to page 1 whenever the tab / search / month changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [tab, search, monthFilter]);

  const filtered = useMemo<InvoiceTableRow[]>(() => {
    return rows
      .filter((inv) => {
        if (tab === "outstanding" && inv.status !== "sent") return false;
        if (tab === "paid" && inv.status !== "paid") return false;
        if (tab === "draft" && inv.status !== "draft" && inv.status !== "ready")
          return false;
        if (tab === "void" && inv.status !== "void") return false;

        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const hit =
            inv.property_address.toLowerCase().includes(q) ||
            String(inv.id).includes(q) ||
            (inv.qbo_invoice_id ?? "").toLowerCase().includes(q) ||
            (inv.payment_reference ?? "").toLowerCase().includes(q);
          if (!hit) return false;
        }
        return true;
      })
      .map((inv) => ({
        ...inv,
        invoice: inv.id,
        property: inv.property_address,
        month: inv.invoice_month,
        qboSync: inv.qbo_push_status,
        total: inv.total_amount_cents,
        paid: inv.payment_amount_cents ?? -1,
        paymentDate: inv.payment_recorded_at ?? "",
        reference: inv.payment_reference ?? "",
      }));
  }, [rows, tab, search]);

  const summary = useMemo(() => {
    let billedCents = 0;
    let paidCents = 0;
    let outstandingCents = 0;
    let qboFailedCount = 0;

    filtered.forEach((inv) => {
      if (inv.status !== "void") billedCents += inv.total_amount_cents;
      if (inv.status === "paid")
        paidCents += inv.payment_amount_cents ?? inv.total_amount_cents;
      if (inv.status === "sent") outstandingCents += inv.total_amount_cents;
      if (inv.qbo_push_status === "failed") qboFailedCount += 1;
    });

    return {
      count: filtered.length,
      billedCents,
      paidCents,
      outstandingCents,
      qboFailedCount,
    };
  }, [filtered]);

  const sortingHook = useSortingTable(filtered, "portfolioInvoices");
  const columnManagementHook = useColumnManagement(COLUMN_KEYS);
  const {
    visibleColumns,
    showColumnModal,
    setShowColumnModal,
    columnMenuPos,
    columnButtonRef,
    toggleColumnVisibility,
  } = columnManagementHook;

  const [refundTarget, setRefundTarget] = useState<InvoiceTableRow | null>(
    null,
  );
  const [refundAlreadyCents, setRefundAlreadyCents] = useState(0);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  const handleRefund = async (inv: InvoiceTableRow) => {
    if (inv.status !== "paid") {
      toast.error("Only paid invoices can be refunded.");
      return;
    }
    try {
      const { total_refunded_cents } = await getInvoiceRefunds(inv.id);
      setRefundTarget(inv);
      setRefundAlreadyCents(total_refunded_cents);
      setRefundModalOpen(true);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Failed to load refund status for invoice #${inv.id}`,
      );
    }
  };

  const handleVoid = async (inv: InvoiceTableRow) => {
    if (inv.status === "paid") {
      toast.error("Paid invoices cannot be voided.");
      return;
    }
    if (
      !confirm(
        `Void invoice #${inv.id} for ${inv.property_address}? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await voidInvoice(inv.id);
      toast.success(`Invoice #${inv.id} voided.`);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to void invoice #${inv.id}`,
      );
    }
  };

  const renderCell = (inv: InvoiceTableRow, columnKey: string) => {
    switch (columnKey) {
      case "invoice":
        return (
          <div className="whitespace-nowrap">
            <div className="text-gray-900 font-medium text-sm">#{inv.id}</div>
            {inv.qbo_invoice_id && (
              <div className="text-[11px] text-gray-500">QBO {inv.qbo_invoice_id}</div>
            )}
          </div>
        );
      case "property":
        return (
          <span
            className="text-gray-900 font-normal text-sm block truncate max-w-[260px]"
            title={inv.property_address}
          >
            {inv.property_address}
          </span>
        );
      case "month":
        return (
          <span className="text-gray-900 font-normal text-sm whitespace-nowrap">
            {formatMonth(inv.invoice_month)}
          </span>
        );
      case "status":
        return <StatusBadge status={inv.status} />;
      case "qboSync":
        return <QBOStatusCell row={inv} />;
      case "total":
        return (
          <span className="text-gray-900 font-medium text-sm tabular-nums">
            {formatCents(inv.total_amount_cents)}
          </span>
        );
      case "paid":
        return inv.payment_amount_cents != null ? (
          <span
            className={cn(
              "text-sm tabular-nums",
              inv.payment_amount_cents < inv.total_amount_cents
                ? "text-amber-700"
                : "text-gray-900",
            )}
          >
            {formatCents(inv.payment_amount_cents)}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        );
      case "paymentDate":
        return (
          <span className="text-gray-900 font-normal text-sm whitespace-nowrap">
            {formatDate(inv.payment_recorded_at)}
          </span>
        );
      case "reference":
        return (
          <span
            className="text-gray-900 font-normal text-sm block truncate max-w-[180px]"
            title={inv.payment_reference ?? undefined}
          >
            {inv.payment_reference ?? "—"}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        <PageHeader
          title="Invoices"
          description={`Portfolio-wide view of invoices issued to property owners, ${PORTFOLIO_CUTOFF_LABEL} onward. Tracks lifecycle status, QBO sync state, and payments across every property.`}
        />

        {/* Tabs */}
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

        {/* Summary tiles (KPIs) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryTile
            label="Invoices"
            value={summary.count.toString()}
            hint={
              monthFilter === "all"
                ? `since ${PORTFOLIO_CUTOFF_LABEL}`
                : `for ${formatMonthShort(`${monthFilter}-01`)}`
            }
          />
          <SummaryTile
            label="Billed"
            value={formatCents(summary.billedCents)}
            hint="excludes void"
          />
          <SummaryTile
            label="Outstanding"
            value={formatCents(summary.outstandingCents)}
            hint="sent, not yet paid"
            tone={summary.outstandingCents > 0 ? "warning" : "neutral"}
          />
          <SummaryTile
            label="QBO sync issues"
            value={summary.qboFailedCount.toString()}
            hint="invoices failed to push"
            tone={summary.qboFailedCount > 0 ? "danger" : "neutral"}
          />
        </div>

        {error && <div className="text-sm text-rose-600">{error}</div>}

        {/* Filter bar — toggled by the Filter button in the table header */}
        {showFilterBar && (
          <div
            className="flex flex-wrap items-center gap-4 px-6 py-4 border border-[#E5E5E5] rounded-lg bg-gray-50/80"
            style={{ borderColor: "var(--color-border-light)" }}
          >
            <span className="text-sm font-medium text-[#303030] shrink-0">
              Filter by
            </span>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#717179] whitespace-nowrap">
                Month
              </label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-[#DADADA] bg-white text-sm text-[#303030] min-w-[150px]"
              >
                <option value="all">All ({PORTFOLIO_CUTOFF_LABEL}+)</option>
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthShort(`${m}-01`)}
                  </option>
                ))}
              </select>
            </div>
            {monthFilter !== "all" && (
              <button
                type="button"
                onClick={() => setMonthFilter("all")}
                className="h-9 px-3 rounded-lg border border-[#DADADA] bg-white text-sm font-medium text-[#303030] hover:bg-gray-100 shrink-0"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <GlobalTable
          columns={COLUMNS}
          data={filtered}
          rowKey="id"
          renderCell={renderCell}
          onRowClick={(inv: InvoiceTableRow) =>
            navigate(`/property/${inv.property_id}/Invoicing`)
          }
          sortingHook={sortingHook}
          columnManagementHook={columnManagementHook}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
          showPageSizeDropdown={showPageSizeDropdown}
          onShowPageSizeDropdownChange={setShowPageSizeDropdown}
          openMenuId={openMenuId}
          onOpenMenuIdChange={setOpenMenuId}
          title={TAB_TITLE[tab]}
          emptyMessage={
            loading
              ? "Loading invoices…"
              : "No invoices match the current filters."
          }
          showSearchBar
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
          onFilterClick={() => {
            setShowPageSizeDropdown(false);
            setOpenMenuId(null);
            setShowFilterBar(!showFilterBar);
          }}
          headerActions={
            <>
              <button
                ref={columnButtonRef}
                onClick={() => {
                  setShowPageSizeDropdown(false);
                  setOpenMenuId(null);
                  setShowColumnModal((prev) => !prev);
                }}
                className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="3" r="1.5" fill="var(--color-text-primary)" />
                  <circle cx="8" cy="8" r="1.5" fill="var(--color-text-primary)" />
                  <circle cx="8" cy="13" r="1.5" fill="var(--color-text-primary)" />
                </svg>
              </button>
            </>
          }
          actions={[
            {
              label: "Void",
              hidden: (inv: InvoiceTableRow) =>
                inv.status === "paid" || inv.status === "void",
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.724 12.3895C13.6451 13.5732 13.6057 14.165 13.35 14.6138C13.1249 15.0088 12.7854 15.3265 12.3762 15.5248C11.9115 15.75 11.3183 15.75 10.132 15.75H7.86799C6.68168 15.75 6.08852 15.75 5.62375 15.5248C5.21457 15.3265 4.87507 15.0088 4.64999 14.6138C4.39433 14.165 4.35488 13.5732 4.27596 12.3895L3.75 4.5"
                    stroke="var(--color-status-error)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
              onClick: (inv: InvoiceTableRow) => handleVoid(inv),
            },
            {
              label: "Refund",
              hidden: (inv: InvoiceTableRow) => inv.status !== "paid",
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4.5 8.25L2.25 6M2.25 6L4.5 3.75M2.25 6H11.25C13.3211 6 15 7.67893 15 9.75C15 11.8211 13.3211 13.5 11.25 13.5H6"
                    stroke="var(--color-text-primary)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
              onClick: (inv: InvoiceTableRow) => handleRefund(inv),
            },
          ]}
          showColumnModal={showColumnModal}
          onShowColumnModalChange={setShowColumnModal}
        />
      </div>

      {/* Column Filter Modal */}
      <ColumnFilterModal
        isOpen={showColumnModal}
        position={columnMenuPos}
        columns={COLUMNS.map((col) => ({
          key: col.key,
          label: col.label,
          icon: col.icon || null,
        }))}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumnVisibility}
        onClose={() => setShowColumnModal(false)}
        buttonRef={columnButtonRef}
      />

      {refundTarget && (
        <RefundInvoiceModal
          open={refundModalOpen}
          onOpenChange={setRefundModalOpen}
          invoice={refundTarget}
          alreadyRefundedCents={refundAlreadyCents}
          onRefunded={() => setRefreshTick((t) => t + 1)}
        />
      )}
    </PageTemplate>
  );
}

function SummaryTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-rose-200 bg-rose-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : "border-[#E5E5E5] bg-white";
  return (
    <div className={cn("rounded-md border p-4 flex flex-col gap-1", toneClass)}>
      <span className="text-xs font-medium text-[#717179] uppercase tracking-wide">
        {label}
      </span>
      <span className="text-xl font-semibold text-[#303030] tabular-nums">
        {value}
      </span>
      {hint && <span className="text-xs text-[#717179]">{hint}</span>}
    </div>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 text-xs rounded-full border",
        STATUS_BADGE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function QBOStatusCell({ row }: { row: PortfolioInvoiceRow }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={cn(
          "inline-block px-2 py-0.5 text-xs rounded-full border w-fit",
          QBO_BADGE[row.qbo_push_status],
        )}
        title={row.qbo_last_error ?? undefined}
      >
        {QBO_LABEL[row.qbo_push_status]}
      </span>
      {row.status === "paid" && (
        <span
          className={cn(
            "inline-block px-2 py-0.5 text-[10px] rounded-full border w-fit",
            QBO_BADGE[row.qbo_payment_push_status],
          )}
        >
          Payment {QBO_LABEL[row.qbo_payment_push_status].toLowerCase()}
        </span>
      )}
    </div>
  );
}
