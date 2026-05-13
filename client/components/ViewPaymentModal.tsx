import { useEffect, useState } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { fetchJSON } from "@/api/fetchJSON";

interface ViewPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: {
    id?: number;
    vendorName?: string;
    propertyName?: string;
    referenceNumber?: string;
    totalCents?: number;
    qboBalanceCents?: number;
    qboPaidAt?: string;
    qboBillId?: string;
    qboBillPaymentId?: string;
    buildiumBillId?: string;
    buildiumBillPaymentId?: string;
    // Latest-payment fallback fields from the bills row, used while the
    // bill_payments fetch is in flight (and as a final fallback for bills
    // that somehow don't have a bill_payments row yet).
    paidOn?: string;
    paidFromName?: string;
    paidDocNumber?: string;
    paidMemo?: string;
  };
}

interface PaymentEntry {
  id: number;
  amount_cents: number;
  paid_on: string;
  paid_from_coa_id: number | null;
  paid_from_name: string | null;
  paid_doc_number: string | null;
  paid_memo: string | null;
  buildium_bill_payment_id: string | null;
  qbo_bill_payment_id: string | null;
  created_at: string;
}

const fmtUSD = (cents?: number | null) =>
  cents == null ? "—" : `$${(cents / 100).toFixed(2)}`;

