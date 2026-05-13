import { useEffect, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import {
  startReconciliation,
  type CreditCardAccount,
  type Reconciliation,
} from "@/data/credit-card-reconciliation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: CreditCardAccount | null;
  defaultBeginningBalanceCents: number;
  // Defaults pulled in from the main page's date pickers so the user doesn't
  // have to re-enter the same range. Both still editable in the modal.
  defaultPeriodStart?: string;
  defaultPeriodEnd?: string;
  onCreated: (rec: Reconciliation) => void;
}

function todayYMD(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    .toISOString()
    .slice(0, 10);
}

function firstOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

// Parses "$1,234.56" / "1234.56" / "-50.00" / "(50.00)" to integer cents.
// Returns NaN on unparseable input — caller surfaces an error.
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

export default function StartReconciliationModal({
  open,
  onOpenChange,
  account,
  defaultBeginningBalanceCents,
  defaultPeriodStart,
  defaultPeriodEnd,
  onCreated,
}: Props) {
  const [periodStart, setPeriodStart] = useState(
    defaultPeriodStart || firstOfMonth(),
  );
  const [periodEnd, setPeriodEnd] = useState(defaultPeriodEnd || todayYMD());
  const [statementDate, setStatementDate] = useState(
    defaultPeriodEnd || todayYMD(),
  );
  const [beginning, setBeginning] = useState(
    centsToDollars(defaultBeginningBalanceCents),
  );
  const [ending, setEnding] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when reopened — pick up whatever the main page is currently
  // showing as the date range, plus any previous-rec balance default.
  useEffect(() => {
    if (open) {
      setPeriodStart(defaultPeriodStart || firstOfMonth());
      setPeriodEnd(defaultPeriodEnd || todayYMD());
      setStatementDate(defaultPeriodEnd || todayYMD());
      setBeginning(centsToDollars(defaultBeginningBalanceCents));
      setEnding("");
      setError(null);
    }
  }, [open, defaultBeginningBalanceCents, defaultPeriodStart, defaultPeriodEnd]);

  const handleSubmit = async () => {
    if (!account) return;
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
    if (periodEnd < periodStart) {
      setError("Period end must be on or after period start");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const rec = await startReconciliation(account.id, {
        period_start: periodStart,
        period_end: periodEnd,
        statement_date: statementDate || undefined,
        beginning_balance_cents: beginningCents,
        ending_balance_cents: endingCents,
      });
      onCreated(rec);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start reconciliation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={`Start reconciliation${account ? ` — ${account.qbo_name}` : ""}`}
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitting ? "Starting…" : "Start"}
          cancelDisabled={submitting}
        />
      }
    >
      <div className="text-sm text-[#717179] mb-4">
        Begin a new reconciliation for this account. Enter the statement period
        and the beginning/ending balances printed on your statement.
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Period start" htmlFor="rec-period-start">
          <Input
            id="rec-period-start"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Period end" htmlFor="rec-period-end">
          <Input
            id="rec-period-end"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Statement date" htmlFor="rec-statement-date">
          <Input
            id="rec-statement-date"
            type="date"
            value={statementDate}
            onChange={(e) => setStatementDate(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Beginning balance (USD)" htmlFor="rec-beginning">
          <Input
            id="rec-beginning"
            type="text"
            inputMode="decimal"
            value={beginning}
            onChange={(e) => setBeginning(e.target.value)}
            placeholder="0.00"
            disabled={submitting}
          />
          <div className="text-xs text-[#717179] mt-1">
            The "Previous balance" printed on the statement. Leave 0 if you're
            testing — Finalize isn't enforcing the math yet.
          </div>
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Ending balance (USD)" htmlFor="rec-ending">
          <Input
            id="rec-ending"
            type="text"
            inputMode="decimal"
            value={ending}
            onChange={(e) => setEnding(e.target.value)}
            placeholder="0.00"
            disabled={submitting}
          />
          <div className="text-xs text-[#717179] mt-1">
            The "New balance" / total at the end of the statement period.
          </div>
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
