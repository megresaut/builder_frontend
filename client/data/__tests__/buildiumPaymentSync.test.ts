import { describe, it, expect } from "vitest";
import {
  describeBuildiumSync,
  type BuildiumSyncResult,
} from "@/data/buildiumPaymentSync";

const result = (over: Partial<BuildiumSyncResult>): BuildiumSyncResult => ({
  ok: true,
  bill_id: 4412,
  buildium_bill_id: "88231",
  status: "none",
  buildium_payment_count: 0,
  amount_cents: 2732,
  paid_cents: 0,
  outstanding_cents: 2732,
  paid_on: null,
  ...over,
});

describe("describeBuildiumSync", () => {
  it("reports the amount and date when Buildium covered the bill", () => {
    expect(
      describeBuildiumSync(
        result({
          status: "paid",
          paid_cents: 2732,
          outstanding_cents: 0,
          buildium_payment_count: 1,
          paid_on: "2026-07-20",
        }),
      ),
    ).toBe("Marked paid — $27.32 found in Buildium (7/20/2026).");
  });

  it("omits the date when Buildium didn't report one", () => {
    expect(
      describeBuildiumSync(
        result({
          status: "paid",
          paid_cents: 2732,
          outstanding_cents: 0,
          paid_on: null,
        }),
      ),
    ).toBe("Marked paid — $27.32 found in Buildium.");
  });

  it("names both halves of a partial payment so the remainder is obvious", () => {
    expect(
      describeBuildiumSync(
        result({
          status: "partial",
          paid_cents: 1000,
          outstanding_cents: 1732,
          buildium_payment_count: 1,
          paid_on: "2026-07-20",
        }),
      ),
    ).toBe("Found $10.00 paid in Buildium; $17.32 still outstanding.");
  });

  it("says nothing was found when Buildium has no payment", () => {
    expect(describeBuildiumSync(result({}))).toBe(
      "No payment record found in Buildium.",
    );
  });

  // paid_on is a bare calendar day. Parsing it with new Date() would treat it
  // as UTC midnight and render the previous day anywhere west of Greenwich —
  // the same off-by-one this feature had to fix on the server side.
  it("renders the calendar day Buildium reported, not a timezone-shifted one", () => {
    expect(
      describeBuildiumSync(
        result({
          status: "paid",
          paid_cents: 2732,
          outstanding_cents: 0,
          paid_on: "2026-01-01",
        }),
      ),
    ).toContain("(1/1/2026)");
  });
});
