import { useEffect, useMemo, useRef, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJSON } from "@/api/fetchJSON";

// Same shape PayBillModal consumes — live from concierge_buildium_mapping.
interface PaymentAccount {
  qbo_account_id: string;
  name: string;
  qbo_account_type: string; // "Bank" or "Credit Card"
}

const PAYMENT_METHODS = ["Check", "ACH", "Wire", "Cash", "Credit Card", "Other"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAmountCents: number;
  invoiceId: number;
  onSubmit: (input: {
    amountCents: number;
    dateISO: string;
    depositAccountQBOID: string | null;
    paymentMethod: PaymentMethod | "";
    reference: string;
    memo: string;
    receiptFile: File | null;
  }) => Promise<void> | void;
}

const ACCEPTED_RECEIPT_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const cents = (dollars: string): number => {
  const cleaned = dollars.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num)) return NaN;
  return Math.round(num * 100);
};

export default function RecordPaymentDialog({
  open,
  onOpenChange,
  defaultAmountCents,
  invoiceId,
  onSubmit,
}: RecordPaymentDialogProps) {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountQBOID, setAccountQBOID] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [reference, setReference] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptDrag, setReceiptDrag] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultDollars = (defaultAmountCents / 100).toFixed(2);

  // Reset state on open. Load payment accounts.
  useEffect(() => {
    if (!open) {
      setAccountQBOID(null);
      setAmount("");
      setDate("");
      setPaymentMethod("");
      setReference("");
      setMemo("");
      setReceiptFile(null);
      setReceiptDrag(false);
      setError(null);
      return;
    }
    setAmount(defaultDollars);
    setDate(todayISO());

    let cancelled = false;
    setLoadingAccounts(true);
    fetchJSON("/payment-accounts")
      .then((res) => {
        if (cancelled) return;
        const list: PaymentAccount[] = Array.isArray(res?.accounts) ? res.accounts : [];
        // Receiving payment — limit to Bank accounts (no CC deposits).
        const banks = list.filter((a) => a.qbo_account_type === "Bank");
        setAccounts(banks);
        if (banks.length === 1) setAccountQBOID(banks[0].qbo_account_id);
      })
      .catch((err) => {
        if (cancelled) return;
        setError("Failed to load deposit accounts: " + (err?.message ?? String(err)));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingAccounts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, defaultDollars]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.qbo_account_id === accountQBOID),
    [accounts, accountQBOID],
  );

  const referenceLabel = useMemo(() => {
    switch (paymentMethod) {
      case "Check":
        return "Check # (optional)";
      case "ACH":
      case "Wire":
        return "Confirmation # (optional)";
      case "Credit Card":
        return "Auth code (optional)";
      default:
        return "Reference (optional)";
    }
  }, [paymentMethod]);

  const handleSubmit = async () => {
    setError(null);
    if (!accountQBOID) {
      setError("Please choose the bank account that received the payment.");
      return;
    }
    const amountCents = cents(amount);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Amount must be greater than $0.");
      return;
    }
    if (!date) {
      setError("Payment date is required.");
      return;
    }
    if (receiptFile && !ACCEPTED_RECEIPT_TYPES.includes(receiptFile.type)) {
      setError("Receipt must be a PDF, JPEG, or PNG file.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        amountCents,
        dateISO: date,
        depositAccountQBOID: accountQBOID,
        paymentMethod,
        reference,
        memo,
        receiptFile,
      });
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={`Record payment for invoice #${invoiceId}`}
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitting ? "Recording…" : "Record Payment"}
          cancelDisabled={submitting}
        />
      }
    >
      <div className="text-sm text-[#717179] mb-4">
        Manually record a payment received from the client. Posts a Payment in
        QuickBooks linked to this invoice.
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Deposit to" htmlFor="rec-deposit">
          <select
            id="rec-deposit"
            value={accountQBOID ?? ""}
            onChange={(e) => setAccountQBOID(e.target.value || null)}
            disabled={loadingAccounts || submitting}
            className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm outline-none focus:border-[#013764]"
          >
            <option value="">{loadingAccounts ? "Loading…" : "Select a bank account"}</option>
            {accounts.map((a) => (
              <option key={a.qbo_account_id} value={a.qbo_account_id}>
                {a.name}
              </option>
            ))}
          </select>
          {selectedAccount && (
            <div className="text-xs text-[#717179] mt-1">
              QBO Payment will land in this account.
            </div>
          )}
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Amount (USD)" htmlFor="rec-amount">
          <Input
            id="rec-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={defaultDollars}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Payment date" htmlFor="rec-date">
          <Input
            id="rec-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Payment method" htmlFor="rec-method">
          <select
            id="rec-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")}
            disabled={submitting}
            className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm outline-none focus:border-[#013764]"
          >
            <option value="">— Select —</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label={referenceLabel} htmlFor="rec-reference">
          <Input
            id="rec-reference"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={paymentMethod === "Check" ? "1234" : ""}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Memo (optional)" htmlFor="rec-memo">
          <Textarea
            id="rec-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Internal notes — included in the QBO Payment private note."
            autoGrow
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Check image / receipt (optional)" htmlFor="rec-receipt">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setReceiptDrag(true);
            }}
            onDragLeave={() => setReceiptDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setReceiptDrag(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setReceiptFile(f);
            }}
            onClick={() => receiptInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-3 py-4 text-center transition-colors ${
              receiptDrag ? "border-[#013764] bg-[#013764]/5" : "border-[#DADADA] hover:bg-gray-50"
            }`}
          >
            {receiptFile ? (
              <p className="text-sm font-medium text-[#303030]">{receiptFile.name}</p>
            ) : (
              <p className="text-xs text-[#717179]">
                Drag and drop a PDF, JPEG, or PNG here, or click to browse
              </p>
            )}
            <input
              id="rec-receipt"
              ref={receiptInputRef}
              type="file"
              accept={ACCEPTED_RECEIPT_TYPES.join(",")}
              className="hidden"
              disabled={submitting}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) setReceiptFile(f);
              }}
            />
          </div>
          {receiptFile && (
            <button
              type="button"
              onClick={() => setReceiptFile(null)}
              disabled={submitting}
              className="mt-1 text-xs text-[#717179] hover:text-[#303030]"
            >
              Remove file
            </button>
          )}
        </FieldShell>
      </div>

      {error && (
        <div className="text-sm text-red-600 mt-2 whitespace-pre-wrap">
          {error}
        </div>
      )}
    </ModalTemplate>
  );
}
