import type { ReactNode } from "react";
import { ModalTemplate } from "@/components/ui/ModalTemplate";
import type {
  InvoicePaymentDetailProps,
  InvoicePaymentRefund,
} from "@/data/invoices";

// Shows what the PLATFORM recorded next to what QUICKBOOKS currently says,
// because the two can legitimately disagree and the disagreement is the thing
// worth seeing:
//
//   local  → invoices.payment_recorded_at / payment_amount_cents /
//            payment_reference / qbo_payment_id
//   qbo    → a live GET /payment/{id} read plus the invoice's current Balance
//
// `qbo` is nullable on purpose: a QBO outage, a token failure, or an invoice
// closed by a platform-side manual credit all have to render the local half
// alone with a reason rather than an empty modal.

export type InvoicePaymentLocal = InvoicePaymentDetailProps["local"];
export type InvoicePaymentQBO = NonNullable<InvoicePaymentDetailProps["qbo"]>;

interface InvoicePaymentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceLabel: string;
  /** null while the live read is in flight — see `loading`. */
  local: InvoicePaymentLocal | null;
  qbo?: InvoicePaymentQBO | null;
  /** Set when the live QBO read failed — renders the local half with a notice. */
  qboUnavailableReason?: string | null;
  loading?: boolean;
  /** Set when the whole request failed (404/409/network), not just the QBO leg. */
  error?: string | null;
  /** Every refund recorded against this invoice's payment (migration 164). */
  refunds?: InvoicePaymentRefund[];
  totalRefundedCents?: number;
}

const money = (cents: number | null | undefined): string => {
  if (cents === null || cents === undefined) return "—";
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
};

const dateTime = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
};

const dateOnly = (iso: string): string => {
  if (!iso) return "—";
  // QBO TxnDate is a bare 'YYYY-MM-DD'; parsing it as a Date would shift it a
  // day in negative-offset timezones, so format it by hand.
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${m}/${d}/${y}` : iso;
};

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[13px] text-[#6B7280]">{label}</span>
      <span
        className={`text-[13px] text-right ${
          muted ? "text-[#9CA3AF]" : "text-[#303030] font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-[#E5E5E5] bg-white p-4">
      <div className="mb-2">
        <div className="text-[13px] font-semibold text-[#303030]">{title}</div>
        <div className="text-[11px] text-[#9CA3AF]">{subtitle}</div>
      </div>
      <div className="divide-y divide-[#F3F4F6]">{children}</div>
    </div>
  );
}

