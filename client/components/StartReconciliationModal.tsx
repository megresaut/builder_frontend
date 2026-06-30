import { useCallback, useEffect, useRef, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import {
  startReconciliation,
  uploadStatement,
  type CreditCardAccount,
  type Reconciliation,
} from "@/data/credit-card-reconciliation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: CreditCardAccount | null;
  defaultBeginningBalanceCents: number;
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
  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingStatement, setUploadingStatement] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPeriodStart(defaultPeriodStart || firstOfMonth());
      setPeriodEnd(defaultPeriodEnd || todayYMD());
      setStatementDate(defaultPeriodEnd || todayYMD());
      setBeginning(centsToDollars(defaultBeginningBalanceCents));
      setEnding("");
      setStatementFile(null);
      setDragOver(false);
      setError(null);
    }
  }, [open, defaultBeginningBalanceCents, defaultPeriodStart, defaultPeriodEnd]);

  const acceptFile = useCallback((file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      setError("Statement must be a .csv or .xlsx file");
      return;
    }
    setStatementFile(file);
    setError(null);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) acceptFile(file);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
    e.target.value = "";
  };

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

      // If a statement was attached, upload it before handing off to the
      // workspace so suggestions are already populated on first load.
      if (statementFile) {
        setUploadingStatement(true);
        try {
          await uploadStatement(rec.id, statementFile);
        } catch {
          // Non-fatal — user can re-upload on the workspace page.
        }
        setUploadingStatement(false);
      }

      onCreated(rec);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start reconciliation");
    } finally {
      setSubmitting(false);
      setUploadingStatement(false);
    }
  };

  const submitLabel = uploadingStatement
    ? "Uploading statement…"
    : submitting
      ? "Starting…"
      : "Start";

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
          confirmLabel={submitLabel}
          cancelDisabled={submitting || uploadingStatement}
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
            The "Previous balance" printed on the statement.
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
            The "New balance" at the end of the statement period.
          </div>
        </FieldShell>
      </div>

      {/* Statement upload — drag-and-drop or click */}
      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Statement (optional)" htmlFor="rec-statement-file">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !submitting && fileInputRef.current?.click()}
            className={[
              "relative flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed px-4 py-5 text-center cursor-pointer transition-colors",
              dragOver
                ? "border-sky-400 bg-sky-50"
                : statementFile
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-[#D5D5D5] bg-[#FAFAFA] hover:bg-[#F5F5F5]",
              submitting ? "pointer-events-none opacity-60" : "",
            ].join(" ")}
          >
            <input
              ref={fileInputRef}
              id="rec-statement-file"
              type="file"
              accept=".csv,.xlsx,.xls"
              className="sr-only"
              onChange={handleFileChange}
              disabled={submitting}
            />
            {statementFile ? (
              <>
                <div className="text-sm font-medium text-emerald-700">
                  {statementFile.name}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatementFile(null);
                  }}
                  className="text-xs text-[#717179] hover:text-rose-600"
                >
                  Remove
                </button>
              </>
            ) : (
              <>
                <div className="text-sm text-[#717179]">
                  {dragOver ? "Drop to attach" : "Drop statement here or click to browse"}
                </div>
                <div className="text-xs text-[#A1A1A1]">CSV or XLSX</div>
              </>
            )}
          </div>
          <div className="text-xs text-[#717179] mt-1">
            Uploaded now so suggestions are ready when the workspace opens.
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
