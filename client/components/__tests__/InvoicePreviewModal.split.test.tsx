/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// html2pdf.js touches canvas APIs jsdom doesn't implement. Each outputPdf call
// resolves with a Blob whose text records the call index, so the test can prove a
// SEPARATE render happened per location rather than one blob reused N times.
let pdfCalls = 0;
vi.mock("html2pdf.js", () => {
  const chain: any = {
    set: () => chain,
    from: () => chain,
    outputPdf: () => {
      pdfCalls += 1;
      return Promise.resolve(
        new Blob([`pdf-${pdfCalls}`], { type: "application/pdf" }),
      );
    },
  };
  return { default: () => chain };
});
vi.mock("exceljs", () => ({ default: { Workbook: class {} } }));

import InvoicePreviewModal from "../InvoicePreviewModal";

type Props = React.ComponentProps<typeof InvoicePreviewModal>;

const LINES = [
  {
    id: 1,
    vendor: "AVMRE LLC",
    description: "July Management Fee",
    amount: "3600.00",
    sourceType: "management_fee",
  },
  {
    id: 2,
    vendor: "Frank Clark Electric LLC",
    description: "Repair hanging fixture",
    amount: "250.00",
    sourceType: "vendor",
  },
  {
    id: 3,
    vendor: "Green Pest Management",
    description: "Exterior bait boxes",
    amount: "159.53",
    sourceType: "vendor",
  },
];

function renderModal(props: Partial<Props> = {}) {
  const resolved: Props = {
    open: true,
    onOpenChange: vi.fn(),
    propertyAddress: "Palm Ventures LLC",
    propertyLocation: "Miami, FL",
    billTo: "Palm Ventures LLC",
    invoiceDate: "2026-07-01",
    lineItems: LINES,
    showCommitButton: true,
    onCommit: vi.fn(),
    derivedStatus: "ready",
    ...props,
  };
  render(<InvoicePreviewModal {...resolved} />);
  return resolved;
}

/** Presses the modal-footer "Send to QBO" button. */
function pressSendToQBO() {
  const buttons = screen.getAllByRole("button", { name: /send to qbo/i });
  fireEvent.click(buttons[buttons.length - 1]);
}

describe("InvoicePreviewModal per-location split commit", () => {
  beforeEach(() => {
    pdfCalls = 0;
  });

  it("renders one PDF per location plus the combined one", async () => {
    const onCommitSplits = vi.fn();
    renderModal({
      onCommitSplits,
      locationSplits: [
        {
          key: "id:100",
          label: "1220 Ocean Dr, Miami, FL",
          locationId: 100,
          lineItemIds: [1, 2],
        },
        {
          key: "id:200",
          label: "88 Palm Ave, Miami, FL",
          locationId: 200,
          lineItemIds: [3],
        },
      ],
    });

    pressSendToQBO();

    await waitFor(() => expect(onCommitSplits).toHaveBeenCalledTimes(1));
    const [combined, splits] = onCommitSplits.mock.calls[0];
    expect(combined).toBeInstanceOf(Blob);
    expect(splits).toHaveLength(2);
    expect(splits[0].label).toBe("1220 Ocean Dr, Miami, FL");
    expect(splits[0].locationId).toBe(100);
    expect(splits[0].blob).toBeInstanceOf(Blob);
    expect(splits[1].label).toBe("88 Palm Ave, Miami, FL");
    // 1 combined + 2 splits — proof each subset was rendered independently.
    expect(pdfCalls).toBe(3);
    // Distinct bytes per call: no blob was reused across documents.
    const texts = await Promise.all([
      combined.text(),
      splits[0].blob.text(),
      splits[1].blob.text(),
    ]);
    expect(new Set(texts).size).toBe(3);
  });

  it("falls back to the single-PDF commit when there are no splits", async () => {
    const onCommit = vi.fn();
    const onCommitSplits = vi.fn();
    renderModal({ onCommit, onCommitSplits, locationSplits: [] });

    pressSendToQBO();

    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(onCommitSplits).not.toHaveBeenCalled();
    expect(pdfCalls).toBe(1);
  });

  it("falls back to the single-PDF commit when onCommitSplits is absent", async () => {
    const onCommit = vi.fn();
    renderModal({
      onCommit,
      locationSplits: [
        {
          key: "id:100",
          label: "1220 Ocean Dr, Miami, FL",
          locationId: 100,
          lineItemIds: [1],
        },
      ],
    });

    pressSendToQBO();

    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(pdfCalls).toBe(1);
  });

  it("restores the full line set after committing", async () => {
    const onCommitSplits = vi.fn();
    renderModal({
      onCommitSplits,
      locationSplits: [
        {
          key: "id:100",
          label: "1220 Ocean Dr, Miami, FL",
          locationId: 100,
          lineItemIds: [1],
        },
      ],
    });

    pressSendToQBO();
    await waitFor(() => expect(onCommitSplits).toHaveBeenCalledTimes(1));

    // The last subset rendered held a single line. Leaving that filter in place
    // would show the operator a partial invoice they could mistake for the real
    // one, so all three descriptions must be back on screen.
    await waitFor(() => {
      expect(screen.getAllByDisplayValue(/July Management Fee/i).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByDisplayValue(/Repair hanging fixture/i).length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue(/Exterior bait boxes/i).length).toBeGreaterThan(0);
  });
});
