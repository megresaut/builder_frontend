import { describe, it, expect } from "vitest";
import { deriveProjectProgress } from "./projectProgress";
import type { BudgetCategory, Milestone, MilestoneStatus } from "@/data/projects";

/**
 * These expectations are pinned against the SQL mirror in the backend's
 * ListProjects query (project_repo.go, the `mp` lateral). The numbers in the
 * "real data" cases were taken from running that SQL on ra_avm_local_final, so
 * if either implementation drifts these tests should fail.
 */

const cat = (id: number, amount_cents: number, subs: { id: number; amount_cents: number }[] = []): BudgetCategory =>
  ({
    id,
    name: `cat-${id}`,
    vendor_id: null,
    vendor_name: "",
    amount_cents,
    spent_cents: 0,
    committed_cents: 0,
    sort_order: 0,
    sub_budgets: subs.map((s) => ({ ...s, name: `sub-${s.id}`, vendor_id: null, vendor_name: "", sort_order: 0 })),
  }) as BudgetCategory;

const ms = (status: MilestoneStatus, budget_item_id: number | null): Pick<Milestone, "status" | "budget_item_id"> => ({
  status,
  budget_item_id,
});

const fin = (billed_to_date_cents: number, current_budget_cents: number) => ({
  billed_to_date_cents,
  current_budget_cents,
});

describe("deriveProjectProgress", () => {
  it("dollar-weights milestones by their budget item (project 11 → 27%)", () => {
    // Shaped as the API actually serves project 11: "Electrical" stores $50,000
    // but has children totalling $18,000, and assembleBudget recomputes the
    // category down to $18,000 on read. Verified against the SQL mirror.
    const got = deriveProjectProgress(
      [ms("in_progress", 22), ms("not_started", 25)],
      [
        cat(22, 1_800_000, [{ id: 23, amount_cents: 1_000_000 }, { id: 24, amount_cents: 800_000 }]),
        cat(25, 1_500_000),
      ],
      fin(650_000, 6_500_000),
    );
    // 1,800,000×0.5 + 1,500,000×0 = 900,000 / 3,300,000 = 27.27% → 27
    expect(got).toEqual({ percent: 27, basis: "milestones_weighted" });
  });

  it("takes the served category amount as-is instead of re-summing its children", () => {
    // The server already rolled this category up to Σ children. Summing the
    // children again on top of it would double-count the weight.
    const got = deriveProjectProgress(
      [ms("complete", 22), ms("not_started", 25)],
      [cat(22, 1_800_000, [{ id: 23, amount_cents: 1_000_000 }, { id: 24, amount_cents: 800_000 }]), cat(25, 1_800_000)],
      fin(0, 3_600_000),
    );
    // Equal weights, one complete → exactly 50%. A double-counted numerator or
    // denominator would land on 67% or 40% instead.
    expect(got).toEqual({ percent: 50, basis: "milestones_weighted" });
  });

  it("weights a milestone pointed at a sub-item by that sub-item's own amount", () => {
    const got = deriveProjectProgress(
      [ms("complete", 23), ms("not_started", 24)],
      [cat(22, 1_800_000, [{ id: 23, amount_cents: 1_000_000 }, { id: 24, amount_cents: 1_000_000 }])],
      fin(0, 1_800_000),
    );
    expect(got).toEqual({ percent: 50, basis: "milestones_weighted" });
  });

  it("returns 0 when every milestone is not_started, and does not fall through to billed", () => {
    // Project 1's shape: real budget, real milestones, none started. This must
    // read 0% — not the billed fallback — because the milestones ARE the answer.
    const got = deriveProjectProgress(
      [ms("not_started", 1), ms("not_started", 2)],
      [cat(1, 4_645_000), cat(2, 19_641_250)],
      fin(5_000_000, 34_266_803),
    );
    expect(got).toEqual({ percent: 0, basis: "milestones_weighted" });
  });

  it("falls back to a flat average when no milestone resolves to dollars", () => {
    const got = deriveProjectProgress(
      [ms("complete", null), ms("in_progress", null), ms("not_started", 999)],
      [],
      fin(0, 1_000_000),
    );
    // (1 + 0.5 + 0) / 3 = 50%
    expect(got).toEqual({ percent: 50, basis: "milestones_flat" });
  });

  it("falls back to billed/budget when there are no milestones (project 3: $10k of $80k)", () => {
    const got = deriveProjectProgress([], [], fin(1_000_000, 8_000_000));
    expect(got).toEqual({ percent: 13, basis: "billed" });
  });

  it("returns 0 with no milestones and no budget, rather than dividing by zero", () => {
    const got = deriveProjectProgress([], [], fin(0, 0));
    expect(got).toEqual({ percent: 0, basis: "none" });
  });

  it("clamps over-billing to 100 instead of reporting above 100%", () => {
    const got = deriveProjectProgress([], [], fin(9_000_000, 6_500_000));
    expect(got.percent).toBe(100);
  });

  it("ignores milestones whose budget item is missing from the budget tree", () => {
    // Milestone 2 points at an id that isn't present; it must not silently
    // contribute weight, but the resolvable one still drives the result.
    const got = deriveProjectProgress([ms("complete", 1), ms("not_started", 4242)], [cat(1, 1_000_000)], fin(0, 1_000_000));
    expect(got).toEqual({ percent: 100, basis: "milestones_weighted" });
  });
});
