import { useEffect, useMemo, useState } from "react";
import { ModalTemplate } from "@/components/ui/ModalTemplate";
import { cn } from "@/lib/utils";
import {
  listUnpaidBillCandidates,
  payExistingBill,
  type ReconciliationLine,
  type StatementRow,
  type UnpaidBillCandidate,
} from "@/data/credit-card-reconciliation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reconciliationID: number;
  statementRow: StatementRow | null;
  onPaid: (line: ReconciliationLine) => void;
}

// Bills within this many cents of the statement row are shown as candidates,
// sorted by absolute distance. ±$5.00.
const AMOUNT_PROXIMITY_CENTS = 500;

const formatCents = (cents: number): string =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

export default function PayExistingBillModal({
  open,
  onOpenChange,
  reconciliationID,
  statementRow,
  onPaid,
}: Props) {
  const [bills, setBills] = useState<UnpaidBillCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingBillID, setSubmittingBillID] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmittingBillID(null);
    setLoading(true);
    // Pull a wide window of unpaid bills and filter client-side. The backend
    // doesn't expose an amount filter today; 500 is enough headroom for any
    // realistic backlog while still being fast.
    listUnpaidBillCandidates(500)
      .then((list) => setBills(list))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load bills"),
      )
      .finally(() => setLoading(false));
  }, [open]);

  const candidates = useMemo(() => {
    if (!statementRow) return [];
    const target = statementRow.amount_cents;
    const within = bills
      .map((b) => ({ bill: b, delta: Math.abs(b.amount_cents - target) }))
      .filter((entry) => entry.delta <= AMOUNT_PROXIMITY_CENTS)
      .sort((a, b) => {
        if (a.delta !== b.delta) return a.delta - b.delta;
        // Tiebreak on statement_date descending (newest first).
        return b.bill.statement_date.localeCompare(a.bill.statement_date);
      });
    return within;
  }, [bills, statementRow]);

  const handlePick = async (billID: number) => {
    if (!statementRow) return;
    setError(null);
    setSubmittingBillID(billID);
    try {
      const line = await payExistingBill(reconciliationID, {
        statement_row: statementRow,
        bill_id: billID,
      });
      onPaid(line);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not pay bill");
    } finally {
      setSubmittingBillID(null);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Pay existing bill from statement row"
      size="md"
      footer={
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="px-3 py-2 text-sm rounded-md border border-[#DADADA] bg-white text-[#303030] hover:bg-[#F8F8F8]"
        >
          Close
        </button>
      }
    >
      {statementRow && (
        <div className="border border-[#E5E5E5] rounded-md bg-[#FAFAFA] px-4 py-3 mb-4">
          <div className="text-xs font-medium text-[#717179] uppercase tracking-wide mb-1">
            From statement
          </div>
          <div className="text-sm font-medium text-[#303030]">
            {statementRow.description || "—"}
          </div>
          <div className="text-xs text-[#717179] mt-0.5">
            {statementRow.date} · row {statementRow.source_row} ·{" "}
            <span className="tabular-nums font-medium text-[#303030]">
              {formatCents(statementRow.amount_cents)}
            </span>
          </div>
        </div>
      )}

      <div className="text-xs text-[#717179] mb-3">
        Showing unpaid platform bills within ±
        {formatCents(AMOUNT_PROXIMITY_CENTS)} of the statement amount, closest
        first. Clicking a bill creates a QBO BillPayment from this CC account
        against the bill, marks the bill paid, and pairs it to the statement
        row. Buildium is not touched.
      </div>

      {loading ? (
        <div className="p-6 text-sm text-[#717179] text-center">
          Loading unpaid bills…
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-6 text-sm text-[#717179] text-center border border-dashed border-[#E5E5E5] rounded-md">
          {bills.length === 0
            ? "No unpaid platform bills found."
            : `No unpaid bills within ±${formatCents(AMOUNT_PROXIMITY_CENTS)} of this statement row.`}
        </div>
      ) : (
        <ul className="max-h-[420px] overflow-y-auto divide-y divide-[#F0F0F0] border border-[#E5E5E5] rounded-md">
          {candidates.map(({ bill, delta }) => {
            const exact = delta === 0;
            const isSubmitting = submittingBillID === bill.id;
            return (
              <li
                key={bill.id}
                className={cn(
                  "px-4 py-3 flex items-center justify-between gap-3",
                  exact && "bg-emerald-50/40",
                )}
              >
                <div className="min-w-0">
                  <div className="text-sm text-[#303030] truncate">
                    {bill.vendor_name || `Vendor #${bill.vendor_id ?? "—"}`}
                    {bill.invoice_number && (
                      <span className="text-[#717179]">
                        {" "}
                        · INV {bill.invoice_number}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#717179] truncate">
                    {bill.statement_date}
                    {bill.property_name && (
                      <span> · {bill.property_name}</span>
                    )}
                    {bill.memo && (
                      <span className="text-[#A1A1A1]"> · {bill.memo}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-medium text-[#303030] tabular-nums">
                      {formatCents(bill.amount_cents)}
                    </div>
                    {!exact && (
                      <div className="text-[10px] text-[#A1A1A1] tabular-nums">
                        Δ {formatCents(delta)}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePick(bill.id)}
                    disabled={isSubmitting || submittingBillID != null}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-md border font-medium",
                      isSubmitting
                        ? "border-[#E5E5E5] text-[#717179] bg-white"
                        : "border-[#013764] text-[#013764] hover:bg-[#F4F7FA] bg-white disabled:opacity-50",
                    )}
                  >
                    {isSubmitting ? "Paying…" : "Pay this bill"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <div className="border border-rose-200 bg-rose-50 text-rose-900 rounded-md px-3 py-2 text-sm mt-3">
          {error}
        </div>
      )}
    </ModalTemplate>
  );
}
