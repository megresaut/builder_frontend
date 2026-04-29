import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";

interface Session {
  id: number;
  account_kind: string;
  account_id: number;
  period_start: string;
  period_end: string;
  statement_balance_cents: number;
  cleared_total_cents: number;
  status: string;
}

interface Suggestion {
  bank_txn_id: number;
  bank_txn_amount: number;
  bank_txn_date: string;
  bill_payment_id: number | null;
  invoice_payment_id: number | null;
  candidate_amount: number;
  candidate_date: string;
  candidate_memo: string | null;
  confidence: string;
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function defaultPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function AccountingBankReconcile() {
  const { id } = useParams<{ id: string }>();
  const accountId = Number(id);
  const [session, setSession] = useState<Session | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  // Open form state
  const period = defaultPeriod();
  const [periodStart, setPeriodStart] = useState(period.start);
  const [periodEnd, setPeriodEnd] = useState(period.end);
  const [statementBalance, setStatementBalance] = useState("");

  async function openSession() {
    if (!statementBalance) {
      toast.error("Statement balance required");
      return;
    }
    setCreating(true);
    try {
      const res: Session = await accountingAPI.openReconciliationSession({
        account_kind: "bank",
        account_id: accountId,
        period_start: periodStart,
        period_end: periodEnd,
        statement_balance_cents: Math.round(Number(statementBalance) * 100),
      });
      setSession(res);
      await loadSuggestions(res.id);
    } catch (e: any) {
      toast.error("Open failed: " + (e?.message ?? "unknown"));
    } finally {
      setCreating(false);
    }
  }

  async function loadSuggestions(sessionId: number) {
    try {
      const res = await accountingAPI.getReconciliationSuggestions(sessionId);
      setSuggestions(res?.suggestions ?? []);
    } catch (e: any) {
      toast.error("Suggestions failed: " + (e?.message ?? "unknown"));
    }
  }

  async function autoMatchHigh() {
    if (!session) return;
    setBusy(true);
    try {
      const high = suggestions.filter((s) => s.confidence === "high");
      const matches = high.map((s) => ({
        bank_txn_id: s.bank_txn_id,
        bill_payment_id: s.bill_payment_id ?? undefined,
        invoice_payment_id: s.invoice_payment_id ?? undefined,
      }));
      if (matches.length === 0) {
        toast.info("No high-confidence matches");
        return;
      }
      const updated: Session = await accountingAPI.confirmReconciliationMatches(
        session.id,
        matches,
      );
      setSession(updated);
      toast.success(`Matched ${matches.length} transactions`);
      await loadSuggestions(session.id);
    } catch (e: any) {
      toast.error("Match failed: " + (e?.message ?? "unknown"));
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    if (!session) return;
    setBusy(true);
    try {
      const updated: Session = await accountingAPI.finalizeReconciliationSession(session.id);
      setSession(updated);
      toast.success("Session finalized");
    } catch (e: any) {
      toast.error("Finalize failed: " + (e?.message ?? "unknown"));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // No auto-load: a bank account doesn't yet have a "current open session" lookup.
  }, [accountId]);

  if (!Number.isFinite(accountId)) {
    return (
      <PageTemplate>
        <div>Invalid bank account ID.</div>
      </PageTemplate>
    );
  }

  const balanced = session
    ? session.cleared_total_cents === session.statement_balance_cents
    : false;

  return (
    <PageTemplate>
      <div className="text-sm text-gray-500 mb-2">
        <Link to={`/accounting/bank-accounts/${accountId}`} className="hover:underline">
          ← Bank account
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Reconcile Bank Account</h1>

      {!session ? (
        <div className="bg-gray-50 rounded p-4 max-w-lg">
          <h2 className="text-base font-medium mb-3">Open a new session</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">Period start</label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">Period end</label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Statement balance ($)</label>
              <input
                type="number"
                step="0.01"
                value={statementBalance}
                onChange={(e) => setStatementBalance(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              />
            </div>
            <button
              disabled={creating}
              onClick={openSession}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded disabled:opacity-50"
            >
              {creating ? "Opening…" : "Open session"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-white border border-gray-200 rounded p-3">
              <div className="text-xs text-gray-500">Period</div>
              <div className="text-sm font-medium">
                {session.period_start.slice(0, 10)} → {session.period_end.slice(0, 10)}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-3">
              <div className="text-xs text-gray-500">Statement balance</div>
              <div className="text-sm font-medium">
                {formatCents(session.statement_balance_cents)}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-3">
              <div className="text-xs text-gray-500">Cleared total</div>
              <div className="text-sm font-medium">
                {formatCents(session.cleared_total_cents)}{" "}
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded border ${
                    balanced
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {balanced ? "✓ matches" : "off"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={autoMatchHigh}
              disabled={busy}
              className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Auto-match high confidence
            </button>
            <button
              onClick={finalize}
              disabled={busy || !balanced || session.status !== "open"}
              className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded disabled:opacity-50"
            >
              Finalize
            </button>
          </div>

          <h2 className="text-base font-medium mb-2">Suggested matches</h2>
          {suggestions.length === 0 ? (
            <div className="text-sm text-gray-500">
              No suggestions. Sync transactions on the bank account first if empty.
            </div>
          ) : (
            <div className="border border-gray-200 rounded overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Bank txn</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-left">Candidate</th>
                    <th className="px-3 py-2 text-right">Cand amount</th>
                    <th className="px-3 py-2 text-left">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((s, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        #{s.bank_txn_id} · {s.bank_txn_date}
                      </td>
                      <td className="px-3 py-2 text-right">{formatCents(s.bank_txn_amount)}</td>
                      <td className="px-3 py-2">
                        {s.bill_payment_id
                          ? `Bill payment #${s.bill_payment_id}`
                          : s.invoice_payment_id
                            ? `Invoice payment #${s.invoice_payment_id}`
                            : "—"}{" "}
                        · {s.candidate_date}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCents(s.candidate_amount)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 text-xs rounded border ${
                            s.confidence === "high"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : s.confidence === "medium"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {s.confidence}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </PageTemplate>
  );
}
