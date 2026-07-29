import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJSON } from "@/api/fetchJSON";

/**
 * RecordCardRefundModal — POST /vendors/bill-payments/{id}/refunds.
 *
 * A vendor overcharged us, we already paid by credit card, and the vendor put
 * the difference back on that same card. This books one QBO Credit Card
 * Credit plus a local refund row linked to the payment it reverses.
 *
 * This is deliberately NOT a vendor-credit picker: the card, the expense
 * account, and the vendor are all derived server-side from the payment and
 * the bill, so the only inputs the user can get wrong are amount, date, and
 * memo. Card + expense account + vendor are shown read-only so the user can
 * sanity-check what they're refunding against without being able to miscode
 * it — a vendor credit means the vendor keeps the money against a future
 * bill, this means the money physically came back on the card, and mixing
 * the two double-counts it.
 */

// Mirrors repository.BillPaymentRefund (avm-backend/api/modules/vendors/repository/bill_payment_refunds.go).
export interface BillPaymentRefund {
  id: number;
  bill_id: number;
  bill_payment_id: number;
  amount_cents: number;
  refund_date: string;
  card_coa_id: number;
  card_name: string;
  expense_coa_id: number;
  expense_name: string;
  memo: string;
  qbo_purchase_id: string | null;
  created_at: string;
}

interface RecordCardRefundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: number;
    amount_cents: number;
    paid_from_name?: string | null;
  };
  /** Shown alongside the card for an extra sanity-check — already visible on the bill page. */
  vendorName?: string;
  /** Sum of refunds already recorded against this payment; caps the amount client-side. */
  alreadyRefundedCents: number;
  onRecorded: () => void;
}

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const dollarsFromCents = (cents: number): string => (cents / 100).toFixed(2);
const centsFromDollars = (s: string): number => {
  const cleaned = s.replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

export default function RecordCardRefundModal({
  open,
  onOpenChange,
  payment,
  vendorName,
  alreadyRefundedCents,
  onRecorded,
}: RecordCardRefundModalProps) {
  const [amount, setAmount] = useState("");
  const [refundDate, setRefundDate] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // What's left to refund on THIS payment — the client-side cap. The server
  // re-checks under a row lock (409 refund_exceeds_payment), which still wins
  // if a concurrent refund landed between this render and submit.
  const remainingRefundableCents = Math.max(
    0,
    payment.amount_cents - alreadyRefundedCents,
  );

  useEffect(() => {
    if (!open) {
      setAmount("");
      setRefundDate("");
      setMemo("");
      setError(null);
      setSubmitting(false);
      return;
    }
    setAmount(dollarsFromCents(remainingRefundableCents));
    setRefundDate(todayISO());
    setMemo("");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    const amountCents = centsFromDollars(amount);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Amount must be greater than $0.");
      return;
    }
    if (amountCents > remainingRefundableCents) {
      setError(
        `Amount cannot exceed $${dollarsFromCents(remainingRefundableCents)} — that's what's left refundable on this payment.`,
      );
      return;
    }
    if (!refundDate) {
      setError("Refund date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchJSON(
        `/vendors/bill-payments/${payment.id}/refunds`,
        {
          method: "POST",
          body: JSON.stringify({
            amount_cents: amountCents,
            refund_date: refundDate,
            memo: memo || undefined,
          }),
        },
      );
      toast.success(`Recorded a $${dollarsFromCents(amountCents)} card refund.`);
      // Buildium has no credit/refund entity for this — the backend always
      // flags it as a manual follow-up. A toast carrying the exact wording
      // is the whole ask here.
      if (res?.requires_manual_buildium_update && res?.buildium_instructions) {
        toast.info(res.buildium_instructions, { duration: 10000 });
      }
      onRecorded();
      onOpenChange(false);
    } catch (err: any) {
      // fetchJSON throws with .body.code set from the API's {error, code} —
      // the messages themselves are already written to be read directly
      // (not_concierge / not_a_card_payment / payment_account_unmapped /
      // refund_exceeds_payment), so just surface err.message as-is.
      setError(err?.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Record Card Refund"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitting ? "Recording…" : "Record refund"}
          cancelDisabled={submitting}
        />
      }
    >
      <div className="text-sm text-[#717179] mb-4">
        This posts a credit card credit in QuickBooks for money the vendor put
        back on the card that paid this bill. It is not a vendor credit — a
        vendor credit means the vendor keeps the money against a future bill;
        this means it already came back to you.
      </div>

      {/* Read-only context — card, vendor, amount paid. No pickers: the card
          and the expense account this reverses are derived server-side from
          the payment and the bill, which is the whole point. */}
      <div className="rounded-md border border-[#E5E5E5] bg-[#F7F8FA] px-3 py-2 mb-4 text-sm">
        {vendorName && (
          <div className="flex justify-between">
            <span className="text-[#717179]">Vendor</span>
            <span className="text-[#303030] font-medium">{vendorName}</span>
          </div>
        )}
        <div className="flex justify-between mt-1">
          <span className="text-[#717179]">Card</span>
          <span className="text-[#303030] font-medium">
            {payment.paid_from_name || "--"}
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[#717179]">Amount paid</span>
          <span className="text-[#303030] font-medium">
            ${dollarsFromCents(payment.amount_cents)}
          </span>
        </div>
        {alreadyRefundedCents > 0 && (
          <div className="flex justify-between mt-1">
            <span className="text-[#717179]">Already refunded</span>
            <span className="text-[#303030] font-medium">
              ${dollarsFromCents(alreadyRefundedCents)}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Refund amount" htmlFor="refund-amount">
          <Input
            id="refund-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Refund date" htmlFor="refund-date">
          <Input
            id="refund-date"
            type="date"
            value={refundDate}
            onChange={(e) => setRefundDate(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Memo (optional)" htmlFor="refund-memo">
          <Textarea
            id="refund-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="e.g. Overcharge on invoice #1234"
            autoGrow
          />
        </FieldShell>
      </div>

      {error && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </ModalTemplate>
  );
}
