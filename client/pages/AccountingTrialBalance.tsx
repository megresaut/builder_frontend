import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";

interface TBRow {
  account_id: number | null;
  account_name: string;
  classification: string;
  debit_cents: number;
  credit_cents: number;
  net_cents: number;
}

interface TBData {
  as_of: string;
  rows: TBRow[];
  total_debit_cents: number;
  total_credit_cents: number;
  balanced_within_cents: number;
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const CLASSIFICATIONS = ["Asset", "Liability", "Equity", "Revenue", "Expense", "Other"];

export default function AccountingTrialBalance() {
  const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<TBData | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    accountingAPI
      .getTrialBalance(asOf)
      .then((d: TBData) => setData(d))
      .catch((e: Error) => toast.error("Load failed: " + e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const out: Record<string, TBRow[]> = {};
    for (const r of data?.rows ?? []) {
      const key = CLASSIFICATIONS.includes(r.classification) ? r.classification : "Other";
      out[key] = out[key] || [];
      out[key].push(r);
    }
    return out;
  }, [data]);

  const balancedCents = data?.balanced_within_cents ?? 0;
  const balanced = Math.abs(balancedCents) <= 1;

  return (
    <PageTemplate>
      <div className="text-sm text-gray-500 mb-2">
        <Link to="/accounting/general-ledger" className="hover:underline">
          ← General Ledger
        </Link>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Trial Balance</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
          <button
            onClick={load}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Apply
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {CLASSIFICATIONS.map((cls) => {
            const rows = grouped[cls] ?? [];
            if (rows.length === 0) return null;
            return (
              <div key={cls} className="border border-gray-200 rounded bg-white">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                  {cls}
                </div>
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500">
                    <tr>
                      <th className="px-3 py-1 text-left">Account</th>
                      <th className="px-3 py-1 text-right">Debit</th>
                      <th className="px-3 py-1 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-1 truncate max-w-xs">{r.account_name}</td>
                        <td className="px-3 py-1 text-right">
                          {r.debit_cents ? formatCents(r.debit_cents) : "—"}
                        </td>
                        <td className="px-3 py-1 text-right">
                          {r.credit_cents ? formatCents(r.credit_cents) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {data ? (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded p-4 max-w-md">
          <dl className="text-sm space-y-1">
            <div className="flex justify-between">
              <dt className="text-gray-500">Total debits</dt>
              <dd>{formatCents(data.total_debit_cents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Total credits</dt>
              <dd>{formatCents(data.total_credit_cents)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <dt className="font-medium text-gray-700">Balance status</dt>
              <dd>
                <span
                  className={`px-2 py-0.5 text-xs rounded border ${
                    balanced
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {balanced
                    ? "✓ Balanced"
                    : `Off by ${formatCents(Math.abs(balancedCents))}`}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </PageTemplate>
  );
}
