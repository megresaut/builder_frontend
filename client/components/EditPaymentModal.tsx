import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJSON } from "@/api/fetchJSON";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * EditPaymentModal — PATCH a posted bill payment via /vendors/bill-payments/{id}.
 *
 * Buildium has no payment-update API. The backend propagates the edit to QBO
 * and returns a `requires_manual_buildium_update` array listing fields the
 * user must update in Buildium by hand. We surface that as a warning banner
 * the moment any "Buildium-impacting" field is touched.
 */

interface PaymentAccount {
  qbo_account_id: string;
  name: string;
  qbo_account_type: string;
}

interface EditPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: number;
    amount_cents: number;
    paid_on: string; // YYYY-MM-DD
    paid_from_qbo_account_id: string | null;
    paid_doc_number: string | null;
    paid_memo: string | null;
  };
  bill: {
    vendorName?: string;
    referenceNumber?: string;
  };
  onSaved?: () => void;
  onVoided?: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  amount: "amount",
  "payment date": "payment date",
  "payment account": "payment account",
  "check/reference number": "check/reference number",
  memo: "memo",
};

const dollarsFromCents = (cents: number): string => (cents / 100).toFixed(2);
const centsFromDollars = (s: string): number => {
  const cleaned = s.replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

export default function EditPaymentModal({
  open,
  onOpenChange,
  payment,
  bill,
  onSaved,
  onVoided,
}: EditPaymentModalProps) {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [accountQBOID, setAccountQBOID] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false);
  const [voiding, setVoiding] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(dollarsFromCents(payment.amount_cents));
    setPaidOn(payment.paid_on);
    setAccountQBOID(payment.paid_from_qbo_account_id);
    setDocNumber(payment.paid_doc_number ?? "");
    setMemo(payment.paid_memo ?? "");

    let cancelled = false;
    fetchJSON("/payment-accounts")
      .then((res) => {
        if (cancelled) return;
        setAccounts(Array.isArray(res?.accounts) ? res.accounts : []);
      })
      .catch(() => {
        if (cancelled) return;
        setAccounts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, payment]);

  // Compute which fields would land in requires_manual_buildium_update — drives
  // the warning banner. Mirrors the backend's classification so the warning
  // matches the eventual server response.
  const manualBuildium = useMemo(() => {
    const out: string[] = [];
    const newCents = centsFromDollars(amount);
    if (Number.isFinite(newCents) && newCents !== payment.amount_cents) {
      out.push(FIELD_LABELS.amount);
    }
    if (paidOn && paidOn !== payment.paid_on) {
      out.push(FIELD_LABELS["payment date"]);
    }
    if (accountQBOID != null && accountQBOID !== payment.paid_from_qbo_account_id) {
      out.push(FIELD_LABELS["payment account"]);
    }
    if ((payment.paid_doc_number ?? "") !== docNumber) {
      out.push(FIELD_LABELS["check/reference number"]);
    }
    if ((payment.paid_memo ?? "") !== memo) {
      out.push(FIELD_LABELS.memo);
    }
    return out;
  }, [amount, paidOn, accountQBOID, docNumber, memo, payment]);

  const buildPatch = () => {
    const patch: Record<string, unknown> = {};
    const newCents = centsFromDollars(amount);
    if (Number.isFinite(newCents) && newCents !== payment.amount_cents) {
      patch.amount_cents = newCents;
    }
    if (paidOn && paidOn !== payment.paid_on) {
      patch.paid_on = paidOn;
    }
    if (accountQBOID != null && accountQBOID !== payment.paid_from_qbo_account_id) {
      patch.payment_account_qbo_id = accountQBOID;
    }
    if ((payment.paid_doc_number ?? "") !== docNumber) {
      patch.paid_doc_number = docNumber;
    }
    if ((payment.paid_memo ?? "") !== memo) {
      patch.paid_memo = memo;
    }
    return patch;
  };

  const handleVoid = async () => {
    setVoiding(true);
    try {
      const res = await fetchJSON(`/vendors/bill-payments/${payment.id}`, {
        method: "DELETE",
      });
      const manual: string[] = Array.isArray(res?.requires_manual_buildium_update)
        ? res.requires_manual_buildium_update
        : [];
      if (manual.length > 0) {
        toast(`Payment voided. Please ${manual.join(", ")} in Buildium manually.`, {
          duration: 10000,
        });
      } else {
        toast.success("Payment voided.");
      }
      onVoided?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg, { duration: 8000 });
    } finally {
      setVoiding(false);
      setVoidConfirmOpen(false);
    }
  };

  const handleSave = async () => {
    const patch = buildPatch();
    if (Object.keys(patch).length === 0) {
      toast.message("No changes to save");
      return;
    }
    setSaving(true);
    try {
      const res = await fetchJSON(`/vendors/bill-payments/${payment.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      const manual: string[] = Array.isArray(res?.requires_manual_buildium_update)
        ? res.requires_manual_buildium_update
        : [];
      if (manual.length > 0) {
        toast(
          `Payment updated in QuickBooks. Please update ${manual.join(", ")} in Buildium manually.`,
          { duration: 10000 },
        );
      } else {
        toast.success("Payment updated.");
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg, { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <AlertDialog open={voidConfirmOpen} onOpenChange={setVoidConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Void this payment?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the payment record
            {bill.vendorName ? ` for ${bill.vendorName}` : ""}. The action
            cannot be undone. If this bill was paid in Buildium, you will need
            to void it there manually.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={voiding}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleVoid}
            disabled={voiding}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {voiding ? "Voiding…" : "Void payment"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Payment"
      size="sm"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => setVoidConfirmOpen(true)}
            disabled={saving || voiding}
            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Void payment
          </button>
          <ModalButtons
            onCancel={() => onOpenChange(false)}
            onConfirm={handleSave}
            cancelLabel="Cancel"
            confirmLabel={saving ? "Saving…" : "Save changes"}
            confirmDisabled={saving || voiding}
          />
        </div>
      }
    >
      <div className="text-sm text-[#717179] mb-4">
        <div>
          <span className="text-[#303030] font-medium">{bill.vendorName || "—"}</span>
          {bill.referenceNumber ? <span> · Ref {bill.referenceNumber}</span> : null}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <Field label="Amount (USD)">
          <Input
            value={amount}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={saving}
          />
        </Field>
        <Field label="Payment date">
          <Input
            type="date"
            value={paidOn}
            onChange={(e) => setPaidOn(e.target.value)}
            disabled={saving}
          />
        </Field>
        <Field label="Paid from account">
          <select
            value={accountQBOID ?? ""}
            onChange={(e) => setAccountQBOID(e.target.value || null)}
            disabled={saving}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">— Select —</option>
            {accounts.map((a) => (
              <option key={a.qbo_account_id} value={a.qbo_account_id}>
                {a.name} ({a.qbo_account_type})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Check / Reference number">
          <Input
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            disabled={saving}
          />
        </Field>
        <Field label="Memo">
          <Textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            disabled={saving}
          />
        </Field>
      </div>

      {manualBuildium.length > 0 && (
        <div className="mt-4 text-xs border border-amber-300 bg-amber-50 rounded-md p-3 text-amber-900">
          <div className="font-medium mb-1">Buildium will not be updated automatically</div>
          <div>
            Buildium does not support editing payments via API. After saving, please
            open this payment in Buildium and update {manualBuildium.join(", ")} by hand.
          </div>
        </div>
      )}
    </ModalTemplate>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-[#717179] mb-1">{label}</span>
      {children}
    </label>
  );
}
