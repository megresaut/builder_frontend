import React, { useState, useEffect } from "react";
import { authFetch } from "@/api/fetchJSON";
import type { ConciergeDefaults } from "./PostToBuildiumModal";

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: number;
  invoiceTotalCents: number;
  defaults: ConciergeDefaults | null;
  onSuccess: () => void;
}

const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const PAYMENT_METHODS = ["check", "ach", "wire", "cash", "other"] as const;

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  open,
  onClose,
  invoiceId,
  invoiceTotalCents,
  defaults,
  onSuccess,
}) => {
  const [paymentDate, setPaymentDate] = useState(todayYMD());
  const [paymentMethod, setPaymentMethod] = useState<string>("check");
  const [checkNumber, setCheckNumber] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPaymentDate(todayYMD());
      setPaymentMethod("check");
      setCheckNumber("");
      setMemo("");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!defaults) {
      setError("Defaults not loaded");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch(`/invoicing/record-payment?id=${invoiceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: invoiceTotalCents,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          dummy_account_id: defaults.dummy_account_id,
          bank_account_id: defaults.bank_account_id,
          income_account_id: defaults.income_account_id,
          check_number: checkNumber,
          memo,
        }),
      });
      const text = await res.text();
      let body: any = {};
      try { body = JSON.parse(text); } catch (_) {}
      if (!res.ok) {
        setError(body?.error || `Failed (status ${res.status})`);
        return;
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-[560px] rounded-xl bg-white shadow-lg border border-[#E5E5E5]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
          <div className="text-[#303030] font-medium text-lg">Record Payment</div>
          <button onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-gray-50">×</button>
        </div>
        <div className="px-6 py-5 grid gap-4">
          <Field label="Amount (full balance)">
            <ReadOnly>{`$${(invoiceTotalCents / 100).toFixed(2)}`}</ReadOnly>
          </Field>
          <Field label="Payment Date">
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="border border-[#DADADA] rounded-lg px-3 h-9 w-full"
            />
          </Field>
          <Field label="Payment Method">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="border border-[#DADADA] rounded-lg px-3 h-9 w-full"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source Account (self-bill paid from)">
            <ReadOnly>{defaults?.dummy_account_name || "(loading…)"}</ReadOnly>
          </Field>
          <Field label="Deposit Destination">
            <ReadOnly>{defaults?.bank_account_name || "(loading…)"}</ReadOnly>
          </Field>
          <Field label="Offset JE Income Account">
            <ReadOnly>{defaults?.income_account_name || "(loading…)"}</ReadOnly>
            <div className="text-xs text-[#737373]">
              Used only for the offset journal entry (debit Dummy / credit this account). The deposit credits per-category income GLs derived from each invoice line item, not this field.
            </div>
          </Field>
          {paymentMethod === "check" && (
            <Field label="Check Number (optional)">
              <input
                type="text"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                className="border border-[#DADADA] rounded-lg px-3 h-9 w-full"
              />
            </Field>
          )}
          <Field label="Memo (optional)">
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              className="border border-[#DADADA] rounded-lg px-3 py-2 w-full"
            />
          </Field>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 whitespace-pre-wrap">
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-4 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={submit}
            disabled={submitting || !defaults}
            className="h-9 px-4 rounded-lg bg-[#013764] text-white disabled:opacity-50"
          >
            {submitting ? "Recording…" : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid gap-1.5">
    <div className="text-sm font-medium text-[#303030]">{label}</div>
    {children}
  </div>
);

const ReadOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="border border-[#EAEAEA] bg-[#FAFAFA] rounded-lg px-3 h-9 flex items-center text-sm text-[#525252]">
    {children}
  </div>
);
