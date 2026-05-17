import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJSON } from "@/api/fetchJSON";
import { authFetch } from "@/api/fetchJSON";
import { toast } from "sonner";

// Returned by GET /payment-accounts (DB-backed: chart_of_accounts rows
// where both qbo_id and buildium_id are populated). The frontend only needs
// the canonical coa_id + name + type for the dropdown — the backend resolves
// QBO and Buildium ids on its side using coa_id.
interface PaymentAccount {
  coa_id: number;
  name: string;
  qbo_account_type: string; // "Bank" or "Credit Card"
}

interface PayBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: {
    id: number;
    vendorName: string;
    propertyName: string;
    referenceNumber?: string;
    qboBalanceCents: number; // outstanding (defaults the amount field)
  };
  onPaid?: (result: {
    qbo_billpayment_id: string;
    qbo_balance_cents: number | null;
    qbo_paid_at: string | null;
    // Echoed back so the caller can render the "Paid" panel without a refetch.
    paid_on?: string;
    paid_from_name?: string;
    paid_doc_number?: string;
    paid_memo?: string;
    receipt_object_key?: string | null;
    receipt_filename?: string | null;
    receipt_mime?: string | null;
    receipt_size_bytes?: number | null;
    receipt_uploaded_at?: string | null;
  }) => void;
}

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const cents = (dollars: string): number => {
  // Tolerant of "$75.35", "75.35", "75", "1,234.56"
  const cleaned = dollars.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num)) return NaN;
  return Math.round(num * 100);
};

