import { useEffect, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { Checkbox } from "@/components/ui/checkbox";
import {
  fetchBillableBillLines,
  type BillableBillLineAPI,
} from "@/data/invoices";

interface EditInvoiceLineItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  billId: number;
  billDescription: string;
  onSubmit: (lineIds: number[]) => Promise<void> | void;
}

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/**
 * Lets the user pick which of a vendor/utility bill's own line_items[] are
 * billed on THIS month's invoice. Anything left unchecked simply isn't
 * inserted — it stays eligible for a future month's invoice, so nothing here
 * needs an explicit "defer" action.
 *
 * Only meaningful when the bill's line_items reconcile to a real per-line
 * breakdown (backend `itemizable`); most bills don't, so this shows an
 * explanation and disables Save rather than assuming the caller always gates
 * correctly upstream.
 */
export default function EditInvoiceLineItemsModal({
  open,
  onOpenChange,
  invoiceId,
  billId,
  billDescription,
  onSubmit,
}: EditInvoiceLineItemsModalProps) {
  const [loading, setLoading] = useState(false);
  const [itemizable, setItemizable] = useState(true);
  const [lines, setLines] = useState<BillableBillLineAPI[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLines([]);
      setSelected(new Set());
      setItemizable(true);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchBillableBillLines(invoiceId, billId)
      .then((res) => {
        if (cancelled) return;
        setItemizable(res.itemizable);
        setLines(res.lines);
        setSelected(
          new Set(res.lines.filter((l) => l.selected_now).map((l) => l.line_id)),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError("Failed to load bill lines: " + (err?.message ?? String(err)));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, invoiceId, billId]);

  const toggle = (lineId: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(lineId);
      else next.delete(lineId);
      return next;
    });
  };

  const handleSubmit = async () => {
    // Defensive: ModalButtons' confirm button can't be disabled (see its
    // @deprecated confirmDisabled prop), so guard here instead — the menu
    // item that opens this modal is already hidden for non-itemizable bills.
    if (!itemizable || loading) {
      onOpenChange(false);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(Array.from(selected));
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
      title={`Edit line items — ${billDescription || "Bill #" + billId}`}
      size="md"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitting ? "Saving…" : "Save"}
          cancelDisabled={submitting}
        />
      }
    >
      {loading && (
        <div className="text-sm text-[#717179] py-6 text-center">
          Loading bill lines…
        </div>
      )}

      {!loading && !itemizable && (
        <div className="text-sm text-[#717179] py-4">
          This bill has no itemized breakdown — it's billed as a whole.
        </div>
      )}

      {!loading && itemizable && (
        <>
          <div className="text-sm text-[#717179] mb-4">
            Choose which of this bill's line items are billed on this
            invoice. Anything left unchecked stays available to bill on a
            future month's invoice.
          </div>
          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto">
            {lines.map((line) => {
              const billedElsewhere =
                line.billed_on_invoice_id != null &&
                line.billed_on_invoice_id !== invoiceId;
              return (
                <div
                  key={line.line_id}
                  className={
                    "flex items-start gap-3 px-3 py-2.5 rounded-md border " +
                    (billedElsewhere
                      ? "border-[#dadada] bg-gray-50"
                      : "border-[#dadada]")
                  }
                >
                  <Checkbox
                    checked={selected.has(line.line_id)}
                    disabled={billedElsewhere || submitting}
                    onCheckedChange={(checked) =>
                      toggle(line.line_id, checked === true)
                    }
                    className="mt-0.5 w-[14px] h-[14px]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#013764]">
                      {line.description || `Line ${line.line_id}`}
                    </div>
                    {billedElsewhere && (
                      <div className="text-xs text-[#717179] mt-0.5">
                        Billed on Invoice #{line.billed_on_invoice_id}
                        {line.billed_on_invoice_month
                          ? ` (${new Date(
                              line.billed_on_invoice_month,
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            })})`
                          : ""}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-[#013764] whitespace-nowrap">
                    {fmt(line.amount_cents + line.upcharge_cents)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {error && (
        <div className="text-sm text-red-600 mt-3">{error}</div>
      )}
    </ModalTemplate>
  );
}
