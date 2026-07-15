import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import { usePropertyBreadcrumb } from "@/hooks/PropertyBreadcrumbContext";
import { fetchJSON } from "@/api/fetchJSON";
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
  createDraw,
  listPayments,
  createPayment,
  getCashFlow,
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
} from "@/data/projects";
import {
  BudgetEditor,
  MilestonesEditor,
  categoriesToDrafts,
  milestonesToDrafts,
  draftsToBudgetPayload,
  draftsToMilestonesPayload,
  type CategoryDraft,
  type MilestoneDraft,
} from "@/components/projects/ProjectEditors";

type TabKey = "dashboard" | "maintenance" | "quotes" | "budget" | "invoicing" | "cashflow" | "files";
type MaintenanceSubTabKey = "tasks" | "work-orders" | "field-team";

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  // Meeting 2026-07: tasks/WOs/FTOs collapsed under one "Work" tab (filter pills inside).
  { key: "maintenance", label: "Work" },
  // Two-lane money model: "Payables" = vendor lane (budget plan, quotes, vendor payment
  // schedules, spend); "Receivables" = client lane (payment schedule, project invoices,
  // receipts); Cash Flow = where the lanes meet. Siloed from monthly invoicing per
  // PROJECT_INVOICING_SPEC.md. The old SOV/draws BillingTab stays dormant (spec P2 deletes it).
  // Quotes = pre-commitment (bidding); accepting one feeds Payables (budget + vendor schedule).
  { key: "quotes", label: "Quotes" },
  { key: "budget", label: "Payables" },
  { key: "invoicing", label: "Receivables" },
  { key: "cashflow", label: "Cash Flow" },
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
            <select id={`${uid}-status`} className={`${fieldCls} mt-1`} value={status} onChange={(e) => setStatus(e.target.value as "draft" | "pending_approval")}>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
            </select>
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

/* --------------------------------- tabs ----------------------------------- */

