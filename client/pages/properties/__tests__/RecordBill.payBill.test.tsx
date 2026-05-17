/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RecordBill } from "../RecordBill";

// ---------------------------------------------------------------------------
// Bug #10 regression: the Pay Bill / View Payment modals used to render the
// raw `PropertyID` numeric string ("498") between the Ref and Outstanding
// rows because `lineItems[0]?.property` was passed straight through as
// `propertyName`. The fix resolves the human-readable property name from the
// `properties` state before handing it to the modals.
// ---------------------------------------------------------------------------

const PROPERTY_ID = 498;
const PROPERTY_NAME = "123 Main Street";
const BILL_ID = 1;

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/api/fetchJSON", () => ({
  fetchJSON: vi.fn((path: string) => {
    if (path === "/properties") {
      return Promise.resolve([
        { id: PROPERTY_ID, name: PROPERTY_NAME, address_line1: PROPERTY_NAME },
      ]);
    }
    if (typeof path === "string" && path === `/utilities/bills/${BILL_ID}`) {
      return Promise.resolve({
        invoice_number: "INV-001",
        statement_date: null,
        due_date: null,
        memo: "",
        vendor_id: 1,
        line_items: [
          {
            line_id: 1,
            property_id: PROPERTY_ID,
            unit: "",
            work_order_ref: "",
            description: "Repair",
            gl_account_id: null,
            gl_account_name: null,
            upcharge_cents: 0,
            amount_cents: 10000,
          },
        ],
      });
    }
    // /properties/:id/units, /vendors?…, /maintenance/work-orders/:id/documents, etc.
    return Promise.resolve([]);
  }),
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

// Capture props passed to PayBillModal / ViewPaymentModal so the test can
// assert what `propertyName` they actually received from the parent.
const payBillModalSpy = vi.fn();
const viewPaymentModalSpy = vi.fn();

vi.mock("@/components/PayBillModal", () => ({
  default: (props: any) => {
    payBillModalSpy(props);
    return null;
  },
}));

vi.mock("@/components/ViewPaymentModal", () => ({
  default: (props: any) => {
    viewPaymentModalSpy(props);
    return null;
  },
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

function renderReadOnlyBill(stateBill: Record<string, unknown>) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/properties/record-bill",
          search: `?readOnly=true&billId=${BILL_ID}`,
          state: { bill: stateBill },
        },
      ]}
    >
      <RecordBill />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RecordBill — Pay Bill / View Payment property name (regression: bug #10)", () => {
  beforeEach(() => {
    payBillModalSpy.mockClear();
    viewPaymentModalSpy.mockClear();
  });

  it("passes the resolved property NAME (not the raw PropertyID) to ViewPaymentModal", async () => {
    // ViewPaymentModal is rendered unconditionally (with open={false} until
    // toggled), so once the bill + properties have loaded, its props reflect
    // whatever `propertyName` the parent resolves from lineItems[0].property.
    //
    // qboPaidAt set => the "Paid" branch — the modal's content is irrelevant
    // here; we only care about the propertyName the parent computes.
    renderReadOnlyBill({
      qboBalanceCents: 0,
      qboPaidAt: "2025-01-01T00:00:00Z",
    });

    // Wait until both the property list AND the line items have resolved.
    // Before both arrive, lineItems[0].property is "" and the find() yields
    // undefined — so the assertion needs to wait for the post-load render.
    await waitFor(() => {
      const lastCall =
        viewPaymentModalSpy.mock.calls.at(-1)?.[0];
      expect(lastCall?.bill?.propertyName).toBe(PROPERTY_NAME);
    });

    // The bug shipped the raw PropertyID as propertyName ("498"). Verify
    // that the numeric ID string never leaks through to the modal during
    // any render in the lifecycle.
    for (const [props] of viewPaymentModalSpy.mock.calls) {
      expect(props?.bill?.propertyName).not.toBe(String(PROPERTY_ID));
    }
  });

  it("passes the resolved property NAME (not the raw PropertyID) to PayBillModal when the user clicks Pay Bill", async () => {
    // qboBalanceCents > 0 with no qboPaidAt => the Pay Bill button renders.
    const { findByText } = renderReadOnlyBill({
      qboBalanceCents: 10000,
    });

    const payBillButton = await findByText("Pay Bill");
    fireEvent.click(payBillButton);

    await waitFor(() => {
      const lastCall = payBillModalSpy.mock.calls.at(-1)?.[0];
      expect(lastCall?.bill?.propertyName).toBe(PROPERTY_NAME);
    });

    for (const [props] of payBillModalSpy.mock.calls) {
      expect(props?.bill?.propertyName).not.toBe(String(PROPERTY_ID));
    }
  });
});
