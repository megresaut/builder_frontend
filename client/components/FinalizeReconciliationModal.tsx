import { useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import {
  finalize,
  type Reconciliation,
  type Workspace,
} from "@/data/credit-card-reconciliation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace | null;
  // Called with the updated reconciliation on success so the caller can refresh
  // its workspace view immediately rather than waiting for the next pull.
  onFinalized: (rec: Reconciliation) => void;
}

const formatCents = (cents: number): string =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

// FinalizeReconciliationModal is the confirmation step before flipping a rec
// to finalized. Shows the period + the three-piece math (beginning + cleared =
// ending, difference 0) so the operator can eyeball one last time. The server
// re-checks the gate on POST so this isn't load-bearing — it's UX.
export default function FinalizeReconciliationModal({
  open,
  onOpenChange,
  workspace,
  onFinalized,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!workspace) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await finalize(workspace.reconciliation.id);
      onFinalized(updated);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finalize");
    } finally {
      setSubmitting(false);
    }
  };

  if (!workspace) return null;
  const { reconciliation: rec } = workspace;

  return (
    <ModalTemplate
      open={open}
      onOpenChange={(o) => {
        if (!submitting) onOpenChange(o);
      }}
      title="Finalize reconciliation"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitting ? "Finalizing…" : "Finalize"}
          cancelDisabled={submitting}
        />
      }
    >
      <div className="text-sm text-[#717179] mb-4">
        Lock this reconciliation. After finalizing, no new matches, force-clears,
        or statement edits are allowed — you'll need to reopen the rec (with an
        audit reason) to make further changes.
      </div>

      <div className="border border-[#E5E5E5] rounded-md bg-[#FAFAFA] px-4 py-3 mb-4">
        <div className="text-xs font-medium text-[#717179] mb-1">Period</div>
        <div className="text-sm text-[#303030]">
          {rec.period_start} → {rec.period_end}
          {rec.statement_date && (
            <span className="ml-2 text-[#A1A1A1]">
              (statement {rec.statement_date})
            </span>
          )}
        </div>
      </div>

      <div className="border border-emerald-200 rounded-md bg-emerald-50 px-4 py-3 mb-2 text-sm">
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#303030]">Beginning balance</span>
          <span className="font-medium text-[#303030] tabular-nums">
            {formatCents(rec.beginning_balance_cents)}
          </span>
        </div>
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#303030]">+ Cleared total</span>
          <span className="font-medium text-[#303030] tabular-nums">
            {formatCents(workspace.cleared_total_cents)}
          </span>
        </div>
        <div className="border-t border-emerald-200 mt-2 pt-2 flex items-center justify-between">
          <span className="text-[#303030]">= Ending balance</span>
          <span className="font-medium text-[#303030] tabular-nums">
            {formatCents(rec.ending_balance_cents)}
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-emerald-200 flex items-center justify-between">
          <span className="text-emerald-800 font-medium">Difference</span>
          <span className="font-semibold text-emerald-700 tabular-nums">
            {formatCents(workspace.difference_cents)}
          </span>
        </div>
      </div>

      {error && (
        <div className="border border-rose-200 bg-rose-50 text-rose-900 rounded-md px-3 py-2 text-sm mt-2">
          {error}
        </div>
      )}
    </ModalTemplate>
  );
}
