import { describe, expect, it } from "vitest";
import { approveRouteForSubmission } from "./ftoRoute";

describe("approveRouteForSubmission", () => {
  it("routes an FTO-attached submission to the FTO approve page", () => {
    expect(approveRouteForSubmission(1063, { fto_id: 412 })).toBe(
      "/field-team-orders/approve/412",
    );
  });

  it("routes a misc expense (fto_id null) to the submission approve page", () => {
    expect(approveRouteForSubmission(1063, { fto_id: null })).toBe(
      "/field-team-orders/approve/submission/1063",
    );
  });

  it("treats a missing fto_id key as a misc expense", () => {
    expect(approveRouteForSubmission(1063, {})).toBe(
      "/field-team-orders/approve/submission/1063",
    );
  });

  it("accepts the PascalCase and camelCase key variants the API may return", () => {
    expect(approveRouteForSubmission(1, { FTOID: 7 })).toBe(
      "/field-team-orders/approve/7",
    );
    expect(approveRouteForSubmission(1, { ftoId: 8 })).toBe(
      "/field-team-orders/approve/8",
    );
  });

  it("accepts a string-encoded fto_id", () => {
    expect(approveRouteForSubmission(1, { fto_id: "412" })).toBe(
      "/field-team-orders/approve/412",
    );
  });

  it("treats fto_id 0 as absent", () => {
    expect(approveRouteForSubmission(1063, { fto_id: 0 })).toBe(
      "/field-team-orders/approve/submission/1063",
    );
  });

  it("falls back to the submission route when the payload is null", () => {
    expect(approveRouteForSubmission(1063, null)).toBe(
      "/field-team-orders/approve/submission/1063",
    );
  });
});
