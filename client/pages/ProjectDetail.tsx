import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import { usePropertyBreadcrumb } from "@/hooks/PropertyBreadcrumbContext";
import { fetchJSON, API_BASE } from "@/api/fetchJSON";
import {
  getProjectSummary,
  updateProject,
  putBudget,
  putMilestones,
  setTaskMilestone,
  attachTasks,
  detachTask,
  listUnassignedTasks,
  createChangeOrder,
  updateChangeOrder,
  putSchedule,
  listPayments,
  createPayment,
  getCashFlow,
  listQuotes,
  createQuote,
  updateQuote,
  deleteQuote,
  analyzeQuote,
  listProjectInvoices,
  getProjectInvoice,
  createProjectInvoice,
  sendProjectInvoice,
  recordInvoicePayment,
  voidProjectInvoice,
  pushInvoiceToQbo,
  getBillables,
  acceptQuote,
  listProjectFiles,
  uploadProjectFile,
  deleteProjectFile,
  listProjectBills,
  uploadPaymentReceipt,
  getPaymentAllocations,
  putPaymentAllocations,
  searchVendors,
  formatUSD,
  formatUSDPrecise,
  PROJECT_STATUS_META,
  CHANGE_ORDER_STATUS_META,
  WORK_ORDER_STATUS_META,
  FTO_STATUS_META,
  MILESTONE_STATUS_META,
  type ProjectSummary,
  type ProjectStatus,
  type ChangeOrder,
  type ChangeOrderStatus,
  type ScheduleLine,
  type UnassignedTask,
  type CashFlowEntry,
  type ProjectPayment,
  type PaymentKind,
  type WorkOrderStatus,
  type FTOStatus,
  type ProjectQuote,
  type QuoteStatus,
  type QuoteVerdict,
  type ProjectInvoice,
  type ProjectInvoiceStatus,
  type ProjectInvoiceLine,
  type PaymentInstallment,
  type Billables,
  type CreateInvoiceLineInput,
  type InstallmentInput,
  type InstallmentBasis,
  type BudgetCategory,
  type VendorFinancialSummary,
  type ProjectFileRow,
  type ProjectFileSource,
  type ProjectBillRow,
  type PaymentAllocation,
  type VendorLite,
} from "@/data/projects";
import {
  BudgetEditor,
  MilestonesEditor,
  categoriesToDrafts,
  milestonesToDrafts,
  draftsToBudgetPayload,
  draftsToMilestonesPayload,
  dollarsToCents,
  centsToInput,
  type CategoryDraft,
  type MilestoneDraft,
} from "@/components/projects/ProjectEditors";
import { SearchableSelect } from "@/components/SearchableSelect";
import PersonAvatars from "@/components/PersonAvatars";

type TabKey = "dashboard" | "maintenance" | "quotes" | "financials" | "files";
type MaintenanceSubTabKey = "tasks" | "work-orders" | "field-team";

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  // Meeting 2026-07: tasks/WOs/FTOs collapsed under one "Work" tab (filter pills inside).
  { key: "maintenance", label: "Work" },
  // Two-lane money model: "Payables" = vendor lane (budget plan, quotes, vendor payment
  // schedules, spend); "Receivables" = client lane (payment schedule, project invoices,
  // receipts); Cash Flow = where the lanes meet. Siloed from monthly invoicing per
  // PROJECT_INVOICING_SPEC.md. The old SOV/draws BillingTab was retired in the project-financials build.
  // Quotes = pre-commitment (bidding); accepting one feeds Payables (budget + vendor schedule).
  { key: "quotes", label: "Quotes" },
  // "Financials" is the single money tab: it consolidated + replaced the former
  // Payables / Receivables / Cash Flow tabs. Vendor bills paid out (via the
  // project's work orders), client payments in, and invoice create/send/push —
  // all here. Siloed from monthly invoicing.
  { key: "financials", label: "Financials" },
  { key: "files", label: "Files" },
];

const MAINTENANCE_SUBTABS: { key: MaintenanceSubTabKey; label: string }[] = [
  { key: "tasks", label: "Tasks" },
  { key: "work-orders", label: "Work Orders" },
  { key: "field-team", label: "Field Team Orders" },
];

/* ------------------------------- primitives ------------------------------- */

type Accent = "navy" | "violet" | "blue" | "green" | "amber" | "red";

const ACCENTS: Record<Accent, { fg: string; bg: string }> = {
  navy: { fg: "#013764", bg: "#E8EEF4" },
  violet: { fg: "#7C3AED", bg: "#F1EBFD" },
  blue: { fg: "#2563EB", bg: "#E7EEFE" },
  green: { fg: "#16A34A", bg: "#E7F6EC" },
  amber: { fg: "#D97706", bg: "#FCF2E1" },
  red: { fg: "#DC2626", bg: "#FCEAEA" },
};

function KpiIcon({ accent }: { accent: Accent }) {
  const { fg, bg } = ACCENTS[accent];
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: bg }}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: fg }} />
    </span>
  );
}

function KpiCard({
  label,
  value,
  subtitle,
  accent = "navy",
  valueColor,
}: {
  label: string;
  value: string;
  subtitle?: string;
  accent?: Accent;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</div>
        <KpiIcon accent={accent} />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums" style={{ color: valueColor ?? "#111827" }}>
        {value}
      </div>
      {subtitle && <div className="mt-0.5 text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
}

function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function Pill({ label, text, bg }: { label: string; text: string; bg: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ color: text, backgroundColor: bg }}>
      {label}
    </span>
  );
}

// SegmentedControl — a contained iOS-style segmented toggle (gray track, white
// active thumb, optional count badges). Replaces the loose pill rows on the
// Files filter and the Work sub-toggle for a calmer, more grouped look.
function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { key: T; label: string; count?: number }[];
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-7" : "h-8";
  const txt = size === "sm" ? "text-xs" : "text-sm";
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5" role="tablist">
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.key)}
            className={`${h} ${txt} rounded-md px-3 font-medium transition-colors ${
              active ? "bg-white text-[#013764] shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span className={`ml-1.5 tabular-nums ${active ? "text-gray-400" : "text-gray-400"}`}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// QboStatusBadge (Package C) — the receivable-side push status of a project
// invoice: pushed (green), error (red), or not yet pushed (neutral).
function QboStatusBadge({ invoice }: { invoice: ProjectInvoice }) {
  if (invoice.qbo_push_status === "pushed") {
    return <Pill label="Pushed" text="#047857" bg="#D1FAE5" />;
  }
  if (invoice.qbo_push_status === "error") {
    return <Pill label="Error" text="#B91C1C" bg="#FEE2E2" />;
  }
  return <span className="text-xs text-gray-400">—</span>;
}

function Dot({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 whitespace-nowrap">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function Bar({ percent, color = "#013764" }: { percent: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden min-w-[80px]">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: color }} />
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700">
      {initials}
    </span>
  );
}

// Real task priority enum (low|medium|high|urgent); medium displays as "Normal"
// per the §8 parity table.
const priorityMeta: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "#6B7280" },
  medium: { label: "Normal", color: "#2563EB" },
  high: { label: "High", color: "#D97706" },
  urgent: { label: "Urgent", color: "#DC2626" },
};
const priorityDisplay = (p: string) => priorityMeta[p] ?? { label: p, color: "#6B7280" };

// Real task statuses (8 states) map to the 3 display buckets (§8 parity table):
// done = completed|closed, in-progress = in_progress|pending_vendor|scheduled,
// everything else = not started.
const taskStatusMeta: Record<string, { label: string; dot: string }> = {
  not_started: { label: "Not Started", dot: "#D97706" },
  in_progress: { label: "In Progress", dot: "#2563EB" },
  completed: { label: "Completed", dot: "#16A34A" },
};
function taskStatusBucket(status: string): "not_started" | "in_progress" | "completed" {
  if (status === "completed" || status === "closed") return "completed";
  if (status === "in_progress" || status === "pending_vendor" || status === "scheduled") return "in_progress";
  return "not_started";
}

const woStatusDisplay = (s: string) =>
  WORK_ORDER_STATUS_META[s as WorkOrderStatus] ?? { label: s, dot: "#9CA3AF" };
const ftoStatusDisplay = (s: string) =>
  FTO_STATUS_META[s as FTOStatus] ?? { label: s, dot: "#9CA3AF" };

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function formatMaybeDate(s: string | null): string {
  if (!s) return "No date";
  const d = new Date(DATE_ONLY.test(s) ? `${s}T00:00:00` : s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(s: string | null, withYear = false): string {
  if (!s) return "—";
  const d = new Date(DATE_ONLY.test(s) ? `${s}T00:00:00` : s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString(
    "en-US",
    withYear ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" },
  );
}

function errMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`py-2 pr-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500 ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

/* ------------------------------ modal shell ------------------------------- */

/**
 * Dialog focus management (a11y): remembers the trigger element, moves focus
 * into the dialog on open, traps Tab within it, closes on Escape, and restores
 * focus to the trigger on unmount. Returns a ref to attach to the dialog node.
 * Purely behavioral — no visual change.
 */
function useDialogFocus(onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prevFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusableSel =
      'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const first = dialog?.querySelector<HTMLElement>(focusableSel);
    (first ?? dialog)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSel)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === firstEl || active === dialog)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (prevFocused && document.contains(prevFocused)) prevFocused.focus();
    };
  }, [onClose]);
  return dialogRef;
}

function ModalShell({
  title,
  onClose,
  children,
  footer,
  maxWidth = "max-w-lg",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  maxWidth?: string;
}) {
  const titleId = useId();
  const dialogRef = useDialogFocus(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`flex max-h-[88vh] w-full ${maxWidth} flex-col rounded-2xl bg-white shadow-xl focus:outline-none`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">{footer}</div>
      </div>
    </div>
  );
}

const fieldCls = "w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-gray-900 focus:border-[#013764] focus:outline-none";
const labelCls = "text-xs font-medium text-gray-600";

/* ------------------------------ change order log -------------------------- */

