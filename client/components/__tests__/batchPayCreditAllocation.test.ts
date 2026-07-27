/**
 * Vendor-credit allocation for the batch pay modal.
 *
 * A vendor credit belongs to a *vendor*, not a bill, so when a batch contains
 * several bills from the same vendor something has to decide how each credit is
 * spread. Since migration 148 a credit no longer has to fit inside one bill — it
 * SPLITS, applying what a bill can absorb and carrying the remainder onward.
 *
 * That replaced the old fit-or-skip rule, so these tests were rewritten rather
 * than extended. The constraint that survives: applied credit can never exceed a
 * bill's amount due, because the pay endpoint rejects credits + cash > outstanding.
 */
import { describe, it, expect } from "vitest";
import {
  allocateCredits,
  allocatedCentsForBill,
  allocatedCentsForCredit,
  maxApplicableCents,
  setCreditAmount,
  toggleCredit,
  unallocatedCentsForCredit,
  type AllocatableBill,
  type AllocatableCredit,
} from "../batchPayCreditAllocation";

const bill = (
  id: number,
  vendorId: number | undefined,
  amountDueCents: number,
): AllocatableBill => ({ id, vendorId, amountDueCents });

const credit = (
  id: number,
  vendor_id: number,
  amount_cents: number,
  date = "2026-06-01",
): AllocatableCredit => ({
  id,
  vendor_id,
  amount_cents,
  remaining_cents: amount_cents,
  date,
  memo: "",
});

describe("allocateCredits", () => {
  it("applies a credit smaller than the bill in full", () => {
    const allocs = allocateCredits([bill(1, 7, 500_000)], [credit(100, 7, 400_000)]);

    expect(allocs).toEqual([{ creditId: 100, billId: 1, amountCents: 400_000 }]);
  });

  it("applies only what the bill can absorb and leaves the rest", () => {
    // The motivating case: a $10,000 credit against a $5,000 bill. The old rule
    // skipped this credit entirely; now it applies $5,000.
    const allocs = allocateCredits([bill(1, 7, 500_000)], [credit(100, 7, 1_000_000)]);

    expect(allocs).toEqual([{ creditId: 100, billId: 1, amountCents: 500_000 }]);
    expect(unallocatedCentsForCredit(allocs, credit(100, 7, 1_000_000))).toBe(500_000);
  });

  it("splits one credit across two bills of the same vendor", () => {
    const allocs = allocateCredits(
      [bill(1, 7, 300_000), bill(2, 7, 800_000)],
      [credit(100, 7, 1_000_000)],
    );

    // Largest bill first, then the remainder carries to the smaller one.
    expect(allocs).toEqual([
      { creditId: 100, billId: 2, amountCents: 800_000 },
      { creditId: 100, billId: 1, amountCents: 200_000 },
    ]);
  });

  it("applies a credit that exactly equals the amount due", () => {
    const allocs = allocateCredits([bill(1, 7, 500_000)], [credit(100, 7, 500_000)]);

    expect(allocs).toEqual([{ creditId: 100, billId: 1, amountCents: 500_000 }]);
  });

  it("fills a bill from several credits, oldest first", () => {
    const allocs = allocateCredits(
      [bill(1, 7, 500_000)],
      [credit(100, 7, 300_000, "2026-06-09"), credit(101, 7, 400_000, "2026-06-02")],
    );

    // 101 is older so it goes first and takes $4,000; 100 covers the last $1,000.
    expect(allocs).toEqual([
      { creditId: 101, billId: 1, amountCents: 400_000 },
      { creditId: 100, billId: 1, amountCents: 100_000 },
    ]);
  });

  it("never exceeds a bill's amount due", () => {
    const allocs = allocateCredits(
      [bill(1, 7, 500_000)],
      [credit(100, 7, 400_000), credit(101, 7, 400_000, "2026-06-02")],
    );

    expect(allocatedCentsForBill(allocs, 1)).toBe(500_000);
  });

  it("respects a credit's already-spent balance", () => {
    // $10,000 face with $9,000 already applied elsewhere leaves $1,000 to spend.
    const partly: AllocatableCredit = {
      ...credit(100, 7, 1_000_000),
      remaining_cents: 100_000,
    };
    const allocs = allocateCredits([bill(1, 7, 500_000)], [partly]);

    expect(allocs).toEqual([{ creditId: 100, billId: 1, amountCents: 100_000 }]);
  });

  it("keeps vendors independent", () => {
    const allocs = allocateCredits(
      [bill(1, 7, 500_000), bill(2, 8, 500_000)],
      [credit(100, 7, 100_000), credit(101, 8, 200_000)],
    );

    expect(allocs).toEqual([
      { creditId: 100, billId: 1, amountCents: 100_000 },
      { creditId: 101, billId: 2, amountCents: 200_000 },
    ]);
  });

  it("never applies a credit to another vendor's bill", () => {
    expect(allocateCredits([bill(1, 7, 500_000)], [credit(100, 8, 100_000)])).toEqual([]);
  });

  it("ignores bills with no vendor id", () => {
    expect(
      allocateCredits([bill(1, undefined, 500_000)], [credit(100, 7, 100_000)]),
    ).toEqual([]);
  });

  it("skips bills with nothing due", () => {
    expect(allocateCredits([bill(1, 7, 0)], [credit(100, 7, 100_000)])).toEqual([]);
  });
});