const fmtDate = (isoOrDateOnly?: string | null) => {
  if (!isoOrDateOnly) return "—";
  // Date-only strings (YYYY-MM-DD) parse to UTC midnight which can shift the
  // day in negative-UTC zones. Treat them as local-only by appending T00:00.
  const d =
    /^\d{4}-\d{2}-\d{2}$/.test(isoOrDateOnly)
      ? new Date(isoOrDateOnly + "T00:00:00")
      : new Date(isoOrDateOnly);
  if (Number.isNaN(d.getTime())) return isoOrDateOnly;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function ViewPaymentModal({
  open,
  onOpenChange,
  bill,
}: ViewPaymentModalProps) {
  const total = bill.totalCents ?? 0;
  const balance = bill.qboBalanceCents ?? 0;
  const isFullyPaid = total > 0 && balance === 0;

  const [payments, setPayments] = useState<PaymentEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !bill.id) {
      setPayments(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchJSON(`/vendors/bills/${bill.id}/payments`)
      .then((res) => {
        if (cancelled) return;
        const list: PaymentEntry[] = Array.isArray(res?.payments) ? res.payments : [];
        setPayments(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(`Failed to load payments: ${err?.message ?? String(err)}`);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, bill.id]);

  // Sum of recorded payments. If we couldn't load bill_payments (older bill,
  // network error), fall back to total - balance so the summary still shows
  // a sensible amount.
  const recordedPaidCents =
    payments != null
      ? payments.reduce((acc, p) => acc + (p.amount_cents || 0), 0)
      : Math.max(0, total - balance);

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Payment Details"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={() => onOpenChange(false)}
          cancelLabel="Close"
          confirmLabel="Done"
        />
      }
    >
      {/* Bill summary header */}
      <div className="text-sm text-[#717179] mb-4">
        <div>
          <span className="text-[#303030] font-medium">{bill.vendorName || "—"}</span>
          {bill.referenceNumber ? <span> · Ref {bill.referenceNumber}</span> : null}
        </div>
        {bill.propertyName && <div>{bill.propertyName}</div>}
      </div>

      {/* Status pill */}
      <div className="mb-4">
        <span
          className={
            isFullyPaid
              ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-1"
              : "inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1"
          }
        >
          <span
            className={
              isFullyPaid
                ? "inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"
                : "inline-block w-1.5 h-1.5 rounded-full bg-amber-500"
            }
          />
          {isFullyPaid ? "Paid in full" : "Partially paid"}
        </span>
      </div>

      {/* Totals */}
      <Row label="Bill total" value={fmtUSD(total)} />
      <Row label="Amount paid" value={fmtUSD(recordedPaidCents)} />
      <Row label="Balance remaining" value={fmtUSD(balance)} />

      <Divider />

      {/* Payment history list */}
      <div className="text-sm text-[#303030] font-medium mb-2">
        {payments && payments.length > 1 ? "Payments" : "Payment"}
      </div>

      {loading && (
        <div className="text-sm text-[#717179]">Loading payments…</div>
      )}

      {!loading && error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && payments && payments.length === 0 && (
        // Show whatever the bills-row latest-payment columns gave us as a
        // best-effort fallback — older bills that predate the bill_payments
        // table won't have rows yet until the next payment.
        <FallbackPaymentBlock bill={bill} />
      )}

      {!loading && !error && payments && payments.length > 0 && (
        <div className="space-y-3">
          {payments.map((p) => (
            <PaymentEntryBlock key={p.id} payment={p} />
          ))}
        </div>
      )}

      <Divider />

      {/* System references — small + monospace, for traceability */}
      <div className="text-xs text-[#717179] space-y-1">
        <div>
          QBO Bill: <code className="text-[#303030]">{bill.qboBillId || "—"}</code>
        </div>
        <div>
          Buildium Bill: <code className="text-[#303030]">{bill.buildiumBillId || "—"}</code>
        </div>
      </div>
    </ModalTemplate>
  );
}

function PaymentEntryBlock({ payment }: { payment: PaymentEntry }) {
  return (
    <div className="rounded-md border border-gray-200 p-3 text-sm">
      <div className="flex items-baseline justify-between">
        <div className="text-[#303030] font-medium">
          {fmtUSD(payment.amount_cents)}
        </div>
        <div className="text-xs text-[#717179]">{fmtDate(payment.paid_on)}</div>
      </div>
      <Row label="Paid from" value={payment.paid_from_name || "—"} compact />
      <Row
        label="Reference / Check #"
        value={payment.paid_doc_number || "—"}
        compact
      />
      {payment.paid_memo && (
        <Row label="Memo" value={payment.paid_memo} compact multiline />
      )}
      <div className="mt-1 text-xs text-[#717179]">
        {payment.qbo_bill_payment_id && (
          <span>
            QBO Payment:{" "}
            <code className="text-[#303030]">{payment.qbo_bill_payment_id}</code>
          </span>
        )}
        {payment.qbo_bill_payment_id && payment.buildium_bill_payment_id && (
          <span> · </span>
        )}
        {payment.buildium_bill_payment_id && (
          <span>
            Buildium Payment:{" "}
            <code className="text-[#303030]">
              {payment.buildium_bill_payment_id}
            </code>
          </span>
        )}
      </div>
    </div>
  );
}

function FallbackPaymentBlock({
  bill,
}: {
  bill: ViewPaymentModalProps["bill"];
}) {
  return (
    <div className="rounded-md border border-gray-200 p-3 text-sm">
      <Row
        label="Payment date"
        value={fmtDate(bill.paidOn || bill.qboPaidAt)}
        compact
      />
      <Row label="Paid from" value={bill.paidFromName || "—"} compact />
      <Row
        label="Reference / Check #"
        value={bill.paidDocNumber || "—"}
        compact
      />
      <Row label="Memo" value={bill.paidMemo || "—"} compact multiline />
      {bill.buildiumBillPaymentId && (
        <div className="mt-1 text-xs text-[#717179]">
          Buildium Payment:{" "}
          <code className="text-[#303030]">{bill.buildiumBillPaymentId}</code>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  multiline,
  compact,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex items-start justify-between gap-4 py-0.5 text-xs"
          : "flex items-start justify-between gap-4 py-1.5 text-sm"
      }
    >
      <span className="text-[#717179]">{label}</span>
      <span
        className={
          multiline
            ? "text-[#303030] text-right max-w-[60%] whitespace-pre-wrap"
            : "text-[#303030] text-right"
        }
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="my-3 h-px bg-gray-200" />;
}
