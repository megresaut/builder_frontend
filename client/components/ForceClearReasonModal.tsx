import { useEffect, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Textarea } from "@/components/ui/textarea";
import type { CreditCardActivityRow } from "@/data/credit-card-reconciliation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The QBO row being force-cleared. Surfaced in the modal body so the user
   * can confirm they picked the right row before justifying it. May be null
   * briefly while the parent closes — render guards against that.
   */
  qboRow: CreditCardActivityRow | null;
  /**
   * Called with the trimmed reason when the user confirms. The parent does
   * the API call + workspace reload. Modal stays open while pending so the
   * parent can surface an error from this side.
   */
  onConfirm: (reason: string) => Promise<void> | void;
  /** True while the parent is processing the force-clear API call. */
  submitting?: boolean;
  /** Surfaced from the parent after a failed API call. */
  error?: string | null;
}

const formatCents = (cents: number): string =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

/**
 * ForceClearReasonModal — captures the operator's audit reason for clearing a
 * QBO row without a statement counterpart. Empty/whitespace-only submissions
 * are rejected client-side; the backend also re-validates.
 */
export default function ForceClearReasonModal({
  open,
  onOpenChange,
  qboRow,
  onConfirm,
  submitting = false,
  error = null,
}: Props) {
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // Reset state every time the modal opens.
  useEffect(() => {
    if (!open) {
      setReason("");
      setLocalError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setLocalError("A reason is required.");
      return;
    }
    setLocalError(null);
    await onConfirm(trimmed);
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Force-clear without statement"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitting ? "Clearing…" : "Force clear"}
          cancelDisabled={submitting}
        />
      }
    >
      {qboRow && (
        <div className="border border-[#E5E5E5] rounded-md bg-[#FAFAFA] px-4 py-3 mb-4">
          <div className="text-xs font-medium text-[#717179] uppercase tracking-wide mb-1">
            QBO transaction
          </div>
          <div className="text-sm font-medium text-[#303030]">
            {qboRow.txn_type}
            {qboRow.vendor && (
              <span className="text-[#717179]"> · {qboRow.vendor}</span>
            )}
          </div>
          <div className="text-xs text-[#717179] mt-0.5">
            {qboRow.txn_date} ·{" "}
            <span className="tabular-nums font-medium text-[#303030]">
              {formatCents(qboRow.amount_cents)}
            </span>
            {qboRow.memo && <span> · {qboRow.memo}</span>}
          </div>
        </div>
      )}

      <div className="text-xs text-[#717179] mb-3">
        Force-clearing marks this QBO row as cleared without a statement
        counterpart. Captured for audit; visible in the Cleared list.
      </div>

      <FieldShell
        label="Reason"
        required
        htmlFor="force-clear-reason"
        error={localError ?? undefined}
      >
        <Textarea
          id="force-clear-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Statement page was missing — confirmed via bank app screenshot."
          rows={3}
          disabled={submitting}
          autoFocus
        />
      </FieldShell>

      {error && (
        <div className="border border-rose-200 bg-rose-50 text-rose-900 rounded-md px-3 py-2 text-sm mt-3">
          {error}
        </div>
      )}
    </ModalTemplate>
  );
}
