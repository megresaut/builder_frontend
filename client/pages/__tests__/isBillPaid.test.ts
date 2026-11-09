import { describe, expect, it } from "vitest";
import { isBillPaid } from "../Bills";

describe("isBillPaid", () => {
  it("concierge bill paid in QBO", () => {
    expect(isBillPaid({ qboPaidAt: "2026-11-01T00:00:00Z", amountDueCents: 0 })).toBe(true);
  });

  it("Buildium-only bill (AVMRE COMM) fully paid in Buildium", () => {
    expect(
      isBillPaid({ amountDueCents: 0, paidOn: "2026-06-29", buildiumBillPaymentId: "261716851" }),
    ).toBe(true);
  });

  it("non-concierge bill paid through the platform without a Buildium payment id", () => {
    expect(isBillPaid({ amountDueCents: 0, paidOn: "2026-10-01" })).toBe(true);
  });

  it("partially paid bill is not paid", () => {
    expect(isBillPaid({ amountDueCents: 5000, paidOn: "2026-10-01" })).toBe(false);
  });

  it("draft / $0 bill with no recorded payment is not paid", () => {
    expect(isBillPaid({ amountDueCents: 0 })).toBe(false);
  });

  it("legacy row with no amountDueCents is not paid", () => {
    expect(isBillPaid({ paidOn: "2026-10-01" })).toBe(false);
  });
});
