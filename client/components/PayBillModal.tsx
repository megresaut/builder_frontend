import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJSON } from "@/api/fetchJSON";
import { authFetch } from "@/api/fetchJSON";
import { toast } from "sonner";

// Returned by GET /payment-accounts (live from concierge_buildium_mapping).
interface PaymentAccount {
  qbo_account_id: string;
  name: string;
  qbo_account_type: string; // "Bank" or "Credit Card"
}

// Returned by GET /buildium/payment-accounts (CSV-backed). Used for the Pay
// From dropdown on non-Concierge bills.
interface BuildiumPaymentAccount {
  buildium_account_id: number;
  name: string;
  type: string; // always "Current Asset (cash)" from the filter
}

interface PayBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: {
    id: number;
    vendorName: string;
    propertyName: string;
    referenceNumber?: string;
    // Concierge bills carry qboBalanceCents from QBO state. Non-Concierge bills
    // pass the bill's total amount instead (treated as outstanding until the
    // backend computes partial-payment state from local bill_payments).
    qboBalanceCents: number;
    // Property type drives picker variant. 'C' → COA-backed /payment-accounts.
    // Anything else → CSV-backed /buildium/payment-accounts (Buildium-only).
    propertyType?: string | null;
  };
  onPaid?: (result: {
    qbo_billpayment_id: string;
    qbo_balance_cents: number | null;
    qbo_paid_at: string | null;
    // 'queued' when the payment is a check awaiting printing (bill is NOT
    // paid yet); undefined for an electronic transfer (paid immediately).
    print_status?: string;
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
  const isConcierge = bill.propertyType === "C";
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [buildiumAccounts, setBuildiumAccounts] = useState<BuildiumPaymentAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountQBOID, setAccountQBOID] = useState<string | null>(null);
  const [buildiumAccountID, setBuildiumAccountID] = useState<number | null>(null);
  // Concierge-only: paper check vs. electronic transfer. Defaults to transfer
  // to preserve the existing flow; backend gates 'check' on property_type='C'.
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "check">("transfer");
  const [amount, setAmount] = useState<string>("");
  const [txnDate, setTxnDate] = useState<string>("");
  const [docNumber, setDocNumber] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [acctSearch, setAcctSearch] = useState("");
  const [acctDropOpen, setAcctDropOpen] = useState(false);
  const acctSearchRef = useRef<HTMLInputElement>(null);
  const acctDropRef = useRef<HTMLDivElement>(null);

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptObjectKey, setReceiptObjectKey] = useState<string | null>(null);
  const [receiptFilename, setReceiptFilename] = useState<string | null>(null);
  const [receiptMime, setReceiptMime] = useState<string | null>(null);
  const [receiptSizeBytes, setReceiptSizeBytes] = useState<number | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const outstanding = bill.qboBalanceCents;
  const outstandingDollars = (outstanding / 100).toFixed(2);

  // Reset state on open. Load the appropriate payment-accounts endpoint
  // based on property type (Concierge → COA, others → CSV).
  useEffect(() => {
    if (!open) {
      setAccountQBOID(null);
      setBuildiumAccountID(null);
      setPaymentMethod("transfer");
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
    const endpoint = isConcierge ? "/payment-accounts" : "/buildium/payment-accounts";
    fetchJSON(endpoint)
      .then((res) => {
        if (cancelled) return;
        const raw = Array.isArray(res?.accounts) ? res.accounts : [];
        if (isConcierge) {
          const list = raw as PaymentAccount[];
          setAccounts(list);
          if (list.length === 1) setAccountQBOID(list[0].qbo_account_id);
        } else {
          const list = raw as BuildiumPaymentAccount[];
          setBuildiumAccounts(list);
          if (list.length === 1) setBuildiumAccountID(list[0].buildium_account_id);
        }
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
  }, [open, outstandingDollars, isConcierge]);

  useEffect(() => {
    if (!acctDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (acctDropRef.current && !acctDropRef.current.contains(e.target as Node)) {
        setAcctDropOpen(false);
        setAcctSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [acctDropOpen]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.qbo_account_id === accountQBOID),
    [accounts, accountQBOID],
  );
  const selectedBuildiumAccount = useMemo(
    () => buildiumAccounts.find((a) => a.buildium_account_id === buildiumAccountID),
    [buildiumAccounts, buildiumAccountID],
  );
  const selectedAccountName = isConcierge
    ? selectedAccount?.name
    : selectedBuildiumAccount?.name;
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
    if (isConcierge && (!accountQBOID || !selectedAccount)) {
      setError("Please choose a Pay From account.");
      return;
    }
    if (!isConcierge && (!buildiumAccountID || !selectedBuildiumAccount)) {
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

    const usingCheck = isConcierge && paymentMethod === "check";

    setSubmitting(true);
    try {
      const res = await authFetch(`/vendors/bills/${bill.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Backend enforces XOR: Concierge bills carry qbo_account_id, others
          // carry the direct Buildium id sourced from the CSV-backed picker.
          ...(isConcierge
            ? { payment_account_qbo_id: accountQBOID }
            : { buildium_account_id: buildiumAccountID }),
          amount_cents: amountCents,
          txn_date: txnDate,
          // Check # is assigned at print time — only send doc_number for transfers.
          ...(usingCheck ? {} : { doc_number: docNumber || undefined }),
          memo: memo || undefined,
          payment_method: usingCheck ? "check" : "transfer",
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
      if (usingCheck) {
        toast.success(
          `Check queued for ${bill.vendorName} — $${(amountCents / 100).toFixed(2)}. Print from Accounting → Print Checks.`,
        );
      } else {
        toast.success(
          amountCents === outstanding
            ? `Paid ${bill.vendorName} — $${(amountCents / 100).toFixed(2)}`
            : `Paid $${(amountCents / 100).toFixed(2)} of $${outstandingDollars} to ${bill.vendorName}`,
        );
      }
      // Receipt attach status: only show a toast when the user actually
      // attached a receipt. Collapse the raw warnings into a clean
      // per-provider status so the user sees "attached to QBO, failed for
      // Buildium" instead of a wall of HTTP error text. Payment itself is
      // already booked at this point — these are supplementary side issues.
      if (receiptObjectKey) {
        const qboOk = !!data?.receipt_attached_qbo;
        const buildiumOk = !!data?.receipt_attached_buildium;
        if (qboOk && buildiumOk) {
          toast.success("Receipt attached to QBO and Buildium.");
        } else if (qboOk && !buildiumOk) {
          toast.warning(
            "Receipt attached to QBO. Buildium attach failed — payment is recorded, but the receipt is only in QBO and the platform.",
          );
        } else if (!qboOk && buildiumOk) {
          toast.warning(
            "Receipt attached to Buildium. QBO attach failed — payment is recorded, but the receipt is only in Buildium and the platform.",
          );
        } else {
          toast.error(
            "Receipt failed to attach to QBO and Buildium. Payment is recorded; the file is saved in the platform and can be re-attached.",
          );
        }
      }
      // Local persistence failure (bill_payments INSERT) is separate from
      // the attach failures — surface it independently if present so the
      // user knows their View Payment history will be missing this row.
      const warnings: string[] = Array.isArray(data?.warnings) ? data.warnings : [];
      const persistFailure = warnings.find((w) => w.toLowerCase().includes("local payment history"));
      if (persistFailure) {
        toast.error(persistFailure);
      }
      onPaid?.({
        qbo_billpayment_id: data.qbo_billpayment_id ?? "",
        qbo_balance_cents: data.qbo_balance_cents ?? null,
        qbo_paid_at: data.qbo_paid_at ?? null,
        print_status: usingCheck ? (data.print_status ?? "queued") : undefined,
        paid_on: txnDate || undefined,
        paid_from_name: selectedAccountName,
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

      {isConcierge && (
        <div style={{ marginBottom: 12 }}>
          <FieldShell label="Payment Method" htmlFor="pay-method">
            <div id="pay-method" className="flex items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pay-method"
                  value="transfer"
                  checked={paymentMethod === "transfer"}
                  onChange={() => setPaymentMethod("transfer")}
                  disabled={submitting}
                />
                <span>Bank transfer / Card</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pay-method"
                  value="check"
                  checked={paymentMethod === "check"}
                  onChange={() => setPaymentMethod("check")}
                  disabled={submitting}
                />
                <span>Check (print later)</span>
              </label>
            </div>
            {paymentMethod === "check" && (
              <div className="text-xs text-[#717179] mt-1">
                Will be queued for printing. Bill will show as paid once the
                check is printed.
              </div>
            )}
          </FieldShell>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Pay From" htmlFor="pay-account">
          {isConcierge ? (
            <select
              id="pay-account"
              value={accountQBOID ?? ""}
              onChange={(e) => setAccountQBOID(e.target.value || null)}
              disabled={loadingAccounts || submitting}
              className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm outline-none focus:border-[#013764]"
            >
              <option value="">{loadingAccounts ? "Loading…" : "Select an account"}</option>
              {accounts.map((a) => (
                <option key={a.qbo_account_id} value={a.qbo_account_id}>
                  {a.name} ({a.qbo_account_type})
                </option>
              ))}
            </select>
          ) : (
            <div className="relative" ref={acctDropRef}>
              <button
                type="button"
                id="pay-account"
                disabled={loadingAccounts || submitting}
                onClick={() => {
                  setAcctDropOpen((v) => !v);
                  setTimeout(() => acctSearchRef.current?.focus(), 50);
                }}
                className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm text-left outline-none focus:border-[#013764] disabled:opacity-50 flex justify-between items-center"
              >
                <span className={buildiumAccountID == null ? "text-[#717179]" : ""}>
                  {loadingAccounts
                    ? "Loading…"
                    : (selectedBuildiumAccount?.name ?? "Select an account")}
                </span>
                <span className="text-[#717179] ml-2">▾</span>
              </button>
              {acctDropOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-[#DADADA] bg-white shadow-lg">
                  <div className="p-2 border-b border-[#DADADA]">
                    <input
                      ref={acctSearchRef}
                      type="text"
                      value={acctSearch}
                      onChange={(e) => setAcctSearch(e.target.value)}
                      placeholder="Search accounts…"
                      className="w-full rounded border border-[#DADADA] px-2 py-1 text-sm outline-none focus:border-[#013764]"
                    />
                  </div>
                  <ul className="max-h-52 overflow-y-auto py-1">
                    {buildiumAccounts
                      .filter((a) =>
                        acctSearch === "" ||
                        a.name.toLowerCase().includes(acctSearch.toLowerCase())
                      )
                      .map((a) => (
                        <li
                          key={a.buildium_account_id}
                          onClick={() => {
                            setBuildiumAccountID(a.buildium_account_id);
                            setAcctDropOpen(false);
                            setAcctSearch("");
                          }}
                          className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-[#f5f5f5] ${
                            buildiumAccountID === a.buildium_account_id ? "font-medium text-[#013764]" : ""
                          }`}
                        >
                          {a.name}
                        </li>
                      ))}
                    {buildiumAccounts.filter((a) =>
                      acctSearch === "" || a.name.toLowerCase().includes(acctSearch.toLowerCase())
                    ).length === 0 && (
                      <li className="px-3 py-2 text-sm text-[#717179]">No accounts found</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          {isConcierge && selectedAccount && (
            <div className="text-xs text-[#717179] mt-1">
              Will post to QBO + Buildium · PayType: {payTypeLabel}
            </div>
          )}
          {!isConcierge && selectedBuildiumAccount && (
            <div className="text-xs text-[#717179] mt-1">
              Will post to Buildium only
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

      {!(isConcierge && paymentMethod === "check") && (
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
      )}

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