export default function InvoicePaymentDetailModal({
  open,
  onOpenChange,
  invoiceLabel,
  local,
  qbo,
  qboUnavailableReason,
  loading,
  error,
  refunds = [],
  totalRefundedCents = 0,
}: InvoicePaymentDetailModalProps) {
  // Settled per QBO, which is not the same as "we marked it paid" — that gap is
  // exactly what the banner below calls out.
  const settledInQBO = qbo ? qbo.invoiceBalanceCents === 0 : null;
  const localSaysPaid = local?.status === "paid";
  const disagreement =
    !!local && qbo !== null && qbo !== undefined && settledInQBO !== localSaysPaid;

  if (loading || error || !local) {
    return (
      <ModalTemplate
        open={open}
        onOpenChange={onOpenChange}
        title="Payment details"
        size="lg"
        showDivider
      >
        <div className="py-8 text-center text-[13px] text-[#6B7280]">
          {error ? (
            <span className="text-rose-700">{error}</span>
          ) : (
            // The live QBO read is the slow part; say so rather than showing a
            // bare spinner that looks like the app hung.
            "Reading the payment from QuickBooks…"
          )}
        </div>
      </ModalTemplate>
    );
  }

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Payment details"
      size="lg"
      showDivider
    >
      <div className="space-y-4">
        <div className="text-[13px] text-[#6B7280]">
          {invoiceLabel}
          {local.qboPaymentId && (
            <>
              {" · "}
              <span className="font-mono text-[12px] text-[#303030]">
                QBO Payment #{local.qboPaymentId}
              </span>
            </>
          )}
        </div>

        {disagreement && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
            <span className="font-semibold">Platform and QuickBooks disagree.</span>{" "}
            {localSaysPaid
              ? `The platform shows this paid, but QuickBooks still reports a ${money(
                  qbo!.invoiceBalanceCents,
                )} balance — the payment may have been deleted or voided there, or a platform-side credit closed it locally.`
              : `QuickBooks shows this fully settled, but the platform has it as “${local.status}”.`}
          </div>
        )}

        {qboUnavailableReason && (
          <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 text-[12px] text-[#6B7280]">
            Live QuickBooks data unavailable — showing what the platform
            recorded. <span className="text-[#9CA3AF]">({qboUnavailableReason})</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3">
          <Panel title="Platform" subtitle="What we recorded">
            <Row label="Status" value={local.status.toUpperCase()} />
            <Row label="Amount recorded" value={money(local.amountCents)} />
            <Row label="Invoice total" value={money(local.invoiceTotalCents)} />
            {/* Only shown when non-zero: a credit is what makes a payment
                smaller than the total still settle the invoice, so hiding it
                makes the amount above read as a shortfall. */}
            {local.creditCents > 0 && (
              <Row
                label="Credits applied"
                value={`−${money(local.creditCents)}`}
              />
            )}
            <Row label="Recorded at" value={dateTime(local.recordedAt)} />
            <Row
              label="Reference"
              value={local.reference || "—"}
              muted={!local.reference}
            />
          </Panel>

          {qbo ? (
            <Panel title="QuickBooks" subtitle="Live, as of now">
              <Row
                label="Invoice balance"
                value={
                  <span
                    className={
                      qbo.invoiceBalanceCents === 0
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }
                  >
                    {money(qbo.invoiceBalanceCents)}
                    {qbo.invoiceBalanceCents === 0 ? " · settled" : " · open"}
                  </span>
                }
              />
              <Row label="Payment total" value={money(qbo.totalCents)} />
              <Row
                label="Unapplied"
                value={money(qbo.unappliedCents)}
                muted={qbo.unappliedCents === 0}
              />
              <Row label="Payment date" value={dateOnly(qbo.txnDate)} />
              <Row label="Method" value={qbo.paymentMethod || "—"} muted={!qbo.paymentMethod} />
              <Row label="Deposited to" value={qbo.depositAccount || "—"} />
              <Row label="Customer" value={qbo.customerName} />
            </Panel>
          ) : (
            !qboUnavailableReason && (
              <Panel title="QuickBooks" subtitle="Live, as of now">
                <Row label="—" value="No QuickBooks payment linked" muted />
              </Panel>
            )
          )}
        </div>

        {qbo && qbo.linkedInvoices.length > 0 && (
          <div>
            <div className="text-[13px] font-semibold text-[#303030] mb-1.5">
              Applied to
            </div>
            {/* Shown even for a single invoice: one QBO payment settling several
                months is the case where a bare total misleads. */}
            <div className="rounded-xl border border-[#E5E5E5] overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-[#FAFAFA] text-[#6B7280]">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Invoice</th>
                    <th className="text-left font-medium px-3 py-2">QBO ID</th>
                    <th className="text-right font-medium px-3 py-2">Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {qbo.linkedInvoices.map((li) => (
                    <tr key={li.qboInvoiceId} className="border-t border-[#F3F4F6]">
                      <td className="px-3 py-2 text-[#303030]">{li.docNumber}</td>
                      <td className="px-3 py-2 font-mono text-[12px] text-[#6B7280]">
                        {li.qboInvoiceId}
                      </td>
                      <td className="px-3 py-2 text-right text-[#303030] font-medium">
                        {money(li.appliedCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {refunds.length > 0 && (
          <div>
            <div className="text-[13px] font-semibold text-[#303030] mb-1.5 flex items-baseline gap-2">
              Refunds
              <span className="text-[12px] font-normal text-[#6B7280]">
                {money(totalRefundedCents)} total
              </span>
            </div>
            <div className="rounded-xl border border-[#E5E5E5] overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-[#FAFAFA] text-[#6B7280]">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Date</th>
                    <th className="text-left font-medium px-3 py-2">Type</th>
                    <th className="text-left font-medium px-3 py-2">Account</th>
                    <th className="text-right font-medium px-3 py-2">Amount</th>
                    <th className="text-left font-medium px-3 py-2">Memo</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((r) => (
                    <tr key={r.id} className="border-t border-[#F3F4F6]">
                      <td className="px-3 py-2 text-[#303030]">
                        {dateOnly(r.refund_date)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            r.refund_path === "payments"
                              ? "bg-violet-50 text-violet-700 border-violet-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                          title={
                            r.refund_path === "payments"
                              ? "Real money refunded via QuickBooks Payments"
                              : "Bookkeeping entry only — money was returned outside the platform"
                          }
                        >
                          {r.refund_path === "payments" ? "Real refund" : "Books only"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[#6B7280]">
                        {r.deposit_account_name || "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-[#303030] font-medium">
                        {money(r.amount_cents)}
                      </td>
                      <td className="px-3 py-2 text-[#6B7280]">
                        {r.memo || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {qbo?.privateNote && (
          <div>
            <div className="text-[13px] font-semibold text-[#303030] mb-1">Memo</div>
            <div className="text-[13px] text-[#6B7280] whitespace-pre-wrap">
              {qbo.privateNote}
            </div>
          </div>
        )}
      </div>
    </ModalTemplate>
  );
}
