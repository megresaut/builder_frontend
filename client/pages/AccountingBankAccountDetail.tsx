import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";

interface BankAccount {
  id: number;
  name: string;
  purpose: string;
  buildium_bank_account_id: string | null;
  current_balance_cents: number | null;
  buildium_balance_cents: number | null;
  buildium_balance_synced_at: string | null;
  holder_name: string | null;
  account_last4: string | null;
  is_active: boolean;
}

interface BuildiumCheckRow {
  id: number;
  buildium_check_id: number;
  payee_buildium_id: number | null;
  payee_type: string | null;
  check_number: string | null;
  entry_date: string;
  total_amount_cents: number;
  memo: string | null;
  lines: string;
  linked_bill_payment_id: number | null;
  synced_at: string;
}

interface BankTransaction {
  id: number;
  txn_date: string;
  amount_cents: number;
  kind: string;
  source: string;
  counterparty: string | null;
  memo: string | null;
  reference_number: string | null;
  cleared_at: string | null;
  reconciled_at: string | null;
  raw_payload?: string | null;
  linked_bill_payment_id: number | null;
  linked_invoice_payment_id: number | null;
}

const KINDS = [
  "",
  "deposit",
  "withdrawal",
  "check",
  "transfer",
  "fee",
  "interest",
  "adjustment",
  "other",
];

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function defaultDateRange(): { from: string; to: string } {
  const today = new Date();
  const from = new Date(today.getTime() - 90 * 86400000);
  return {
    from: from.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  };
}

