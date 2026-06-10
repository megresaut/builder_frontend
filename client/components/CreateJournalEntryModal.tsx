import { useEffect, useId, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/SearchableSelect";
import { createJournalEntry, type LiveAccount, type LiveCustomer } from "@/data/qboReports";

interface JELineState {
  key: string;
  accountId: string;
  description: string;
  debit: string;
  credit: string;
  customerId: string;
}

function blankLine(key: string): JELineState {
  return { key, accountId: "", description: "", debit: "", credit: "", customerId: "" };
}

function parseAmt(s: string): number {
  const n = parseFloat(s.replace(/,/g, ""));
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

function fmtTotal(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  open: boolean;
  accounts: LiveAccount[];
  customers: LiveCustomer[];
  onClose: () => void;
  onCreated: () => void;
}

export function CreateJournalEntryModal({ open, accounts, customers, onClose, onCreated }: Props) {
  const uid = useId();
  const [txnDate, setTxnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [docNumber, setDocNumber] = useState("");
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<JELineState[]>(() => [blankLine("a"), blankLine("b")]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const counter = useRef(2);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setTxnDate(new Date().toISOString().slice(0, 10));
      setDocNumber("");
      setMemo("");
      setLines([blankLine("a"), blankLine("b")]);
      setError(null);
      counter.current = 2;
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const addLine = () => {
    counter.current++;
    setLines((prev) => [...prev, blankLine(String(counter.current))]);
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const updateLine = (key: string, field: keyof JELineState, value: string) => {
    setLines((prev) => prev.map((l) => {
      if (l.key !== key) return l;
      const updated = { ...l, [field]: value };
      // clear the other side when a side is entered
      if (field === "debit" && value) updated.credit = "";
      if (field === "credit" && value) updated.debit = "";
      return updated;
    }));
  };

  const totalDebit  = lines.reduce((s, l) => s + parseAmt(l.debit),  0);
  const totalCredit = lines.reduce((s, l) => s + parseAmt(l.credit), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const balanced = diff < 0.005 && totalDebit > 0;
  const canSubmit = balanced && lines.length >= 2 && lines.every((l) => l.accountId);

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));
  const customerOptions = customers.map((c) => ({ value: c.id, label: c.display_name }));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await createJournalEntry({
        txn_date: txnDate,
        doc_number: docNumber || undefined,
        memo: memo || undefined,
        lines: lines.map((l) => ({
          account_id: l.accountId,
          description: l.description,
          debit: parseAmt(l.debit),
          credit: parseAmt(l.credit),
          customer_id: l.customerId,
        })),
      });
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create journal entry");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* ── header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
          <div>
            <h2 className="text-base font-semibold text-[#111827]">New Journal Entry</h2>
            <p className="text-xs text-[#717179] mt-0.5">Posted directly to QuickBooks Online</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#717179] hover:text-[#303030] p-1 rounded-md hover:bg-[#F5F5F5]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* top fields */}
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor={`${uid}-date`} className="text-[10px] font-semibold uppercase tracking-widest text-[#717179]">Date *</label>
              <input
                id={`${uid}-date`}
                type="date"
                value={txnDate}
                onChange={(e) => setTxnDate(e.target.value)}
                className="border border-[#E5E5E5] rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={`${uid}-ref`} className="text-[10px] font-semibold uppercase tracking-widest text-[#717179]">Reference #</label>
              <input
                id={`${uid}-ref`}
                type="text"
                placeholder="JE-001"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="border border-[#E5E5E5] rounded-md px-2.5 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764]"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label htmlFor={`${uid}-memo`} className="text-[10px] font-semibold uppercase tracking-widest text-[#717179]">Memo</label>
              <input
                id={`${uid}-memo`}
                type="text"
                placeholder="Optional memo / private note"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="border border-[#E5E5E5] rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764]"
              />
            </div>
          </div>

          {/* line items table */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#717179] mb-2">Lines</div>
            <div className="border border-[#E5E5E5] rounded-lg overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-[#F8F9FB] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[#6B7280] w-[220px]">Account *</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Description</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[#6B7280] w-[180px]">Customer / Property</th>
                    <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[#6B7280] w-[110px]">Debit</th>
                    <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[#6B7280] w-[110px]">Credit</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={line.key} className={cn("border-t border-[#F3F4F6]", i % 2 === 1 && "bg-[#FAFAFA]")}>
                      <td className="px-2 py-1.5">
                        <SearchableSelect
                          value={line.accountId}
                          onChange={(v) => updateLine(line.key, "accountId", v)}
                          options={accountOptions}
                          allLabel="Select account…"
                          popoverWidth={300}
                          className="w-full text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => updateLine(line.key, "description", e.target.value)}
                          placeholder="Description"
                          className="w-full border border-[#E5E5E5] rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#013764]/30 focus:border-[#013764]"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <SearchableSelect
                          value={line.customerId}
                          onChange={(v) => updateLine(line.key, "customerId", v)}
                          options={customerOptions}
                          allLabel="None"
                          popoverWidth={300}
                          className="w-full text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.debit}
                          onChange={(e) => updateLine(line.key, "debit", e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-[#E5E5E5] rounded px-2 py-1 text-xs text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[#013764]/30 focus:border-[#013764]"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.credit}
                          onChange={(e) => updateLine(line.key, "credit", e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-[#E5E5E5] rounded px-2 py-1 text-xs text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[#013764]/30 focus:border-[#013764]"
                        />
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        {lines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeLine(line.key)}
                            className="text-[#9CA3AF] hover:text-rose-500 p-0.5 rounded"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* totals row */}
                <tfoot className="border-t-2 border-[#E5E5E5] bg-[#F8F9FB]">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                      Total
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-[#111827]">
                      {fmtTotal(totalDebit)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-[#111827]">
                      {fmtTotal(totalCredit)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <button
              type="button"
              onClick={addLine}
              className="mt-2 flex items-center gap-1.5 text-xs text-[#013764] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add line
            </button>
          </div>

          {/* balance status */}
          <div className={cn(
            "flex items-center gap-2 text-sm px-3 py-2 rounded-md border",
            balanced
              ? "bg-green-50 border-green-200 text-green-700"
              : totalDebit === 0 && totalCredit === 0
                ? "bg-[#F8F9FB] border-[#E5E5E5] text-[#717179]"
                : "bg-amber-50 border-amber-200 text-amber-700",
          )}>
            {balanced
              ? "✓ Balanced"
              : totalDebit === 0 && totalCredit === 0
                ? "Enter amounts above"
                : `Out of balance by $${fmtTotal(diff)}`}
          </div>

          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* ── footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E5E5]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#303030] border border-[#E5E5E5] rounded-md hover:bg-[#F5F5F5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || submitting}
            className={cn(
              "px-5 py-2 text-sm font-semibold rounded-md transition-colors",
              canSubmit && !submitting
                ? "bg-[#013764] text-white hover:bg-[#012a4d]"
                : "bg-[#013764]/40 text-white cursor-not-allowed",
            )}
          >
            {submitting ? "Posting to QBO…" : "Post Journal Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