export default function PayBillModal({
  open,
  onOpenChange,
  bill,
  onPaid,
}: PayBillModalProps) {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountCOAID, setAccountCOAID] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [txnDate, setTxnDate] = useState<string>("");
  const [docNumber, setDocNumber] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptObjectKey, setReceiptObjectKey] = useState<string | null>(null);
  const [receiptFilename, setReceiptFilename] = useState<string | null>(null);
  const [receiptMime, setReceiptMime] = useState<string | null>(null);
  const [receiptSizeBytes, setReceiptSizeBytes] = useState<number | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const outstanding = bill.qboBalanceCents;
  const outstandingDollars = (outstanding / 100).toFixed(2);

  // Reset state on open. Load payment accounts.
  useEffect(() => {
    if (!open) {
      setAccountCOAID(null);
      setAmount("");
      setTxnDate("");
      setDocNumber("");
      setMemo("");
      setError(null);
      setErrorCode(null);
      setReceiptFile(null);
      setReceiptObjectKey(null);
      setReceiptFilename(null);
      setReceiptMime(null);
      setReceiptSizeBytes(null);
      setUploadingReceipt(false);
      setReceiptError(null);
      return;
    }
    setAmount(outstandingDollars);
    setTxnDate(todayISO());

    let cancelled = false;
    setLoadingAccounts(true);
    fetchJSON("/payment-accounts")
      .then((res) => {
        if (cancelled) return;
        const list: PaymentAccount[] = Array.isArray(res?.accounts) ? res.accounts : [];
        setAccounts(list);
        if (list.length === 1) setAccountCOAID(list[0].coa_id);
      })
      .catch((err) => {
        if (cancelled) return;
        setError("Failed to load payment accounts: " + (err?.message ?? String(err)));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingAccounts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, outstandingDollars]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.coa_id === accountCOAID),
    [accounts, accountCOAID],
  );
  const payTypeLabel = selectedAccount?.qbo_account_type === "Credit Card" ? "Credit Card" : "Check";

  const clearReceiptState = () => {
    setReceiptFile(null);
    setReceiptObjectKey(null);
    setReceiptFilename(null);
    setReceiptMime(null);
    setReceiptSizeBytes(null);
  };

  const handleReceiptChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    // Reset the input value so re-selecting the same file re-fires onChange.
    e.target.value = "";
    if (!file) return;

    setReceiptFile(file);
    setReceiptError(null);
    setUploadingReceipt(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await authFetch("/vendors/bills/upload-receipt", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        let message = `Upload failed (status ${res.status}).`;
        try {
          const body = await res.json();
          if (body?.error) message = String(body.error);
        } catch {
          const text = await res.text().catch(() => "");
          if (text) message = text;
        }
        clearReceiptState();
        setReceiptError(message);
        return;
      }
      const data = await res.json();
      setReceiptObjectKey(data?.object_key ?? null);
      setReceiptFilename(data?.filename ?? null);
      setReceiptMime(data?.mime ?? null);
      setReceiptSizeBytes(
        typeof data?.size_bytes === "number" ? data.size_bytes : null,
      );
    } catch (err: any) {
      clearReceiptState();
      setReceiptError(err?.message ?? String(err));
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setErrorCode(null);
    if (!accountCOAID || !selectedAccount) {
      setError("Please choose a Pay From account.");
      return;
    }
    const amountCents = cents(amount);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Amount must be greater than $0.");
      return;
    }
    if (amountCents > outstanding) {
      setError(`Amount cannot exceed the outstanding balance of $${outstandingDollars}.`);
      return;
    }
    if (!txnDate) {
      setError("Payment date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch(`/vendors/bills/${bill.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_account_coa_id: accountCOAID,
          amount_cents: amountCents,
          txn_date: txnDate,
          doc_number: docNumber || undefined,
          memo: memo || undefined,
          ...(receiptObjectKey
            ? {
                receipt_object_key: receiptObjectKey,
                receipt_filename: receiptFilename,
                receipt_mime: receiptMime,
                receipt_size_bytes: receiptSizeBytes,
              }
            : {}),
        }),
      });
      if (!res.ok) {
        // Parse the structured error body {error, code} from the API and fall
        // back to the raw text only if the server returned something else.
        let message = `Payment failed (status ${res.status}).`;
        let code: string | null = null;
        try {
          const body = await res.json();
          if (body?.error) message = String(body.error);
          if (body?.code) code = String(body.code);
        } catch {
          const text = await res.text().catch(() => "");
          if (text) message = text;
        }
        setErrorCode(code);
        setError(message);
        return;
      }
      const data = await res.json();
      toast.success(
        amountCents === outstanding
          ? `Paid ${bill.vendorName} — $${(amountCents / 100).toFixed(2)}`
          : `Paid $${(amountCents / 100).toFixed(2)} of $${outstandingDollars} to ${bill.vendorName}`,
      );
      onPaid?.({
        qbo_billpayment_id: data.qbo_billpayment_id,
        qbo_balance_cents: data.qbo_balance_cents ?? null,
        qbo_paid_at: data.qbo_paid_at ?? null,
        paid_on: txnDate || undefined,
        paid_from_name: selectedAccount?.name,
        paid_doc_number: docNumber || undefined,
        paid_memo: memo || undefined,
        receipt_object_key: data.receipt_object_key ?? null,
        receipt_filename: data.receipt_filename ?? null,
        receipt_mime: data.receipt_mime ?? null,
        receipt_size_bytes: data.receipt_size_bytes ?? null,
        receipt_uploaded_at: data.receipt_uploaded_at ?? null,
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Re-pull QBO/Buildium state for this bill via the existing refresh endpoint,
  // then close the modal so the parent table can reload. Shown when the API
  // tells us the bill is already paid in Buildium and the platform is stale.
  const handleRefreshFromBuildium = async () => {
    setRefreshing(true);
    try {
      const res = await authFetch(`/vendors/bills/${bill.id}/refresh-qbo`, {
        method: "POST",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Refresh failed (status ${res.status})`);
      }
      toast.success("Refreshed bill status from QBO and Buildium.");
      onOpenChange(false);
    } catch (err: any) {
      setError(`Refresh failed: ${err?.message ?? String(err)}`);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Pay Bill"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitting ? "Paying…" : "Pay"}
          cancelDisabled={submitting}
          confirmDisabled={submitting || uploadingReceipt}
        />
      }
    >
      {/* Bill summary header */}
      <div className="text-sm text-[#717179] mb-4">
        <div>
          <span className="text-[#303030] font-medium">{bill.vendorName}</span>
          {bill.referenceNumber ? <span> · Ref {bill.referenceNumber}</span> : null}
        </div>
        <div>{bill.propertyName}</div>
        <div className="mt-1">
          Outstanding: <span className="text-[#303030] font-medium">${outstandingDollars}</span>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Pay From" htmlFor="pay-account">
          <select
            id="pay-account"
            value={accountCOAID == null ? "" : String(accountCOAID)}
            onChange={(e) => setAccountCOAID(e.target.value ? Number(e.target.value) : null)}
            disabled={loadingAccounts || submitting}
            className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm outline-none focus:border-[#013764]"
          >
            <option value="">{loadingAccounts ? "Loading…" : "Select an account"}</option>
            {accounts.map((a) => (
              <option key={a.coa_id} value={a.coa_id}>
                {a.name} ({a.qbo_account_type})
              </option>
            ))}
          </select>
          {selectedAccount && (
            <div className="text-xs text-[#717179] mt-1">
              Will post to QBO + Buildium · PayType: {payTypeLabel}
            </div>
          )}
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Amount" htmlFor="pay-amount">
          <Input
            id="pay-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={outstandingDollars}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Payment Date" htmlFor="pay-date">
          <Input
            id="pay-date"
            type="date"
            value={txnDate}
            onChange={(e) => setTxnDate(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell
          label={payTypeLabel === "Check" ? "Check # (optional)" : "Reference (optional)"}
          htmlFor="pay-doc"
        >
          <Input
            id="pay-doc"
            type="text"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            placeholder={payTypeLabel === "Check" ? "1234" : ""}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Memo (optional)" htmlFor="pay-memo">
          <Textarea
            id="pay-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="e.g. Paid via online bill pay"
            autoGrow
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Receipt (optional)" htmlFor="pay-receipt">
          <input
            type="file"
            id="pay-receipt"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            disabled={submitting || uploadingReceipt}
            onChange={handleReceiptChange}
            className="block w-full text-sm text-[#303030] file:mr-3 file:rounded-md file:border file:border-[#DADADA] file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#303030] hover:file:bg-gray-50 disabled:opacity-50"
          />
          {uploadingReceipt && (
            <div className="text-xs text-[#717179] mt-1">Uploading…</div>
          )}
          {!uploadingReceipt && receiptFilename && (
            <div className="text-xs text-[#717179] mt-1 flex items-center gap-2">
              <span className="text-[#303030]">{receiptFilename}</span>
              <button
                type="button"
                onClick={() => {
                  clearReceiptState();
                  setReceiptError(null);
                }}
                disabled={submitting}
                className="text-[#013764] hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )}
          {receiptError && (
            <div className="text-xs text-red-600 mt-1">{receiptError}</div>
          )}
        </FieldShell>
      </div>

      {error && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <div>{error}</div>
          {(errorCode === "bill_already_paid_in_buildium" ||
            errorCode === "bill_already_paid" ||
            errorCode === "bill_overpay") && (
            <button
              type="button"
              onClick={handleRefreshFromBuildium}
              disabled={refreshing}
              className="mt-2 inline-flex items-center rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {refreshing ? "Refreshing…" : "Refresh from Buildium"}
            </button>
          )}
        </div>
      )}
    </ModalTemplate>
  );
}
