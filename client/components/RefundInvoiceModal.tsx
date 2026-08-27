import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { refundAndReplaceInvoicePayment } from "@/data/invoices";

/**
 * RefundInvoiceModal — POST /invoicing/refund-and-replace?id={id}.
 *
 * Refunds the client who paid this invoice. There is no account picker: the
 * backend derives which QBO account the refund debits from the invoice's own
 * recorded payment, so the only inputs the user can get wrong are amount,
 * date, and memo — same "can't be miscoded" approach as the vendor-side card
 * refund modal.
 *
 * The backend also decides, automatically, whether this is a bookkeeping-only
 * entry (the operator already sent the money back some other way) or a real
 * QBO Payments refund (QBO itself processed the original charge, so this call
 * is what actually moves the money) — the user never chooses which.
 *
 * On a FULL refund the backend also voids this invoice and creates a
 * replacement draft (same property/month, charges carried over) — a fresh
 * QBO invoice is the only way its balance/pay-link end up correct, since the
 * original payment stays linked to this one no matter what its lines say.
 * onRefunded receives the replacement's id, or 0 on a partial refund.
 */

interface RefundInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: number;
    property_address?: string | null;
    payment_amount_cents: number | null;
  };
  /** Sum of refunds already recorded against this invoice; caps the amount client-side. */
  alreadyRefundedCents: number;
  onRefunded: (newInvoiceId: number) => void;
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

export default function RefundInvoiceModal({
  open,
  onOpenChange,
  invoice,
  alreadyRefundedCents,
  onRefunded,
}: RefundInvoiceModalProps) {
  const [amount, setAmount] = useState("");
  const [refundDate, setRefundDate] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paidCents = invoice.payment_amount_cents ?? 0;
  const remainingRefundableCents = Math.max(
    0,
    paidCents - alreadyRefundedCents,
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
        `Amount cannot exceed $${dollarsFromCents(remainingRefundableCents)} — that's what's left refundable on this invoice.`,
      );
      return;
    }
    if (!refundDate) {
      setError("Refund date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const { new_invoice_id } = await refundAndReplaceInvoicePayment(
        invoice.id,
        {
          amount_cents: amountCents,
          date: refundDate,
          memo: memo || undefined,
        },
      );
      if (new_invoice_id) {
        toast.success(`Recorded a $${dollarsFromCents(amountCents)} refund.`, {
          description:
            "This invoice was voided and a replacement was created with the same charges — send it like a new invoice to re-bill the client.",
        });
      } else {
        toast.success(`Recorded a $${dollarsFromCents(amountCents)} refund.`);
      }
      onRefunded(new_invoice_id);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Refund Invoice"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitting ? "Refunding…" : "Refund"}
          cancelDisabled={submitting}
        />
      }
    >
      <div className="text-sm text-[#717179] mb-4">
        This refunds the client who paid this invoice. If QuickBooks itself
        processed the original charge, this actually returns the money; if the
        payment was just recorded here, this only books the accounting entry —
        which one applies is detected automatically.
      </div>

      <div className="rounded-md border border-[#E5E5E5] bg-[#F7F8FA] px-3 py-2 mb-4 text-sm">
        {invoice.property_address && (
          <div className="flex justify-between">
            <span className="text-[#717179]">Property</span>
            <span className="text-[#303030] font-medium">
              {invoice.property_address}
            </span>
          </div>
        )}
        <div className="flex justify-between mt-1">
          <span className="text-[#717179]">Amount paid</span>
          <span className="text-[#303030] font-medium">
            ${dollarsFromCents(paidCents)}
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
        <FieldShell label="Refund amount" htmlFor="invoice-refund-amount">
          <Input
            id="invoice-refund-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Refund date" htmlFor="invoice-refund-date">
          <Input
            id="invoice-refund-date"
            type="date"
            value={refundDate}
            onChange={(e) => setRefundDate(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Memo (optional)" htmlFor="invoice-refund-memo">
          <Textarea
            id="invoice-refund-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="e.g. Client requested refund for overbilled month"
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
