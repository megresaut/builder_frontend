/**
 * Shared budget + milestone editors used by both the Create Project page and
 * the Update Project modal. Draft shapes use string amounts for controlled
 * inputs; converters map to/from the cents-based API payloads (spec §7).
 *
 * Draft rows keep two ids: `id` is the client-local key used by React and by
 * milestone→category links inside the editors; `serverId` is the real DB id
 * for rows loaded from the API (undefined for newly added rows). Full-replace
 * PUT payloads carry `id` only for rows that already exist (Decision #11).
 */
import {
  formatUSD,
  type BudgetCategory,
  type CreateProjectPayload,
  type Milestone,
  type MilestoneStatus,
  type PutBudgetPayload,
  type PutMilestonesPayload,
} from "@/data/projects";
import { SearchableSelect } from "@/components/SearchableSelect";

export interface SubDraft {
  id: number;
  serverId?: number;
  name: string;
  vendorName: string; // blank = inherit the category's vendor, else "AVM" on export
  amount: string;
}
export interface CategoryDraft {
  id: number;
  serverId?: number;
  name: string;
  vendorName: string; // blank = "AVM" on the client-facing export
  amount: string; // used only when there are no sub-budgets
  spentCents: number; // server-derived, display-only
  subBudgets: SubDraft[];
}
export interface MilestoneDraft {
  id: number;
  serverId?: number;
  name: string;
  targetDate: string;
  status: MilestoneStatus;
  categoryId: number | null; // references CategoryDraft.id
  taskCount: number; // server-derived, display-only
}

/* ----------------------- money conversions (Decision #34) ------------------ */
// Integer-safe at the wire boundary: never emit fractional cents, never
// truncate real cents on an edit round-trip.

export const dollarsToCents = (s: string) =>
  Math.max(0, Math.round((Number(s.replace(/,/g, "")) || 0) * 100));
