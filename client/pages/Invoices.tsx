import { useEffect, useMemo, useState } from "react";
import PageTemplate from "@/layout/PageTemplate";
import { PageHeader } from "@/components/BillsPageHeader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  fetchPortfolioInvoices,
  voidInvoice,
  type InvoiceStatus,
  type PortfolioInvoiceRow,
  type QBOPushStatus,
} from "@/data/invoices";

type TabKey = "all" | "outstanding" | "paid" | "draft" | "void";

const TABS: { id: TabKey; label: string }[] = [
  { id: "all", label: "All" },
  { id: "outstanding", label: "Outstanding" },
  { id: "paid", label: "Paid" },
  { id: "draft", label: "Drafts" },
  { id: "void", label: "Void" },
];

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

export default function Invoices() {
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  const [rows, setRows] = useState<PortfolioInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [voidingId, setVoidingId] = useState<number | null>(null);

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

  const filtered = useMemo(() => {
    return rows.filter((inv) => {
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
    });
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

  const handleVoid = async (inv: PortfolioInvoiceRow) => {
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
    setVoidingId(inv.id);
    try {
      await voidInvoice(inv.id);
      toast.success(`Invoice #${inv.id} voided.`);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to void invoice #${inv.id}`,
      );
    } finally {
      setVoidingId(null);
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

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end">
          <label className="flex flex-col gap-1 grow max-w-md">
            <span className="text-xs font-medium text-[#525252]">Search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Property, invoice #, QBO id, or payment ref…"
              className="border border-[#E5E5E5] rounded-md px-3 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#525252]">Month</span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="border border-[#E5E5E5] rounded-md px-2 py-1.5 text-sm bg-white"
            >
              <option value="all">All ({PORTFOLIO_CUTOFF_LABEL}+)</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {formatMonthShort(`${m}-01`)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setRefreshTick((t) => t + 1)}
            disabled={loading}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md border border-[#E5E5E5] bg-white",
              loading
                ? "text-[#717179] cursor-not-allowed"
                : "text-[#303030] hover:bg-[#F8F8F8]",
            )}
          >
            ↻ Refresh
          </button>
          {loading && (
            <div className="text-sm text-[#717179] pb-1.5">Loading…</div>
          )}
        </div>

        {error && <div className="text-sm text-rose-600">{error}</div>}

        {/* Summary tiles */}
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

        {/* Table */}
        {!loading && !error && filtered.length === 0 ? (
          <div className="text-sm text-[#717179] py-12 text-center border border-dashed border-[#E5E5E5] rounded-md">
            No invoices match the current filters.
          </div>
        ) : (
          <InvoicesTable
            rows={filtered}
            onVoid={handleVoid}
            voidingId={voidingId}
          />
        )}
      </div>
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

function InvoicesTable({
  rows,
  onVoid,
  voidingId,
}: {
  rows: PortfolioInvoiceRow[];
  onVoid: (inv: PortfolioInvoiceRow) => void;
  voidingId: number | null;
}) {
  return (
    <div className="border border-[#E5E5E5] rounded-md overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-[#F8F8F8] text-[#717179] text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Invoice</th>
            <th className="text-left px-4 py-3 font-medium">Property</th>
            <th className="text-left px-4 py-3 font-medium">Month</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-left px-4 py-3 font-medium">QBO Sync</th>
            <th className="text-right px-4 py-3 font-medium">Total</th>
            <th className="text-right px-4 py-3 font-medium">Paid</th>
            <th className="text-left px-4 py-3 font-medium">Payment Date</th>
            <th className="text-left px-4 py-3 font-medium">Reference</th>
            <th className="text-right px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((inv) => {
            const canVoid =
              inv.status !== "paid" && inv.status !== "void";
            const isVoiding = voidingId === inv.id;
            return (
              <tr
                key={inv.id}
                className="border-t border-[#E5E5E5] align-top hover:bg-[#FAFAFA]"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-[#303030] font-medium">#{inv.id}</div>
                  {inv.qbo_invoice_id && (
                    <div className="text-[11px] text-[#717179]">
                      QBO {inv.qbo_invoice_id}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-[#303030] max-w-[260px]">
                  <div className="truncate" title={inv.property_address}>
                    {inv.property_address}
                  </div>
                </td>
                <td className="px-4 py-3 text-[#717179] whitespace-nowrap">
                  {formatMonth(inv.invoice_month)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={inv.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <QBOStatusCell row={inv} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-[#303030]">
                  {formatCents(inv.total_amount_cents)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {inv.payment_amount_cents != null ? (
                    <span
                      className={cn(
                        inv.payment_amount_cents < inv.total_amount_cents
                          ? "text-amber-700"
                          : "text-[#303030]",
                      )}
                    >
                      {formatCents(inv.payment_amount_cents)}
                    </span>
                  ) : (
                    <span className="text-[#A0A0A0]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#717179] whitespace-nowrap">
                  {formatDate(inv.payment_recorded_at)}
                </td>
                <td className="px-4 py-3 text-[#525252] max-w-[180px]">
                  <div
                    className="truncate"
                    title={inv.payment_reference ?? undefined}
                  >
                    {inv.payment_reference ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onVoid(inv)}
                    disabled={!canVoid || isVoiding}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-md border",
                      canVoid && !isVoiding
                        ? "border-rose-200 text-rose-700 bg-white hover:bg-rose-50"
                        : "border-[#E5E5E5] text-[#A0A0A0] cursor-not-allowed",
                    )}
                    title={
                      !canVoid
                        ? inv.status === "paid"
                          ? "Paid invoices cannot be voided"
                          : "Already void"
                        : "Void invoice"
                    }
                  >
                    {isVoiding ? "Voiding…" : "Void"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