export default function AccountingBankAccountDetail() {
  const { id } = useParams<{ id: string }>();
  const accountId = Number(id);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [txns, setTxns] = useState<BankTransaction[]>([]);
  const [checks, setChecks] = useState<BuildiumCheckRow[]>([]);
  const [tab, setTab] = useState<"transactions" | "checks">("transactions");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BankTransaction | null>(null);

  const range = useMemo(defaultDateRange, []);
  const [dateFrom, setDateFrom] = useState(range.from);
  const [dateTo, setDateTo] = useState(range.to);
  const [kind, setKind] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      accountingAPI.getBankAccount(accountId),
      accountingAPI.getBankTransactions(accountId, {
        date_from: dateFrom,
        date_to: dateTo,
        kind: kind || undefined,
      }),
      accountingAPI.getBankAccountChecks(accountId, {
        date_from: dateFrom,
        date_to: dateTo,
      }),
    ])
      .then(
        ([a, tx, ck]: [
          BankAccount,
          { transactions: BankTransaction[] },
          { checks: BuildiumCheckRow[] },
        ]) => {
          setAccount(a);
          setTxns(tx?.transactions ?? []);
          setChecks(ck?.checks ?? []);
        },
      )
      .catch((e: Error) => toast.error("Load failed: " + e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  if (!Number.isFinite(accountId) || accountId <= 0) {
    return (
      <PageTemplate>
        <div>Invalid bank account ID.</div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate>
      <div className="text-sm text-gray-500 mb-2">
        <Link to="/accounting/bank-accounts" className="hover:underline">
          ← All bank accounts
        </Link>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {account?.name ?? `Bank Account #${accountId}`}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {account?.holder_name ? `${account.holder_name} · ` : ""}
            {account?.account_last4 ? `••${account.account_last4} · ` : ""}
            {account?.purpose}
          </p>
          <div className="flex gap-4 mt-2 text-xs">
            {typeof account?.current_balance_cents === "number" ? (
              <span className="text-gray-700">
                <span className="text-gray-500">QBO:</span>{" "}
                <span className="font-semibold">
                  {formatCents(account.current_balance_cents)}
                </span>
              </span>
            ) : null}
            {typeof account?.buildium_balance_cents === "number" ? (
              <span className="text-gray-700">
                <span className="text-gray-500">Buildium:</span>{" "}
                <span className="font-semibold">
                  {formatCents(account.buildium_balance_cents)}
                </span>
                {account?.buildium_balance_synced_at ? (
                  <span className="text-gray-400 ml-1">
                    (synced{" "}
                    {new Date(
                      account.buildium_balance_synced_at,
                    ).toLocaleString()}
                    )
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/accounting/bank-accounts/${accountId}/reconcile`}
            className="px-3 py-2 text-sm bg-[#013764] text-white rounded hover:bg-[#003a73] transition-colors"
          >
            Reconcile
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {[
          { key: "transactions" as const, label: `Transactions (${txns.length})` },
          { key: "checks" as const, label: `Checks (${checks.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${
              tab === t.key
                ? "border-[#013764] text-[#013764] font-medium"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-3 items-end mb-4 flex-wrap bg-gray-50 p-3 rounded">
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">Kind</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k || "All"}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={load}
          className="px-3 py-1.5 text-sm bg-[#013764] text-white rounded hover:bg-[#003a73] transition-colors"
        >
          Apply
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : tab === "transactions" ? (
        txns.length === 0 ? (
          <div className="text-sm text-gray-500">
            No transactions in this range. Buildium data syncs automatically.
          </div>
        ) : (
          <div className="border border-gray-200 rounded overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Kind</th>
                  <th className="px-3 py-2 text-left">Counterparty</th>
                  <th className="px-3 py-2 text-left">Memo</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      {t.txn_date.slice(0, 10)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 text-xs bg-gray-100 rounded border border-gray-200">
                        {t.kind}
                      </span>
                    </td>
                    <td className="px-3 py-2">{t.counterparty ?? ""}</td>
                    <td className="px-3 py-2 truncate max-w-xs">{t.memo ?? ""}</td>
                    <td
                      className={`px-3 py-2 text-right ${
                        t.amount_cents < 0 ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {formatCents(t.amount_cents)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 text-xs rounded border bg-gray-50 border-gray-200 capitalize">
                        {t.source}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {t.reconciled_at
                        ? "Reconciled"
                        : t.cleared_at
                          ? "Cleared"
                          : "Open"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : checks.length === 0 ? (
        <div className="text-sm text-gray-500">
          No checks in this range. Buildium data syncs automatically.
        </div>
      ) : (
        <div className="border border-gray-200 rounded overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left">Entry date</th>
                <th className="px-3 py-2 text-left">Check #</th>
                <th className="px-3 py-2 text-left">Payee</th>
                <th className="px-3 py-2 text-left">Memo</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Linked bill payment</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {c.entry_date.slice(0, 10)}
                  </td>
                  <td className="px-3 py-2">{c.check_number ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {c.payee_type ?? ""}
                    {c.payee_buildium_id ? ` #${c.payee_buildium_id}` : ""}
                  </td>
                  <td className="px-3 py-2 truncate max-w-xs">{c.memo ?? ""}</td>
                  <td className="px-3 py-2 text-right">
                    {formatCents(c.total_amount_cents)}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {c.linked_bill_payment_id ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <SidePanel txn={selected} onClose={() => setSelected(null)} />
      ) : null}
    </PageTemplate>
  );
}

function SidePanel({
  txn,
  onClose,
}: {
  txn: BankTransaction;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg h-full p-6 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Transaction #{txn.id}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
            ×
          </button>
        </div>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between">
            <dt className="text-gray-500">Date</dt>
            <dd>{txn.txn_date.slice(0, 10)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Amount</dt>
            <dd>{formatCents(txn.amount_cents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Kind</dt>
            <dd>{txn.kind}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Source</dt>
            <dd>{txn.source}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Reference</dt>
            <dd>{txn.reference_number ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Memo</dt>
            <dd>{txn.memo ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Linked bill payment</dt>
            <dd>{txn.linked_bill_payment_id ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Linked invoice payment</dt>
            <dd>{txn.linked_invoice_payment_id ?? "—"}</dd>
          </div>
        </dl>
        {txn.raw_payload ? (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600">
              Raw payload
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto whitespace-pre-wrap">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(txn.raw_payload!), null, 2);
                } catch {
                  return txn.raw_payload;
                }
              })()}
            </pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}
