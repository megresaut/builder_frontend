import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";

interface ViewPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: {
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
    paidOn?: string;
    paidFromName?: string;
    paidDocNumber?: string;
    paidMemo?: string;
  };
}

const fmtUSD = (cents?: number) =>
  cents == null ? "—" : `$${(cents / 100).toFixed(2)}`;

const fmtDate = (isoOrDateOnly?: string) => {
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
  const paidAmount = Math.max(0, total - balance);
  const isFullyPaid = total > 0 && balance === 0;

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

      {/* Amounts */}
      <Row label="Bill total" value={fmtUSD(total)} />
      <Row label="Amount paid" value={fmtUSD(paidAmount)} />
      <Row label="Balance remaining" value={fmtUSD(balance)} />

      <Divider />

      {/* Payment metadata */}
      <Row label="Payment date" value={fmtDate(bill.paidOn || bill.qboPaidAt)} />
      <Row label="Paid from" value={bill.paidFromName || "—"} />
      <Row label="Reference / Check #" value={bill.paidDocNumber || "—"} />
      <Row label="Memo" value={bill.paidMemo || "—"} multiline />

      <Divider />

      {/* System references — small + monospace, for traceability */}
      <div className="text-xs text-[#717179] space-y-1">
        <div>
          QBO Bill: <code className="text-[#303030]">{bill.qboBillId || "—"}</code>
          {bill.qboBillPaymentId && (
            <>
              {" · "}QBO Payment:{" "}
              <code className="text-[#303030]">{bill.qboBillPaymentId}</code>
            </>
          )}
        </div>
        <div>
          Buildium Bill: <code className="text-[#303030]">{bill.buildiumBillId || "—"}</code>
          {bill.buildiumBillPaymentId && (
            <>
              {" · "}Buildium Payment:{" "}
              <code className="text-[#303030]">{bill.buildiumBillPaymentId}</code>
            </>
          )}
        </div>
      </div>
    </ModalTemplate>
  );
}

function Row({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
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
