import React, { useState, useEffect } from "react";
import { authFetch } from "@/api/fetchJSON";

export interface ConciergeDefaults {
  vendor_id: number;
  vendor_name: string;
  income_account_id: number;
  income_account_name: string;
  dummy_account_id: number;
  dummy_account_name: string;
  bank_account_id: number;
  bank_account_name: string;
  buildium_bank_account_id: number;
}

interface PostToBuildiumModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: number;
  invoiceTotal: number; // dollars
  invoiceMonthLabel: string;
  defaults: ConciergeDefaults | null;
  onSuccess: () => void;
}

const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const PostToBuildiumModal: React.FC<PostToBuildiumModalProps> = ({
  open,
  onClose,
  invoiceId,
  invoiceTotal,
  invoiceMonthLabel,
  defaults,
  onSuccess,
}) => {
  const [billDate, setBillDate] = useState(todayYMD());
  const [reference, setReference] = useState("");
  const [memo, setMemo] = useState("");
  const [vendorId, setVendorId] = useState<number | "">("");
  const [incomeAccountId, setIncomeAccountId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (open && defaults) {
      setBillDate(todayYMD());
      setReference(`Concierge ${invoiceMonthLabel} - Invoice #${invoiceId}`);
      setMemo("");
      setVendorId(defaults.vendor_id);
      setIncomeAccountId(defaults.income_account_id);
      setError(null);
      setWarning(null);
    }
  }, [open, defaults, invoiceId, invoiceMonthLabel]);

  if (!open) return null;

  const submit = async () => {
    if (!vendorId || !incomeAccountId) {
      setError("Vendor and income account are required");
      return;
    }
    setSubmitting(true);
    setError(null);
    setWarning(null);
    try {
      const res = await authFetch(`/invoicing/post-to-buildium?id=${invoiceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          bill_date: billDate,
          reference,
          memo,
          income_account_id: incomeAccountId,
        }),
      });
      const text = await res.text();
      let body: any = {};
      try { body = JSON.parse(text); } catch (_) {}
      if (!res.ok) {
        setError(body?.error || `Failed (status ${res.status})`);
        return;
      }
      if (body?.pdf_attach_warning) {
        setWarning(body.pdf_attach_warning);
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
          <div className="text-[#303030] font-medium text-lg">Post to Buildium</div>
          <button onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-gray-50">×</button>
        </div>
        <div className="px-6 py-5 grid gap-4">
          <Field label="Property">
            <ReadOnly>{`Invoice #${invoiceId} (${invoiceMonthLabel})`}</ReadOnly>
          </Field>
          <Field label="Amount">
            <ReadOnly>{`$${invoiceTotal.toFixed(2)}`}</ReadOnly>
          </Field>
          <Field label="Vendor">
            <ReadOnly>{defaults?.vendor_name || "(loading…)"}</ReadOnly>
          </Field>
          <Field label="Income Account">
            <ReadOnly>{defaults?.income_account_name || "(loading…)"}</ReadOnly>
          </Field>
          <Field label="Bill Date">
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="border border-[#DADADA] rounded-lg px-3 h-9 w-full"
            />
          </Field>
          <Field label="Reference">
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="border border-[#DADADA] rounded-lg px-3 h-9 w-full"
            />
          </Field>
          <Field label="Memo (optional)">
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              className="border border-[#DADADA] rounded-lg px-3 py-2 w-full"
            />
          </Field>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}
          {warning && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Posted to Buildium, but {warning}
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
            {submitting ? "Posting…" : "Post to Buildium"}
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
