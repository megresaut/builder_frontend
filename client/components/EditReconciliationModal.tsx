import { useEffect, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import {
  updateReconciliation,
  type Reconciliation,
  type UpdateReconciliationRequest,
} from "@/data/credit-card-reconciliation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reconciliation: Reconciliation | null;
  // Called with the updated reconciliation on success so callers can refresh
  // their workspace view immediately rather than waiting for the next pull.
  onSaved: (rec: Reconciliation) => void;
}

// dollarsToCents accepts "$1,234.56" / "1234.56" / "-50.00" / "(50.00)" and
// returns integer cents. NaN on unparseable input — caller surfaces an error.
function dollarsToCents(input: string): number {
  const s = input.trim();
  if (s === "") return NaN;
  let neg = false;
  let body = s;
  if (body.startsWith("(") && body.endsWith(")")) {
    neg = true;
    body = body.slice(1, -1);
  }
  body = body.replace(/[$,\s]/g, "");
  if (body.startsWith("-")) {
    neg = true;
    body = body.slice(1);
  } else if (body.startsWith("+")) {
    body = body.slice(1);
  }
  const f = Number.parseFloat(body);
  if (!Number.isFinite(f)) return NaN;
  const cents = Math.round(f * 100);
  return neg ? -cents : cents;
}

function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function EditReconciliationModal({
  open,
  onOpenChange,
  reconciliation,
  onSaved,
}: Props) {
  // Form state seeded from the existing rec each time the modal opens.
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [statementDate, setStatementDate] = useState("");
  const [beginning, setBeginning] = useState("");
  const [ending, setEnding] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !reconciliation) return;
    setPeriodStart(reconciliation.period_start);
    setPeriodEnd(reconciliation.period_end);
    setStatementDate(reconciliation.statement_date ?? "");
    setBeginning(centsToDollars(reconciliation.beginning_balance_cents));
    setEnding(centsToDollars(reconciliation.ending_balance_cents));
    setError(null);
  }, [open, reconciliation]);

  const handleSubmit = async () => {
    if (!reconciliation) return;
    if (periodEnd < periodStart) {
      setError("Period end must be on or after period start");
      return;
    }
    const beginningCents = dollarsToCents(beginning);
    const endingCents = dollarsToCents(ending);
    if (!Number.isFinite(beginningCents)) {
      setError("Beginning balance is not a valid number");
      return;
    }
    if (!Number.isFinite(endingCents)) {
      setError("Ending balance is not a valid number");
      return;
    }
    // Build a sparse patch — only include fields the user actually changed.
    // This keeps the wire format honest and aligns with the COALESCE-driven
    // backend (nil = don't touch).
    const patch: UpdateReconciliationRequest = {};
    if (periodStart !== reconciliation.period_start) {
      patch.period_start = periodStart;
    }
    if (periodEnd !== reconciliation.period_end) {
      patch.period_end = periodEnd;
    }
    const trimmedStmt = statementDate.trim();
    const existingStmt = reconciliation.statement_date ?? "";
    if (trimmedStmt !== "" && trimmedStmt !== existingStmt) {
      patch.statement_date = trimmedStmt;
    }
    if (beginningCents !== reconciliation.beginning_balance_cents) {
      patch.beginning_balance_cents = beginningCents;
    }
    if (endingCents !== reconciliation.ending_balance_cents) {
      patch.ending_balance_cents = endingCents;
    }
    if (Object.keys(patch).length === 0) {
      // Nothing changed — close without an API roundtrip.
      onOpenChange(false);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateReconciliation(reconciliation.id, patch);
      onSaved(updated);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Edit reconciliation period"
      size="sm"
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
      <div className="text-sm text-[#717179] mb-4">
        Adjust the statement period or balances. Existing matched lines are
        kept; any whose dates fall outside the new range will show up as drift
        when the workspace next pulls QBO activity.
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Period start" htmlFor="edit-rec-period-start">
          <Input
            id="edit-rec-period-start"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Period end" htmlFor="edit-rec-period-end">
          <Input
            id="edit-rec-period-end"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Statement date" htmlFor="edit-rec-statement-date">
          <Input
            id="edit-rec-statement-date"
            type="date"
            value={statementDate}
            onChange={(e) => setStatementDate(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Beginning balance (USD)" htmlFor="edit-rec-beginning">
          <Input
            id="edit-rec-beginning"
            type="text"
            inputMode="decimal"
            value={beginning}
            onChange={(e) => setBeginning(e.target.value)}
            placeholder="0.00"
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Ending balance (USD)" htmlFor="edit-rec-ending">
          <Input
            id="edit-rec-ending"
            type="text"
            inputMode="decimal"
            value={ending}
            onChange={(e) => setEnding(e.target.value)}
            placeholder="0.00"
            disabled={submitting}
          />
        </FieldShell>
      </div>

      {error && (
        <div className="border border-rose-200 bg-rose-50 text-rose-900 rounded-md px-3 py-2 text-sm mt-2">
          {error}
        </div>
      )}
    </ModalTemplate>
  );
}
