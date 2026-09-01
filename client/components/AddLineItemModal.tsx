import { useEffect, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import {
  fetchManualLineItemOptions,
  type ManualLineQBOItem,
} from "@/data/invoices";

interface AddLineItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  onSubmit: (input: {
    description: string;
    amount: number;
    qboItemID: string;
  }) => Promise<void> | void;
}

/**
 * Adds a manually-typed line to an invoice — a one-off AVMRE-billed charge
 * that isn't a vendor bill, utility bill, or FTO submission. Works on both
 * draft and already-sent/paid invoices (the parent's onSubmit picks the
 * right endpoint); reached from the Invoicing tab's "..." actions menu next
 * to Send to QBO.
 */
export default function AddLineItemModal({
  open,
  onOpenChange,
  invoiceId,
  onSubmit,
}: AddLineItemModalProps) {
  const [items, setItems] = useState<ManualLineQBOItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [qboItemID, setQBOItemID] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQBOItemID("");
      setDescription("");
      setAmount("");
      setError(null);
      return;
    }

    let cancelled = false;
    setLoadingItems(true);
    fetchManualLineItemOptions()
      .then((list) => {
        if (cancelled) return;
        setItems(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          "Failed to load GL Account options: " +
            (err?.message ?? String(err)),
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingItems(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      setError("Description is required.");
      return;
    }
    const cleaned = amount.replace(/[^0-9.]/g, "");
    const parsedAmount = parseFloat(cleaned);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than $0.");
      return;
    }
    if (!qboItemID) {
      setError("Choose a GL Account.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        description: trimmedDescription,
        amount: parsedAmount,
        qboItemID,
      });
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
      title={`Add line item — invoice #${invoiceId}`}
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitting ? "Adding…" : "Add Line Item"}
          cancelDisabled={submitting}
        />
      }
    >
      <div className="text-sm text-[#717179] mb-4">
        Adds a one-off charge to this invoice and re-syncs the total to
        QuickBooks against the GL Account you choose.
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Vendor" htmlFor="add-line-vendor">
          <Input id="add-line-vendor" type="text" value="AVMRE LLC" disabled />
          <div className="text-xs text-[#717179] mt-1">
            Manually-added lines are always billed as AVMRE LLC, same as the
            management fee.
          </div>
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="GL Account" htmlFor="add-line-gl-account">
          <select
            id="add-line-gl-account"
            value={qboItemID}
            onChange={(e) => setQBOItemID(e.target.value)}
            disabled={loadingItems || submitting}
            className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm outline-none focus:border-[#013764]"
          >
            <option value="">
              {loadingItems ? "Loading…" : "Select a GL Account"}
            </option>
            {items.map((item) => (
              <option key={item.qbo_item_id} value={item.qbo_item_id}>
                {item.name}
              </option>
            ))}
          </select>
          <div className="text-xs text-[#717179] mt-1">
            Which QuickBooks income account this charge posts to.
          </div>
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Description" htmlFor="add-line-description">
          <Input
            id="add-line-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Holiday decoration setup"
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Amount (USD)" htmlFor="add-line-amount">
          <Input
            id="add-line-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={submitting}
          />
        </FieldShell>
      </div>

      {error && (
        <div className="text-sm text-red-600 mt-2" role="alert">
          {error}
        </div>
      )}
    </ModalTemplate>
  );
}
