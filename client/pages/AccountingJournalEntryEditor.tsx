import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";

interface CoAItem {
  id: number;
  name: string;
  account_type: string;
  active: boolean;
}

interface LineForm {
  accountId: string;
  debit: string;
  credit: string;
  memo: string;
}

const EMPTY_LINE: LineForm = { accountId: "", debit: "", credit: "", memo: "" };

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function dollarsToCents(s: string): number {
  if (!s) return 0;
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export default function AccountingJournalEntryEditor() {
  const navigate = useNavigate();
  const [coa, setCoa] = useState<CoAItem[]>([]);
  const [txnDate, setTxnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<LineForm[]>([
    { ...EMPTY_LINE },
    { ...EMPTY_LINE },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    accountingAPI
      .getCachedChartOfAccounts()
      .then((data: { accounts?: CoAItem[] }) => setCoa(data?.accounts ?? []))
      .catch(() => {});
  }, []);

  function setLine(idx: number, patch: Partial<LineForm>) {
    setLines((curr) => curr.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((curr) => [...curr, { ...EMPTY_LINE }]);
  }

  function removeLine(idx: number) {
    if (lines.length <= 2) return;
    setLines((curr) => curr.filter((_, i) => i !== idx));
  }

  const totalDebit = lines.reduce((s, l) => s + dollarsToCents(l.debit), 0);
  const totalCredit = lines.reduce((s, l) => s + dollarsToCents(l.credit), 0);
  const balanced = totalDebit > 0 && totalDebit === totalCredit;

  async function save(post: boolean) {
    if (!balanced) {
      toast.error("Debits must equal credits and be > 0");
      return;
    }
    const payload = {
      txn_date: txnDate,
      memo,
      lines: lines.map((l) => ({
        account_id: Number(l.accountId),
        debit_cents: dollarsToCents(l.debit),
        credit_cents: dollarsToCents(l.credit),
        memo: l.memo,
      })),
    };
    if (payload.lines.some((l) => !l.account_id)) {
      toast.error("Each line must have an account");
      return;
    }
    setSaving(true);
    try {
      const created = await accountingAPI.createJournalEntry(payload);
      if (post) {
        const posted = await accountingAPI.postJournalEntry(created.id);
        const qboOK = !!posted?.qbo_journal_entry_id;
        const buildiumOK = !!posted?.buildium_journal_entry_id;
        toast.success(
          `Posted #${posted.id} · QBO ${qboOK ? "✓" : "✗"} · Buildium ${buildiumOK ? "✓" : "✗"}`,
        );
        navigate(`/accounting/journal-entries/${created.id}`);
      } else {
        toast.success("Draft saved");
        navigate(`/accounting/journal-entries/${created.id}`);
      }
    } catch (e: any) {
      toast.error("Save failed: " + (e?.message ?? "unknown"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageTemplate>
      <div className="text-sm text-gray-500 mb-2">
        <Link to="/accounting/journal-entries" className="hover:underline">
          ← All journal entries
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">New journal entry</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">Date</label>
          <input
            type="date"
            value={txnDate}
            onChange={(e) => setTxnDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-0.5">Memo</label>
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="border border-gray-200 rounded overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Account</th>
              <th className="px-3 py-2 text-right">Debit</th>
              <th className="px-3 py-2 text-right">Credit</th>
              <th className="px-3 py-2 text-left">Memo</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <select
                    value={l.accountId}
                    onChange={(e) => setLine(idx, { accountId: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="">Select…</option>
                    {coa.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={l.debit}
                    onChange={(e) =>
                      setLine(idx, {
                        debit: e.target.value,
                        credit: e.target.value ? "" : l.credit,
                      })
                    }
                    className="w-full text-right border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={l.credit}
                    onChange={(e) =>
                      setLine(idx, {
                        credit: e.target.value,
                        debit: e.target.value ? "" : l.debit,
                      })
                    }
                    className="w-full text-right border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={l.memo}
                    onChange={(e) => setLine(idx, { memo: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  {lines.length > 2 ? (
                    <button
                      onClick={() => removeLine(idx)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Remove
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 text-sm">
            <tr>
              <td className="px-3 py-2 font-medium">Totals</td>
              <td className="px-3 py-2 text-right font-medium">{formatCents(totalDebit)}</td>
              <td className="px-3 py-2 text-right font-medium">{formatCents(totalCredit)}</td>
              <td className="px-3 py-2 text-left">
                <span
                  className={`px-2 py-0.5 text-xs rounded border ${
                    balanced
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {balanced ? "✓ Balanced" : "Unbalanced"}
                </span>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={addLine}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
        >
          Add line
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => save(false)}
            disabled={saving || !balanced}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving || !balanced}
            className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded disabled:opacity-50"
          >
            {saving ? "Saving…" : "Post"}
          </button>
        </div>
      </div>
    </PageTemplate>
  );
}
