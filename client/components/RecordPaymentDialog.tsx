import { useEffect, useMemo, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJSON } from "@/api/fetchJSON";

// Same shape PayBillModal consumes — DB-backed via /payment-accounts.
interface PaymentAccount {
  coa_id: number;
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
    depositAccountCoaId: number | null;
    paymentMethod: PaymentMethod | "";
    reference: string;
    memo: string;
  }) => Promise<void> | void;
}

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
  const [accountCOAID, setAccountCOAID] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [reference, setReference] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultDollars = (defaultAmountCents / 100).toFixed(2);

  // Reset state on open. Load payment accounts.
  useEffect(() => {
    if (!open) {
      setAccountCOAID(null);
      setAmount("");
      setDate("");
      setPaymentMethod("");
      setReference("");
      setMemo("");
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
        if (banks.length === 1) setAccountCOAID(banks[0].coa_id);
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
    () => accounts.find((a) => a.coa_id === accountCOAID),
    [accounts, accountCOAID],
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
    if (!accountCOAID) {
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
    setSubmitting(true);
    try {
      await onSubmit({
        amountCents,
        dateISO: date,
        depositAccountCoaId: accountCOAID,
        paymentMethod,
        reference,
        memo,
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
            value={accountCOAID == null ? "" : String(accountCOAID)}
            onChange={(e) => setAccountCOAID(e.target.value ? Number(e.target.value) : null)}
            disabled={loadingAccounts || submitting}
            className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm outline-none focus:border-[#013764]"
          >
            <option value="">{loadingAccounts ? "Loading…" : "Select a bank account"}</option>
            {accounts.map((a) => (
              <option key={a.coa_id} value={a.coa_id}>
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

      {error && (
        <div className="text-sm text-red-600 mt-2 whitespace-pre-wrap">
          {error}
        </div>
      )}
    </ModalTemplate>
  );
}
