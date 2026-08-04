import { describe, it, expect } from "vitest";
import {
  describeBillSync,
  billSyncProblems,
  type BillSyncResult,
  type BillSyncSystemResult,
} from "@/data/billSync";

// Spelling out every counter in each fixture makes adding one a 12-file edit,
// so default them here and override only what a test is about.
const sys = (
  over: Partial<BillSyncSystemResult> = {},
): BillSyncSystemResult => ({
  present: true,
  created: false,
  payments_imported: 0,
  payments_updated: 0,
  payments_pushed: 0,
  ...over,
});

const result = (over: Partial<BillSyncResult>): BillSyncResult => ({
  ok: true,
  bill_id: 549,
  property_type: "HOA",
  is_concierge: false,
  qbo: sys({ present: false }),
  buildium: sys(),
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
          buildium: sys({ payments_imported: 1 }),
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
          buildium: sys({ payments_imported: 1 }),
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
          qbo: sys({ created: true }),
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
          qbo: sys({ created: true }),
          buildium: sys({ created: true }),
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
          qbo: sys({ payments_imported: 1 }),
          buildium: sys({ payments_imported: 1 }),
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
          buildium: sys({ payments_updated: 1 }),
        }),
      ),
    ).toBe("Bill is fully paid — $648.00 (7/30/2026).");
  });

  // Booking a payment into QuickBooks changes QBO itself, not just the
  // platform's copy of it, so it gets its own sentence rather than being
  // folded into the import count.
  it("reports payments booked into QuickBooks separately from imports", () => {
    const msg = describeBillSync(
      result({
        is_concierge: true,
        property_type: "C",
        status: "paid",
        paid_cents: 64800,
        outstanding_cents: 0,
        paid_on: "2026-07-30",
        qbo: sys({ payments_pushed: 1 }),
        buildium: sys({ payments_imported: 1 }),
      }),
    );
    expect(msg).toContain("Imported 1 payment.");
    expect(msg).toContain("Booked 1 payment into QuickBooks.");
  });

  it("pluralises the pushed payment count", () => {
    expect(
      describeBillSync(
        result({
          is_concierge: true,
          property_type: "C",
          qbo: sys({ payments_pushed: 2 }),
        }),
      ),
    ).toContain("Booked 2 payments into QuickBooks.");
  });

  // The other direction: a payment QuickBooks held that Buildium never got.
  it("reports payments booked into Buildium", () => {
    expect(
      describeBillSync(
        result({
          is_concierge: true,
          property_type: "C",
          buildium: sys({ payments_pushed: 1 }),
        }),
      ),
    ).toContain("Booked 1 payment into Buildium.");
  });

  // Both directions in one sync — each has to be named, or the user can't tell
  // which book changed.
  it("reports both directions separately", () => {
    const msg = describeBillSync(
      result({
        is_concierge: true,
        property_type: "C",
        qbo: sys({ payments_pushed: 1 }),
        buildium: sys({ payments_pushed: 2 }),
      }),
    );
    expect(msg).toContain("Booked 1 payment into QuickBooks.");
    expect(msg).toContain("Booked 2 payments into Buildium.");
  });

  // Sync relinked the bill because the QuickBooks bill on record was deleted.
  // The user needs to know the bill now points somewhere else.
  it("reports an adopted QuickBooks bill", () => {
    expect(
      describeBillSync(
        result({
          is_concierge: true,
          property_type: "C",
          qbo: sys({ adopted: "900" }),
        }),
      ),
    ).toContain("Linked to existing QuickBooks bill 900");
  });

  it("says nothing about pushing when nothing was pushed", () => {
    expect(describeBillSync(result({}))).not.toContain("QuickBooks");
  });

  // The field is new; a cached or older API response won't carry it.
  it("survives a response with no payments_pushed field", () => {
    const stale = result({ status: "paid", paid_cents: 64800, outstanding_cents: 0 });
    delete (stale.qbo as Partial<BillSyncSystemResult>).payments_pushed;
    expect(() => describeBillSync(stale)).not.toThrow();
    expect(describeBillSync(stale)).not.toContain("Booked");
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
          qbo: sys({ error: "qbo push failed: 401" }),
        }),
      ),
    ).toEqual(["QuickBooks: qbo push failed: 401"]);
  });

  it("collects drift and warnings alongside system errors", () => {
    const problems = billSyncProblems(
      result({
        buildium: sys({ error: "buildium sync: timeout" }),
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
