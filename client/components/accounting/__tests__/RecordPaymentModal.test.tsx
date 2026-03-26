import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RecordPaymentModal from "../RecordPaymentModal";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRecordPayment = vi.fn();

vi.mock("@/api/accounting", () => ({
  accountingAPI: {
    recordPayment: (...args: any[]) => mockRecordPayment(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderModal(overrides: Partial<Parameters<typeof RecordPaymentModal>[0]> = {}) {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    invoiceId: 42,
    remainingBalanceCents: 150000, // $1,500.00
  };
  const props = { ...defaults, ...overrides };
  const result = render(<RecordPaymentModal {...props} />);
  return { ...result, props };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RecordPaymentModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders modal when open", () => {
    renderModal();
    // "Record Payment" appears as the dialog title (sr-only h2), the visible
    // heading div, and the confirm button — so use getAllByText.
    const matches = screen.getAllByText("Record Payment");
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Remaining Balance")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText("Remaining Balance")).not.toBeInTheDocument();
  });

  it("shows remaining balance formatted as currency", () => {
    renderModal({ remainingBalanceCents: 250050 }); // $2,500.50
    expect(screen.getByText("$2,500.50")).toBeInTheDocument();
  });

  it("defaults amount to remaining balance", async () => {
    renderModal({ remainingBalanceCents: 150000 });
    const amountInput = screen.getByPlaceholderText("0.00") as HTMLInputElement;
    // useEffect sets the default value after initial render
    await waitFor(() => {
      expect(amountInput.value).toBe("1500.00");
    });
  });

  it("validates amount > remaining balance shows error", async () => {
    renderModal({ remainingBalanceCents: 100000 }); // $1,000.00

    const amountInput = screen.getByPlaceholderText("0.00") as HTMLInputElement;

    // Wait for useEffect to populate the default value first
    await waitFor(() => {
      expect(amountInput.value).toBe("1000.00");
    });

    // Now override with an amount that exceeds the balance
    fireEvent.change(amountInput, { target: { value: "1500.00" } });

    // Click the confirm/submit button
    // "Record Payment" appears as both the modal title and the button label.
    // The button is a <button> element.
    const buttons = screen.getAllByRole("button");
    const submitButton = buttons.find(
      (b) => b.textContent === "Record Payment",
    )!;
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Amount cannot exceed remaining balance/),
      ).toBeInTheDocument();
    });

    // API should not have been called
    expect(mockRecordPayment).not.toHaveBeenCalled();
  });

  it("calls onSuccess after successful submit", async () => {
    mockRecordPayment.mockResolvedValueOnce({ id: 1 });

    const { props } = renderModal({ remainingBalanceCents: 50000 }); // $500.00

    // Wait for useEffect to set the default amount
    await waitFor(() => {
      const input = screen.getByPlaceholderText("0.00") as HTMLInputElement;
      expect(input.value).toBe("500.00");
    });

    // The amount defaults to $500.00 – just click submit
    const buttons = screen.getAllByRole("button");
    const submitButton = buttons.find(
      (b) => b.textContent === "Record Payment",
    )!;
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRecordPayment).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          amount_cents: 50000,
          payment_method: "check",
        }),
      );
    });

    await waitFor(() => {
      expect(props.onClose).toHaveBeenCalled();
      expect(props.onSuccess).toHaveBeenCalled();
    });
  });
});