function BudgetTab({ summary, onEdit, onRefresh }: { summary: ProjectSummary; onEdit: () => void; onRefresh: () => void }) {
  const categories = summary.budget;
  const totalAllocated = categories.reduce((s, c) => s + c.amount_cents, 0);
  const totalSpent = categories.reduce((s, c) => s + c.spent_cents, 0);
  const remaining = totalAllocated - totalSpent;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label="Allocated" value={formatUSD(totalAllocated)} subtitle="Across all categories" accent="navy" />
        <KpiCard label="Spent" value={formatUSD(totalSpent)} subtitle={`${totalAllocated ? Math.round((totalSpent / totalAllocated) * 100) : 0}% of budget`} accent="violet" />
        <KpiCard label="Remaining" value={formatUSD(remaining)} subtitle="Unspent budget" accent={remaining >= 0 ? "green" : "red"} valueColor={remaining >= 0 ? "#15803D" : "#B91C1C"} />
      </div>

      <Card title="Budget Breakdown" action={<button onClick={onEdit} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Edit budget</button>}>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">No budget categories yet.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {categories.map((c) => {
              const pct = c.amount_cents > 0 ? (c.spent_cents / c.amount_cents) * 100 : 0;
              const over = c.spent_cents > c.amount_cents;
              return (
                <div key={c.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{c.name}</span>
                    <span className="tabular-nums text-gray-700">
                      <span className={over ? "font-semibold text-red-700" : ""}>{formatUSD(c.spent_cents)}</span>
                      <span className="text-gray-400"> / {formatUSD(c.amount_cents)}</span>
                    </span>
                  </div>
                  <Bar percent={pct} color={over ? "#DC2626" : "#013764"} />
                  {c.sub_budgets.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1 border-l-2 border-gray-100 pl-3">
                      {c.sub_budgets.map((s) => (
                        <div key={s.id} className="flex items-center justify-between text-xs text-gray-500">
                          <span>{s.name}</span>
                          <span className="tabular-nums">{formatUSD(s.amount_cents)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex justify-between border-t border-gray-100 pt-3 text-sm font-semibold text-gray-900">
              <span>Total</span>
              <span className="tabular-nums">{formatUSD(totalSpent)} <span className="font-normal text-gray-400">/ {formatUSD(totalAllocated)}</span></span>
            </div>
          </div>
        )}
      </Card>

      {/* Vendor lane: when each vendor gets paid what (deposit terms etc.) — sample preview.
          Quotes live on their own tab (pre-commitment); accepted quotes seed these schedules. */}
      <VendorScheduleCard />

      {/* COs are budget amendments (current budget = original + approved COs), so the log lives here. */}
      <ChangeOrderLog summary={summary} onRefresh={onRefresh} />
    </div>
  );
}

function DashboardTab({ summary, onEdit }: { summary: ProjectSummary; onEdit: () => void }) {
  const project = summary.project;
  const fin = summary.financials;
  const budget = fin.current_budget_cents;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      {/* main column */}
      <div className="flex flex-col gap-6 min-w-0">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          <KpiCard label="Current Budget" value={formatUSD(budget)} subtitle={fin.approved_change_orders_cents > 0 ? `${formatUSD(fin.original_budget_cents)} + ${formatUSD(fin.approved_change_orders_cents)} COs` : "No change orders"} accent="navy" />
          <KpiCard label="Spent" value={formatUSD(fin.spent_cents)} subtitle={`${formatUSD(fin.remaining_budget_cents)} remaining`} accent="violet" />
          <KpiCard label="% Complete" value={`${project.percent_complete}%`} subtitle="Weighted across work" accent="blue" />
          <KpiCard label="Payments In" value={formatUSD(fin.collected_cents)} subtitle="Deposits + progress" accent="green" valueColor="#15803D" />
          <KpiCard label="Outstanding" value={fin.outstanding_invoices_cents > 0 ? formatUSD(fin.outstanding_invoices_cents) : "$0"} subtitle="Billed, awaiting pay" accent="amber" valueColor={fin.outstanding_invoices_cents > 0 ? "#B45309" : undefined} />
          <KpiCard label="Net Cash Position" value={formatUSD(fin.net_cash_cents)} subtitle="In minus out" accent={fin.net_cash_cents >= 0 ? "green" : "red"} valueColor={fin.net_cash_cents >= 0 ? "#15803D" : "#B91C1C"} />
        </div>

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

        <Card title="Budget vs. Spent">
          <div className="flex flex-col gap-4">
            {[
              { label: "Spent to date", value: fin.spent_cents, color: "#7C3AED" },
              { label: "Billed to client", value: fin.billed_to_date_cents, color: "#013764" },
              { label: "Collected from client", value: fin.collected_cents, color: "#16A34A" },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600">{row.label}</span>
                  <span className="font-medium text-gray-900 tabular-nums">
                    {formatUSD(row.value)} <span className="text-gray-400">of {formatUSD(budget)}</span>
                  </span>
                </div>
                <Bar percent={budget > 0 ? (row.value / budget) * 100 : 0} color={row.color} />
              </div>
            ))}
          </div>
        </Card>

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
              <dd className="flex items-center gap-2">
                {project.manager_initials && <Avatar initials={project.manager_initials} />}
                <span className="text-gray-800">{project.manager_name || "Unassigned"}</span>
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
                      <select
                        aria-label={`Milestone for ${t.name}`}
                        value={t.milestone_id ?? ""}
                        onChange={(e) => assignMilestone(t.id, e.target.value === "" ? null : Number(e.target.value))}
                        className="max-w-[180px] rounded-md border border-[#DADADA] bg-white px-2 py-1 text-sm text-gray-700 focus:border-[#013764] focus:outline-none"
                      >
                        <option value="">— None —</option>
                        {milestones.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
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

/* ------------------------------ progress billing --------------------------- */
/* NOTE: BillingTab (SOV / draws / client billing) is currently NOT rendered — the
   tab was collapsed in favor of Cash Flow's paid-vs-repaid view. The backend
   (schedule, draws, change-order headroom) is untouched; re-add the tab entry in
   TABS and the render branch in ProjectDetailPage to restore it. */

interface ScheduleLineDraft {
  key: number; // client-local React key
  id?: number; // real DB id (existing lines)
  description: string;
  scheduledValueCents: number;
  percentComplete: number;
  retainagePercent: number;
  billedToDateCents: number; // derived, display-only
}

// Sample data rendered only while the project has no real schedule of values.
// Illustrates the intent of this tab (client-side contract billing) — clearly
// badged as sample in the UI and never persisted.
const SAMPLE_SCHEDULE: ScheduleLineDraft[] = [
  { key: -101, description: "Deposit / mobilization", scheduledValueCents: 3_426_600, percentComplete: 100, retainagePercent: 0, billedToDateCents: 3_426_600 },
  { key: -102, description: "Masonry & stonework — Teixera", scheduledValueCents: 16_214_600, percentComplete: 45, retainagePercent: 0, billedToDateCents: 5_000_000 },
  { key: -103, description: "Electrical — Frank Clark", scheduledValueCents: 4_645_000, percentComplete: 0, retainagePercent: 0, billedToDateCents: 0 },
  { key: -104, description: "Plumbing & heat — Guasco's", scheduledValueCents: 6_927_000, percentComplete: 0, retainagePercent: 0, billedToDateCents: 0 },
  { key: -105, description: "A/V — American Knight", scheduledValueCents: 1_938_500, percentComplete: 0, retainagePercent: 0, billedToDateCents: 0 },
  { key: -106, description: "Site & final cleanup — AVM", scheduledValueCents: 1_115_103, percentComplete: 0, retainagePercent: 0, billedToDateCents: 0 },
];

const SAMPLE_DRAWS = [
  { number: "Draw #1", date: "Mar 12, 2026", covers: "Deposit / mobilization", amountCents: 3_426_600, status: "Paid", paid: true },
  { number: "Draw #2", date: "Jun 30, 2026", covers: "Masonry & stonework — 45% complete", amountCents: 5_000_000, status: "Sent — awaiting payment", paid: false },
];

// Sample vendor spend (Budget-side number) for the billing-vs-cost comparison.
const SAMPLE_SPENT_CENTS = 9_640_000;
const SAMPLE_OUTSTANDING_CENTS = 5_000_000;

function BillingTab({ summary, onRefresh }: { summary: ProjectSummary; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);
  const [draft, setDraft] = useState<ScheduleLineDraft[]>([]);
  const keySeq = useRef(-1);

  const toDrafts = (lines: ScheduleLine[]): ScheduleLineDraft[] =>
    lines.map((l) => ({
      key: l.id,
      id: l.id,
      description: l.description,
      scheduledValueCents: l.scheduled_value_cents,
      percentComplete: l.percent_complete,
      retainagePercent: l.retainage_percent,
      billedToDateCents: l.billed_to_date_cents,
    }));

  // Sample mode: no real schedule exists yet — show badged illustration data.
  const sample = !editing && summary.schedule.length === 0;
  const viewRows: ScheduleLineDraft[] = editing ? draft : sample ? SAMPLE_SCHEDULE : toDrafts(summary.schedule);
  const totalScheduled = viewRows.reduce((s, l) => s + l.scheduledValueCents, 0);
  const totalBilled = viewRows.reduce((s, l) => s + l.billedToDateCents, 0);
  const earned = (l: ScheduleLineDraft) => Math.round((l.scheduledValueCents * l.percentComplete) / 100);

  const fin = summary.financials;
  // Contract = SOV + approved COs (approved COs are exactly the over-billing headroom draws get).
  const contractValue = totalScheduled + fin.approved_change_orders_cents;
  const leftToBill = contractValue - totalBilled;
  const outstanding = sample ? SAMPLE_OUTSTANDING_CENTS : fin.outstanding_invoices_cents;
  const vendorSpent = sample ? SAMPLE_SPENT_CENTS : fin.spent_cents;
  const fronting = vendorSpent - totalBilled; // >0: AVM has paid out more than it has asked the client for

  const startEdit = () => {
    setDraft(toDrafts(summary.schedule));
    setEditing(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      await putSchedule(summary.project.id, {
        lines: draft.map((l) => ({
          ...(l.id != null ? { id: l.id } : {}),
          description: l.description.trim() || "Untitled line",
          scheduled_value_cents: l.scheduledValueCents,
          percent_complete: l.percentComplete,
          retainage_percent: l.retainagePercent,
        })),
      });
      toast.success("Schedule of values saved");
      setEditing(false);
      onRefresh();
    } catch (e) {
      toast.error(errMessage(e, "Failed to save schedule"));
    } finally {
      setSaving(false);
    }
  };
  const cancel = () => setEditing(false);
  const patch = (key: number, p: Partial<ScheduleLineDraft>) =>
    setDraft((d) => d.map((l) => (l.key === key ? { ...l, ...p } : l)));
  const addLine = () =>
    setDraft((d) => [
      ...d,
      { key: keySeq.current--, description: "", scheduledValueCents: 0, percentComplete: 0, retainagePercent: 0, billedToDateCents: 0 },
    ]);
  const removeLine = (key: number) => setDraft((d) => d.filter((l) => l.key !== key));

  return (
    <div className="flex flex-col gap-6">
      {/* What this tab is for — the client side, vs Budget's vendor-cost side. */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm leading-relaxed text-gray-700">
        <span className="font-semibold text-[#013764]">This is the client side of the project.</span>{" "}
        <span className="font-medium">Budget</span> tracks what the work costs AVM — vendor bills against plan. This tab tracks
        what we charge the owner: the agreed billing schedule, the invoices (draws) issued against it, and what's still billable.
        Money actually received shows up in <span className="font-medium">Cash Flow</span>.
      </div>

      {sample && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold uppercase tracking-wider">Sample data</span>
          <span>No billing schedule exists for this project yet — everything below is an illustration. Use “Edit” on the schedule to build the real one.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard
          label="Contract Value"
          value={formatUSD(contractValue)}
          subtitle={fin.approved_change_orders_cents > 0 ? `Schedule + ${formatUSD(fin.approved_change_orders_cents)} approved COs` : "What the client agreed to pay"}
          accent="navy"
        />
        <KpiCard
          label="Billed to Client"
          value={formatUSD(totalBilled)}
          subtitle={`${contractValue ? Math.round((totalBilled / contractValue) * 100) : 0}% of contract invoiced`}
          accent="blue"
        />
        <KpiCard
          label="Outstanding"
          value={formatUSD(outstanding)}
          subtitle="Invoiced, awaiting payment"
          accent="amber"
          valueColor={outstanding > 0 ? "#B45309" : undefined}
        />
        <KpiCard label="Left to Bill" value={formatUSD(leftToBill)} subtitle="Not yet invoiced" accent="violet" />
      </div>

      <Card
        title="Billing Schedule — what we invoice the client against"
        action={
          editing ? (
            <div className="flex items-center gap-2">
              <button onClick={cancel} disabled={saving} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button onClick={save} disabled={saving} className="h-7 rounded-lg bg-[#013764] px-2.5 text-xs font-medium text-white hover:bg-[#003a73] disabled:opacity-50">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={startEdit} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Edit</button>
              {/* New draw button — the Phase-4 entry point promised in Decision #46.
                  The adjacent "Generate progress report" button is kept inert exactly
                  as in the mock (Decision #46) and is intentionally NOT wired here. */}
              <button
                onClick={() => setDrawOpen(true)}
                disabled={summary.schedule.length === 0}
                title={summary.schedule.length === 0 ? "Add schedule-of-values lines first" : "Bill a progress draw against the schedule of values"}
                className="h-7 rounded-lg border border-[#013764] bg-white px-2.5 text-xs font-medium text-[#013764] hover:bg-[#013764]/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                New draw
              </button>
              <button className="h-7 rounded-lg bg-[#013764] px-2.5 text-xs font-medium text-white hover:bg-[#003a73]">Generate progress report</button>
            </div>
          )
        }
      >
        {viewRows.length === 0 && !editing ? (
          <p className="text-sm text-gray-500">No schedule of values yet. Use “Edit” to build the billing schedule.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <Th>Work item</Th><Th right>Scheduled value</Th><Th>% Complete</Th><Th right>Earned</Th><Th right>Billed to date</Th><Th right>To bill</Th>
                  {editing && <Th>{""}</Th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {viewRows.map((l) => {
                  const earnedCents = earned(l);
                  const toBill = earnedCents - l.billedToDateCents;
                  return (
                    <tr key={l.key} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 text-gray-900">
                        {editing ? (
                          <input
                            aria-label="Work item description"
                            value={l.description}
                            placeholder="Work item"
                            onChange={(e) => patch(l.key, { description: e.target.value })}
                            className="w-full min-w-[160px] rounded-md border border-[#DADADA] px-2 py-1 focus:border-[#013764] focus:outline-none"
                          />
                        ) : (
                          l.description
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-gray-900">
                        {editing ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-gray-400" aria-hidden="true">$</span>
                            <input
                              type="number"
                              aria-label="Scheduled value in dollars"
                              value={l.scheduledValueCents / 100}
                              onChange={(e) => patch(l.key, { scheduledValueCents: Math.max(0, Math.round((Number(e.target.value) || 0) * 100)) })}
                              className="w-24 rounded-md border border-[#DADADA] px-2 py-1 text-right tabular-nums focus:border-[#013764] focus:outline-none"
                            />
                          </div>
                        ) : (
                          formatUSD(l.scheduledValueCents)
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {editing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              aria-label="Percent complete"
                              value={l.percentComplete}
                              onChange={(e) => patch(l.key, { percentComplete: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                              className="w-16 rounded-md border border-[#DADADA] px-2 py-1 text-right tabular-nums focus:border-[#013764] focus:outline-none"
                            />
                            <span className="text-gray-500">%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Bar percent={l.percentComplete} />
                            <span className="w-9 text-right text-xs text-gray-600 tabular-nums">{l.percentComplete}%</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-gray-700">{formatUSD(earnedCents)}</td>
                      {/* Billed-to-date is derived from invoices (Decision #17) — read-only, 0 until Phase 4. */}
                      <td className="py-3 pr-4 text-right tabular-nums text-gray-700">{formatUSD(l.billedToDateCents)}</td>
                      <td className={`py-3 pr-4 text-right tabular-nums font-medium ${toBill > 0 ? "text-green-700" : "text-gray-400"}`}>
                        {toBill > 0 ? formatUSD(toBill) : "—"}
                      </td>
                      {editing && (
                        <td className="py-3 text-right">
                          <button type="button" onClick={() => removeLine(l.key)} title="Remove line" aria-label="Remove line" className="px-1.5 text-gray-400 hover:text-red-600">✕</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 font-semibold text-gray-900">
                  <td className="py-3 pr-4">Total</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{formatUSD(totalScheduled)}</td>
                  <td className="py-3 pr-4" />
                  <td className="py-3 pr-4" />
                  <td className="py-3 pr-4 text-right tabular-nums">{formatUSD(totalBilled)}</td>
                  <td className="py-3 pr-4" />
                  {editing && <td className="py-3" />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {editing && (
          <div className="mt-3 flex items-center justify-between">
            <button onClick={addLine} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">+ Add line</button>
            <p className="text-xs text-gray-400">
              Editing updates % complete and scheduled value. Billed-to-date is derived from invoices. Earned and “to bill” recalculate live.
            </p>
          </div>
        )}
      </Card>

      {/* Draws are the invoices this tab exists to produce — each one is a draft
          invoice in the normal invoicing pipeline (source_type='project_progress'). */}
      <Card title="Draw History — invoices issued to the client">
        {sample ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <Th>Draw</Th><Th>Date</Th><Th>Covers</Th><Th right>Amount</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {SAMPLE_DRAWS.map((d) => (
                  <tr key={d.number} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">{d.number}</td>
                    <td className="py-3 pr-4 text-gray-700">{d.date}</td>
                    <td className="py-3 pr-4 text-gray-700">{d.covers}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-gray-900">{formatUSD(d.amountCents)}</td>
                    <td className="py-3 pr-4">
                      {d.paid ? <Pill label={d.status} text="#15803D" bg="#E7F6EC" /> : <Pill label={d.status} text="#B45309" bg="#FCF2E1" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : fin.billed_to_date_cents > 0 ? (
          <p className="text-sm text-gray-600">
            {formatUSD(fin.billed_to_date_cents)} billed to the client across progress draws, {formatUSD(fin.outstanding_invoices_cents)} still
            outstanding. Each draw is a draft invoice — find and send them under <span className="font-medium">Invoicing</span>.
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            No draws yet. “New draw” invoices the client for completed work against the schedule above and creates a draft invoice
            in the normal invoicing pipeline.
          </p>
        )}
      </Card>

      {/* The one-glance contrast with the Budget tab: money out vs money asked for. */}
      <Card title="Billing vs. Cost — where AVM stands">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Paid to vendors</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{formatUSD(vendorSpent)}</div>
            <div className="mt-0.5 text-xs text-gray-500">Cost side — tracked on the Budget tab</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Billed to client</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{formatUSD(totalBilled)}</div>
            <div className="mt-0.5 text-xs text-gray-500">Revenue side — driven from this tab</div>
          </div>
          <div className={`rounded-lg px-4 py-3 ${fronting > 0 ? "bg-red-50" : "bg-green-50"}`}>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {fronting > 0 ? "AVM is fronting" : "Billed ahead by"}
            </div>
            <div className={`mt-1 text-xl font-semibold tabular-nums ${fronting > 0 ? "text-red-700" : "text-green-700"}`}>
              {formatUSD(Math.abs(fronting))}
            </div>
            <div className="mt-0.5 text-xs text-gray-500">
              {fronting > 0 ? "Spend not yet invoiced to the client" : "Invoiced ahead of vendor spend"}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Whether the client has actually <span className="font-medium text-gray-500">paid</span> what we billed lives on the Cash Flow tab.
        </p>
      </Card>

      {drawOpen && (
        <NewDrawModal
          projectId={summary.project.id}
          lines={summary.schedule}
          onSaved={onRefresh}
          onClose={() => setDrawOpen(false)}
        />
      )}
    </div>
  );
}

/* ---------------------------------- draw ----------------------------------- */

function NewDrawModal({
  projectId,
  lines,
  onSaved,
  onClose,
}: {
  projectId: number;
  lines: ScheduleLine[];
  onSaved: () => void;
  onClose: () => void;
}) {
  // Per-line draw amount in dollars, keyed by schedule-line id. Empty = not billed.
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const uid = useId();

  const setAmount = (id: number, v: string) => setAmounts((a) => ({ ...a, [id]: v }));
  const fillRemaining = (l: ScheduleLine) => {
    const remainingCents = Math.max(0, l.scheduled_value_cents - l.billed_to_date_cents);
    setAmount(l.id, remainingCents ? (remainingCents / 100).toFixed(2) : "");
  };

  const drawLines = lines
    .map((l) => ({ id: l.id, cents: Math.round((Number(amounts[l.id]) || 0) * 100) }))
    .filter((x) => x.cents > 0);
  const totalCents = drawLines.reduce((s, x) => s + x.cents, 0);
  const canSubmit = drawLines.length > 0 && !saving;

  const submit = async () => {
    if (drawLines.length === 0) {
      toast.error("Enter a draw amount on at least one line");
      return;
    }
    setSaving(true);
    try {
      const res = await createDraw(projectId, {
        lines: drawLines.map((x) => ({ schedule_line_id: x.id, amount_cents: x.cents })),
        memo: memo.trim() || undefined,
      });
      toast.success(`Draft draw invoice created — ${formatUSD(res.total_amount_cents)}`);
      onSaved();
      onClose();
    } catch (e) {
      // Surfaces the backend 400 over-billing message verbatim (names the line).
      toast.error(errMessage(e, "Failed to create draw"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="New progress draw"
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className="h-9 rounded-lg border border-[#DADADA] bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={submit} disabled={!canSubmit} className="h-9 rounded-lg bg-[#013764] px-3 text-sm font-medium text-white hover:bg-[#003a73] disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Creating…" : `Create draw${totalCents ? ` — ${formatUSD(totalCents)}` : ""}`}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-gray-500">
          Bill an amount against each schedule-of-values line. This creates one draft invoice
          (no QBO/Buildium push). Billing past a line’s scheduled value is only allowed within
          the approved change-order allowance — otherwise the draw is rejected.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <Th>Work item</Th><Th right>Scheduled</Th><Th right>Billed</Th><Th right>Left</Th><Th right>This draw</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((l) => {
                const leftCents = l.scheduled_value_cents - l.billed_to_date_cents;
                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="py-2 pr-4 text-gray-900">{l.description}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-gray-700">{formatUSD(l.scheduled_value_cents)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-gray-700">{formatUSD(l.billed_to_date_cents)}</td>
                    <td className={`py-2 pr-4 text-right tabular-nums ${leftCents > 0 ? "text-gray-700" : "text-gray-400"}`}>{formatUSD(leftCents)}</td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-gray-400" aria-hidden="true">$</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          aria-label={`Draw amount for ${l.description}`}
                          value={amounts[l.id] ?? ""}
                          placeholder="0.00"
                          onChange={(e) => setAmount(l.id, e.target.value)}
                          className="w-24 rounded-md border border-[#DADADA] px-2 py-1 text-right tabular-nums focus:border-[#013764] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => fillRemaining(l)}
                          title="Fill remaining"
                          aria-label={`Fill remaining for ${l.description}`}
                          className="rounded px-1 text-xs text-[#013764] hover:underline"
                        >
                          max
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 font-semibold text-gray-900">
                <td className="py-2 pr-4" colSpan={4}>Total this draw</td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatUSD(totalCents)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${uid}-memo`} className={labelCls}>Memo (optional)</label>
          <input
            id={`${uid}-memo`}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="e.g. Progress billing #2"
            className={fieldCls}
          />
        </div>
      </div>
    </ModalShell>
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
  const [saving, setSaving] = useState(false);
  const uid = useId();

  const submit = async () => {
    setSaving(true);
    try {
      await createPayment(projectId, {
        kind,
        amount_cents: Math.max(0, Math.round((Number(amount) || 0) * 100)),
        received_on: receivedOn,
        reference: reference.trim(),
      });
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
            <select id={`${uid}-kind`} className={`${fieldCls} mt-1`} value={kind} onChange={(e) => setKind(e.target.value as PaymentKind)}>
              <option value="deposit">Deposit</option>
              <option value="progress_payment">Progress payment</option>
            </select>
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
        {payments.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">Previously recorded</div>
            <div className="flex flex-col gap-1">
              {payments.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs text-gray-500">
                  <span className="truncate">{formatMaybeDate(p.received_on)} · {p.kind === "deposit" ? "Deposit" : "Progress payment"}{p.reference ? ` · ${p.reference}` : ""}</span>
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

// Sample ledger rendered only while the project has zero real cash activity.
// Clearly badged in the UI, never persisted — illustrates the paid-vs-repaid model.
const SAMPLE_CASHFLOW: CashFlowEntry[] = [
  { date: "2026-02-20", direction: "inbound", kind: "Deposit", description: "Project deposit — 10% of budget", party: "Owner", amount_cents: 3_426_600 },
  { date: "2026-03-03", direction: "outbound", kind: "Vendor Bill Payment", description: "Mobilization & footings", party: "Teixera Construction", amount_cents: 2_850_000 },
  { date: "2026-03-28", direction: "outbound", kind: "Vendor Bill Payment", description: "Cedar lake stone — 50% materials deposit", party: "Teixera Construction", amount_cents: 4_088_139 },
  { date: "2026-04-15", direction: "outbound", kind: "Vendor Bill Payment", description: "Dumpster rental — April", party: "County Waste", amount_cents: 165_000 },
  { date: "2026-05-02", direction: "outbound", kind: "Vendor Bill Payment", description: "Progress bill #2 — footings + walls", party: "Teixera Construction", amount_cents: 4_500_000 },
  { date: "2026-05-20", direction: "inbound", kind: "Progress Payment", description: "Reimbursement — costs through April", party: "Owner", amount_cents: 8_426_600 },
  { date: "2026-06-05", direction: "outbound", kind: "Vendor Bill Payment", description: "Rough plumbing — deposit", party: "Guasco's Plumbing", amount_cents: 1_240_000 },
  { date: "2026-06-18", direction: "outbound", kind: "Vendor Bill Payment", description: "Portapotty — May/June", party: "AVM (misc)", amount_cents: 75_000 },
];

// Upcoming (not yet moved) money, shown per lane in sample mode. Out-side rows come
// from vendor payment schedules (Payables tab); in-side rows from the client payment
// schedule + outstanding invoices (Receivables tab). Amounts reconcile with those tabs.
const SAMPLE_UPCOMING_OUT = [
  { label: "Frank Clark — 30% electrical deposit", when: "Due Jul 17, 2026 (work start)", amountCents: 1_393_500, urgent: true },
  { label: "American Knight — 60% A/V deposit", when: "On quote acceptance", amountCents: 1_163_132 },
  { label: "Guasco's Plumbing — balance", when: "On plumbing completion", amountCents: 5_687_000 },
  { label: "Teixera — masonry balance", when: "On masonry completion", amountCents: 8_203_111 },
];
const SAMPLE_UPCOMING_IN = [
  { label: "Invoice PI-45-003 — masonry progress (sent)", when: "Due Aug 7, 2026", amountCents: 4_500_000, urgent: true },
  { label: "Installment — masonry 50% complete", when: "Due now — invoice it on Receivables", amountCents: 8_500_000, urgent: true },
  { label: "Installment — rough-ins complete", when: "Aug 15, 2026", amountCents: 12_000_000 },
  { label: "Installment — final balance", when: "On completion", amountCents: 10_340_203 },
];

function CashFlowTab({ projectId, onRefreshSummary }: { projectId: number; onRefreshSummary: () => void }) {
  const [entries, setEntries] = useState<CashFlowEntry[] | null>(null);
  const [payments, setPayments] = useState<ProjectPayment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [cf, pays] = await Promise.all([getCashFlow(projectId), listPayments(projectId)]);
      setEntries(cf);
      setPayments(pays);
    } catch (e) {
      setError(errMessage(e, "Failed to load cash flow"));
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        {error}{" "}
        <button onClick={load} className="text-blue-600 hover:underline">Retry</button>
      </div>
    );
  }
  if (entries === null) {
    return <div className="py-12 text-center text-sm text-gray-500">Loading cash flow…</div>;
  }

  // Sample mode: no real cash activity yet — show badged illustration data.
  const sample = entries.length === 0;
  const viewEntries = sample ? SAMPLE_CASHFLOW : entries;
  const inTotal = viewEntries.filter((c) => c.direction === "inbound").reduce((s, c) => s + c.amount_cents, 0);
  const outTotal = viewEntries.filter((c) => c.direction === "outbound").reduce((s, c) => s + c.amount_cents, 0);
  const net = inTotal - outTotal;

  return (
    <div className="flex flex-col gap-6">
      {sample && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold uppercase tracking-wider">Sample data</span>
          <span>
            No cash activity on this project yet — the ledger below is an illustration. Vendor payments appear automatically
            when bills on this project's work orders are paid; client payments are logged with “Record payment.”
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label="Paid to Vendors" value={formatUSD(outTotal)} subtitle="AVM money out on this project" accent="red" valueColor="#B91C1C" />
        <KpiCard label="Repaid by Client" value={formatUSD(inTotal)} subtitle="Deposits + progress payments received" accent="green" valueColor="#15803D" />
        <KpiCard
          label={net < 0 ? "AVM is Fronting" : "Collected Ahead"}
          value={formatUSD(Math.abs(net))}
          subtitle={net < 0 ? "Paid out, not yet repaid by client" : "Received ahead of vendor spend"}
          accent={net < 0 ? "amber" : "green"}
          valueColor={net < 0 ? "#B45309" : "#15803D"}
        />
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        {net < 0 ? (
          <>
            <span className="font-semibold">The client currently owes AVM {formatUSD(-net)}</span> for project costs we've
            fronted — money paid to vendors that hasn't been repaid yet. Bill it through the owner's invoice, then record the
            payment here when it lands.
          </>
        ) : net > 0 ? (
          <>
            <span className="font-semibold">AVM is holding {formatUSD(net)} of client money</span> — collected ahead of vendor
            spend. Upcoming vendor payments up to this amount are already covered.
          </>
        ) : (
          <>
            <span className="font-semibold">Fully settled</span> — everything paid to vendors has been repaid by the client.
          </>
        )}
      </div>

      {/* Two lanes: the vendor lane and the client lane, side by side. Actuals on top,
          upcoming (from the Payables / Receivables schedules) below — this is where the
          two directions meet, and the only place both appear together. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card title="AVM → Vendors — money out">
          <CashLane
            rows={viewEntries.filter((c) => c.direction === "outbound")}
            totalCents={outTotal}
            totalLabel="Paid to vendors"
            sign="−"
            amountColor="text-red-700"
            emptyText="No vendor payments yet — they appear automatically when bills on this project's work are paid."
            upcoming={sample ? SAMPLE_UPCOMING_OUT : undefined}
            upcomingHint="From vendor payment schedules (Payables)"
          />
        </Card>
        <Card
          title="Client → AVM — money in"
          action={
            <button onClick={() => setRecordOpen(true)} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
              + Record payment
            </button>
          }
        >
          <CashLane
            rows={viewEntries.filter((c) => c.direction === "inbound")}
            totalCents={inTotal}
            totalLabel="Received from client"
            sign="+"
            amountColor="text-green-700"
            emptyText="No client payments yet — record one, or they arrive automatically when a project invoice is paid."
            upcoming={sample ? SAMPLE_UPCOMING_IN : undefined}
            upcomingHint="From the client payment schedule + outstanding invoices (Receivables)"
          />
        </Card>
      </div>

      {sample && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Near-term position:</span> {formatUSD(13_000_000)} expected in
          (outstanding invoice + due installment) against {formatUSD(1_393_500)} committed out (Frank Clark deposit) — the
          current {formatUSD(-net > 0 ? -net : 0)} fronting gap closes once PI-45-003 is paid.
        </div>
      )}

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
    </div>
  );
}

/* ------------------- project invoicing (spec preview, sample) --------------- */
/* Frontend-only preview of PROJECT_INVOICING_SPEC.md: siloed project invoices,
   payment-schedule installments, quotes, files. All state is local + badged as
   sample; interactions work in-page and reset on reload. No API calls. */

function SampleBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold uppercase tracking-wider">Sample data</span>
      <span>{children}</span>
    </div>
  );
}

type PInvoiceStatus = "draft" | "sent" | "partially_paid" | "paid" | "void";

const P_INVOICE_STATUS_META: Record<PInvoiceStatus, { label: string; text: string; bg: string }> = {
  draft: { label: "Draft", text: "#374151", bg: "#F3F4F6" },
  sent: { label: "Sent", text: "#1D4ED8", bg: "#E7EEFE" },
  partially_paid: { label: "Partially Paid", text: "#B45309", bg: "#FCF2E1" },
  paid: { label: "Paid", text: "#15803D", bg: "#E7F6EC" },
  void: { label: "Void", text: "#6B7280", bg: "#F3F4F6" },
};

interface PInvoiceLine {
  description: string;
  amountCents: number;
  sourceType: "manual" | "installment" | "change_order" | "cost_reimbursement";
}
interface PInvoicePayment {
  date: string;
  amountCents: number;
  reference: string;
  viaQbo?: boolean;
}
interface PInvoice {
  id: number;
  number: string;
  title: string;
  status: PInvoiceStatus;
  issueDate: string;
  dueDate?: string;
  lines: PInvoiceLine[];
  payments: PInvoicePayment[];
}
interface PInstallment {
  id: number;
  label: string;
  basisLabel: string; // "10% of budget" | "Fixed"
  amountCents: number;
  trigger: string; // human-readable due trigger
  triggerMet: boolean; // due date passed or linked milestone complete
  invoiceId: number | null;
}

const SAMPLE_INSTALLMENTS: PInstallment[] = [
  { id: 1, label: "Deposit", basisLabel: "10% of budget", amountCents: 3_426_600, trigger: "On signing", triggerMet: true, invoiceId: 1 },
  { id: 2, label: "Masonry 50% complete", basisLabel: "Fixed", amountCents: 8_500_000, trigger: "Milestone: Construction Work", triggerMet: true, invoiceId: null },
  { id: 3, label: "Rough-ins complete (electric + plumbing)", basisLabel: "Fixed", amountCents: 12_000_000, trigger: "Due Aug 15, 2026", triggerMet: false, invoiceId: null },
  { id: 4, label: "Final balance", basisLabel: "Fixed", amountCents: 10_340_203, trigger: "On completion", triggerMet: false, invoiceId: null },
];

const SAMPLE_PROJECT_INVOICES: PInvoice[] = [
  {
    id: 1, number: "PI-45-001", title: "Project deposit", status: "paid", issueDate: "Feb 18, 2026", dueDate: "Mar 4, 2026",
    lines: [{ description: "Deposit — 10% of project budget", amountCents: 3_426_600, sourceType: "installment" }],
    payments: [{ date: "Feb 20, 2026", amountCents: 3_426_600, reference: "QBO payment link", viaQbo: true }],
  },
  {
    id: 2, number: "PI-45-002", title: "Reimbursement — costs through April", status: "paid", issueDate: "May 12, 2026", dueDate: "May 26, 2026",
    lines: [{ description: "Unreimbursed project costs through Apr 30", amountCents: 8_426_600, sourceType: "cost_reimbursement" }],
    payments: [{ date: "May 20, 2026", amountCents: 8_426_600, reference: "QBO payment link", viaQbo: true }],
  },
  {
    id: 3, number: "PI-45-003", title: "Masonry progress — partial billing", status: "sent", issueDate: "Jul 8, 2026", dueDate: "Aug 7, 2026",
    lines: [{ description: "Masonry & stonework — progress through Jun 30", amountCents: 4_500_000, sourceType: "manual" }],
    payments: [],
  },
];

// One unbilled approved change order, offered as a billable line in the builder.
const SAMPLE_UNBILLED_CO = { id: 900, label: "CO-01 · Bluestone cap upgrade (approved)", amountCents: 650_000 };

const paidCents = (inv: PInvoice) => inv.payments.reduce((s, p) => s + p.amountCents, 0);

function InvoicingTab({ summary }: { summary: ProjectSummary }) {
  const [invoices, setInvoices] = useState<PInvoice[]>(SAMPLE_PROJECT_INVOICES);
  const [installments, setInstallments] = useState<PInstallment[]>(SAMPLE_INSTALLMENTS);
  const [coBilledOnInvoiceId, setCoBilledOnInvoiceId] = useState<number | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const nextId = useRef(100);

  const budget = summary.financials.current_budget_cents;
  const active = invoices.filter((i) => i.status !== "void");
  const issued = active.filter((i) => i.status !== "draft");
  const invTotal = (inv: PInvoice) => inv.lines.reduce((s, l) => s + l.amountCents, 0);
  const billed = issued.reduce((s, i) => s + invTotal(i), 0);
  const received = active.reduce((s, i) => s + paidCents(i), 0);
  const outstanding = issued.reduce((s, i) => s + Math.max(0, invTotal(i) - paidCents(i)), 0);
  const leftToBill = Math.max(0, budget - billed);

  const instStatus = (inst: PInstallment): { label: string; text: string; bg: string } => {
    if (inst.invoiceId != null) {
      const inv = invoices.find((i) => i.id === inst.invoiceId);
      if (inv && inv.status === "paid") return { label: "Paid", text: "#15803D", bg: "#E7F6EC" };
      return { label: "Invoiced", text: "#1D4ED8", bg: "#E7EEFE" };
    }
    if (inst.triggerMet) return { label: "Due now", text: "#B45309", bg: "#FCF2E1" };
    return { label: "Upcoming", text: "#6B7280", bg: "#F3F4F6" };
  };

  const createInvoice = (title: string, lines: PInvoiceLine[], instIds: number[], includesCo: boolean) => {
    const id = nextId.current++;
    const seq = invoices.length + 1;
    const inv: PInvoice = {
      id,
      number: `PI-${summary.project.id}-${String(seq).padStart(3, "0")}`,
      title,
      status: "draft",
      issueDate: "Jul 15, 2026",
      lines,
      payments: [],
    };
    setInvoices((v) => [inv, ...v]);
    setInstallments((v) => v.map((x) => (instIds.includes(x.id) ? { ...x, invoiceId: id } : x)));
    if (includesCo) setCoBilledOnInvoiceId(id);
    setBuilderOpen(false);
    setDetailId(id);
    toast.success(`${inv.number} created as draft`);
  };

  const mutateInvoice = (id: number, fn: (inv: PInvoice) => PInvoice) =>
    setInvoices((v) => v.map((i) => (i.id === id ? fn(i) : i)));

  const sendInvoice = (id: number) => {
    mutateInvoice(id, (i) => ({ ...i, status: "sent" }));
    toast.success("Invoice sent — PDF emailed to the client (sample)");
  };
  const recordPayment = (id: number, amountCents: number) => {
    mutateInvoice(id, (i) => {
      const payments = [...i.payments, { date: "Jul 15, 2026", amountCents, reference: "Manual entry" }];
      const paid = payments.reduce((s, p) => s + p.amountCents, 0);
      return { ...i, payments, status: paid >= invTotal(i) ? "paid" : "partially_paid" };
    });
    toast.success("Payment recorded — a linked row lands in Cash Flow (sample)");
  };
  const voidInvoice = (id: number) => {
    mutateInvoice(id, (i) => ({ ...i, status: "void" }));
    setInstallments((v) => v.map((x) => (x.invoiceId === id ? { ...x, invoiceId: null } : x)));
    if (coBilledOnInvoiceId === id) setCoBilledOnInvoiceId(null);
    toast.success("Invoice voided — linked installments released");
  };

  const detail = detailId != null ? invoices.find((i) => i.id === detailId) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <SampleBanner>
        Interactive preview (local state, resets on reload). This is the <strong>client lane</strong>: the agreed payment
        schedule, the project invoices issued against it, and receipts. Vendor-side money lives on Payables; the two lanes
        meet on Cash Flow. Completely separate from monthly invoices.
      </SampleBanner>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Billed to Client" value={formatUSD(billed)} subtitle={`${budget ? Math.round((billed / budget) * 100) : 0}% of budget`} accent="navy" />
        <KpiCard label="Received" value={formatUSD(received)} subtitle="Payments on project invoices" accent="green" valueColor="#15803D" />
        <KpiCard label="Outstanding" value={formatUSD(outstanding)} subtitle="Invoiced, awaiting payment" accent="amber" valueColor={outstanding > 0 ? "#B45309" : undefined} />
        <KpiCard label="Left to Bill" value={formatUSD(leftToBill)} subtitle="Budget not yet invoiced" accent="violet" />
      </div>

      <Card
        title="Client Payment Schedule"
        action={<span className="text-xs text-gray-400">The agreed plan for when the client pays what</span>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <Th>Installment</Th><Th>Basis</Th><Th right>Amount</Th><Th>Trigger</Th><Th>Status</Th><Th right>{""}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {installments.map((inst) => {
                const meta = instStatus(inst);
                const linked = inst.invoiceId != null ? invoices.find((i) => i.id === inst.invoiceId) : undefined;
                return (
                  <tr key={inst.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">{inst.label}</td>
                    <td className="py-3 pr-4 text-gray-500">{inst.basisLabel}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-gray-900">{formatUSD(inst.amountCents)}</td>
                    <td className="py-3 pr-4 text-gray-500">{inst.trigger}</td>
                    <td className="py-3 pr-4"><Pill label={meta.label} text={meta.text} bg={meta.bg} /></td>
                    <td className="py-3 text-right">
                      {inst.invoiceId == null && inst.triggerMet ? (
                        <button
                          onClick={() =>
                            createInvoice(
                              inst.label,
                              [{ description: `${inst.label} — per payment schedule`, amountCents: inst.amountCents, sourceType: "installment" }],
                              [inst.id],
                              false,
                            )
                          }
                          className="h-7 rounded-lg bg-[#013764] px-2.5 text-xs font-medium text-white hover:bg-[#003a73]"
                        >
                          Invoice now
                        </button>
                      ) : linked ? (
                        <button onClick={() => setDetailId(linked.id)} className="text-xs font-medium text-blue-600 hover:underline">
                          {linked.number}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 font-semibold text-gray-900">
                <td className="py-3 pr-4" colSpan={2}>Total scheduled</td>
                <td className="py-3 pr-4 text-right tabular-nums">{formatUSD(installments.reduce((s, i) => s + i.amountCents, 0))}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card
        title="Project Invoices"
        action={
          <button onClick={() => setBuilderOpen(true)} className="h-7 rounded-lg bg-[#013764] px-2.5 text-xs font-medium text-white hover:bg-[#003a73]">
            + New invoice
          </button>
        }
      >
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-500">No project invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <Th>Invoice</Th><Th>Title</Th><Th>Issued</Th><Th right>Total</Th><Th right>Paid</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => {
                  const meta = P_INVOICE_STATUS_META[inv.status];
                  return (
                    <tr key={inv.id} onClick={() => setDetailId(inv.id)} className="cursor-pointer hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-blue-600">{inv.number}</td>
                      <td className="py-3 pr-4 text-gray-900">{inv.title}</td>
                      <td className="py-3 pr-4 text-gray-500">{inv.issueDate}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-gray-900">{formatUSD(invTotal(inv))}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-gray-700">{paidCents(inv) > 0 ? formatUSD(paidCents(inv)) : "—"}</td>
                      <td className="py-3 pr-4"><Pill label={meta.label} text={meta.text} bg={meta.bg} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {builderOpen && (
        <ProjectInvoiceBuilderModal
          installments={installments.filter((i) => i.invoiceId == null)}
          coAvailable={coBilledOnInvoiceId == null}
          unreimbursedCents={0 /* sample: all fronted costs already billed (spent − billed ≤ 0) */}
          onCreate={createInvoice}
          onClose={() => setBuilderOpen(false)}
        />
      )}
      {detail && (
        <ProjectInvoiceDetailModal
          invoice={detail}
          totalCents={invTotal(detail)}
          onSend={() => sendInvoice(detail.id)}
          onRecordPayment={(cents) => recordPayment(detail.id, cents)}
          onVoid={() => voidInvoice(detail.id)}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}

function ProjectInvoiceBuilderModal({
  installments,
  coAvailable,
  unreimbursedCents,
  onCreate,
  onClose,
}: {
  installments: PInstallment[];
  coAvailable: boolean;
  unreimbursedCents: number;
  onCreate: (title: string, lines: PInvoiceLine[], instIds: number[], includesCo: boolean) => void;
  onClose: () => void;
}) {
  // Due installments come pre-checked — they're what the builder exists to bill.
  const [selected, setSelected] = useState<number[]>(installments.filter((i) => i.triggerMet).map((i) => i.id));
  const [includeCo, setIncludeCo] = useState(false);
  const [includeCosts, setIncludeCosts] = useState(false);
  const [manual, setManual] = useState<{ key: number; description: string; amount: string }[]>([]);
  const [title, setTitle] = useState("");
  const manualSeq = useRef(-1);

  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const manualCents = manual.reduce((s, m) => s + Math.round((Number(m.amount) || 0) * 100), 0);
  const total =
    installments.filter((i) => selected.includes(i.id)).reduce((s, i) => s + i.amountCents, 0) +
    (includeCo ? SAMPLE_UNBILLED_CO.amountCents : 0) +
    (includeCosts ? unreimbursedCents : 0) +
    manualCents;

  const create = () => {
    const lines: PInvoiceLine[] = [
      ...installments
        .filter((i) => selected.includes(i.id))
        .map((i): PInvoiceLine => ({ description: `${i.label} — per payment schedule`, amountCents: i.amountCents, sourceType: "installment" })),
      ...(includeCo ? [{ description: SAMPLE_UNBILLED_CO.label, amountCents: SAMPLE_UNBILLED_CO.amountCents, sourceType: "change_order" as const }] : []),
      ...(includeCosts && unreimbursedCents > 0
        ? [{ description: "Unreimbursed project costs to date", amountCents: unreimbursedCents, sourceType: "cost_reimbursement" as const }]
        : []),
      ...manual
        .filter((m) => m.description.trim() && Number(m.amount))
        .map((m): PInvoiceLine => ({ description: m.description.trim(), amountCents: Math.round(Number(m.amount) * 100), sourceType: "manual" })),
    ];
    if (lines.length === 0) {
      toast.error("Add at least one line");
      return;
    }
    onCreate(title.trim() || "Project invoice", lines, selected, includeCo);
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
          <button onClick={create} className="h-9 rounded-lg bg-[#013764] px-3.5 text-sm font-medium text-white hover:bg-[#003a73]">
            Create draft{total > 0 ? ` — ${formatUSD(total)}` : ""}
          </button>
        </>
      }
    >
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
            {installments.length === 0 && <p className="text-sm text-gray-500">All installments are invoiced.</p>}
            {installments.map((i) => (
              <label key={i.id} className={`${rowCls} cursor-pointer ${selected.includes(i.id) ? "border-[#013764] bg-[#013764]/[0.03]" : ""}`}>
                <span className="flex items-center gap-2.5 text-sm text-gray-900">
                  <input type="checkbox" className={checkCls} checked={selected.includes(i.id)} onChange={() => toggle(i.id)} />
                  {i.label}
                  {i.triggerMet && <Pill label="Due now" text="#B45309" bg="#FCF2E1" />}
                </span>
                <span className="text-sm font-medium tabular-nums text-gray-900">{formatUSD(i.amountCents)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Other billable items</div>
          <div className="flex flex-col gap-2">
            {coAvailable && (
              <label className={`${rowCls} cursor-pointer ${includeCo ? "border-[#013764] bg-[#013764]/[0.03]" : ""}`}>
                <span className="flex items-center gap-2.5 text-sm text-gray-900">
                  <input type="checkbox" className={checkCls} checked={includeCo} onChange={() => setIncludeCo((v) => !v)} />
                  {SAMPLE_UNBILLED_CO.label}
                </span>
                <span className="text-sm font-medium tabular-nums text-gray-900">{formatUSD(SAMPLE_UNBILLED_CO.amountCents)}</span>
              </label>
            )}
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
    </ModalShell>
  );
}

function ProjectInvoiceDetailModal({
  invoice,
  totalCents,
  onSend,
  onRecordPayment,
  onVoid,
  onClose,
}: {
  invoice: PInvoice;
  totalCents: number;
  onSend: () => void;
  onRecordPayment: (cents: number) => void;
  onVoid: () => void;
  onClose: () => void;
}) {
  const paid = paidCents(invoice);
  const remaining = Math.max(0, totalCents - paid);
  const [payAmount, setPayAmount] = useState(String(remaining / 100));
  const meta = P_INVOICE_STATUS_META[invoice.status];
  const canPay = invoice.status === "sent" || invoice.status === "partially_paid";

  return (
    <ModalShell
      title={`${invoice.number} · ${invoice.title}`}
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
          <span>Issued {invoice.issueDate}</span>
          {invoice.dueDate && <span>Due {invoice.dueDate}</span>}
          <span className="ml-auto font-semibold tabular-nums text-gray-900">{formatUSD(totalCents)}</span>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Lines</div>
          <div className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
            {invoice.lines.map((l, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span className="text-gray-900">{l.description}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-gray-400">{l.sourceType.replace("_", " ")}</span>
                  <span className="font-medium tabular-nums text-gray-900">{formatUSD(l.amountCents)}</span>
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
              {invoice.payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="text-gray-700">
                    {p.date} · {p.reference}
                    {p.viaQbo && <span className="ml-2 rounded bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700">auto-reconciled via QBO</span>}
                  </span>
                  <span className="font-medium tabular-nums text-green-700">{formatUSD(p.amountCents)}</span>
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

/* ------------------------------ cash lanes ---------------------------------- */

interface UpcomingRow {
  label: string;
  when: string;
  amountCents: number;
  urgent?: boolean;
}

function CashLane({
  rows,
  totalCents,
  totalLabel,
  sign,
  amountColor,
  emptyText,
  upcoming,
  upcomingHint,
}: {
  rows: CashFlowEntry[];
  totalCents: number;
  totalLabel: string;
  sign: "+" | "−";
  amountColor: string;
  emptyText: string;
  upcoming?: UpcomingRow[];
  upcomingHint?: string;
}) {
  return (
    <div className="flex flex-col">
      {rows.length === 0 ? (
        <p className="py-2 text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {rows.map((c, idx) => (
            <div key={`${c.date}-${idx}`} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-sm text-gray-900">{c.description}</div>
                <div className="text-xs text-gray-500">
                  {c.date} · {c.party}
                  {c.kind === "Deposit" || c.kind === "Progress Payment" ? ` · ${c.kind}` : ""}
                </div>
              </div>
              <span className={`shrink-0 text-sm font-medium tabular-nums ${amountColor}`}>
                {sign}
                {formatUSDPrecise(c.amount_cents)}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-1 flex items-center justify-between border-t-2 border-gray-200 pt-3 text-sm font-semibold text-gray-900">
        <span>{totalLabel}</span>
        <span className={`tabular-nums ${amountColor}`}>
          {sign}
          {formatUSD(totalCents)}
        </span>
      </div>
      {upcoming && upcoming.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Upcoming</span>
            {upcomingHint && <span className="text-[11px] text-gray-400">{upcomingHint}</span>}
          </div>
          <div className="flex flex-col gap-2">
            {upcoming.map((u) => (
              <div key={u.label} className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-gray-300 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm text-gray-700">{u.label}</div>
                  <div className={`text-xs ${u.urgent ? "font-medium text-amber-700" : "text-gray-400"}`}>{u.when}</div>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-gray-500">{formatUSD(u.amountCents)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------- vendor payment schedule (sample) --------------------- */

interface VendorStage {
  id: number;
  vendor: string;
  label: string;
  amountCents: number;
  trigger: string;
  status: "paid" | "due" | "upcoming";
  paidDate?: string;
}

// Reconciles with the Cash Flow sample: paid stages sum to $126,781.39 — the sample's
// vendor outflows minus unscheduled misc (dumpster $1,650 + portapotty $750).
const SAMPLE_VENDOR_STAGES: VendorStage[] = [
  { id: 1, vendor: "Teixera Construction — Masonry", label: "Mobilization", amountCents: 2_850_000, trigger: "Contract signing", status: "paid", paidDate: "Mar 3, 2026" },
  { id: 2, vendor: "Teixera Construction — Masonry", label: "Stone materials — 50% deposit", amountCents: 4_088_139, trigger: "Materials order", status: "paid", paidDate: "Mar 28, 2026" },
  { id: 3, vendor: "Teixera Construction — Masonry", label: "Progress — masonry 50%", amountCents: 4_500_000, trigger: "Milestone: Construction Work", status: "paid", paidDate: "May 2, 2026" },
  { id: 4, vendor: "Teixera Construction — Masonry", label: "Balance", amountCents: 8_203_111, trigger: "On masonry completion", status: "upcoming" },
  { id: 5, vendor: "Frank Clark — Electrical", label: "30% deposit", amountCents: 1_393_500, trigger: "Work start — Jul 17, 2026", status: "due" },
  { id: 6, vendor: "Frank Clark — Electrical", label: "Balance", amountCents: 3_251_500, trigger: "On electrical completion", status: "upcoming" },
  { id: 7, vendor: "Guasco's Plumbing — Plumbing/Heat", label: "Rough-in deposit", amountCents: 1_240_000, trigger: "Rough-in start", status: "paid", paidDate: "Jun 5, 2026" },
  { id: 8, vendor: "Guasco's Plumbing — Plumbing/Heat", label: "Balance", amountCents: 5_687_000, trigger: "On plumbing completion", status: "upcoming" },
  { id: 9, vendor: "American Knight — A/V", label: "60% deposit", amountCents: 1_163_132, trigger: "On quote acceptance", status: "upcoming" },
  { id: 10, vendor: "American Knight — A/V", label: "Balance", amountCents: 775_421, trigger: "On A/V completion", status: "upcoming" },
];

const VENDOR_STAGE_META: Record<VendorStage["status"], { label: string; text: string; bg: string }> = {
  paid: { label: "Paid", text: "#15803D", bg: "#E7F6EC" },
  due: { label: "Due now", text: "#B45309", bg: "#FCF2E1" },
  upcoming: { label: "Upcoming", text: "#6B7280", bg: "#F3F4F6" },
};

function VendorScheduleCard() {
  const [stages, setStages] = useState<VendorStage[]>(SAMPLE_VENDOR_STAGES);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<VendorStage[]>([]);
  const seq = useRef(1000);

  const rows = editing ? draft : stages;
  const vendors = [...new Set(rows.map((s) => s.vendor))];
  const committed = rows.reduce((s, x) => s + x.amountCents, 0);
  const paid = rows.filter((s) => s.status === "paid").reduce((s, x) => s + x.amountCents, 0);
  const dueNow = rows.filter((s) => s.status === "due").reduce((s, x) => s + x.amountCents, 0);

  const startEdit = () => {
    setDraft(stages.map((s) => ({ ...s })));
    setEditing(true);
  };
  const save = () => {
    setStages(draft.filter((s) => s.label.trim()));
    setEditing(false);
    toast.success("Vendor payment schedules saved — due stages update Cash Flow's upcoming outflows");
  };
  const patch = (id: number, p: Partial<VendorStage>) =>
    setDraft((d) => d.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const addStage = (vendor: string) =>
    setDraft((d) => [...d, { id: seq.current++, vendor, label: "", amountCents: 0, trigger: "", status: "upcoming" }]);
  const removeStage = (id: number) => setDraft((d) => d.filter((s) => s.id !== id));
  const markPaid = (id: number) => {
    setStages((v) => v.map((s) => (s.id === id ? { ...s, status: "paid", paidDate: "Jul 15, 2026" } : s)));
    toast.success("Stage marked paid — in the real flow you'd link it to the bill payment");
  };

  const fieldCls = "rounded-md border border-[#DADADA] px-2 py-1 text-sm focus:border-[#013764] focus:outline-none";

  return (
    <Card
      title="Vendor Payment Schedules"
      action={
        editing ? (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(false)} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={save} className="h-7 rounded-lg bg-[#013764] px-2.5 text-xs font-medium text-white hover:bg-[#003a73]">Save changes</button>
          </div>
        ) : (
          <button onClick={startEdit} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Edit</button>
        )
      }
    >
      <div className="mb-4">
        <SampleBanner>
          Each vendor's payment terms (deposits, progress stages, balance), seeded from their accepted quote and editable
          until paid. Due stages surface as upcoming outflows on Cash Flow. Misc spend (dumpster, portapotty) isn't
          scheduled — it shows only in actuals.
        </SampleBanner>
      </div>
      <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-gray-50 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Committed to vendors</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{formatUSD(committed)}</div>
        </div>
        <div className="rounded-lg bg-gray-50 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Paid so far</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{formatUSD(paid)}</div>
        </div>
        <div className={`rounded-lg px-4 py-3 ${dueNow > 0 ? "bg-amber-50" : "bg-gray-50"}`}>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Due now</div>
          <div className={`mt-1 text-xl font-semibold tabular-nums ${dueNow > 0 ? "text-amber-700" : "text-gray-900"}`}>{formatUSD(dueNow)}</div>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        {vendors.map((v) => {
          const vStages = rows.filter((s) => s.vendor === v);
          const vTotal = vStages.reduce((s, x) => s + x.amountCents, 0);
          return (
            <div key={v}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">{v}</span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums text-gray-500">{formatUSD(vTotal)}</span>
                  {editing && (
                    <button onClick={() => addStage(v)} className="text-xs font-medium text-blue-600 hover:underline">
                      + Stage
                    </button>
                  )}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {vStages.map((s) => {
                  const meta = VENDOR_STAGE_META[s.status];
                  const locked = s.status === "paid";
                  if (editing && !locked) {
                    return (
                      <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[#013764]/30 bg-[#013764]/[0.02] px-3 py-2.5">
                        <input
                          aria-label="Stage label"
                          value={s.label}
                          placeholder="Stage (e.g. 30% deposit)"
                          onChange={(e) => patch(s.id, { label: e.target.value })}
                          className={`${fieldCls} min-w-[150px] flex-1`}
                        />
                        <input
                          aria-label="Trigger"
                          value={s.trigger}
                          placeholder="Trigger (date, milestone, event)"
                          onChange={(e) => patch(s.id, { trigger: e.target.value })}
                          className={`${fieldCls} min-w-[170px] flex-1`}
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">$</span>
                          <input
                            type="number"
                            aria-label="Amount in dollars"
                            value={s.amountCents / 100}
                            onChange={(e) => patch(s.id, { amountCents: Math.max(0, Math.round((Number(e.target.value) || 0) * 100)) })}
                            className={`${fieldCls} w-28 text-right tabular-nums`}
                          />
                        </div>
                        <select
                          aria-label="Stage status"
                          value={s.status}
                          onChange={(e) => patch(s.id, { status: e.target.value as VendorStage["status"] })}
                          className={fieldCls}
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="due">Due now</option>
                        </select>
                        <button onClick={() => removeStage(s.id)} title="Remove stage" aria-label="Remove stage" className="px-1 text-gray-400 hover:text-red-600">✕</button>
                      </div>
                    );
                  }
                  return (
                    <div key={s.id} className={`flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5 ${editing ? "opacity-70" : ""}`}>
                      <div className="min-w-0">
                        <div className="truncate text-sm text-gray-900">{s.label}</div>
                        <div className="text-xs text-gray-500">
                          {s.status === "paid" && s.paidDate ? `Paid ${s.paidDate}` : s.trigger}
                          {editing && locked && <span className="ml-2 text-gray-400">🔒 paid — locked</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {!editing && s.status === "due" && (
                          <button onClick={() => markPaid(s.id)} className="text-xs font-medium text-green-700 hover:underline">
                            Mark paid
                          </button>
                        )}
                        <span className="text-sm font-medium tabular-nums text-gray-900">{formatUSD(s.amountCents)}</span>
                        <Pill label={meta.label} text={meta.text} bg={meta.bg} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {editing && (
        <p className="mt-3 text-xs text-gray-400">
          Paid stages are locked — they're history, tied to actual bill payments. New vendors appear here when their quote is
          accepted on the Quotes tab.
        </p>
      )}
    </Card>
  );
}

/* ------------------------------ quotes (sample) ----------------------------- */

interface PQuote {
  id: number;
  category: string;
  vendor: string;
  amountCents: number;
  status: "received" | "shortlisted" | "accepted" | "rejected";
  note?: string;
  supersededNote?: string;
}

const SAMPLE_QUOTES: PQuote[] = [
  { id: 1, category: "Frank Clark - Electrical", vendor: "Frank Clark", amountCents: 4_645_000, status: "accepted", note: "Rev 2 — added exterior outlets", supersededNote: "Supersedes Rev 1 ($49,200)" },
  { id: 2, category: "Frank Clark - Electrical", vendor: "Nutmeg Electric", amountCents: 5_210_000, status: "rejected" },
  { id: 3, category: "Frank Clark - Electrical", vendor: "Greenwich Electric Co", amountCents: 4_890_000, status: "rejected" },
  { id: 4, category: "American Knight - A/V", vendor: "American Knight", amountCents: 1_938_553, status: "shortlisted", note: "60% deposit terms" },
  { id: 5, category: "American Knight - A/V", vendor: "Sound & Vision CT", amountCents: 2_200_000, status: "received" },
];

const QUOTE_STATUS_META: Record<PQuote["status"], { label: string; text: string; bg: string }> = {
  received: { label: "Received", text: "#6B7280", bg: "#F3F4F6" },
  shortlisted: { label: "Shortlisted", text: "#1D4ED8", bg: "#E7EEFE" },
  accepted: { label: "Accepted", text: "#15803D", bg: "#E7F6EC" },
  rejected: { label: "Rejected", text: "#B91C1C", bg: "#FCEAEA" },
};

function QuotesCard() {
  const [quotes, setQuotes] = useState<PQuote[]>(SAMPLE_QUOTES);
  const categories = [...new Set(quotes.map((q) => q.category))];

  const accept = (q: PQuote) => {
    setQuotes((v) =>
      v.map((x) =>
        x.category !== q.category ? x : x.id === q.id ? { ...x, status: "accepted" } : { ...x, status: "rejected" },
      ),
    );
    toast.success(
      `${q.vendor} accepted — you'd be prompted to update the category budget to ${formatUSD(q.amountCents)} and seed their payment schedule on Payables`,
    );
  };

  return (
    <Card title="Quotes" action={<span className="text-xs text-gray-400">Compare bids per category · sample preview</span>}>
      <div className="mb-4">
        <SampleBanner>
          The bidding workspace: competing quotes per budget category, revisions kept like work-order history. Accepting a
          quote rejects the others, offers to update the category budget, and seeds that vendor's payment schedule on
          Payables from the quoted terms.
        </SampleBanner>
      </div>
      <div className="flex flex-col gap-5">
        {categories.map((cat) => (
          <div key={cat}>
            <div className="mb-2 text-sm font-medium text-gray-900">{cat}</div>
            <div className="flex flex-col gap-2">
              {quotes
                .filter((q) => q.category === cat)
                .map((q) => {
                  const meta = QUOTE_STATUS_META[q.status];
                  return (
                    <div key={q.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <span className="font-medium">{q.vendor}</span>
                          <Pill label={meta.label} text={meta.text} bg={meta.bg} />
                        </div>
                        {(q.note || q.supersededNote) && (
                          <div className="mt-0.5 text-xs text-gray-500">
                            {q.note}
                            {q.note && q.supersededNote ? " · " : ""}
                            <span className="text-gray-400">{q.supersededNote}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-medium tabular-nums text-gray-900">{formatUSD(q.amountCents)}</span>
                        {q.status !== "accepted" && q.status !== "rejected" && (
                          <button onClick={() => accept(q)} className="text-xs font-medium text-green-700 hover:underline">
                            Accept
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Quotes get their own tab: bidding is pre-commitment, Payables is post-commitment.
// The link between them is the accept action (budget update + vendor schedule seed).
function QuotesTab() {
  return (
    <div className="flex flex-col gap-6">
      <QuotesCard />
    </div>
  );
}

/* ------------------------------- files (sample) ----------------------------- */

interface PFile {
  id: number;
  name: string;
  source: "Task" | "Work Order" | "Field Team" | "Quote";
  parent: string;
  type: string;
  size: string;
  uploaded: string;
}

const SAMPLE_FILES: PFile[] = [
  { id: 1, name: "pergola-plans-v3.pdf", source: "Task", parent: "Pergola construction", type: "PDF", size: "4.2 MB", uploaded: "Feb 10, 2026" },
  { id: 2, name: "permit-application.pdf", source: "Task", parent: "Permitting", type: "PDF", size: "1.1 MB", uploaded: "Feb 14, 2026" },
  { id: 3, name: "teixera-quote-rev2.pdf", source: "Quote", parent: "Teixera Construction — Masonry", type: "PDF", size: "820 KB", uploaded: "Feb 22, 2026" },
  { id: 4, name: "frank-clark-electrical-quote.pdf", source: "Quote", parent: "Frank Clark - Electrical", type: "PDF", size: "610 KB", uploaded: "Mar 2, 2026" },
  { id: 5, name: "footing-inspection-photos.zip", source: "Work Order", parent: "WO-1204 · Footings", type: "ZIP", size: "18.6 MB", uploaded: "Apr 3, 2026" },
  { id: 6, name: "stone-delivery-receipt.jpg", source: "Field Team", parent: "FTO-88 · Stone staging", type: "Image", size: "2.4 MB", uploaded: "Apr 11, 2026" },
  { id: 7, name: "masonry-progress-jun.pdf", source: "Work Order", parent: "WO-1231 · Stonework", type: "PDF", size: "6.8 MB", uploaded: "Jun 30, 2026" },
];

const FILE_SOURCES = ["All", "Task", "Work Order", "Field Team", "Quote"] as const;

function FilesTab() {
  const [filter, setFilter] = useState<(typeof FILE_SOURCES)[number]>("All");
  const rows = filter === "All" ? SAMPLE_FILES : SAMPLE_FILES.filter((f) => f.source === filter);

  return (
    <div className="flex flex-col gap-6">
      <SampleBanner>
        One place for every attachment on this project — pulled from tasks, work orders, field team orders, and quotes,
        labeled by where it came from. Preview only; the aggregate endpoint ships with the invoicing backend.
      </SampleBanner>

      <Card
        title="Project Files"
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            {FILE_SOURCES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={filter === s}
                onClick={() => setFilter(s)}
                className={`h-7 rounded-full px-3 text-xs font-medium transition-colors ${
                  filter === s ? "bg-[#013764] text-white" : "border border-[#DADADA] bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <Th>File</Th><Th>Source</Th><Th>Attached to</Th><Th>Type</Th><Th right>Size</Th><Th>Uploaded</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-blue-600">{f.name}</td>
                  <td className="py-3 pr-4">
                    <Pill
                      label={f.source}
                      text={f.source === "Quote" ? "#7C3AED" : f.source === "Task" ? "#1D4ED8" : f.source === "Work Order" ? "#B45309" : "#15803D"}
                      bg={f.source === "Quote" ? "#F1EBFD" : f.source === "Task" ? "#E7EEFE" : f.source === "Work Order" ? "#FCF2E1" : "#E7F6EC"}
                    />
                  </td>
                  <td className="py-3 pr-4 text-gray-700">{f.parent}</td>
                  <td className="py-3 pr-4 text-gray-500">{f.type}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-gray-500">{f.size}</td>
                  <td className="py-3 pr-4 text-gray-500">{f.uploaded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
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
  const [description, setDescription] = useState(project.description);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryDraft[]>(() => categoriesToDrafts(summary.budget));
  const [milestones, setMilestones] = useState<MilestoneDraft[]>(() => milestonesToDrafts(summary.milestones));
  const uid = useId();
  const titleId = useId();
  const dialogRef = useDialogFocus(onClose);

  // Manager picker reuses the existing users data source (spec §7).
  useEffect(() => {
    let cancelled = false;
    fetchJSON("/users/property-managers")
      .then((rows) => {
        if (cancelled) return;
        setManagers(
          ((rows ?? []) as { id: number; name?: string; email?: string }[]).map((u) => ({
            id: u.id,
            name: u.name || u.email || `User ${u.id}`,
          })),
        );
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
        description,
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
                  <select id={`${uid}-status`} className={`${fieldCls} mt-1`} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
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
                <select
                  id={`${uid}-manager`}
                  className={`${fieldCls} mt-1`}
                  value={managerUserId}
                  onChange={(e) => setManagerUserId(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">Unassigned</option>
                  {managerOptions.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${uid}-desc`} className={labelCls}>Description</label>
                <textarea id={`${uid}-desc`} rows={2} className={`${fieldCls} mt-1 resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} />
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
          {tab === "dashboard" && <DashboardTab summary={summary} onEdit={() => setEditOpen(true)} />}
          {tab === "maintenance" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-2">
                {MAINTENANCE_SUBTABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    aria-pressed={maintenanceTab === t.key}
                    onClick={() => setMaintenanceTab(t.key)}
                    className={`h-8 rounded-full px-3.5 text-sm font-medium transition-colors ${
                      maintenanceTab === t.key
                        ? "bg-[#013764] text-white"
                        : "border border-[#DADADA] bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {maintenanceTab === "tasks" && <TasksTab summary={summary} onRefresh={load} />}
              {maintenanceTab === "work-orders" && <WorkOrdersTab summary={summary} />}
              {maintenanceTab === "field-team" && <FieldTeamTab summary={summary} />}
            </div>
          )}
          {tab === "quotes" && <QuotesTab />}
          {tab === "budget" && <BudgetTab summary={summary} onEdit={() => setEditOpen(true)} onRefresh={load} />}
          {tab === "invoicing" && <InvoicingTab summary={summary} />}
          {tab === "cashflow" && <CashFlowTab projectId={project.id} onRefreshSummary={load} />}
          {tab === "files" && <FilesTab />}
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
