/**
 * Derived project progress.
 *
 * `projects.percent_complete` is a stored, hand-typed column that nothing ever
 * computes — it defaults to 0 and stays there unless someone edits it, which is
 * why the Progress card read 0% on projects that had real billing against them.
 * This module replaces it with a value derived on every read.
 *
 * Primary source is the milestone rollup: each milestone carries a 3-state
 * status and a link to a top-level budget item, so progress is weighted by the
 * dollars each milestone represents rather than by a flat milestone count.
 *
 * The schedule-of-values table (`project_schedule_lines`) would be the textbook
 * source here, but its write path is retired (`PUT /projects/{id}/schedule`
 * returns 410) and the table is empty, so `summary.schedule` is always [].
 * Do not reintroduce it as an input.
 *
 * ⚠ The identical formula is mirrored in SQL in the backend's ListProjects
 * query (avm-backend/api/modules/projects/repository/project_repo.go, the `mp`
 * lateral) because the list endpoint's DTO carries no milestones and so cannot
 * call this function. Any change to CREDIT, the weighting rule, the fallback,
 * or the rounding MUST be made in both places or the list and detail pages will
 * disagree about the same project.
 */

import type { BudgetCategory, Milestone, MilestoneStatus, ProjectFinancials } from "@/data/projects";

/** Fraction of a milestone's weight counted as done, per status. */
export const CREDIT: Record<MilestoneStatus, number> = {
  not_started: 0,
  in_progress: 0.5,
  complete: 1,
};

export type ProgressBasis = "milestones_weighted" | "milestones_flat" | "billed" | "none";

export interface ProjectProgress {
  /** Whole percent, 0–100, already clamped and rounded — render directly. */
  percent: number;
  /** Which rule produced `percent`; drives the explanatory subtitle. */
  basis: ProgressBasis;
}

type MilestoneLike = Pick<Milestone, "status" | "budget_item_id">;
type FinancialsLike = Pick<ProjectFinancials, "billed_to_date_cents" | "current_budget_cents">;

/**
 * Maps budget-item id → amount_cents, for both top-level categories and
 * sub-items. Amounts are taken exactly as the API serves them and are never
 * rolled up here: the backend's assembleBudget already recomputes a category's
 * amount as Σ children when it has children (stored parent sums can be stale
 * and are deliberately not trusted on read), so summing children again would
 * double-count. Sub-item amounts are literal.
 *
 * A milestone may point at either a category or a sub-item — both live in the
 * same project_budget_items id namespace, so both go in the map.
 */
function amountsById(budget: BudgetCategory[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const cat of budget) {
    out.set(cat.id, cat.amount_cents);
    for (const sub of cat.sub_budgets ?? []) out.set(sub.id, sub.amount_cents);
  }
  return out;
}

/**
 * Derives percent complete, in priority order:
 *
 *   1. dollar-weighted over milestones that resolve to a positive budget amount
 *   2. flat average over milestones, when none of them carry usable dollars
 *   3. billed_to_date / current_budget, when there are no milestones at all
 *   4. 0, when there is nothing to measure
 */
export function deriveProjectProgress(
  milestones: MilestoneLike[],
  budget: BudgetCategory[],
  fin: FinancialsLike,
): ProjectProgress {
  const amounts = amountsById(budget);

  let weighted = 0;
  let weight = 0;
  let credited = 0;
  for (const m of milestones) {
    const amount = m.budget_item_id == null ? 0 : amounts.get(m.budget_item_id) ?? 0;
    const credit = CREDIT[m.status] ?? 0;
    credited += credit;
    if (amount > 0) {
      weighted += amount * credit;
      weight += amount;
    }
  }

  if (weight > 0) return { percent: pct(weighted, weight), basis: "milestones_weighted" };
  if (milestones.length > 0) return { percent: pct(credited, milestones.length), basis: "milestones_flat" };
  if (fin.current_budget_cents > 0) {
    return { percent: pct(fin.billed_to_date_cents, fin.current_budget_cents), basis: "billed" };
  }
  return { percent: 0, basis: "none" };
}

/** Whole percent, clamped to 0–100. Over-billing shows 100%, never 118%. */
function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((numerator / denominator) * 100)));
}

const SUBTITLES: Record<ProgressBasis, string> = {
  milestones_weighted: "Weighted by milestone budget",
  milestones_flat: "Averaged across milestones",
  billed: "Billed vs budget — no milestones",
  none: "Not enough data",
};

export function progressSubtitle(basis: ProgressBasis): string {
  return SUBTITLES[basis];
}