export const centsToInput = (cents: number) => {
  const digits = cents % 100 === 0 ? 0 : 2;
  return (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};
// Keystroke filter: digits, separators, nothing else.
export const sanitizeAmountInput = (s: string) => s.replace(/[^0-9.,]/g, "");
// On blur, normalize whatever was typed to comma-grouped cents precision.
export const formatAmountInput = (s: string) =>
  s.trim() === "" ? "" : centsToInput(dollarsToCents(s));

export const categoryTotalCents = (c: CategoryDraft) =>
  c.subBudgets.length
    ? c.subBudgets.reduce((sum, s) => sum + dollarsToCents(s.amount), 0)
    : dollarsToCents(c.amount);
export const budgetTotalCents = (cats: CategoryDraft[]) =>
  cats.reduce((s, c) => s + categoryTotalCents(c), 0);

/* ------------------------------- converters -------------------------------- */

export function categoriesToDrafts(cats: BudgetCategory[]): CategoryDraft[] {
  return cats.map((c) => ({
    id: c.id,
    serverId: c.id,
    name: c.name,
    vendorName: c.vendor_name ?? "",
    amount: c.sub_budgets.length ? "" : centsToInput(c.amount_cents),
    spentCents: c.spent_cents,
    subBudgets: c.sub_budgets.map((s) => ({
      id: s.id,
      serverId: s.id,
      name: s.name,
      vendorName: s.vendor_name ?? "",
      amount: centsToInput(s.amount_cents),
    })),
  }));
}

export function milestonesToDrafts(ms: Milestone[]): MilestoneDraft[] {
  return ms.map((m) => ({
    id: m.id,
    serverId: m.id,
    name: m.name,
    targetDate: m.target_date ?? "",
    status: m.status,
    categoryId: m.budget_item_id,
    taskCount: m.task_ids.length,
  }));
}

/** Full-replace PUT /projects/{id}/budget payload (existing ids preserved). */
export function draftsToBudgetPayload(drafts: CategoryDraft[]): PutBudgetPayload {
  return {
    categories: drafts.map((c) => ({
      ...(c.serverId != null ? { id: c.serverId } : {}),
      name: c.name.trim() || "Untitled category",
      vendor_name: c.vendorName.trim(),
      amount_cents: c.subBudgets.length ? 0 : dollarsToCents(c.amount),
      sub_budgets: c.subBudgets.map((s) => ({
        ...(s.serverId != null ? { id: s.serverId } : {}),
        name: s.name.trim() || "Untitled",
        vendor_name: s.vendorName.trim(),
        amount_cents: dollarsToCents(s.amount),
      })),
    })),
  };
}

/**
 * Full-replace PUT /projects/{id}/milestones payload. `budget_item_id` must be
 * a real DB id, so links to newly created categories are resolved through the
 * PUT-budget response: the response array is index-aligned with the payload
 * (array order defines sort_order, Decision #11).
 */
export function draftsToMilestonesPayload(
  drafts: MilestoneDraft[],
  categoryDrafts: CategoryDraft[],
  savedCategories: BudgetCategory[],
): PutMilestonesPayload {
  const idByDraft = new Map<number, number>();
  categoryDrafts.forEach((c, i) => {
    const saved = savedCategories[i];
    if (saved) idByDraft.set(c.id, saved.id);
  });
  return {
    milestones: drafts.map((m) => ({
      ...(m.serverId != null ? { id: m.serverId } : {}),
      name: m.name.trim() || "Untitled milestone",
      target_date: m.targetDate || null,
      status: m.status,
      budget_item_id:
        m.categoryId != null ? (idByDraft.get(m.categoryId) ?? null) : null,
    })),
  };
}

/** Nested budget input for POST /projects (no ids yet). */
export function draftsToCreateBudget(
  drafts: CategoryDraft[],
): NonNullable<CreateProjectPayload["budget"]> {
  return drafts.map((c) => ({
    name: c.name.trim() || "Untitled category",
    vendor_name: c.vendorName.trim(),
    amount_cents: c.subBudgets.length ? 0 : dollarsToCents(c.amount),
    sub_budgets: c.subBudgets.map((s) => ({
      name: s.name.trim() || "Untitled",
      vendor_name: s.vendorName.trim(),
      amount_cents: dollarsToCents(s.amount),
    })),
  }));
}

/** Nested milestones input for POST /projects — links by array index (Decision #13). */
export function draftsToCreateMilestones(
  drafts: MilestoneDraft[],
  categoryDrafts: CategoryDraft[],
): NonNullable<CreateProjectPayload["milestones"]> {
  return drafts.map((m) => {
    const idx =
      m.categoryId != null
        ? categoryDrafts.findIndex((c) => c.id === m.categoryId)
        : -1;
    return {
      name: m.name.trim() || "Untitled milestone",
      ...(m.targetDate ? { target_date: m.targetDate } : {}),
      status: m.status,
      ...(idx >= 0 ? { budget_category_index: idx } : {}),
    };
  });
}

const smallField =
  "rounded-md border border-[#DADADA] px-2.5 py-1.5 text-sm text-gray-900 focus:border-[#013764] focus:outline-none";

/* ------------------------------- BudgetEditor ----------------------------- */

export function BudgetEditor({
  categories,
  onChange,
  newId,
}: {
  categories: CategoryDraft[];
  onChange: (c: CategoryDraft[]) => void;
  newId: () => number;
}) {
  const total = budgetTotalCents(categories);
  const addCategory = () =>
    onChange([...categories, { id: newId(), name: "", vendorName: "", amount: "", spentCents: 0, subBudgets: [] }]);
  const removeCategory = (id: number) => onChange(categories.filter((c) => c.id !== id));
  const patchCategory = (id: number, p: Partial<CategoryDraft>) =>
    onChange(categories.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const addSub = (catId: number) =>
    onChange(
      categories.map((c) =>
        c.id === catId
          ? { ...c, subBudgets: [...c.subBudgets, { id: newId(), name: "", vendorName: "", amount: "" }] }
          : c,
      ),
    );
  const patchSub = (catId: number, subId: number, p: Partial<SubDraft>) =>
    onChange(
      categories.map((c) =>
        c.id === catId
          ? { ...c, subBudgets: c.subBudgets.map((s) => (s.id === subId ? { ...s, ...p } : s)) }
          : c,
      ),
    );
  const removeSub = (catId: number, subId: number) =>
    onChange(
      categories.map((c) =>
        c.id === catId ? { ...c, subBudgets: c.subBudgets.filter((s) => s.id !== subId) } : c,
      ),
    );

  return (
    <div className="flex flex-col gap-4">
      {categories.length === 0 && (
        <p className="text-sm text-gray-500">No budget categories yet. Add one, or leave it — you can build the budget later.</p>
      )}
      {categories.map((c) => {
        const hasSubs = c.subBudgets.length > 0;
        return (
          <div key={c.id} className="rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <input aria-label="Category name" className={`${smallField} flex-1`} placeholder="Description (e.g. Electrical)" value={c.name} onChange={(e) => patchCategory(c.id, { name: e.target.value })} />
              <input aria-label="Category vendor" className={`${smallField} w-40`} placeholder="Vendor (AVM)" value={c.vendorName} onChange={(e) => patchCategory(c.id, { vendorName: e.target.value })} />
              <div className="flex items-center gap-1">
                <span className="text-gray-400" aria-hidden="true">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label="Category amount in dollars"
                  className={`${smallField} w-28 text-right tabular-nums ${hasSubs ? "bg-gray-50 text-gray-400" : ""}`}
                  placeholder="0"
                  disabled={hasSubs}
                  value={hasSubs ? centsToInput(categoryTotalCents(c)) : c.amount}
                  onChange={(e) => patchCategory(c.id, { amount: sanitizeAmountInput(e.target.value) })}
                  onBlur={() => patchCategory(c.id, { amount: formatAmountInput(c.amount) })}
                />
              </div>
              <button type="button" onClick={() => removeCategory(c.id)} className="px-1.5 text-gray-400 hover:text-red-600" title="Remove category" aria-label="Remove category">✕</button>
            </div>
            {hasSubs && (
              <div className="border-t border-gray-100 bg-gray-50/60 px-3 py-2">
                <div className="flex flex-col gap-2">
                  {c.subBudgets.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 pl-4">
                      <span className="text-gray-300" aria-hidden="true">└</span>
                      <input aria-label="Sub-budget name" className={`${smallField} flex-1 bg-white`} placeholder="Sub-budget description" value={s.name} onChange={(e) => patchSub(c.id, s.id, { name: e.target.value })} />
                      <input aria-label="Sub-budget vendor" className={`${smallField} w-36 bg-white`} placeholder={c.vendorName.trim() || "AVM"} value={s.vendorName} onChange={(e) => patchSub(c.id, s.id, { vendorName: e.target.value })} />
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400" aria-hidden="true">$</span>
                        <input type="text" inputMode="decimal" aria-label="Sub-budget amount in dollars" className={`${smallField} w-24 bg-white text-right tabular-nums`} placeholder="0" value={s.amount} onChange={(e) => patchSub(c.id, s.id, { amount: sanitizeAmountInput(e.target.value) })} onBlur={() => patchSub(c.id, s.id, { amount: formatAmountInput(s.amount) })} />
                      </div>
                      <button type="button" onClick={() => removeSub(c.id, s.id)} className="px-1.5 text-gray-400 hover:text-red-600" title="Remove sub-budget" aria-label="Remove sub-budget">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t border-gray-100 px-3 py-1.5">
              <button onClick={() => addSub(c.id)} className="text-xs font-medium text-blue-600 hover:underline">+ Add sub-budget</button>
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between">
        <button onClick={addCategory} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">+ Add category</button>
        {categories.length > 0 && (
          <span className="text-sm font-semibold text-gray-900">Total: <span className="tabular-nums">{formatUSD(total)}</span></span>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- MilestonesEditor --------------------------- */

export function MilestonesEditor({
  milestones,
  categories,
  onChange,
  newId,
}: {
  milestones: MilestoneDraft[];
  categories: CategoryDraft[];
  onChange: (m: MilestoneDraft[]) => void;
  newId: () => number;
}) {
  const add = () =>
    onChange([
      ...milestones,
      { id: newId(), name: "", targetDate: "", status: "not_started", categoryId: null, taskCount: 0 },
    ]);
  const patch = (id: number, p: Partial<MilestoneDraft>) =>
    onChange(milestones.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const remove = (id: number) => onChange(milestones.filter((m) => m.id !== id));

  return (
    <div className="flex flex-col gap-2">
      {milestones.length === 0 && (
        <p className="text-sm text-gray-500">No milestones yet. Add checkpoints like “Demo complete” or “Final walkthrough”.</p>
      )}
      {milestones.map((m, i) => (
        <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500" aria-hidden="true">{i + 1}</span>
          <input aria-label={`Milestone ${i + 1} name`} className={`${smallField} min-w-[160px] flex-1`} placeholder="Milestone name" value={m.name} onChange={(e) => patch(m.id, { name: e.target.value })} />
          <input type="date" aria-label={`Milestone ${i + 1} target date`} className={`${smallField} w-40`} value={m.targetDate} onChange={(e) => patch(m.id, { targetDate: e.target.value })} />
          <SearchableSelect
            className={`${smallField} w-36`}
            value={m.status}
            onChange={(v) => patch(m.id, { status: (v || "not_started") as MilestoneStatus })}
            options={[
              { value: "not_started", label: "Not started" },
              { value: "in_progress", label: "In progress" },
              { value: "complete", label: "Complete" },
            ]}
            allLabel="Status"
          />
          <SearchableSelect
            className={`${smallField} w-44`}
            value={m.categoryId != null ? String(m.categoryId) : ""}
            onChange={(v) => patch(m.id, { categoryId: v === "" ? null : Number(v) })}
            options={categories.map((c) => ({ value: String(c.id), label: c.name || "Untitled category" }))}
            allLabel="No budget link"
          />
          {m.taskCount > 0 && <span className="text-xs text-gray-400">{m.taskCount} task{m.taskCount > 1 ? "s" : ""}</span>}
          <button type="button" onClick={() => remove(m.id)} className="px-1.5 text-gray-400 hover:text-red-600" title="Remove milestone" aria-label={`Remove milestone ${i + 1}`}>✕</button>
        </div>
      ))}
      <div>
        <button onClick={add} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">+ Add milestone</button>
      </div>
    </div>
  );
}
