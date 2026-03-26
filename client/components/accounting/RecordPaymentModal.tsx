import { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalField,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoiceId: number;
  remainingBalanceCents: number;
}

const inputStyle: React.CSSProperties = {
  borderRadius: "8px",
  backgroundColor: "rgba(255, 255, 255, 1)",
  borderColor: "rgba(229, 229, 229, 1)",
  borderStyle: "solid",
  borderWidth: "1px",
  padding: "8px 12px",
  fontSize: "16px",
  fontWeight: 400,
  letterSpacing: "-0.32px",
  lineHeight: 1.4,
  fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
  color: "#303030",
  width: "100%",
  boxSizing: "border-box" as const,
};

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function todayString(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  invoiceId,
  remainingBalanceCents,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayString());
  const [paymentMethod, setPaymentMethod] = useState("check");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setAmount((remainingBalanceCents / 100).toFixed(2));
      setPaymentDate(todayString());
      setPaymentMethod("check");
      setReferenceNumber("");
      setNotes("");
      setSaving(false);
      setErrors({});
    }
  }, [isOpen, remainingBalanceCents]);

  const handleConfirm = async () => {
    const newErrors: Record<string, string> = {};
    const amountNum = parseFloat(amount);

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Please enter a valid amount";
    } else if (Math.round(amountNum * 100) > remainingBalanceCents) {
      newErrors.amount = `Amount cannot exceed remaining balance of ${formatCents(remainingBalanceCents)}`;
    }

    if (!paymentDate) {
      newErrors.paymentDate = "Please select a payment date";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      await accountingAPI.recordPayment(invoiceId, {
        amount_cents: Math.round(amountNum * 100),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        notes: notes,
      });
      toast.success("Payment recorded successfully");
      onClose();
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalTemplate
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title="Record Payment"
      size="sm"
      footer={
        <ModalButtons
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmLabel={saving ? "Recording..." : "Record Payment"}
          cancelDisabled={saving}
        />
      }
    >
      {/* Remaining balance banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-700">Remaining Balance</p>
        <p className="text-2xl font-bold text-blue-900">
          {formatCents(remainingBalanceCents)}
        </p>
      </div>

      <ModalField label="Amount ($)">
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setErrors((prev) => ({ ...prev, amount: "" }));
          }}
          style={{
            ...inputStyle,
            borderColor: errors.amount ? "rgb(239, 68, 68)" : "rgba(229, 229, 229, 1)",
            borderWidth: errors.amount ? "2px" : "1px",
          }}
          placeholder="0.00"
        />
        {errors.amount && (
          <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
        )}
      </ModalField>

      <ModalField label="Payment Date">
        <input
          type="date"
          value={paymentDate}
          onChange={(e) => {
            setPaymentDate(e.target.value);
            setErrors((prev) => ({ ...prev, paymentDate: "" }));
          }}
          style={{
            ...inputStyle,
            borderColor: errors.paymentDate ? "rgb(239, 68, 68)" : "rgba(229, 229, 229, 1)",
            borderWidth: errors.paymentDate ? "2px" : "1px",
          }}
        />
        {errors.paymentDate && (
          <p className="text-red-500 text-xs mt-1">{errors.paymentDate}</p>
        )}
      </ModalField>

      <ModalField label="Payment Method">
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          style={inputStyle}
        >
          <option value="check">Check</option>
          <option value="ach">ACH</option>
          <option value="wire">Wire</option>
          <option value="cash">Cash</option>
          <option value="other">Other</option>
        </select>
      </ModalField>

      <ModalField label="Reference #">
        <input
          type="text"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          style={inputStyle}
          placeholder="Check number, transaction ID, etc."
        />
      </ModalField>

      <ModalField label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ ...inputStyle, minHeight: "80px", resize: "vertical" as const }}
          placeholder="Optional notes..."
        />
      </ModalField>
    </ModalTemplate>
  );
}
