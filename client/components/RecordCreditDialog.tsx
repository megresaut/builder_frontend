import { useEffect, useMemo, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJSON } from "@/api/fetchJSON";

// Same shape RecordPaymentDialog / PayBillModal consume — live from
// concierge_buildium_mapping.
interface PaymentAccount {
  qbo_account_id: string;
  name: string;
  qbo_account_type: string; // "Bank" or "Credit Card"
}

const PAYMENT_METHODS = ["Check", "ACH", "Wire", "Cash", "Credit Card", "Other"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type CreditKind = "payment" | "credit";

interface RecordCreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  // Current credit on the invoice (cents), prefilled so re-opening shows what's
  // already applied rather than a blank field.
  currentCreditCents: number;
  onSubmit: (input: {
    kind: CreditKind;
    amountCents: number;
    dateISO: string;
    depositAccountQBOID: string | null;
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

/**
 * Records an owner payment received OUTSIDE the platform, or a no-cash credit,
 * against an invoice — and books the matching object in QuickBooks so the QBO
 * balance, the pay link, and the printed PDF all agree.
 *
 * Distinct from RecordPaymentDialog, which settles a sent invoice and flips it
 * to PAID. This one reduces what the owner owes without closing the invoice.
 */
export default function RecordCreditDialog({
  open,
  onOpenChange,
  invoiceId,
  currentCreditCents,
  onSubmit,
}: RecordCreditDialogProps) {
  const [kind, setKind] = useState<CreditKind>("payment");
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountQBOID, setAccountQBOID] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [reference, setReference] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prefillDollars =
    currentCreditCents > 0 ? (currentCreditCents / 100).toFixed(2) : "";

  useEffect(() => {
    if (!open) {
      setKind("payment");
      setAccountQBOID(null);
      setAmount("");
      setDate("");
      setPaymentMethod("");
      setReference("");
      setMemo("");
      setError(null);
      return;
    }
    setAmount(prefillDollars);
    setDate(todayISO());

    let cancelled = false;
    setLoadingAccounts(true);
    fetchJSON("/payment-accounts")
      .then((res) => {
        if (cancelled) return;
        const list: PaymentAccount[] = Array.isArray(res?.accounts) ? res.accounts : [];
        // Receiving money — Bank accounts only, no CC deposits.
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
  }, [open, prefillDollars]);

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

  const isPayment = kind === "payment";

  const handleSubmit = async () => {
    setError(null);
    const amountCents = cents(amount);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Amount must be greater than $0.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }
    if (isPayment && !accountQBOID) {
      setError("Choose the bank account that received the payment.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        kind,
        amountCents,
        dateISO: date,
        depositAccountQBOID: isPayment ? accountQBOID : null,
        paymentMethod: isPayment ? paymentMethod : "",
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
      title={`Add payment or credit — invoice #${invoiceId}`}
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitting ? "Booking…" : isPayment ? "Record Payment" : "Apply Credit"}
          cancelDisabled={submitting}
        />
      }
    >
      <div className="text-sm text-[#717179] mb-4">
        Reduces what the owner owes on this invoice and books the matching object
        in QuickBooks, so the QBO balance and pay link match the printed PDF.
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Type" htmlFor="cred-kind">
          <div className="flex gap-2">
            {(
              [
                ["payment", "Payment received"],
                ["credit", "Credit"],
              ] as Array<[CreditKind, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                disabled={submitting}
                className={
                  "flex-1 h-10 rounded-md border text-sm font-medium transition-colors " +
                  (kind === value
                    ? "border-[#013764] bg-[#013764] text-white"
                    : "border-[#DADADA] bg-white text-[#013764] hover:bg-gray-50")
                }
              >
                {label}
              </button>
            ))}
          </div>
          <div className="text-xs text-[#717179] mt-1">
            {isPayment
              ? "Cash reached AVMRE outside the platform. Books a QuickBooks Payment; the amount becomes credit on the owner and is applied when this invoice is sent to QBO."
              : "A reduction with no cash behind it. Books a QuickBooks Credit Memo against this invoice's account."}
          </div>
        </FieldShell>
      </div>

      {isPayment && (
        <div style={{ marginBottom: 12 }}>
          <FieldShell label="Deposit to" htmlFor="cred-deposit">
            <select
              id="cred-deposit"
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
            <div className="text-xs text-[#717179] mt-1">
              The account the money actually landed in — QuickBooks books the
              cash here.
            </div>
          </FieldShell>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Amount (USD)" htmlFor="cred-amount">
          <Input
            id="cred-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label={isPayment ? "Payment date" : "Credit date"} htmlFor="cred-date">
          <Input
            id="cred-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      {isPayment && (
        <div style={{ marginBottom: 12 }}>
          <FieldShell label="Payment method" htmlFor="cred-method">
            <select
              id="cred-method"
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
      )}

      <div style={{ marginBottom: 12 }}>
        <FieldShell label={referenceLabel} htmlFor="cred-reference">
          <Input
            id="cred-reference"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={paymentMethod === "Check" ? "1234" : ""}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Memo (optional)" htmlFor="cred-memo">
          <Textarea
            id="cred-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="e.g. June overpayment rolled forward — included in the QuickBooks private note."
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
