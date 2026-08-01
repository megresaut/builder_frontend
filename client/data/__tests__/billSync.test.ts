import { describe, it, expect } from "vitest";
import {
  describeBillSync,
  billSyncProblems,
  type BillSyncResult,
} from "@/data/billSync";

const result = (over: Partial<BillSyncResult>): BillSyncResult => ({
  ok: true,
  bill_id: 549,
  property_type: "HOA",
  is_concierge: false,
  qbo: { present: false, created: false, payments_imported: 0, payments_updated: 0 },
  buildium: { present: true, created: false, payments_imported: 0, payments_updated: 0 },
  status: "none",
  amount_cents: 64800,
  paid_cents: 0,
  outstanding_cents: 64800,
  paid_on: null,
  drift: [],
  warnings: [],
  ...over,
});

describe("describeBillSync", () => {
  it("says nothing was found when neither system has a payment", () => {
    expect(describeBillSync(result({}))).toBe("No payments found.");
  });

  it("reports the total and date once the bill is settled", () => {
    expect(
      describeBillSync(
        result({
          status: "paid",
          paid_cents: 64800,
          outstanding_cents: 0,
          paid_on: "2026-07-30",
          buildium: {
            present: true,
            created: false,
            payments_imported: 1,
            payments_updated: 0,
          },
        }),
      ),
    ).toBe("Imported 1 payment. Bill is fully paid — $648.00 (7/30/2026).");
  });

  it("names both halves of a partial payment", () => {
    expect(
      describeBillSync(
        result({
          status: "partial",
          paid_cents: 30000,
          outstanding_cents: 34800,
          buildium: {
            present: true,
            created: false,
            payments_imported: 1,
            payments_updated: 0,
          },
        }),
      ),
    ).toBe("Imported 1 payment. $300.00 paid; $348.00 still outstanding.");
  });

  it("calls out a bill it had to create", () => {
    expect(
      describeBillSync(
        result({
          is_concierge: true,
          property_type: "C",
          qbo: {
            present: true,
            created: true,
            payments_imported: 0,
            payments_updated: 0,
          },
        }),
      ),
    ).toBe("Created in QuickBooks. No payments found.");
  });

  it("names both systems when the bill was missing from each", () => {
    expect(
      describeBillSync(
        result({
          is_concierge: true,
          property_type: "C",
          qbo: { present: true, created: true, payments_imported: 0, payments_updated: 0 },
          buildium: { present: true, created: true, payments_imported: 0, payments_updated: 0 },
        }),
      ),
    ).toBe("Created in QuickBooks and Buildium. No payments found.");
  });

  it("pluralises the imported payment count", () => {
    expect(
      describeBillSync(
        result({
          status: "paid",
          paid_cents: 64800,
          outstanding_cents: 0,
          qbo: { present: true, created: false, payments_imported: 1, payments_updated: 0 },
          buildium: { present: true, created: false, payments_imported: 1, payments_updated: 0 },
        }),
      ),
    ).toContain("Imported 2 payments.");
  });

  // A re-sync that only refreshed rows it had already imported shouldn't claim
  // it found something new.
  it("does not claim an import when every payment was already known", () => {
    expect(
      describeBillSync(
        result({
          status: "paid",
          paid_cents: 64800,
          outstanding_cents: 0,
          paid_on: "2026-07-30",
          buildium: {
            present: true,
            created: false,
            payments_imported: 0,
            payments_updated: 1,
          },
        }),
      ),
    ).toBe("Bill is fully paid — $648.00 (7/30/2026).");
  });

  // paid_on is a bare calendar day; parsing it with new Date() would render the
  // previous day west of Greenwich.
  it("renders the calendar day as reported, not timezone-shifted", () => {
    expect(
      describeBillSync(
        result({
          status: "paid",
          paid_cents: 64800,
          outstanding_cents: 0,
          paid_on: "2026-01-01",
        }),
      ),
    ).toContain("(1/1/2026)");
  });
});

describe("billSyncProblems", () => {
  it("is empty on a clean sync", () => {
    expect(billSyncProblems(result({}))).toEqual([]);
  });

  it("surfaces a per-system error", () => {
    expect(
      billSyncProblems(
        result({
          qbo: {
            present: true,
            created: false,
            payments_imported: 0,
            payments_updated: 0,
            error: "qbo push failed: 401",
          },
        }),
      ),
    ).toEqual(["QuickBooks: qbo push failed: 401"]);
  });

  it("collects drift and warnings alongside system errors", () => {
    const problems = billSyncProblems(
      result({
        buildium: {
          present: true,
          created: false,
          payments_imported: 0,
          payments_updated: 0,
          error: "buildium sync: timeout",
        },
        drift: ["QBO shows $0.00 still outstanding but the platform shows $648.00"],
        warnings: ["buildium PDF attach failed"],
      }),
    );
    expect(problems).toEqual([
      "Buildium: buildium sync: timeout",
      "QBO shows $0.00 still outstanding but the platform shows $648.00",
      "buildium PDF attach failed",
    ]);
  });
});