describe("allocatedCentsForBill", () => {
  it("sums every credit applied to the bill", () => {
    const allocs = [
      { creditId: 100, billId: 1, amountCents: 300_000 },
      { creditId: 101, billId: 1, amountCents: 150_000 },
      { creditId: 102, billId: 2, amountCents: 90_000 },
    ];

    expect(allocatedCentsForBill(allocs, 1)).toBe(450_000);
  });

  it("is zero for a bill with no credits", () => {
    expect(allocatedCentsForBill([], 1)).toBe(0);
  });
});

describe("allocatedCentsForCredit", () => {
  it("sums a split credit across bills", () => {
    const allocs = [
      { creditId: 100, billId: 1, amountCents: 300_000 },
      { creditId: 100, billId: 2, amountCents: 200_000 },
    ];

    expect(allocatedCentsForCredit(allocs, 100)).toBe(500_000);
  });
});

describe("maxApplicableCents", () => {
  it("is capped by the bill's remaining due", () => {
    const credits = [credit(100, 7, 1_000_000)];

    expect(maxApplicableCents([], credits, bill(1, 7, 500_000), 100)).toBe(500_000);
  });

  it("is capped by what is left of the credit", () => {
    const credits = [credit(100, 7, 100_000)];

    expect(maxApplicableCents([], credits, bill(1, 7, 500_000), 100)).toBe(100_000);
  });

  it("accounts for other credits already on the bill", () => {
    const credits = [credit(100, 7, 400_000), credit(101, 7, 400_000)];
    const allocs = [{ creditId: 100, billId: 1, amountCents: 400_000 }];

    expect(maxApplicableCents(allocs, credits, bill(1, 7, 500_000), 101)).toBe(100_000);
  });

  it("accounts for the same credit being spent on another bill", () => {
    const credits = [credit(100, 7, 500_000)];
    const allocs = [{ creditId: 100, billId: 2, amountCents: 300_000 }];

    expect(maxApplicableCents(allocs, credits, bill(1, 7, 500_000), 100)).toBe(200_000);
  });

  it("is zero for another vendor's credit", () => {
    expect(maxApplicableCents([], [credit(100, 8, 100_000)], bill(1, 7, 500_000), 100)).toBe(0);
  });
});

describe("setCreditAmount", () => {
  const bills = [bill(1, 7, 500_000), bill(2, 7, 800_000)];

  it("records a partial amount the user typed", () => {
    const credits = [credit(100, 7, 1_000_000)];

    expect(setCreditAmount([], credits, bills, 100, 1, 120_000)).toEqual([
      { creditId: 100, billId: 1, amountCents: 120_000 },
    ]);
  });

  it("clamps an over-large amount to what is applicable", () => {
    const credits = [credit(100, 7, 1_000_000)];

    expect(setCreditAmount([], credits, bills, 100, 1, 900_000)).toEqual([
      { creditId: 100, billId: 1, amountCents: 500_000 },
    ]);
  });

  it("removes the allocation when set to zero", () => {
    const credits = [credit(100, 7, 1_000_000)];
    const allocs = [{ creditId: 100, billId: 1, amountCents: 500_000 }];

    expect(setCreditAmount(allocs, credits, bills, 100, 1, 0)).toEqual([]);
  });

  it("leaves this credit's other bills alone", () => {
    const credits = [credit(100, 7, 1_000_000)];
    const allocs = [{ creditId: 100, billId: 2, amountCents: 300_000 }];

    expect(setCreditAmount(allocs, credits, bills, 100, 1, 200_000)).toEqual([
      { creditId: 100, billId: 2, amountCents: 300_000 },
      { creditId: 100, billId: 1, amountCents: 200_000 },
    ]);
  });

  it("does not mutate the allocations it was given", () => {
    const credits = [credit(100, 7, 1_000_000)];
    const before = [{ creditId: 100, billId: 1, amountCents: 500_000 }];

    setCreditAmount(before, credits, bills, 100, 1, 100_000);

    expect(before).toEqual([{ creditId: 100, billId: 1, amountCents: 500_000 }]);
  });
});

describe("toggleCredit", () => {
  const bills = [bill(1, 7, 500_000), bill(2, 7, 800_000)];

  it("applies as much as possible when ticked", () => {
    const credits = [credit(100, 7, 1_000_000)];

    expect(toggleCredit([], credits, bills, 100, 1)).toEqual([
      { creditId: 100, billId: 1, amountCents: 500_000 },
    ]);
  });

  it("removes the credit from that bill when unticked", () => {
    const credits = [credit(100, 7, 1_000_000)];
    const allocs = [{ creditId: 100, billId: 1, amountCents: 500_000 }];

    expect(toggleCredit(allocs, credits, bills, 100, 1)).toEqual([]);
  });

  it("leaves the same credit's other bills untouched when unticked", () => {
    const credits = [credit(100, 7, 1_000_000)];
    const allocs = [
      { creditId: 100, billId: 1, amountCents: 500_000 },
      { creditId: 100, billId: 2, amountCents: 500_000 },
    ];

    expect(toggleCredit(allocs, credits, bills, 100, 1)).toEqual([
      { creditId: 100, billId: 2, amountCents: 500_000 },
    ]);
  });

  it("is a no-op when nothing can be applied", () => {
    const credits = [credit(100, 7, 500_000)];
    const allocs = [{ creditId: 100, billId: 2, amountCents: 500_000 }];

    expect(toggleCredit(allocs, credits, bills, 100, 1)).toEqual(allocs);
  });
});
