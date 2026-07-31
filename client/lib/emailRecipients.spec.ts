import { describe, it, expect } from "vitest";
import { parseRecipients } from "./emailRecipients";

describe("parseRecipients", () => {
  it("accepts a single address", () => {
    expect(parseRecipients("client@example.com")).toEqual({
      addresses: ["client@example.com"],
    });
  });

  it("splits a comma-separated list and trims each address", () => {
    expect(parseRecipients(" leslie@example.com ,  curt@example.com ")).toEqual({
      addresses: ["leslie@example.com", "curt@example.com"],
    });
  });

  it("ignores empty entries from a trailing or doubled comma", () => {
    expect(parseRecipients("a@example.com, , b@example.com,")).toEqual({
      addresses: ["a@example.com", "b@example.com"],
    });
  });

  it("collapses a repeated address regardless of case, keeping the first spelling", () => {
    expect(parseRecipients("Owner@example.com, owner@example.com")).toEqual({
      addresses: ["Owner@example.com"],
    });
  });

  it("reports an error naming the malformed address in a list", () => {
    const result = parseRecipients("leslie@example.com, not-an-email");
    expect(result.addresses).toBeUndefined();
    expect(result.error).toContain("not-an-email");
  });

  it("reports an error for blank input", () => {
    for (const input of ["", "   ", ","]) {
      expect(parseRecipients(input).error).toBeTruthy();
    }
  });

  it("rejects an address with no dotted domain", () => {
    expect(parseRecipients("a@b").error).toContain("a@b");
  });
});
