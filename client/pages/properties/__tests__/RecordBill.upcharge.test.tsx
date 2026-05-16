/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RecordBill } from "../RecordBill";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: vi.fn(() => Promise.resolve([])),
  authFetch: vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      blob: () => Promise.resolve(new Blob([], { type: "application/pdf" })),
    } as unknown as Response),
  ),
  API_BASE: "http://localhost:8080",
}));

vi.mock("@/data/chartOfAccounts", () => ({
  fetchChartOfAccounts: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/utils/convertFiletoPdf", () => ({
  convertFiletoPdf: vi.fn(() => Promise.resolve(new File([], "stub.pdf"))),
}));

vi.mock("@/utils/parseMsgFile", () => ({
  parseMsgFile: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/utils/parseEmlFile", () => ({
  parseEmlFile: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/components/MsgViewerModal", () => ({
  default: () => null,
}));

vi.mock("@/components/AddVendorModal", () => ({
  default: () => null,
}));

vi.mock("@/components/PayBillModal", () => ({
  default: () => null,
}));

vi.mock("@/components/ViewPaymentModal", () => ({
  default: () => null,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// JSDOM doesn't implement URL.createObjectURL; some code paths read it.
if (typeof URL.createObjectURL !== "function") {
  // @ts-expect-error — patching for jsdom
  URL.createObjectURL = () => "blob:stub";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderRecordBill() {
  return render(
    <MemoryRouter initialEntries={["/properties/record-bill"]}>
      <RecordBill />
    </MemoryRouter>,
  );
}

/**
 * Find the upcharge cell <input>. Two inputs share the placeholder "$0.00"
 * (upcharge + total); the total cell carries `data-measure-width="total"`
 * while the upcharge cell intentionally does not. We isolate the upcharge
 * input by excluding the total one.
 */
function getUpchargeInput(container: HTMLElement): HTMLInputElement {
  const dollarInputs = Array.from(
    container.querySelectorAll<HTMLInputElement>(
      'input[type="text"][placeholder="$0.00"]',
    ),
  );
  const upcharge = dollarInputs.find(
    (el) => el.getAttribute("data-measure-width") !== "total",
  );
  if (!upcharge) {
    throw new Error(
      "Upcharge input not found — expected an <input> with placeholder '$0.00' and no data-measure-width='total'",
    );
  }
  return upcharge;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RecordBill — Upcharge column (regression: bug #8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Upcharge cell as a typeable text input (not a percent picker / Select)", async () => {
    const { container } = renderRecordBill();

    // Wait for the header label so we know the line-item table is mounted.
    await waitFor(() => {
      expect(container.textContent).toMatch(/Upcharge/);
    });

    const upchargeInput = getUpchargeInput(container);

    // The fix replaces the old <Select> with a real <input> — assert tag + type.
    expect(upchargeInput.tagName).toBe("INPUT");
    expect(upchargeInput.getAttribute("type")).toBe("text");
    expect(upchargeInput).toHaveAttribute("placeholder", "$0.00");

    // The old implementation rendered a SelectTrigger button containing the
    // hardcoded percent strings "10 %" and "15 %". Make sure none of those
    // legacy percent options leak into the rendered Upcharge column.
    expect(container.textContent).not.toMatch(/\b10\s*%/);
    expect(container.textContent).not.toMatch(/\b15\s*%/);
  });

  it("accepts a typed dollar amount and stores it with a leading '$' prefix", async () => {
    const { container } = renderRecordBill();

    await waitFor(() => {
      expect(container.textContent).toMatch(/Upcharge/);
    });

    const upchargeInput = getUpchargeInput(container);

    // Mirror the typed-money pattern used for the Total cell.
    fireEvent.change(upchargeInput, { target: { value: "25.50" } });

    await waitFor(() => {
      expect(upchargeInput.value).toBe("$25.50");
    });

    // Subsequent edits that already include the '$' should not double-prefix.
    fireEvent.change(upchargeInput, { target: { value: "$25.5" } });
    await waitFor(() => {
      expect(upchargeInput.value).toBe("$25.5");
    });
  });

  it("rejects non-numeric upcharge input (invariant should not mutate state)", async () => {
    const { container } = renderRecordBill();

    await waitFor(() => {
      expect(container.textContent).toMatch(/Upcharge/);
    });

    const upchargeInput = getUpchargeInput(container);
    fireEvent.change(upchargeInput, { target: { value: "50" } });
    await waitFor(() => expect(upchargeInput.value).toBe("$50"));

    // The regex ^\$?[\d,]*\.?\d{0,2}$ should drop letter input — the value
    // stays at the last accepted dollar amount.
    fireEvent.change(upchargeInput, { target: { value: "abc" } });
    expect(upchargeInput.value).toBe("$50");
  });
});