function NewChangeOrderModal({
  projectId,
  onSaved,
  onClose,
}: {
  projectId: number;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"draft" | "pending_approval">("draft");
  const [saving, setSaving] = useState(false);
  const uid = useId();

  const submit = async () => {
    setSaving(true);
    try {
      await createChangeOrder(projectId, {
        description: description.trim(),
        reason: reason.trim(),
        amount_cents: Math.round((Number(amount) || 0) * 100),
        status,
      });
      toast.success("Change order created");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errMessage(e, "Failed to create change order"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="New change order"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="h-9 rounded-lg border border-[#DADADA] bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving} className="h-9 rounded-lg bg-[#013764] px-4 text-sm font-medium text-white hover:bg-[#003a73] disabled:opacity-50">
            {saving ? "Creating…" : "Create change order"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor={`${uid}-desc`} className={labelCls}>Description</label>
          <input id={`${uid}-desc`} className={`${fieldCls} mt-1`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Upgrade to quartzite countertops" />
        </div>
        <div>
          <label htmlFor={`${uid}-reason`} className={labelCls}>Reason</label>
          <input id={`${uid}-reason`} className={`${fieldCls} mt-1`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Owner selection change" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${uid}-amount`} className={labelCls}>Amount ($, ± allowed)</label>
            <input id={`${uid}-amount`} type="number" className={`${fieldCls} mt-1 text-right tabular-nums`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label htmlFor={`${uid}-status`} className={labelCls}>Status</label>
            <SearchableSelect
              className={`${fieldCls} mt-1`}
              value={status}
              onChange={(v) => setStatus((v || "draft") as "draft" | "pending_approval")}
              options={[
                { value: "draft", label: "Draft" },
                { value: "pending_approval", label: "Pending Approval" },
              ]}
              allLabel="Select status"
            />
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function ChangeOrderLog({ summary, onRefresh }: { summary: ProjectSummary; onRefresh: () => void }) {
  const [createOpen, setCreateOpen] = useState(false);
  const changeOrders = summary.change_orders;
  const approvedTotal = summary.financials.approved_change_orders_cents;
  const pendingTotal = changeOrders
    .filter((c) => c.status === "pending_approval" || c.status === "draft")
    .reduce((s, c) => s + c.amount_cents, 0);

  const transition = async (co: ChangeOrder, status: ChangeOrderStatus) => {
    try {
      await updateChangeOrder(summary.project.id, co.id, { status });
      toast.success(`${co.co_number} ${status === "pending_approval" ? "submitted for approval" : status}`);
      onRefresh();
    } catch (e) {
      toast.error(errMessage(e, "Failed to update change order"));
    }
  };

  return (
    <Card
      title="Change Order Log"
      action={
        <button onClick={() => setCreateOpen(true)} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          + New change order
        </button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-4 text-xs">
        <span className="text-gray-500">Original budget <span className="font-semibold text-gray-900">{formatUSD(summary.financials.original_budget_cents)}</span></span>
        <span className="text-gray-500">Approved COs <span className="font-semibold text-green-700">+{formatUSD(approvedTotal)}</span></span>
        <span className="text-gray-500">Pending / draft <span className="font-semibold text-amber-700">+{formatUSD(pendingTotal)}</span></span>
      </div>
      {changeOrders.length === 0 ? (
        <p className="text-sm text-gray-500">No change orders logged.</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {changeOrders.map((co) => {
            const meta = CHANGE_ORDER_STATUS_META[co.status];
            return (
              <div key={co.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm text-gray-900">
                    <span className="font-medium">{co.co_number}</span> · {co.description}
                  </div>
                  <div className="text-xs text-gray-500">{co.reason ? `${co.reason} · ` : ""}{formatMaybeDate(co.created_at)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {co.status === "draft" && (
                    <button onClick={() => transition(co, "pending_approval")} className="text-xs font-medium text-blue-600 hover:underline">
                      Submit
                    </button>
                  )}
                  {co.status === "pending_approval" && (
                    <>
                      <button onClick={() => transition(co, "approved")} className="text-xs font-medium text-green-700 hover:underline">
                        Approve
                      </button>
                      <button onClick={() => transition(co, "rejected")} className="text-xs font-medium text-red-600 hover:underline">
                        Reject
                      </button>
                    </>
                  )}
                  <span className="text-sm font-medium tabular-nums text-gray-900">
                    {co.amount_cents >= 0 ? "+" : ""}
                    {formatUSD(co.amount_cents)}
                  </span>
                  <Pill label={meta.label} text={meta.text} bg={meta.bg} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {createOpen && (
        <NewChangeOrderModal projectId={summary.project.id} onSaved={onRefresh} onClose={() => setCreateOpen(false)} />
      )}
    </Card>
  );
}

/* ------------------------------- milestones ------------------------------- */

function MilestonesCard({ summary, onEdit }: { summary: ProjectSummary; onEdit: () => void }) {
  const milestones = summary.milestones;
  const done = milestones.filter((m) => m.status === "complete").length;
  const catName = (id: number | null) => summary.budget.find((c) => c.id === id)?.name;

  return (
    <Card
      title="Milestones"
      action={
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{done}/{milestones.length} complete</span>
          <button onClick={onEdit} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">+ Milestone</button>
        </div>
      }
    >
      {milestones.length === 0 ? (
        <p className="text-sm text-gray-500">No milestones yet.</p>
      ) : (
        <ol className="relative flex flex-col">
          {milestones.map((m, i) => {
            const meta = MILESTONE_STATUS_META[m.status];
            const last = i === milestones.length - 1;
            const stats = m.task_stats;
            return (
              <li key={m.id} className="relative flex gap-3 pb-4 last:pb-0">
                {!last && <span className="absolute left-[7px] top-4 h-full w-px bg-gray-200" />}
                <span className="z-10 mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-white" style={{ backgroundColor: meta.dot, boxShadow: "0 0 0 1px #e5e7eb" }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-gray-900">{m.name}</span>
                    <Pill label={meta.label} text={meta.text} bg={meta.bg} />
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{formatMaybeDate(m.target_date)}</span>
                    {m.budget_item_id != null && catName(m.budget_item_id) && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">{catName(m.budget_item_id)}</span>
                    )}
                    {stats.total > 0 && (
                      <span className="text-gray-400">· {stats.done}/{stats.total} tasks</span>
                    )}
                  </div>
                  {stats.total > 0 && (
                    <div className="mt-1.5">
                      <Bar percent={stats.percent} color={meta.dot} />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

/* --------------------------------- budget --------------------------------- */

// Category-level spend indicator: a stacked bar (paid solid over committed
// lighter, budget = track) plus a "N% committed" label. Percent text shows the
// true committed/budget ratio (can exceed 100 when over-committed → amber); the
// bar itself is clamped at 100%.
function CategoryProgress({ amount, committed, spent }: { amount: number; committed: number; spent: number }) {
  const committedPct = amount > 0 ? (committed / amount) * 100 : 0;
  const paidPct = amount > 0 ? (spent / amount) * 100 : 0;
  const over = committedPct > 100;
  const committedColor = over ? "#FCD34D" : "#93C5FD";
  const paidColor = over ? "#B45309" : "#013764";
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 min-w-[80px]">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, committedPct)}%`, backgroundColor: committedColor }} />
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, paidPct)}%`, backgroundColor: paidColor }} />
      </div>
      <span className={`shrink-0 text-[11px] tabular-nums ${over ? "font-medium text-amber-600" : "text-gray-400"}`}>
        {Math.round(committedPct)}% committed
      </span>
    </div>
  );
}

// BudgetCard — the Dashboard's budget structure. View mode renders the real
// budget set at project creation (categories → sub-budgets) with a per-category
// spend indicator. "Edit" swaps in the same BudgetEditor the Update-project
// modal uses; Save calls putBudget then refreshes the summary.
function BudgetCard({
  projectId,
  budget,
  onRefresh,
}: {
  projectId: number;
  budget: BudgetCategory[];
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [categories, setCategories] = useState<CategoryDraft[]>(() => categoriesToDrafts(budget));
  const [saving, setSaving] = useState(false);
  const seq = useRef(1);

  const nextId = () => seq.current++;

  const beginEdit = () => {
    const drafts = categoriesToDrafts(budget);
    setCategories(drafts);
    seq.current = Math.max(0, ...drafts.flatMap((c) => [c.id, ...c.subBudgets.map((s) => s.id)])) + 1;
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await putBudget(projectId, draftsToBudgetPayload(categories));
      toast.success("Budget updated");
      onRefresh();
      setEditing(false);
    } catch (e) {
      toast.error(errMessage(e, "Failed to update budget"));
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <Card
        title="Budget"
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(false)} disabled={saving} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={save} disabled={saving} className="h-7 rounded-lg bg-[#013764] px-2.5 text-xs font-medium text-white hover:bg-[#003a73] disabled:opacity-50">{saving ? "Saving…" : "Save budget"}</button>
          </div>
        }
      >
        <BudgetEditor categories={categories} onChange={setCategories} newId={nextId} />
      </Card>
    );
  }

  return (
    <Card
      title="Budget"
      action={
        <button onClick={beginEdit} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Edit</button>
      }
    >
      {budget.length === 0 ? (
        <p className="text-sm text-gray-500">No budget set for this project yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {budget.map((cat) => (
            <div key={cat.id} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatUSD(cat.amount_cents)}</span>
              </div>
              <CategoryProgress amount={cat.amount_cents} committed={cat.committed_cents} spent={cat.spent_cents} />
              {cat.sub_budgets.length > 0 && (
                <div className="mt-2 flex flex-col gap-1 border-l border-gray-100 pl-3">
                  {cat.sub_budgets.map((sub) => (
                    <div key={sub.id} className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-gray-600">{sub.name}</span>
                      <span className="text-sm text-gray-700 tabular-nums">{formatUSD(sub.amount_cents)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* --------------------------------- tabs ----------------------------------- */


function DashboardTab({ summary, onEdit, onRefresh }: { summary: ProjectSummary; onEdit: () => void; onRefresh: () => void }) {
  const project = summary.project;
  const fin = summary.financials;
  const budget = fin.current_budget_cents;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      {/* main column */}
      <div className="flex flex-col gap-6 min-w-0">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          <KpiCard label="Total Budget" value={formatUSD(fin.current_budget_cents)} subtitle={fin.approved_change_orders_cents > 0 ? `${formatUSD(fin.original_budget_cents)} + ${formatUSD(fin.approved_change_orders_cents)} COs` : "No change orders"} accent="navy" />
          <KpiCard label="Committed" value={formatUSD(fin.committed_cents)} subtitle="booked bills" accent="amber" valueColor={fin.unpaid_committed_cents > 0 ? "#B45309" : undefined} />
          <KpiCard label="Remaining" value={formatUSD(fin.remaining_budget_cents)} subtitle="net of committed" accent="violet" valueColor={fin.remaining_budget_cents < 0 ? "#B91C1C" : undefined} />
          <KpiCard label="% Complete" value={`${project.percent_complete}%`} subtitle="Weighted across work" accent="blue" />
          <KpiCard label="Collected from Client" value={formatUSD(fin.collected_cents)} subtitle="Deposits + progress" accent="green" valueColor="#15803D" />
          <KpiCard label="Net Cash Position" value={formatUSD(fin.net_cash_cents)} subtitle="collected − paid" accent={fin.net_cash_cents >= 0 ? "green" : "red"} valueColor={fin.net_cash_cents >= 0 ? "#15803D" : "#B91C1C"} />
        </div>

        {/* Over/under-billing indicator: billed-to-client vs cost incurred (committed). */}
        {(fin.billed_to_date_cents > 0 || fin.committed_cents > 0) && (
          <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${fin.billed_vs_cost_cents >= 0 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <span className={`mt-0.5 ${fin.billed_vs_cost_cents >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
              {fin.billed_vs_cost_cents >= 0 ? "▲" : "▼"}
            </span>
            <div className="text-sm">
              <span className={`font-semibold ${fin.billed_vs_cost_cents >= 0 ? "text-emerald-800" : "text-amber-800"}`}>
                {fin.billed_vs_cost_cents >= 0 ? "Over-billing" : "Under-billing"} {formatUSD(Math.abs(fin.billed_vs_cost_cents))}
              </span>
              <span className="ml-1 text-gray-600">
                — billed {formatUSD(fin.billed_to_date_cents)} vs committed cost {formatUSD(fin.committed_cents)}.
              </span>
            </div>
          </div>
        )}

        {fin.pending_change_orders_count > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="mt-0.5 text-amber-600">⚠</span>
            <div>
              <div className="text-sm font-semibold text-amber-800">
                {fin.pending_change_orders_count} change order{fin.pending_change_orders_count > 1 ? "s" : ""} awaiting approval —{" "}
                {formatUSD(fin.pending_change_orders_cents)} not yet in the budget
              </div>
              <div className="mt-0.5 text-xs text-amber-700">
                Review under <span className="font-medium">Payables</span> — approve to fold the added cost into the budget before it surfaces on the final invoice.
              </div>
            </div>
          </div>
        )}

        <BudgetCard projectId={project.id} budget={summary.budget} onRefresh={onRefresh} />

        <MilestonesCard summary={summary} onEdit={onEdit} />
      </div>

      {/* right rail — project details */}
      <div className="flex flex-col gap-6">
        <Card title="Project Details">
          <dl className="flex flex-col gap-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Property</dt>
              <dd className="mt-0.5 font-medium text-blue-600">{project.property_name}</dd>
              <dd className="text-xs text-gray-500">{project.property_address}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <dt className="text-gray-500">Project manager</dt>
              <dd>
                <PersonAvatars
                  people={
                    project.manager_name || project.manager_initials
                      ? [{
                          id: "pm",
                          name: project.manager_name || "Unassigned",
                          initials: project.manager_initials || "?",
                        }]
                      : []
                  }
                  fallback="—"
                  size="sm"
                />
              </dd>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <dt className="text-gray-500">Field team managers</dt>
              <dd className="mt-1">
                <PersonAvatars
                  people={(project.field_team_managers ?? []).map((m) => ({
                    id: m.id,
                    name: m.name,
                    initials: m.initials,
                  }))}
                  fallback="—"
                  size="sm"
                />
              </dd>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <dt className="text-gray-500">Collaborators</dt>
              <dd className="mt-1">
                <PersonAvatars
                  people={(project.collaborators ?? []).map((m) => ({
                    id: m.id,
                    name: m.name,
                    initials: m.initials,
                  }))}
                  type="collaborator"
                  fallback="—"
                  size="sm"
                />
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <dt className="text-gray-500">Timeline</dt>
              <dd className="text-gray-800">
                {formatDateShort(project.start_date)} → {formatDateShort(project.target_end_date, true)}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">{summary.counts.tasks}</div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Tasks</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{summary.counts.work_orders}</div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">WOs</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{summary.counts.field_team_orders}</div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Field Team</div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">About</dt>
              <dd className="text-gray-600 leading-relaxed">{project.description || "No description."}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Progress">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold text-gray-900">{project.percent_complete}%</span>
              <span className="text-xs text-gray-500">complete</span>
            </div>
            <Bar percent={project.percent_complete} />
            <div className="mt-1 text-xs text-gray-500">
              {formatUSD(fin.billed_to_date_cents)} billed of {formatUSD(budget)} budget
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------ attach tasks ------------------------------- */

function AttachTasksModal({
  projectId,
  propertyId,
  onSaved,
  onClose,
}: {
  projectId: number;
  propertyId: number;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [candidates, setCandidates] = useState<UnassignedTask[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listUnassignedTasks({ property_id: propertyId })
      .then((rows) => {
        if (!cancelled) setCandidates(rows);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(errMessage(e, "Failed to load unassigned tasks"));
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async () => {
    setSaving(true);
    try {
      await attachTasks(projectId, Array.from(selected).map((task_id) => ({ task_id })));
      toast.success(`${selected.size} task${selected.size > 1 ? "s" : ""} attached`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errMessage(e, "Failed to attach tasks"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Attach tasks"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="h-9 rounded-lg border border-[#DADADA] bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving || selected.size === 0} className="h-9 rounded-lg bg-[#013764] px-4 text-sm font-medium text-white hover:bg-[#003a73] disabled:opacity-50">
            {saving ? "Attaching…" : `Attach ${selected.size || ""}`.trim()}
          </button>
        </>
      }
    >
      {loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : candidates === null ? (
        <p className="text-sm text-gray-500">Loading unassigned tasks…</p>
      ) : candidates.length === 0 ? (
        <p className="text-sm text-gray-500">No unassigned tasks for this property. Create tasks first, then attach them here.</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {candidates.map((t) => (
            <label key={t.id} className="flex cursor-pointer items-center gap-3 py-2.5">
              <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} className="h-4 w-4 rounded border-gray-300" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-gray-900">{t.name}</div>
                <div className="text-xs text-gray-500">
                  <Dot label={taskStatusMeta[taskStatusBucket(t.status)].label} color={taskStatusMeta[taskStatusBucket(t.status)].dot} />
                  <span className="ml-2">{t.work_order_count} WOs · {t.fto_count} FTOs · {formatMaybeDate(t.due_date)}</span>
                </div>
              </div>
              {t.assignee_initials && <Avatar initials={t.assignee_initials} />}
            </label>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

function TasksTab({ summary, onRefresh }: { summary: ProjectSummary; onRefresh: () => void }) {
  const [attachOpen, setAttachOpen] = useState(false);
  const milestones = summary.milestones;
  const tasks = summary.tasks;

  const assignMilestone = async (taskId: number, milestoneId: number | null) => {
    try {
      await setTaskMilestone(summary.project.id, taskId, milestoneId);
      onRefresh();
    } catch (e) {
      toast.error(errMessage(e, "Failed to update milestone"));
    }
  };

  const detach = async (taskId: number) => {
    try {
      await detachTask(summary.project.id, taskId);
      toast.success("Task detached");
      onRefresh();
    } catch (e) {
      toast.error(errMessage(e, "Failed to detach task"));
    }
  };

  return (
    <Card
      title={`Tasks in this project (${tasks.length})`}
      action={<button onClick={() => setAttachOpen(true)} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">+ Attach task</button>}
    >
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">No tasks attached yet. Use “+ Attach task” to pull existing tasks into this project.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <Th>Task</Th><Th>Status</Th><Th>Priority</Th><Th>Milestone / Section</Th><Th>WOs</Th><Th>FTOs</Th><Th right>Spent</Th><Th>Due</Th><Th>Owner</Th><Th>{""}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((t) => {
                const bucket = taskStatusBucket(t.status);
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 text-blue-600">{t.name}</td>
                    <td className="py-3 pr-4"><Dot label={taskStatusMeta[bucket].label} color={taskStatusMeta[bucket].dot} /></td>
                    <td className="py-3 pr-4"><Dot {...priorityDisplay(t.priority)} /></td>
                    <td className="py-3 pr-4">
                      <SearchableSelect
                        className="max-w-[180px] rounded-md border-[#DADADA]"
                        value={t.milestone_id != null ? String(t.milestone_id) : ""}
                        onChange={(v) => assignMilestone(t.id, v === "" ? null : Number(v))}
                        options={milestones.map((m) => ({ value: String(m.id), label: m.name }))}
                        allLabel="— None —"
                      />
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{t.work_order_count}</td>
                    <td className="py-3 pr-4 text-gray-700">{t.fto_count}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-gray-900">{formatUSD(t.spent_cents)}</td>
                    <td className="py-3 pr-4 text-gray-700">{formatMaybeDate(t.due_date)}</td>
                    <td className="py-3 pr-4">{t.assignee_initials ? <Avatar initials={t.assignee_initials} /> : <span className="text-gray-400">—</span>}</td>
                    <td className="py-3">
                      <button type="button" onClick={() => detach(t.id)} title="Detach from project" aria-label={`Detach ${t.name} from project`} className="px-1.5 text-gray-400 hover:text-red-600">✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {attachOpen && (
        <AttachTasksModal
          projectId={summary.project.id}
          propertyId={summary.project.property_id}
          onSaved={onRefresh}
          onClose={() => setAttachOpen(false)}
        />
      )}
    </Card>
  );
}

function WorkOrdersTab({ summary }: { summary: ProjectSummary }) {
  const wos = summary.work_orders;
  const totalBilled = wos.reduce((s, w) => s + w.billed_cents, 0);
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard label="Work Orders" value={String(wos.length)} subtitle="Across all tasks" accent="navy" />
        <KpiCard label="Completed" value={String(wos.filter((w) => w.status === "completed").length)} subtitle="Finished & billed" accent="green" valueColor="#15803D" />
        <KpiCard label="Billed to Date" value={formatUSD(totalBilled)} subtitle="Vendor work performed" accent="violet" />
      </div>
      <Card title={`Work Orders (${wos.length})`} action={<button disabled title="Create work orders from the Maintenance module" className="h-7 rounded-lg bg-[#013764] px-2.5 text-xs font-medium text-white opacity-50 cursor-not-allowed">+ New work order</button>}>
        {wos.length === 0 ? (
          <p className="text-sm text-gray-500">No work orders on this project’s tasks yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <Th>Work Order</Th><Th>Task</Th><Th>Vendor</Th><Th>Status</Th><Th>Priority</Th><Th right>Estimate</Th><Th right>Billed</Th><Th>Due</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wos.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 text-blue-600">{w.name}</td>
                    <td className="py-3 pr-4 text-gray-500">{w.task_name}</td>
                    <td className="py-3 pr-4 text-gray-700">{w.vendor_name}</td>
                    <td className="py-3 pr-4"><Dot label={woStatusDisplay(w.status).label} color={woStatusDisplay(w.status).dot} /></td>
                    <td className="py-3 pr-4"><Dot {...priorityDisplay(w.priority)} /></td>
                    <td className="py-3 pr-4 text-right tabular-nums text-gray-700">{w.estimated_cost_cents != null ? formatUSD(w.estimated_cost_cents) : "—"}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-gray-900">{formatUSD(w.billed_cents)}</td>
                    <td className="py-3 pr-4 text-gray-700">{formatMaybeDate(w.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function FieldTeamTab({ summary }: { summary: ProjectSummary }) {
  const ftos = summary.field_team_orders;
  const totalHours = ftos.reduce((s, f) => s + f.hours_decimal, 0);
  const totalAmount = ftos.reduce((s, f) => s + (f.amount_cents ?? 0), 0);
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard label="Field Team Orders" value={String(ftos.length)} subtitle="In-house field work" accent="navy" />
        <KpiCard label="Total Hours" value={String(totalHours)} subtitle="Logged by field team" accent="blue" />
        <KpiCard label="Labor Cost" value={formatUSD(totalAmount)} subtitle="At standard rate" accent="violet" />
      </div>
      <Card title={`Field Team Orders (${ftos.length})`} action={<button disabled title="Create field team orders from the Maintenance module" className="h-7 rounded-lg bg-[#013764] px-2.5 text-xs font-medium text-white opacity-50 cursor-not-allowed">+ New field team order</button>}>
        {ftos.length === 0 ? (
          <p className="text-sm text-gray-500">No field team orders on this project.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <Th>Field Team Order</Th><Th>Task</Th><Th>Team</Th><Th>Status</Th><Th right>Hours</Th><Th right>Amount</Th><Th>Due</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ftos.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 text-blue-600">{f.name}</td>
                    <td className="py-3 pr-4 text-gray-500">{f.task_name}</td>
                    <td className="py-3 pr-4 text-gray-700">{f.member_names}</td>
                    <td className="py-3 pr-4"><Dot label={ftoStatusDisplay(f.status).label} color={ftoStatusDisplay(f.status).dot} /></td>
                    <td className="py-3 pr-4 text-right tabular-nums text-gray-700">{f.hours_decimal}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-gray-900">{f.amount_cents != null ? formatUSD(f.amount_cents) : "—"}</td>
                    <td className="py-3 pr-4 text-gray-700">{formatMaybeDate(f.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* -------------------------------- cash flow -------------------------------- */

function RecordPaymentModal({
  projectId,
  payments,
  onSaved,
  onClose,
}: {
  projectId: number;
  payments: ProjectPayment[];
  onSaved: () => void;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<PaymentKind>("deposit");
  const [amount, setAmount] = useState("");
  const [receivedOn, setReceivedOn] = useState("");
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptDrag, setReceiptDrag] = useState(false);
  const receiptInput = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const uid = useId();

  const submit = async () => {
    setSaving(true);
    try {
      const created = await createPayment(projectId, {
        kind,
        amount_cents: Math.max(0, Math.round((Number(amount) || 0) * 100)),
        received_on: receivedOn,
        reference: reference.trim(),
      });
      // Attach the receipt (optional) to the freshly-created payment.
      if (receipt) {
        try {
          await uploadPaymentReceipt(projectId, created.id, receipt);
        } catch (e) {
          toast.error(errMessage(e, "Payment saved, but the receipt failed to upload"));
        }
      }
      toast.success("Payment recorded");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errMessage(e, "Failed to record payment"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Record payment"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="h-9 rounded-lg border border-[#DADADA] bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving} className="h-9 rounded-lg bg-[#013764] px-4 text-sm font-medium text-white hover:bg-[#003a73] disabled:opacity-50">
            {saving ? "Recording…" : "Record payment"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${uid}-kind`} className={labelCls}>Type</label>
            <SearchableSelect
              className={`${fieldCls} mt-1`}
              value={kind}
              onChange={(v) => setKind((v || "deposit") as PaymentKind)}
              options={[
                { value: "deposit", label: "Deposit" },
                { value: "progress_payment", label: "Progress payment" },
              ]}
              allLabel="Select type"
            />
          </div>
          <div>
            <label htmlFor={`${uid}-amount`} className={labelCls}>Amount ($)</label>
            <input id={`${uid}-amount`} type="number" min={0} className={`${fieldCls} mt-1 text-right tabular-nums`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${uid}-received`} className={labelCls}>Received on</label>
            <input id={`${uid}-received`} type="date" className={`${fieldCls} mt-1`} value={receivedOn} onChange={(e) => setReceivedOn(e.target.value)} />
          </div>
          <div>
            <label htmlFor={`${uid}-reference`} className={labelCls}>Reference</label>
            <input id={`${uid}-reference`} className={`${fieldCls} mt-1`} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Initial project deposit (30%)" />
          </div>
        </div>
        <div>
          <span className={labelCls}>Receipt / proof (optional)</span>
          <div
            onDragOver={(e) => { e.preventDefault(); setReceiptDrag(true); }}
            onDragLeave={() => setReceiptDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setReceiptDrag(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setReceipt(f);
            }}
            onClick={() => receiptInput.current?.click()}
            className={`mt-1 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
              receiptDrag ? "border-[#013764] bg-[#013764]/5" : "border-[#DADADA] hover:bg-gray-50"
            }`}
          >
            <div className="text-xl text-gray-400" aria-hidden="true">⬆</div>
            {receipt ? (
              <p className="text-sm font-medium text-gray-900">{receipt.name}</p>
            ) : (
              <p className="text-xs text-gray-600">Drag and drop a file here, or click to browse</p>
            )}
            <input
              ref={receiptInput}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) setReceipt(f);
              }}
            />
          </div>
          {receipt && (
            <button type="button" onClick={() => setReceipt(null)} className="mt-1 text-xs text-gray-400 hover:text-gray-700">
              Choose a different file
            </button>
          )}
        </div>
        {payments.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">Previously recorded</div>
            <div className="flex flex-col gap-1">
              {payments.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1.5 truncate">
                    {formatMaybeDate(p.received_on)} · {p.kind === "deposit" ? "Deposit" : "Progress payment"}{p.reference ? ` · ${p.reference}` : ""}
                    {p.receipt_object_key && (
                      <a
                        href={`/files/${p.receipt_object_key}`}
                        target="_blank"
                        rel="noreferrer"
                        title={p.receipt_filename ?? "View receipt"}
                        className="text-blue-600 hover:underline"
                      >
                        📎
                      </a>
                    )}
                  </span>
                  <span className="tabular-nums text-gray-700">{formatUSD(p.amount_cents)}</span>
                </div>
              ))}
              {payments.length > 5 && <div className="text-xs text-gray-400">+ {payments.length - 5} more</div>}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}


// AllocatePaymentModal — manually split ONE collected payment across the
// project's bills (pure tracking). Σ inputs is capped at the payment amount; the
// remainder stays unallocated. Full-amount allocation allowed (a bill may be
// covered past its cost), so we don't cap per bill.
function AllocatePaymentModal({
  projectId,
  payment,
  bills,
  onSaved,
  onClose,
}: {
  projectId: number;
  payment: ProjectPayment;
  bills: ProjectBillRow[];
  onSaved: () => void;
  onClose: () => void;
}) {
  // billId -> dollar string
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const existing = await getPaymentAllocations(projectId, payment.id);
        if (!alive) return;
        const seed: Record<number, string> = {};
        existing.forEach((a: PaymentAllocation) => {
          seed[a.bill_id] = centsToInput(a.amount_cents);
        });
        setAmounts(seed);
      } catch (e) {
        toast.error(errMessage(e, "Failed to load allocations"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId, payment.id]);

  const allocatedCents = Object.values(amounts).reduce((s, v) => s + dollarsToCents(v), 0);
  const remainingCents = payment.amount_cents - allocatedCents;
  const over = remainingCents < 0;

  const save = async () => {
    setSaving(true);
    try {
      const allocations = bills
        .map((b) => ({ bill_id: b.id, amount_cents: dollarsToCents(amounts[b.id] ?? "") }))
        .filter((a) => a.amount_cents > 0);
      await putPaymentAllocations(projectId, payment.id, allocations);
      toast.success("Allocation saved");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errMessage(e, "Failed to save allocation"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Allocate payment to bills"
      maxWidth="max-w-2xl"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="h-9 rounded-lg border border-[#DADADA] bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving || over || loading} className="h-9 rounded-lg bg-[#013764] px-4 text-sm font-medium text-white hover:bg-[#003a73] disabled:opacity-50">
            {saving ? "Saving…" : "Save allocation"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Running header */}
        <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${over ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
          <span className="text-gray-600">
            {payment.reference || (payment.kind === "deposit" ? "Deposit" : "Progress payment")} · {formatUSD(payment.amount_cents)}
          </span>
          <span className={`font-semibold ${over ? "text-red-700" : "text-gray-900"}`}>
            {over
              ? `Over by ${formatUSD(-remainingCents)}`
              : `${formatUSD(remainingCents)} of ${formatUSD(payment.amount_cents)} left to allocate`}
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading…</div>
        ) : bills.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">No vendor bills on this project to allocate against yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="pb-2 font-semibold">Vendor</th>
                  <th className="pb-2 font-semibold">Bill</th>
                  <th className="pb-2 text-right font-semibold">Booked</th>
                  <th className="pb-2 text-right font-semibold">Covered</th>
                  <th className="pb-2 text-right font-semibold">Allocate ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bills.map((b) => (
                  <tr key={b.id}>
                    <td className="py-2 pr-2 text-gray-900">{b.vendor_name || (b.vendor_id ? `Vendor #${b.vendor_id}` : "—")}</td>
                    <td className="py-2 pr-2 text-gray-600">
                      <span className="block truncate max-w-[14rem]">{b.description || b.work_order_name || `Bill #${b.id}`}</span>
                    </td>
                    <td className="py-2 text-right tabular-nums text-gray-700">{formatUSD(b.booked_cents)}</td>
                    <td className="py-2 text-right tabular-nums text-gray-500">{formatUSD(b.covered_cents)}</td>
                    <td className="py-2 pl-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-8 w-28 rounded-lg border border-[#DADADA] bg-white px-2 text-right text-sm tabular-nums focus:border-[#013764] focus:outline-none"
                        value={amounts[b.id] ?? ""}
                        onChange={(e) => setAmounts((m) => ({ ...m, [b.id]: e.target.value }))}
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-xs text-gray-400">
              Allocation is platform tracking only — it records which bills this client payment covers and doesn't post to QuickBooks or change the budget.
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

/* ------------------- EXPLORATORY: consolidated Financials tab ---------------- */
/* One tab that answers: what have we paid OUT to vendors, and what have we taken
   IN from the client, and where do we net. Composes the already-loaded
   ProjectSummary + getCashFlow + listProjectInvoices + listPayments. No new
   backend endpoints. Intentionally lean vs. Payables/Receivables/Cash Flow. */
type PInvoiceStatus = ProjectInvoiceStatus;

const P_INVOICE_STATUS_META: Record<PInvoiceStatus, { label: string; text: string; bg: string }> = {
  draft: { label: "Draft", text: "#374151", bg: "#F3F4F6" },
  sent: { label: "Sent", text: "#1D4ED8", bg: "#E7EEFE" },
  partially_paid: { label: "Partially Paid", text: "#B45309", bg: "#FCF2E1" },
  paid: { label: "Paid", text: "#15803D", bg: "#E7F6EC" },
  void: { label: "Void", text: "#6B7280", bg: "#F3F4F6" },
};

function FinancialsTab({
  summary,
  projectId,
  onRefreshSummary,
}: {
  summary: ProjectSummary;
  projectId: number;
  onRefreshSummary: () => void;
}) {
  const fin = summary.financials;
  const cancelled = summary.project.status === "cancelled";
  const [cashflow, setCashflow] = useState<CashFlowEntry[] | null>(null);
  const [invoices, setInvoices] = useState<ProjectInvoice[]>([]);
  const [payments, setPayments] = useState<ProjectPayment[]>([]);
  const [bills, setBills] = useState<ProjectBillRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [allocatePayment, setAllocatePayment] = useState<ProjectPayment | null>(null);
  // Invoice management (folded in from the retired Receivables tab).
  const [builderOpen, setBuilderOpen] = useState(false);
  const [billables, setBillables] = useState<Billables | null>(null);
  const [detail, setDetail] = useState<ProjectInvoice | null>(null);
  const [busy, setBusy] = useState(false);
  // Over/under-billing banner dismissal, persisted per-project so it doesn't nag.
  const bannerKey = `pfv2:billing-banner-dismissed:${projectId}`;
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(bannerKey) === "1";
    } catch {
      return false;
    }
  });
  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem(bannerKey, "1");
    } catch {
      /* ignore */
    }
  };

  const load = useCallback(async () => {
    try {
      setError(null);
      const [cf, inv, pays, bl] = await Promise.all([
        getCashFlow(projectId),
        listProjectInvoices(projectId),
        listPayments(projectId),
        listProjectBills(projectId),
      ]);
      setCashflow(cf);
      setInvoices(inv);
      setPayments(pays);
      setBills(bl);
    } catch (e) {
      setError(errMessage(e, "Failed to load financials"));
    }
  }, [projectId]);
  useEffect(() => {
    load();
  }, [load]);

  const openBuilder = async () => {
    setBuilderOpen(true);
    setBillables(null);
    try {
      setBillables(await getBillables(projectId));
    } catch (e) {
      toast.error(errMessage(e, "Failed to load billable items"));
    }
  };
  const openDetail = async (id: number) => {
    try {
      setDetail(await getProjectInvoice(projectId, id));
    } catch (e) {
      toast.error(errMessage(e, "Failed to load invoice"));
    }
  };
  const doCreate = async (title: string, lines: CreateInvoiceLineInput[]) => {
    if (busy) return;
    setBusy(true);
    try {
      const created = await createProjectInvoice(projectId, { title, lines });
      setBuilderOpen(false);
      setBillables(null);
      await load();
      setDetail(created);
      toast.success(`${created.invoice_number} created as draft`);
    } catch (e) {
      toast.error(errMessage(e, "Failed to create invoice"));
    } finally {
      setBusy(false);
    }
  };
  const doSend = async (id: number) => {
    try {
      const updated = await sendProjectInvoice(projectId, id);
      setDetail(updated);
      await load();
      onRefreshSummary();
      toast.success("Invoice sent to client");
    } catch (e) {
      toast.error(errMessage(e, "Failed to send invoice"));
    }
  };
  const doRecordInvoicePayment = async (id: number, amountCents: number) => {
    try {
      const updated = await recordInvoicePayment(projectId, id, { amount_cents: amountCents, received_on: isoToday() });
      setDetail(updated);
      await load();
      onRefreshSummary();
      toast.success("Payment recorded");
    } catch (e) {
      toast.error(errMessage(e, "Failed to record payment"));
    }
  };
  const doVoid = async (id: number) => {
    if (detail && detail.paid_cents > 0 && !window.confirm(
      `This invoice has ${formatUSD(detail.paid_cents)} in recorded payments. Voiding drops it from receivables totals but keeps those payments. Void anyway?`,
    )) return;
    try {
      const updated = await voidProjectInvoice(projectId, id);
      setDetail(updated);
      await load();
      onRefreshSummary();
      toast.success("Invoice voided");
    } catch (e) {
      toast.error(errMessage(e, "Failed to void invoice"));
    }
  };
  const doPushQbo = async (id: number) => {
    try {
      const res = await pushInvoiceToQbo(projectId, id);
      await load();
      if (detail?.id === id) await openDetail(id);
      toast.success(res.already_pushed ? "Already in QuickBooks" : `Pushed to QuickBooks (invoice ${res.qbo_invoice_id})`);
    } catch (e) {
      // Non-concierge → 409, missing customer → 400, QBO failure → 502.
      toast.error(errMessage(e, "Failed to push invoice to QuickBooks"));
    }
  };

  if (error) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        {error} <button onClick={load} className="text-blue-600 hover:underline">Retry</button>
      </div>
    );
  }
  if (cashflow === null) {
    return <div className="py-12 text-center text-sm text-gray-500">Loading financials…</div>;
  }

  const paidOut = cashflow.filter((c) => c.direction === "outbound").reduce((s, c) => s + c.amount_cents, 0);
  const receivedIn = cashflow.filter((c) => c.direction === "inbound").reduce((s, c) => s + c.amount_cents, 0);
  const net = receivedIn - paidOut;
  const overUnder = fin.billed_vs_cost_cents; // billed_to_date − committed

  return (
    <div className="flex flex-col gap-6">
      {/* Over/under-billing banner — first thing shown; dismissible per project. */}
      {!bannerDismissed && (fin.billed_to_date_cents > 0 || fin.committed_cents > 0) && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${overUnder >= 0 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <span className={`mt-0.5 ${overUnder >= 0 ? "text-emerald-600" : "text-amber-600"}`}>{overUnder >= 0 ? "▲" : "▼"}</span>
          <div className="flex-1 text-sm">
            <span className={`font-semibold ${overUnder >= 0 ? "text-emerald-800" : "text-amber-800"}`}>
              {overUnder >= 0 ? "Over-billing" : "Under-billing"} {formatUSD(Math.abs(overUnder))}
            </span>
            <span className="ml-1 text-gray-600">
              — billed {formatUSD(fin.billed_to_date_cents)} vs committed cost {formatUSD(fin.committed_cents)}.
            </span>
          </div>
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Dismiss over/under-billing banner"
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Compact summary header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {fin.contract_amount_cents != null && (
          <KpiCard label="Contract" value={formatUSD(fin.contract_amount_cents)} accent="navy" />
        )}
        <KpiCard label="Committed" value={formatUSD(fin.committed_cents)} subtitle="Booked bills" accent="amber" valueColor="#B45309" />
        <KpiCard label="Paid to vendors" value={formatUSD(fin.paid_cents)} subtitle="Cash out" accent="violet" valueColor="#7C3AED" />
        <KpiCard label="Remaining" value={formatUSD(fin.remaining_budget_cents)} subtitle="Budget − committed" accent="navy" />
        <KpiCard label="Collected" value={formatUSD(fin.collected_cents)} subtitle="From client" accent="green" valueColor="#15803D" />
      </div>

      {/* Net strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
        <span className="text-gray-600">
          Paid to vendors <span className="font-semibold text-red-700">−{formatUSD(paidOut)}</span>
          <span className="mx-2 text-gray-300">·</span>
          Received from client <span className="font-semibold text-green-700">+{formatUSD(receivedIn)}</span>
        </span>
        <span className={`font-semibold ${net < 0 ? "text-amber-700" : "text-green-700"}`}>
          {net < 0 ? `AVM fronting ${formatUSD(-net)}` : net > 0 ? `Collected ahead ${formatUSD(net)}` : "Fully settled"}
        </span>
      </div>

      {/* Two lanes: bills → vendors (out), payments ← client (in) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Bills booked on the project (money out) — per-bill via WO/FTO. */}
        <Card title="Vendor bills">
          {bills.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No vendor bills booked on this project yet. Bills flow in from the project's work orders.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                    <th className="pb-2 font-semibold">Vendor</th>
                    <th className="pb-2 font-semibold">Bill / work order</th>
                    <th className="pb-2 text-right font-semibold">Booked</th>
                    <th className="pb-2 text-right font-semibold">Paid</th>
                    <th className="pb-2 text-right font-semibold">Covered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bills.map((b) => {
                    const fullyCovered = b.covered_cents >= b.booked_cents && b.booked_cents > 0;
                    return (
                    <tr key={b.id}>
                      <td className="py-2 pr-2 text-gray-900">{b.vendor_name || (b.vendor_id ? `Vendor #${b.vendor_id}` : "—")}</td>
                      <td className="py-2 pr-2 text-gray-600">
                        <span className="block truncate max-w-[16rem]">{b.description || b.work_order_name || `Bill #${b.id}`}</span>
                        {b.statement_date && <span className="text-xs text-gray-400">{fmtProjDate(b.statement_date)}</span>}
                      </td>
                      <td className="py-2 text-right tabular-nums text-gray-700">{formatUSD(b.booked_cents)}</td>
                      <td className="py-2 text-right tabular-nums text-violet-700">{formatUSD(b.paid_cents)}</td>
                      <td className="py-2 text-right tabular-nums">
                        {b.covered_cents > 0 ? (
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${fullyCovered ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`} title={fullyCovered ? "Fully covered by client payments" : "Partially covered by client payments"}>
                            {formatUSD(b.covered_cents)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 font-semibold text-gray-900">
                    <td className="pt-2" colSpan={2}>Total</td>
                    <td className="pt-2 text-right tabular-nums">{formatUSD(fin.committed_cents)}</td>
                    <td className="pt-2 text-right tabular-nums text-violet-700">{formatUSD(fin.paid_cents)}</td>
                    <td className="pt-2 text-right tabular-nums">{formatUSD(bills.reduce((s, b) => s + b.covered_cents, 0))}</td>
                  </tr>
                </tfoot>
              </table>
              <div className="mt-2 text-xs text-gray-400">Booked = bill total (committed) · Paid = settled with the vendor · Covered = client payments allocated to this bill.</div>
            </div>
          )}
        </Card>

        {/* Payments received from client */}
        <Card
          title="Client payments received"
          action={
            <button
              onClick={() => setRecordOpen(true)}
              className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              + Record payment
            </button>
          }
        >
          {payments.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No client payments yet — record one, or they arrive automatically when a project invoice is paid.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Reference</th>
                    <th className="pb-2 text-right font-semibold">Amount</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => {
                    const unallocated = p.amount_cents - p.allocated_cents;
                    return (
                    <tr key={p.id}>
                      <td className="py-2 pr-2 text-gray-700">{fmtProjDate(p.received_on)}</td>
                      <td className="py-2 pr-2">
                        <span className="flex items-center gap-1.5 text-gray-900">
                          {p.reference || (p.kind === "deposit" ? "Deposit" : "Progress payment")}
                          {p.receipt_object_key && (
                            <a href={`/files/${p.receipt_object_key}`} target="_blank" rel="noreferrer" title={p.receipt_filename ?? "View receipt"} className="text-blue-600 hover:underline">📎</a>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-400">
                          {p.allocated_cents > 0
                            ? <>{formatUSD(p.allocated_cents)} allocated{unallocated > 0 ? ` · ${formatUSD(unallocated)} unallocated` : " · fully allocated"}</>
                            : <>{formatUSD(p.amount_cents)} unallocated</>}
                        </span>
                      </td>
                      <td className="py-2 text-right align-top tabular-nums text-green-700">+{formatUSD(p.amount_cents)}</td>
                      <td className="py-2 pl-2 text-right align-top">
                        <button
                          onClick={() => setAllocatePayment(p)}
                          className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Allocate
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 font-semibold text-gray-900">
                    <td className="pt-2" colSpan={2}>Total received</td>
                    <td className="pt-2 text-right tabular-nums text-green-700">+{formatUSD(fin.collected_cents)}</td>
                    <td className="pt-2" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Invoices — create / send / push-to-QBO all live here now. */}
          <div className="mt-4 border-t border-gray-100 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Invoices</div>
              <button
                onClick={openBuilder}
                disabled={cancelled}
                className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                + New invoice
              </button>
            </div>
            {invoices.length === 0 ? (
              <div className="py-3 text-center text-xs text-gray-400">No invoices yet — create one to bill the client.</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {invoices.map((inv) => {
                  const meta = P_INVOICE_STATUS_META[inv.status];
                  return (
                    <button
                      key={inv.id}
                      onClick={() => openDetail(inv.id)}
                      className="flex w-full items-center justify-between rounded-lg px-1.5 py-1 text-left text-sm hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-gray-900">{inv.invoice_number}</span>
                        <Pill label={meta.label} text={meta.text} bg={meta.bg} />
                        <QboStatusBadge invoice={inv} />
                      </span>
                      <span className="tabular-nums text-gray-600">
                        {formatUSD(inv.paid_cents)} / {formatUSD(inv.total_amount_cents)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {recordOpen && (
        <RecordPaymentModal
          projectId={projectId}
          payments={payments}
          onSaved={() => {
            load();
            onRefreshSummary();
          }}
          onClose={() => setRecordOpen(false)}
        />
      )}

      {allocatePayment && (
        <AllocatePaymentModal
          projectId={projectId}
          payment={allocatePayment}
          bills={bills}
          onSaved={() => {
            load();
            onRefreshSummary();
          }}
          onClose={() => setAllocatePayment(null)}
        />
      )}

      {builderOpen && (
        <ProjectInvoiceBuilderModal
          billables={billables}
          busy={busy}
          onCreate={doCreate}
          onClose={() => {
            setBuilderOpen(false);
            setBillables(null);
          }}
        />
      )}

      {detail && (
        <ProjectInvoiceDetailModal
          invoice={detail}
          onSend={() => doSend(detail.id)}
          onRecordPayment={(cents) => doRecordInvoicePayment(detail.id, cents)}
          onVoid={() => doVoid(detail.id)}
          onPushQbo={() => doPushQbo(detail.id)}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function fmtProjDate(d: string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(`${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
const isoToday = () => new Date().toISOString().slice(0, 10);

function installmentBasisLabel(inst: PaymentInstallment): string {
  if (inst.basis === "percent") return `${((inst.percent_bps ?? 0) / 100).toLocaleString("en-US")}% of budget`;
  return "Fixed";
}
function installmentTrigger(inst: PaymentInstallment): string {
  if (inst.milestone_name) return `Milestone: ${inst.milestone_name}`;
  if (inst.due_date) return `Due ${fmtProjDate(inst.due_date)}`;
  return "On signing";
}

function ProjectInvoiceBuilderModal({
  billables,
  busy,
  onCreate,
  onClose,
}: {
  billables: Billables | null;
  busy: boolean;
  onCreate: (title: string, lines: CreateInvoiceLineInput[]) => void;
  onClose: () => void;
}) {
  const installments = billables?.installments_due ?? [];
  const changeOrders = billables?.change_orders_unbilled ?? [];
  const unreimbursedCents = billables?.unreimbursed_spend_cents ?? 0;

  const [selectedInst, setSelectedInst] = useState<number[]>([]);
  const [selectedCo, setSelectedCo] = useState<number[]>([]);
  const [includeCosts, setIncludeCosts] = useState(false);
  const [manual, setManual] = useState<{ key: number; description: string; amount: string }[]>([]);
  const [title, setTitle] = useState("");
  const [primed, setPrimed] = useState(false);
  const manualSeq = useRef(-1);

  // Pre-check all due installments once billables arrive — they're what the
  // builder exists to bill.
  useEffect(() => {
    if (billables && !primed) {
      setSelectedInst(billables.installments_due.map((i) => i.id));
      setPrimed(true);
    }
  }, [billables, primed]);

  const toggle = (id: number, list: number[], set: (v: number[]) => void) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const manualCents = manual.reduce((s, m) => s + Math.round((Number(m.amount) || 0) * 100), 0);
  const total =
    installments.filter((i) => selectedInst.includes(i.id)).reduce((s, i) => s + i.resolved_amount_cents, 0) +
    changeOrders.filter((c) => selectedCo.includes(c.id)).reduce((s, c) => s + c.amount_cents, 0) +
    (includeCosts ? unreimbursedCents : 0) +
    manualCents;

  const create = () => {
    const lines: CreateInvoiceLineInput[] = [
      ...installments
        .filter((i) => selectedInst.includes(i.id))
        .map((i): CreateInvoiceLineInput => ({
          description: `${i.label} — per payment schedule`,
          amount_cents: i.resolved_amount_cents,
          source_type: "installment",
          source_id: i.id,
        })),
      ...changeOrders
        .filter((c) => selectedCo.includes(c.id))
        .map((c): CreateInvoiceLineInput => ({
          description: `${c.co_number} · ${c.description}`,
          amount_cents: c.amount_cents,
          source_type: "change_order",
          source_id: c.id,
        })),
      ...(includeCosts && unreimbursedCents > 0
        ? [{ description: "Unreimbursed project costs to date", amount_cents: unreimbursedCents, source_type: "cost_reimbursement" as const }]
        : []),
      ...manual
        .filter((m) => m.description.trim() && Number(m.amount))
        .map((m): CreateInvoiceLineInput => ({ description: m.description.trim(), amount_cents: Math.round(Number(m.amount) * 100), source_type: "manual" })),
    ];
    if (lines.length === 0) {
      toast.error("Add at least one line");
      return;
    }
    onCreate(title.trim() || "Project invoice", lines);
  };

  const rowCls = "flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5";
  const checkCls = "h-4 w-4 rounded border-gray-300 accent-[#013764]";

  return (
    <ModalShell
      title="New project invoice"
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button onClick={onClose} className="h-9 rounded-lg border border-[#DADADA] bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={create} disabled={busy} className="h-9 rounded-lg bg-[#013764] px-3.5 text-sm font-medium text-white hover:bg-[#003a73] disabled:opacity-50">
            Create draft{total !== 0 ? ` — ${formatUSD(total)}` : ""}
          </button>
        </>
      }
    >
      {!billables ? (
        <p className="py-6 text-center text-sm text-gray-500">Loading billable items…</p>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Masonry milestone billing"
              className="mt-1 w-full rounded-md border border-[#DADADA] px-3 py-2 text-sm focus:border-[#013764] focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">From the payment schedule</div>
            <div className="flex flex-col gap-2">
              {installments.length === 0 && <p className="text-sm text-gray-500">No installments are due.</p>}
              {installments.map((i) => (
                <label key={i.id} className={`${rowCls} cursor-pointer ${selectedInst.includes(i.id) ? "border-[#013764] bg-[#013764]/[0.03]" : ""}`}>
                  <span className="flex items-center gap-2.5 text-sm text-gray-900">
                    <input type="checkbox" className={checkCls} checked={selectedInst.includes(i.id)} onChange={() => toggle(i.id, selectedInst, setSelectedInst)} />
                    {i.label}
                    <Pill label="Due now" text="#B45309" bg="#FCF2E1" />
                  </span>
                  <span className="text-sm font-medium tabular-nums text-gray-900">{formatUSD(i.resolved_amount_cents)}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Other billable items</div>
            <div className="flex flex-col gap-2">
              {changeOrders.map((c) => (
                <label key={c.id} className={`${rowCls} cursor-pointer ${selectedCo.includes(c.id) ? "border-[#013764] bg-[#013764]/[0.03]" : ""}`}>
                  <span className="flex items-center gap-2.5 text-sm text-gray-900">
                    <input type="checkbox" className={checkCls} checked={selectedCo.includes(c.id)} onChange={() => toggle(c.id, selectedCo, setSelectedCo)} />
                    {c.co_number} · {c.description}
                  </span>
                  <span className="text-sm font-medium tabular-nums text-gray-900">{formatUSD(c.amount_cents)}</span>
                </label>
              ))}
              <label className={`${rowCls} ${unreimbursedCents > 0 ? "cursor-pointer" : "opacity-60"}`}>
                <span className="flex items-center gap-2.5 text-sm text-gray-900">
                  <input
                    type="checkbox"
                    className={checkCls}
                    disabled={unreimbursedCents === 0}
                    checked={includeCosts}
                    onChange={() => setIncludeCosts((v) => !v)}
                  />
                  Unreimbursed costs to date
                  {unreimbursedCents === 0 && <span className="text-xs text-gray-400">(all fronted costs already billed)</span>}
                </span>
                <span className="text-sm font-medium tabular-nums text-gray-900">{formatUSD(unreimbursedCents)}</span>
              </label>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Manual lines</span>
              <button
                onClick={() => setManual((m) => [...m, { key: manualSeq.current--, description: "", amount: "" }])}
                className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                + Add line
              </button>
            </div>
            {manual.length === 0 ? (
              <p className="text-xs text-gray-400">Freeform charges or credits (negative amounts allowed).</p>
            ) : (
              <div className="flex flex-col gap-2">
                {manual.map((m) => (
                  <div key={m.key} className="flex items-center gap-2">
                    <input
                      value={m.description}
                      placeholder="Description"
                      onChange={(e) => setManual((v) => v.map((x) => (x.key === m.key ? { ...x, description: e.target.value } : x)))}
                      className="flex-1 rounded-md border border-[#DADADA] px-2 py-1.5 text-sm focus:border-[#013764] focus:outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">$</span>
                      <input
                        type="number"
                        value={m.amount}
                        placeholder="0.00"
                        onChange={(e) => setManual((v) => v.map((x) => (x.key === m.key ? { ...x, amount: e.target.value } : x)))}
                        className="w-28 rounded-md border border-[#DADADA] px-2 py-1.5 text-right text-sm tabular-nums focus:border-[#013764] focus:outline-none"
                      />
                    </div>
                    <button onClick={() => setManual((v) => v.filter((x) => x.key !== m.key))} aria-label="Remove line" className="px-1 text-gray-400 hover:text-red-600">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function ProjectInvoiceDetailModal({
  invoice,
  onSend,
  onRecordPayment,
  onVoid,
  onPushQbo,
  onClose,
}: {
  invoice: ProjectInvoice;
  onSend: () => void;
  onRecordPayment: (cents: number) => void;
  onVoid: () => void;
  onPushQbo: () => void | Promise<void>;
  onClose: () => void;
}) {
  const totalCents = invoice.total_amount_cents;
  const paid = invoice.paid_cents;
  const remaining = Math.max(0, totalCents - paid);
  const [payAmount, setPayAmount] = useState(String(remaining / 100));
  const [pushing, setPushing] = useState(false);
  const meta = P_INVOICE_STATUS_META[invoice.status];
  const canPay = invoice.status === "sent" || invoice.status === "partially_paid";
  const pushed = invoice.qbo_push_status === "pushed";
  // Push to QBO once the invoice has left draft (so it's a real receivable), while
  // not void. The backend fail-loud gate (409 non-concierge / 400 no customer) is
  // the source of truth; the button stays optimistic.
  const canPushQbo = invoice.status !== "void" && invoice.status !== "draft";

  return (
    <ModalShell
      title={`${invoice.invoice_number} · ${invoice.title}`}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          {invoice.status !== "void" && (
            <button onClick={onVoid} className="mr-auto h-9 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 hover:bg-red-50">
              Void
            </button>
          )}
          <button onClick={onClose} className="h-9 rounded-lg border border-[#DADADA] bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
          {canPushQbo && (
            <button
              onClick={async () => { setPushing(true); try { await onPushQbo(); } finally { setPushing(false); } }}
              disabled={pushing || pushed}
              title={pushed ? "Already pushed to QuickBooks" : "Post this invoice to QuickBooks (concierge only)"}
              className={`h-9 rounded-lg px-3.5 text-sm font-medium ${pushed ? "cursor-default border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-[#013764] bg-white text-[#013764] hover:bg-[#013764]/5 disabled:opacity-50"}`}
            >
              {pushed ? "In QuickBooks ✓" : pushing ? "Pushing…" : "Push to QuickBooks"}
            </button>
          )}
          {invoice.status === "draft" && (
            <button onClick={onSend} className="h-9 rounded-lg bg-[#013764] px-3.5 text-sm font-medium text-white hover:bg-[#003a73]">
              Send to client
            </button>
          )}
          {canPay && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">$</span>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                aria-label="Payment amount in dollars"
                className="w-28 rounded-md border border-[#DADADA] px-2 py-1.5 text-right text-sm tabular-nums focus:border-[#013764] focus:outline-none"
              />
              <button
                onClick={() => {
                  const cents = Math.round((Number(payAmount) || 0) * 100);
                  if (cents <= 0) {
                    toast.error("Enter a payment amount");
                    return;
                  }
                  onRecordPayment(cents);
                }}
                className="h-9 rounded-lg bg-[#013764] px-3.5 text-sm font-medium text-white hover:bg-[#003a73]"
              >
                Record payment
              </button>
            </div>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <Pill label={meta.label} text={meta.text} bg={meta.bg} />
          <span>Issued {fmtProjDate(invoice.issue_date)}</span>
          {invoice.due_date && <span>Due {fmtProjDate(invoice.due_date)}</span>}
          <span className="ml-auto font-semibold tabular-nums text-gray-900">{formatUSD(totalCents)}</span>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Lines</div>
          <div className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
            {invoice.lines.map((l: ProjectInvoiceLine) => (
              <div key={l.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span className="text-gray-900">{l.description}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-gray-400">{l.source_type.replace(/_/g, " ")}</span>
                  <span className="font-medium tabular-nums text-gray-900">{formatUSD(l.amount_cents)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Payments</div>
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-gray-500">No payments yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="text-gray-700">
                    {fmtProjDate(p.received_on)}
                    {p.reference ? ` · ${p.reference}` : ""}
                    {p.via_qbo && <span className="ml-2 rounded bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700">auto-reconciled via QBO</span>}
                  </span>
                  <span className="font-medium tabular-nums text-green-700">{formatUSD(p.amount_cents)}</span>
                </div>
              ))}
            </div>
          )}
          {remaining > 0 && paid > 0 && (
            <p className="mt-2 text-xs text-amber-700">{formatUSD(remaining)} remaining on this invoice.</p>
          )}
        </div>

        <p className="text-xs text-gray-400">
          Payments recorded here also create a linked row in the project's Cash Flow ledger. Project invoices never touch the
          monthly invoice flow.
        </p>
      </div>
    </ModalShell>
  );
}


/* --------------------------------- quotes --------------------------------- */

const QUOTE_STATUS_META: Record<QuoteStatus, { label: string; text: string; bg: string }> = {
  received: { label: "Received", text: "#6B7280", bg: "#F3F4F6" },
  shortlisted: { label: "Shortlisted", text: "#1D4ED8", bg: "#E7EEFE" },
  accepted: { label: "Accepted", text: "#15803D", bg: "#E7F6EC" },
  rejected: { label: "Rejected", text: "#B91C1C", bg: "#FCEAEA" },
};

const VERDICT_META: Record<QuoteVerdict, { label: string; text: string; bg: string }> = {
  fair: { label: "Fair price", text: "#15803D", bg: "#E7F6EC" },
  high: { label: "Above market", text: "#B4232B", bg: "#FBEBEC" },
  low: { label: "Below market", text: "#B45309", bg: "#F8EEDD" },
  insufficient_data: { label: "Not enough data", text: "#6B7280", bg: "#F3F4F6" },
};

function QuoteAnalysisPanel({ a }: { a: NonNullable<ProjectQuote["ai_analysis"]> }) {
  const meta = VERDICT_META[a.verdict] ?? VERDICT_META.insufficient_data;
  const hasRange = a.suggested_low_cents > 0 || a.suggested_high_cents > 0;
  return (
    <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Pill label={meta.label} text={meta.text} bg={meta.bg} />
        {hasRange && (
          <span className="text-xs text-gray-500">
            Fair range{" "}
            <span className="font-medium tabular-nums text-gray-700">
              {formatUSD(a.suggested_low_cents)}–{formatUSD(a.suggested_high_cents)}
            </span>
          </span>
        )}
        {typeof a.confidence === "number" && (
          <span className="ml-auto text-[11px] text-gray-400">confidence {Math.round(a.confidence * 100)}%</span>
        )}
      </div>
      {a.reasoning && <p className="mt-2 text-[13px] leading-relaxed text-gray-600">{a.reasoning}</p>}
      {a.red_flags?.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {a.red_flags.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] text-amber-800">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      {typeof a.comparables_used === "number" && (
        <div className="mt-2 text-[11px] text-gray-400">
          Based on {a.comparables_used} comparable{a.comparables_used === 1 ? "" : "s"} from your records + market knowledge.
        </div>
      )}
    </div>
  );
}

function NewQuoteModal({
  projectId,
  budget,
  reviseOf,
  onSaved,
  onClose,
}: {
  projectId: number;
  budget: BudgetCategory[];
  reviseOf?: ProjectQuote | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [vendorName, setVendorName] = useState(reviseOf?.vendor_name ?? "");
  const [trade, setTrade] = useState(reviseOf?.trade ?? "");
  const [amount, setAmount] = useState(reviseOf ? String(reviseOf.amount_cents / 100) : "");
  const [scope, setScope] = useState(reviseOf?.scope_description ?? "");
  const [budgetItemId, setBudgetItemId] = useState<number | "">(reviseOf?.budget_item_id ?? "");
  const [saving, setSaving] = useState(false);
  const uid = useId();

  const submit = async () => {
    if (!vendorName.trim() && !trade.trim()) {
      toast.error("Add a vendor or trade");
      return;
    }
    setSaving(true);
    try {
      await createQuote(projectId, {
        vendor_name: vendorName.trim(),
        trade: trade.trim(),
        scope_description: scope.trim(),
        amount_cents: Math.round((Number(amount) || 0) * 100),
        budget_item_id: budgetItemId === "" ? null : budgetItemId,
        supersedes_quote_id: reviseOf ? reviseOf.id : null,
      });
      toast.success(reviseOf ? "Revision added & analyzed" : "Quote added & analyzed");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errMessage(e, "Failed to add quote"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={reviseOf ? "Revise quote" : "Add quote"}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="h-9 rounded-lg border border-[#DADADA] bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving} className="h-9 rounded-lg bg-[#013764] px-4 text-sm font-medium text-white hover:bg-[#003a73] disabled:opacity-50">
            {saving ? "Analyzing…" : "Add & analyze"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {reviseOf && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Revising <span className="font-medium text-gray-700">{reviseOf.vendor_name || "quote"}</span> ({formatUSD(reviseOf.amount_cents)}). The
            original is kept for history; this becomes the current quote.
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${uid}-vendor`} className={labelCls}>Vendor</label>
            <input id={`${uid}-vendor`} className={`${fieldCls} mt-1`} value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g. Frank Clark" />
          </div>
          <div>
            <label htmlFor={`${uid}-trade`} className={labelCls}>Trade</label>
            <input id={`${uid}-trade`} className={`${fieldCls} mt-1`} value={trade} onChange={(e) => setTrade(e.target.value)} placeholder="e.g. Electrical" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${uid}-amount`} className={labelCls}>Quoted amount ($)</label>
            <input id={`${uid}-amount`} type="number" className={`${fieldCls} mt-1 text-right tabular-nums`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label htmlFor={`${uid}-cat`} className={labelCls}>Budget line</label>
            <SearchableSelect
              className={`${fieldCls} mt-1`}
              value={budgetItemId === "" ? "" : String(budgetItemId)}
              onChange={(v) => setBudgetItemId(v ? Number(v) : "")}
              options={budget.flatMap((b) => {
                const hasSubs = (b.sub_budgets?.length ?? 0) > 0;
                return [
                  { value: String(b.id), label: hasSubs ? `${b.name || "Untitled"} (category)` : (b.name || "Untitled") },
                  ...(b.sub_budgets ?? []).map((s) => ({ value: String(s.id), label: `   ↳ ${s.name || "Untitled"}` })),
                ];
              })}
              allLabel="Unassigned"
            />
            <p className="mt-1 text-[11px] text-gray-400">Tip: link to a sub-budget (indented) or a category with no sub-lines — accepting a quote copies its amount onto that exact line. A category that has sub-lines won’t receive the copy.</p>
          </div>
        </div>
        <div>
          <label htmlFor={`${uid}-scope`} className={labelCls}>Scope</label>
          <textarea id={`${uid}-scope`} className={`${fieldCls} mt-1`} rows={3} value={scope} onChange={(e) => setScope(e.target.value)} placeholder="What the quote covers — the more detail, the better the fairness analysis." />
        </div>
      </div>
    </ModalShell>
  );
}

// Quotes tab: capture competing vendor quotes grouped by budget category, run an
// AI fairness analysis (grounded in our historical costs + market knowledge),
// shortlist, revise (immutable history), and accept one per category —
// optionally copying the accepted amount into the budget (Part B / B3).
function QuotesTab({ projectId, budget }: { projectId: number; budget: BudgetCategory[] }) {
  const [quotes, setQuotes] = useState<ProjectQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [reviseOf, setReviseOf] = useState<ProjectQuote | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setQuotes(await listQuotes(projectId));
    } catch (e) {
      setError(errMessage(e, "Failed to load quotes"));
    } finally {
      setLoading(false);
    }
  }, [projectId]);
  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const runAnalyze = async (q: ProjectQuote) => {
    setBusyId(q.id);
    try {
      await analyzeQuote(projectId, q.id);
      load();
    } catch (e) {
      toast.error(errMessage(e, "Analysis failed"));
    } finally {
      setBusyId(null);
    }
  };
  const changeStatus = async (q: ProjectQuote, status: Exclude<QuoteStatus, "accepted">) => {
    try {
      await updateQuote(projectId, q.id, { status });
      load();
    } catch (e) {
      toast.error(errMessage(e, "Failed to update quote"));
    }
  };
  const accept = async (q: ProjectQuote, copyToBudget: boolean) => {
    try {
      await acceptQuote(projectId, q.id, { copy_to_budget: copyToBudget });
      toast.success(copyToBudget ? "Accepted — amount copied into the budget" : "Quote accepted");
      load();
    } catch (e) {
      toast.error(errMessage(e, "Failed to accept quote"));
    }
  };
  const remove = async (q: ProjectQuote) => {
    try {
      await deleteQuote(projectId, q.id);
      toast.success("Quote deleted");
      load();
    } catch (e) {
      toast.error(errMessage(e, "Failed to delete quote"));
    }
  };

  const catName = (id: number | null): string => {
    if (id == null) return "Unassigned";
    return budget.find((b) => b.id === id)?.name ?? `Category #${id}`;
  };
  // Quotes that a later revision supersedes (dimmed as history).
  const supersededIds = new Set(quotes.map((q) => q.supersedes_quote_id).filter((x): x is number => x != null));

  // Group by budget category (Unassigned last).
  const groups = new Map<number | null, ProjectQuote[]>();
  for (const q of quotes) {
    const key = q.budget_item_id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(q);
  }
  const groupKeys = [...groups.keys()].sort((a, b) => {
    if (a == null) return 1;
    if (b == null) return -1;
    return catName(a).localeCompare(catName(b));
  });

  const renderQuote = (q: ProjectQuote) => {
    const sMeta = QUOTE_STATUS_META[q.status];
    const superseded = supersededIds.has(q.id);
    return (
      <div key={q.id} className={`rounded-lg border border-gray-200 p-3.5 ${superseded ? "opacity-60" : ""}`}>
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-gray-900">{q.vendor_name || "Unnamed vendor"}</span>
              {q.trade && <span className="text-xs text-gray-500">{q.trade}</span>}
              <Pill label={sMeta.label} text={sMeta.text} bg={sMeta.bg} />
              {superseded && <span className="text-[11px] text-gray-400">superseded</span>}
              {q.supersedes_quote_id != null && <span className="text-[11px] text-gray-400">revision</span>}
              {q.source === "verbal_intake" && <span className="text-[11px] text-gray-400">from intake</span>}
            </div>
            {q.scope_description && <div className="mt-1 text-[13px] text-gray-500">{q.scope_description}</div>}
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm font-semibold tabular-nums text-gray-900">{formatUSD(q.amount_cents)}</div>
          </div>
        </div>

        {q.ai_analysis && <QuoteAnalysisPanel a={q.ai_analysis} />}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={() => runAnalyze(q)}
            disabled={busyId === q.id}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#013764] px-3 text-xs font-medium text-[#013764] hover:bg-[#013764]/5 disabled:opacity-50"
          >
            {busyId === q.id ? "Analyzing…" : q.ai_analysis ? "Re-analyze" : "Analyze fairness"}
          </button>
          {q.status !== "accepted" && (
            <button onClick={() => accept(q, false)} className="text-xs font-medium text-green-700 hover:underline">Accept</button>
          )}
          {q.status !== "accepted" && q.budget_item_id != null && (
            <button onClick={() => accept(q, true)} className="text-xs font-medium text-green-700 hover:underline">Accept → budget</button>
          )}
          {q.status !== "shortlisted" && q.status !== "accepted" && (
            <button onClick={() => changeStatus(q, "shortlisted")} className="text-xs font-medium text-blue-600 hover:underline">Shortlist</button>
          )}
          <button onClick={() => setReviseOf(q)} className="text-xs font-medium text-gray-600 hover:underline">Revise</button>
          {q.status !== "rejected" && (
            <button onClick={() => changeStatus(q, "rejected")} className="text-xs font-medium text-gray-500 hover:underline">Reject</button>
          )}
          {q.status !== "received" && (
            <button onClick={() => changeStatus(q, "received")} className="text-xs font-medium text-gray-400 hover:underline">Reset</button>
          )}
          <button onClick={() => remove(q)} className="ml-auto text-xs font-medium text-gray-400 hover:text-red-600">Delete</button>
        </div>
      </div>
    );
  };

  return (
    <Card
      title="Quotes"
      action={
        <button onClick={() => setCreateOpen(true)} className="h-8 rounded-lg bg-[#013764] px-3 text-xs font-medium text-white hover:bg-[#003a73]">
          + New quote
        </button>
      }
    >
      {loading ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading quotes…</div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-rose-600">{error}</div>
      ) : quotes.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          No quotes yet. Add competing vendor quotes per budget category to check whether prices are fair.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groupKeys.map((key) => (
            <div key={key ?? "unassigned"}>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">{catName(key)}</div>
              <div className="flex flex-col gap-3">{groups.get(key)!.map(renderQuote)}</div>
            </div>
          ))}
        </div>
      )}
      {createOpen && <NewQuoteModal projectId={projectId} budget={budget} onSaved={load} onClose={() => setCreateOpen(false)} />}
      {reviseOf && (
        <NewQuoteModal
          projectId={projectId}
          budget={budget}
          reviseOf={reviseOf}
          onSaved={load}
          onClose={() => setReviseOf(null)}
        />
      )}
    </Card>
  );
}

/* ----------------------------------- files ---------------------------------- */

const FILE_SOURCE_META: Record<ProjectFileSource, { label: string; text: string; bg: string }> = {
  project: { label: "Project", text: "#374151", bg: "#F3F4F6" },
  task: { label: "Task", text: "#1D4ED8", bg: "#E7EEFE" },
  work_order: { label: "Work Order", text: "#B45309", bg: "#FCF2E1" },
  field_team: { label: "Field Team", text: "#15803D", bg: "#E7F6EC" },
  invoice: { label: "Invoice", text: "#7C3AED", bg: "#F1EBFD" },
  bill: { label: "Bill", text: "#B91C1C", bg: "#FEECEC" },
};

const FILE_FILTERS: { key: "all" | ProjectFileSource; label: string }[] = [
  { key: "all", label: "All" },
  { key: "project", label: "Project" },
  { key: "task", label: "Task" },
  { key: "work_order", label: "Work Order" },
  { key: "field_team", label: "Field Team" },
  { key: "invoice", label: "Invoice" },
  { key: "bill", label: "Bills" },
];

function formatBytes(n: number): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// Real Files tab (Part B / B2): aggregates every attachment on the project —
// direct uploads plus attachments living on its tasks / work orders / FTOs /
// project invoices — and supports direct upload + delete of project files.
function FilesTab({ projectId, summary }: { projectId: number; summary: ProjectSummary }) {
  const [files, setFiles] = useState<ProjectFileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ProjectFileSource>("all");
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [picked, setPicked] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  // Association: encoded as "project" | "invoice" | "task:<id>" | "work_order:<id>".
  const [assoc, setAssoc] = useState<string>("project");
  const [uploadDescription, setUploadDescription] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setFiles(await listProjectFiles(projectId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [projectId]);
  useEffect(() => {
    load();
  }, [load]);

  const rows = filter === "all" ? files : files.filter((f) => f.source === filter);

  const openUpload = () => {
    setPicked(null);
    setDragOver(false);
    setAssoc("project");
    setUploadDescription("");
    setUploadOpen(true);
  };

  const confirmUpload = async () => {
    if (!picked) return;
    setUploading(true);
    try {
      const [aType, aId] = assoc.split(":");
      await uploadProjectFile(projectId, picked, {
        associated_type: aType,
        associated_id: aId ? Number(aId) : undefined,
        description: uploadDescription.trim(),
      });
      await load();
      toast.success("File uploaded");
      setUploadOpen(false);
      setPicked(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (f: ProjectFileRow) => {
    if (!window.confirm(`Delete "${f.name}"?`)) return;
    try {
      await deleteProjectFile(projectId, f.id);
      await load();
      toast.success("File deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card
        title="Project Files"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              size="sm"
              value={filter}
              onChange={(v) => setFilter(v as "all" | ProjectFileSource)}
              options={FILE_FILTERS.map((s) => ({
                key: s.key,
                label: s.label,
                count: s.key === "all" ? files.length : files.filter((f) => f.source === s.key).length,
              }))}
            />
            <button
              type="button"
              onClick={openUpload}
              className="h-7 rounded-lg bg-[#013764] px-2.5 text-xs font-medium text-white hover:bg-[#003a73]"
            >
              + Upload
            </button>
          </div>
        }
      >
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">
            {filter === "all" ? "No files yet. Upload one, or attach files on tasks, work orders, or invoices." : "No files from this source."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <Th>File</Th><Th>Source</Th><Th>Attached to</Th><Th>Type</Th><Th right>Size</Th><Th right>{""}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((f) => {
                  const meta = FILE_SOURCE_META[f.source];
                  return (
                    <tr key={`${f.source}-${f.id}`} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <a href={`${API_BASE}${f.download}`} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">{f.name}</a>
                        {f.description && <div className="mt-0.5 text-xs text-gray-500">{f.description}</div>}
                        {(f.uploaded_by || f.created_at) && (
                          <div className="mt-0.5 text-[11px] text-gray-400">
                            {f.uploaded_by ? `${f.uploaded_by} · ` : ""}{f.created_at?.slice(0, 10)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap items-center gap-1">
                          <Pill label={meta.label} text={meta.text} bg={meta.bg} />
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{f.parent || "—"}</td>
                      <td className="py-3 pr-4 text-gray-500">{f.mime || "—"}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-gray-500">{formatBytes(f.size_bytes)}</td>
                      <td className="py-3 text-right">
                        {f.deletable && (
                          <button onClick={() => remove(f)} aria-label="Delete file" className="text-xs text-gray-400 hover:text-red-600">✕</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {uploadOpen && (
        <ModalShell
          title="Upload file"
          onClose={() => setUploadOpen(false)}
          maxWidth="max-w-md"
          footer={
            <>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="h-9 rounded-lg border border-[#DADADA] bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmUpload}
                disabled={!picked || uploading}
                className="h-9 rounded-lg bg-[#013764] px-4 text-sm font-medium text-white hover:bg-[#003a73] disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </>
          }
        >
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setPicked(f);
            }}
            onClick={() => fileInput.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragOver ? "border-[#013764] bg-[#013764]/5" : "border-[#DADADA] hover:bg-gray-50"
            }`}
          >
            <div className="text-2xl text-gray-400" aria-hidden="true">⬆</div>
            {picked ? (
              <p className="text-sm font-medium text-gray-900">{picked.name}</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">Drag and drop a file here, or click to browse</p>
                <p className="text-xs text-gray-400">Attached directly to this project</p>
              </>
            )}
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) setPicked(f);
              }}
            />
          </div>
          {picked && (
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="mt-2 text-xs text-gray-400 hover:text-gray-700"
            >
              Choose a different file
            </button>
          )}

          <div className="mt-4 grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Associate with</label>
              <SearchableSelect
                value={assoc}
                onChange={(v) => setAssoc(v)}
                allLabel="Project (overall)"
                options={[
                  { value: "project", label: "Project (overall)" },
                  { value: "invoice", label: "Invoice" },
                  ...summary.tasks.map((t) => ({ value: `task:${t.id}`, label: `Task: ${t.name}` })),
                  ...summary.work_orders.map((w) => ({ value: `work_order:${w.id}`, label: `Work Order: ${w.name}` })),
                ]}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Optional note about this file"
                rows={2}
                className="w-full rounded-lg border border-[#DADADA] bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#013764] focus:outline-none"
              />
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/* --------------------------- update project modal ------------------------- */

function UpdateProjectModal({
  summary,
  onSaved,
  onClose,
}: {
  summary: ProjectSummary;
  onSaved: () => void;
  onClose: () => void;
}) {
  const project = summary.project;
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [percent, setPercent] = useState(project.percent_complete);
  const [startDate, setStartDate] = useState(project.start_date ?? "");
  const [targetEndDate, setTargetEndDate] = useState(project.target_end_date ?? "");
  const [managerUserId, setManagerUserId] = useState<number | "">(project.manager_user_id ?? "");
  const [managers, setManagers] = useState<{ id: number; name: string }[]>([]);
  // Field team managers + collaborators (migration 142) — display-only multi-
  // selects. SearchableSelect multi mode uses string[]; converted to number[]
  // for the PATCH body.
  const [fieldTeamManagerIds, setFieldTeamManagerIds] = useState<string[]>(
    (project.field_team_manager_ids ?? []).map(String),
  );
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>(
    (project.collaborator_ids ?? []).map(String),
  );
  const [fieldTeam, setFieldTeam] = useState<{ id: number; name: string }[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: number; name: string }[]>([]);
  const [description, setDescription] = useState(project.description);
  const [contractAmount, setContractAmount] = useState(
    project.contract_amount_cents != null ? centsToInput(project.contract_amount_cents) : "",
  );
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryDraft[]>(() => categoriesToDrafts(summary.budget));
  const [milestones, setMilestones] = useState<MilestoneDraft[]>(() => milestonesToDrafts(summary.milestones));
  const uid = useId();
  const titleId = useId();
  const dialogRef = useDialogFocus(onClose);

  // Manager / field-team / collaborator pickers reuse the existing users data
  // sources (spec §7). Field team candidates come from /users/field-team,
  // collaborators from /users (all users).
  useEffect(() => {
    let cancelled = false;
    const toRow = (u: { id: number; name?: string; email?: string }) => ({
      id: u.id,
      name: u.name || u.email || `User ${u.id}`,
    });
    Promise.all([
      fetchJSON("/users/property-managers").catch(() => []),
      fetchJSON("/users/field-team").catch(() => []),
      fetchJSON("/users").catch(() => []),
    ])
      .then(([managersRes, fieldTeamRes, allUsersRes]) => {
        if (cancelled) return;
        setManagers(((managersRes ?? []) as any[]).map(toRow));
        setFieldTeam(((fieldTeamRes ?? []) as any[]).map(toRow));
        setAllUsers(((allUsersRes ?? []) as any[]).map(toRow));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // ids for newly-added rows won't collide with existing ones
  const seq = useRef(
    Math.max(
      0,
      ...categories.flatMap((c) => [c.id, ...c.subBudgets.map((s) => s.id)]),
      ...milestones.map((m) => m.id),
    ) + 1,
  );
  const nextId = () => seq.current++;

  const submit = async () => {
    setSaving(true);
    try {
      await updateProject(project.id, {
        name,
        status,
        percent_complete: Math.min(100, Math.max(0, percent)),
        ...(startDate ? { start_date: startDate } : {}),
        ...(targetEndDate ? { target_end_date: targetEndDate } : {}),
        manager_user_id: managerUserId === "" ? null : managerUserId,
        field_team_manager_ids: fieldTeamManagerIds.map(Number),
        collaborator_ids: collaboratorIds.map(Number),
        description,
        ...(contractAmount.trim() !== "" ? { contract_amount_cents: dollarsToCents(contractAmount) } : {}),
      });
      // Budget first: the PUT response carries real ids for new categories so
      // milestone → budget links can be resolved (index-aligned, Decision #11).
      const savedCategories = await putBudget(project.id, draftsToBudgetPayload(categories));
      await putMilestones(project.id, draftsToMilestonesPayload(milestones, categories, savedCategories));
      toast.success("Project updated");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errMessage(e, "Failed to update project"));
    } finally {
      setSaving(false);
    }
  };

  const managerOptions = useMemo(() => {
    if (project.manager_user_id != null && !managers.some((m) => m.id === project.manager_user_id)) {
      return [{ id: project.manager_user_id, name: project.manager_name || `User ${project.manager_user_id}` }, ...managers];
    }
    return managers;
  }, [managers, project.manager_user_id, project.manager_name]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl focus:outline-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">Update project</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor={`${uid}-name`} className={labelCls}>Project name</label>
                <input id={`${uid}-name`} className={`${fieldCls} mt-1`} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${uid}-status`} className={labelCls}>Status</label>
                  <SearchableSelect
                    className={`${fieldCls} mt-1`}
                    value={status}
                    onChange={(v) => setStatus((v || "planning") as ProjectStatus)}
                    options={[
                      { value: "planning", label: "Planning" },
                      { value: "active", label: "Active" },
                      { value: "on_hold", label: "On Hold" },
                      { value: "completed", label: "Completed" },
                      { value: "cancelled", label: "Cancelled" },
                    ]}
                    allLabel="Select status"
                  />
                </div>
                <div>
                  <label htmlFor={`${uid}-percent`} className={labelCls}>% Complete</label>
                  <input id={`${uid}-percent`} type="number" min={0} max={100} className={`${fieldCls} mt-1`} value={percent} onChange={(e) => setPercent(Number(e.target.value) || 0)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${uid}-start`} className={labelCls}>Start date</label>
                  <input id={`${uid}-start`} type="date" className={`${fieldCls} mt-1`} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`${uid}-target`} className={labelCls}>Target end date</label>
                  <input id={`${uid}-target`} type="date" className={`${fieldCls} mt-1`} value={targetEndDate} onChange={(e) => setTargetEndDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor={`${uid}-manager`} className={labelCls}>Project manager</label>
                <SearchableSelect
                  className={`${fieldCls} mt-1`}
                  value={managerUserId === "" ? "" : String(managerUserId)}
                  onChange={(v) => setManagerUserId(v === "" ? "" : Number(v))}
                  options={managerOptions.map((m) => ({ value: String(m.id), label: m.name }))}
                  allLabel="Unassigned"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Field team managers</label>
                  <SearchableSelect
                    multiSelect
                    className={`${fieldCls} mt-1`}
                    value={fieldTeamManagerIds}
                    onChange={setFieldTeamManagerIds}
                    options={fieldTeam.map((m) => ({ value: String(m.id), label: m.name }))}
                    allLabel="None"
                  />
                </div>
                <div>
                  <label className={labelCls}>Collaborators</label>
                  <SearchableSelect
                    multiSelect
                    className={`${fieldCls} mt-1`}
                    value={collaboratorIds}
                    onChange={setCollaboratorIds}
                    options={allUsers.map((m) => ({ value: String(m.id), label: m.name }))}
                    allLabel="None"
                  />
                </div>
              </div>
              <div>
                <label htmlFor={`${uid}-desc`} className={labelCls}>Description</label>
                <textarea id={`${uid}-desc`} rows={2} className={`${fieldCls} mt-1 resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label htmlFor={`${uid}-contract`} className={labelCls}>Contract amount (agreed client price)</label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    id={`${uid}-contract`}
                    inputMode="decimal"
                    placeholder="Optional"
                    className={`${fieldCls} pl-6`}
                    value={contractAmount}
                    onChange={(e) => setContractAmount(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">Basis for the owner budget-variance figure. Leave blank to omit.</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Budget & sub-budgets</h3>
              <BudgetEditor categories={categories} onChange={setCategories} newId={nextId} />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Milestones</h3>
              <p className="mb-2 text-xs text-gray-400">Task assignments are kept — set those on the Tasks tab.</p>
              <MilestonesEditor milestones={milestones} categories={categories} onChange={setMilestones} newId={nextId} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} disabled={saving} className="h-9 rounded-lg border border-[#DADADA] bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={submit} disabled={saving} className="h-9 rounded-lg bg-[#013764] px-4 text-sm font-medium text-white hover:bg-[#003a73] disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- page shell ------------------------------ */

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const id = Number(projectId);
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [maintenanceTab, setMaintenanceTab] = useState<MaintenanceSubTabKey>("tasks");
  const [editOpen, setEditOpen] = useState(false);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setError("project not found");
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await getProjectSummary(id);
      setSummary(data);
    } catch (e) {
      setError(errMessage(e, "Failed to load project"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setSummary(null);
    load();
  }, [load]);

  // Sync project name to the tab label + top-nav breadcrumb (Projects > name)
  const { setProjectDisplayName } = usePropertyBreadcrumb();
  useEffect(() => {
    setProjectDisplayName(summary?.project.name ?? null);
    return () => setProjectDisplayName(null);
  }, [summary, setProjectDisplayName]);

  if (loading) {
    return (
      <PageTemplate>
        <div className="py-16 text-center text-sm text-gray-500">Loading project…</div>
      </PageTemplate>
    );
  }

  if (error || !summary) {
    const notFound = (error ?? "").toLowerCase().includes("not found");
    return (
      <PageTemplate>
        <div className="py-16 text-center text-gray-500">
          {notFound ? "Project not found." : error || "Failed to load project."}{" "}
          {!notFound && (
            <button className="text-blue-600 hover:underline" onClick={() => { setLoading(true); load(); }}>
              Retry
            </button>
          )}{" "}
          <button className="text-blue-600 hover:underline" onClick={() => navigate("/projects")}>
            Back to projects
          </button>
        </div>
      </PageTemplate>
    );
  }

  const project = summary.project;
  const statusMeta = PROJECT_STATUS_META[project.status];

  return (
    <PageTemplate>
      <div className="flex flex-col w-full">
        <button onClick={() => navigate("/projects")} className="mb-2 w-fit text-xs font-medium text-gray-400 hover:text-gray-600">
          ← Projects
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="truncate text-xl font-semibold text-gray-900">{project.name}</h1>
            <Pill label={statusMeta.label} text={statusMeta.text} bg={statusMeta.bg} />
          </div>
          <div className="flex items-center gap-2">
            <button disabled title="Export is not yet available" className="h-9 rounded-lg border border-[#DADADA] bg-white px-3 text-sm font-medium text-gray-700 opacity-50 cursor-not-allowed">Export</button>
            <button onClick={() => setEditOpen(true)} className="h-9 rounded-lg border border-white bg-[#013764] px-3.5 text-sm font-medium text-white shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73]">
              Update project
            </button>
          </div>
        </div>
        <div className="mt-0.5 text-sm text-gray-500">
          {project.property_name} · {project.property_address}
        </div>

        <div className="mt-4 border-b border-gray-200">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-current={tab === t.key ? "page" : undefined}
                onClick={() => setTab(t.key)}
                className={`whitespace-nowrap border-b-2 -mb-px px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.key ? "border-[#013764] text-[#013764]" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6">
          {tab === "dashboard" && <DashboardTab summary={summary} onEdit={() => setEditOpen(true)} onRefresh={load} />}
          {tab === "maintenance" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-2">
                <SegmentedControl
                  value={maintenanceTab}
                  onChange={(v) => setMaintenanceTab(v as MaintenanceSubTabKey)}
                  options={MAINTENANCE_SUBTABS.map((t) => ({
                    key: t.key,
                    label: t.label,
                    count:
                      t.key === "tasks"
                        ? summary.counts.tasks
                        : t.key === "work-orders"
                        ? summary.counts.work_orders
                        : summary.counts.field_team_orders,
                  }))}
                />
              </div>
              {maintenanceTab === "tasks" && <TasksTab summary={summary} onRefresh={load} />}
              {maintenanceTab === "work-orders" && <WorkOrdersTab summary={summary} />}
              {maintenanceTab === "field-team" && <FieldTeamTab summary={summary} />}
            </div>
          )}
          {tab === "quotes" && <QuotesTab projectId={project.id} budget={summary.budget} />}
          {tab === "financials" && <FinancialsTab summary={summary} projectId={project.id} onRefreshSummary={load} />}
          {tab === "files" && <FilesTab projectId={project.id} summary={summary} />}
        </div>
      </div>

      {editOpen && (
        <UpdateProjectModal
          summary={summary}
          onSaved={load}
          onClose={() => setEditOpen(false)}
        />
      )}
    </PageTemplate>
  );
}
