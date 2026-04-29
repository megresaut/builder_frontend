import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";

interface GLEntry {
  id: number;
  source: string;
  source_id: string;
  txn_date: string;
  txn_type: string | null;
  account_id: number | null;
  account_name: string | null;
  debit_cents: number;
  credit_cents: number;
  memo: string | null;
  property_id: number | null;
  vendor_id: number | null;
  doc_number: string | null;
  raw_payload: string | null;
}

interface CoAItem {
  id: number;
  name: string;
  account_type: string;
  active: boolean;
}

function formatCents(cents: number): string {
  if (!cents) return "—";
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatSignedCents(cents: number): string {
  if (cents === 0) return "$0.00";
  const abs = Math.abs(cents) / 100;
  const formatted = abs.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  return cents < 0 ? `(${formatted})` : formatted;
}

function defaultRange() {
  const today = new Date();
  const from = new Date(today.getTime() - 30 * 86400000);
  return {
    from: from.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  };
}

// Account types that increase with debits ("debit-natural"). For these we
// compute running balance as cumulative (debit - credit). For credit-natural
// accounts (liabilities, equity, income) we flip the sign so the displayed
// balance is positive when the account is in its expected direction.
const DEBIT_NATURAL = new Set(["Asset", "Expense", "expense", "asset"]);

// Typed shape for whatever Buildium puts in raw_payload (subset we render).
type RawPayload = {
  Id?: number | string;
  Description?: string;
  TransactionType?: string;
  AccountingEntity?: {
    Id?: number | string;
    AccountingEntityType?: string;
    Unit?: { Id?: number | string };
  };
  // Some payloads include these on certain transaction types; render if present.
  CheckNumber?: string;
  ReferenceNumber?: string;
  Memo?: string;
};

function parseRaw(raw: string | null): RawPayload | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RawPayload;
  } catch {
    return null;
  }
}

function entityLabel(raw: RawPayload | null): string {
  const ae = raw?.AccountingEntity;
  if (!ae) return "—";
  const type = ae.AccountingEntityType ?? "Entity";
  const id = ae.Id ?? "?";
  const unit = ae.Unit?.Id ? ` · Unit ${ae.Unit.Id}` : "";
  return `${type} #${id}${unit}`;
}

const TYPE_CHIP_STYLES: Record<string, string> = {
  Charge: "bg-blue-50 text-blue-700 border-blue-200",
  Payment: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Check: "bg-amber-50 text-amber-700 border-amber-200",
  Deposit: "bg-violet-50 text-violet-700 border-violet-200",
  Bill: "bg-rose-50 text-rose-700 border-rose-200",
  JournalEntry: "bg-gray-100 text-gray-700 border-gray-200",
};

function TypeChip({ type }: { type: string | null }) {
  if (!type) return <span className="text-gray-400">—</span>;
  const cls = TYPE_CHIP_STYLES[type] ?? "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${cls}`}
    >
      {type}
    </span>
  );
}

// AccountGroup is the per-account block we render: heading, ordered entries
// with running balance, and a footer total.
type AccountGroup = {
  accountName: string;
  accountType: string | null;
  isDebitNatural: boolean;
  entries: Array<GLEntry & { runningBalanceCents: number }>;
  totalDebitCents: number;
  totalCreditCents: number;
  netChangeCents: number; // signed by account direction
};

function buildGroups(items: GLEntry[], coa: CoAItem[]): AccountGroup[] {
  const accountTypeById = new Map<number, string>();
  coa.forEach((a) => accountTypeById.set(a.id, a.account_type));

  const byAccount = new Map<string, GLEntry[]>();
  for (const e of items) {
    const key = e.account_name ?? "(Unassigned)";
    const list = byAccount.get(key);
    if (list) list.push(e);
    else byAccount.set(key, [e]);
  }

  const groups: AccountGroup[] = [];
  for (const [accountName, entries] of byAccount.entries()) {
    // Sort within each group: oldest → newest, so running balance accumulates
    // forward in time (matches Buildium's ledger format).
    const sorted = [...entries].sort((a, b) => {
      const cmp = a.txn_date.localeCompare(b.txn_date);
      if (cmp !== 0) return cmp;
      return a.id - b.id;
    });

    const accountType = sorted[0]?.account_id != null
      ? accountTypeById.get(sorted[0].account_id) ?? null
      : null;
    const isDebitNatural = accountType
      ? DEBIT_NATURAL.has(accountType)
      : true; // default to debit-natural if unknown

    let running = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    const withRunning: AccountGroup["entries"] = [];
    for (const e of sorted) {
      // Net effect on this account in cents, signed by account direction.
      const delta = isDebitNatural
        ? e.debit_cents - e.credit_cents
        : e.credit_cents - e.debit_cents;
      running += delta;
      totalDebit += e.debit_cents;
      totalCredit += e.credit_cents;
      withRunning.push({ ...e, runningBalanceCents: running });
    }

    groups.push({
      accountName,
      accountType,
      isDebitNatural,
      entries: withRunning,
      totalDebitCents: totalDebit,
      totalCreditCents: totalCredit,
      netChangeCents: isDebitNatural
        ? totalDebit - totalCredit
        : totalCredit - totalDebit,
    });
  }

  // Sort groups alphabetically by account name for stable display.
  groups.sort((a, b) => a.accountName.localeCompare(b.accountName));
  return groups;
}

export default function AccountingGeneralLedger() {
  const range = useMemo(defaultRange, []);
  const [dateFrom, setDateFrom] = useState(range.from);
  const [dateTo, setDateTo] = useState(range.to);
  const [accountId, setAccountId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);

  const [coa, setCoa] = useState<CoAItem[]>([]);
  const [items, setItems] = useState<GLEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<GLEntry | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    accountingAPI
      .getCachedChartOfAccounts()
      .then((data: { accounts?: CoAItem[] }) => setCoa(data?.accounts ?? []))
      .catch(() => {});
  }, []);

  function load() {
    setLoading(true);
    accountingAPI
      .listGL({
        date_from: dateFrom,
        date_to: dateTo,
        account_id: accountId ? Number(accountId) : undefined,
        source: source || undefined,
        search: search || undefined,
        page,
        page_size: pageSize,
      })
      .then((data: { items: GLEntry[]; total: number }) => {
        setItems(data?.items ?? []);
        setTotal(data?.total ?? 0);
      })
      .catch((e: Error) => toast.error("Load failed: " + e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await accountingAPI.refreshGL(dateFrom, dateTo);
      toast.success(
        `Refreshed · ${res?.items_in ?? 0} pulled, ${res?.items_out ?? 0} stored`,
      );
      load();
    } catch (e: any) {
      toast.error("Refresh failed: " + (e?.message ?? "unknown"));
    } finally {
      setRefreshing(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const groups = useMemo(() => buildGroups(items, coa), [items, coa]);

  const toggleGroup = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Reset showRaw whenever the selected entry changes so the JSON section
  // doesn't stay open across opens.
  useEffect(() => {
    setShowRaw(false);
  }, [selected?.id]);

  const selectedRaw = parseRaw(selected?.raw_payload ?? null);

  return (
    <PageTemplate>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">General Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">
            Read-only GL entries pulled from Buildium.{" "}
            <Link
              to="/accounting/general-ledger/trial-balance"
              className="text-blue-600 hover:underline"
            >
              View Trial Balance →
            </Link>
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="px-3 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh from Buildium"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-gray-50 p-3 rounded mb-4">
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {coa.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">All</option>
            <option value="buildium">Buildium</option>
            <option value="qbo">QBO</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="memo, account, doc#"
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="md:col-span-5 flex justify-end">
          <button
            onClick={() => {
              setPage(1);
              load();
            }}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Apply filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">
          No entries. Try refreshing from Buildium.
        </div>
      ) : (
        <>
          <div className="text-xs text-gray-500 mb-2">
            {items.length} of {total} entries · grouped into {groups.length}{" "}
            account{groups.length === 1 ? "" : "s"}
          </div>

          <div className="border border-gray-200 rounded overflow-hidden bg-white">
            {/* Column header — single header for the whole grouped view so
                the columns stay aligned across groups. */}
            <div className="grid grid-cols-[110px_120px_1fr_minmax(0,1.4fr)_110px_120px_120px] px-3 py-2 bg-gray-50 text-gray-600 text-xs uppercase font-medium border-b border-gray-200">
              <div>Date</div>
              <div>Type</div>
              <div>Property / Entity</div>
              <div>Description</div>
              <div>Doc #</div>
              <div className="text-right">Amount</div>
              <div className="text-right">Balance</div>
            </div>

            {groups.map((g) => {
              const isCollapsed = collapsed.has(g.accountName);
              return (
                <div key={g.accountName} className="border-b border-gray-200 last:border-b-0">
                  {/* Account heading row */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(g.accountName)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 hover:bg-gray-200 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">
                        {isCollapsed ? "▸" : "▾"}
                      </span>
                      <span className="font-semibold text-gray-900 text-sm">
                        {g.accountName}
                      </span>
                      {g.accountType && (
                        <span className="text-xs text-gray-500">
                          ({g.accountType})
                        </span>
                      )}
                      <span className="text-xs text-gray-500 ml-2">
                        {g.entries.length} entr
                        {g.entries.length === 1 ? "y" : "ies"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Net change:{" "}
                      <span
                        className={
                          "font-semibold " +
                          (g.netChangeCents >= 0
                            ? "text-gray-900"
                            : "text-rose-700")
                        }
                      >
                        {formatSignedCents(g.netChangeCents)}
                      </span>
                    </div>
                  </button>

                  {!isCollapsed &&
                    g.entries.map((e) => {
                      const raw = parseRaw(e.raw_payload);
                      const description =
                        raw?.Description ?? e.memo ?? "—";
                      const signedCents = g.isDebitNatural
                        ? e.debit_cents - e.credit_cents
                        : e.credit_cents - e.debit_cents;
                      return (
                        <div
                          key={e.id}
                          onClick={() => setSelected(e)}
                          className="grid grid-cols-[110px_120px_1fr_minmax(0,1.4fr)_110px_120px_120px] px-3 py-2 border-t border-gray-100 hover:bg-blue-50/40 cursor-pointer text-sm"
                        >
                          <div className="text-gray-700 whitespace-nowrap">
                            {e.txn_date.slice(0, 10)}
                          </div>
                          <div>
                            <TypeChip type={e.txn_type} />
                          </div>
                          <div className="text-gray-700 truncate" title={entityLabel(raw)}>
                            {entityLabel(raw)}
                          </div>
                          <div
                            className="text-gray-700 truncate"
                            title={description}
                          >
                            {description}
                          </div>
                          <div className="text-gray-500 truncate">
                            {e.doc_number ?? raw?.CheckNumber ?? "—"}
                          </div>
                          <div
                            className={
                              "text-right font-medium " +
                              (signedCents < 0 ? "text-rose-700" : "text-gray-900")
                            }
                          >
                            {formatSignedCents(signedCents)}
                          </div>
                          <div className="text-right text-gray-700">
                            {formatSignedCents(e.runningBalanceCents)}
                          </div>
                        </div>
                      );
                    })}

                  {!isCollapsed && (
                    <div className="grid grid-cols-[110px_120px_1fr_minmax(0,1.4fr)_110px_120px_120px] px-3 py-2 bg-gray-50 border-t border-gray-200 text-sm font-semibold">
                      <div className="col-span-5 text-gray-700">
                        Total {g.accountName}
                      </div>
                      <div
                        className={
                          "text-right " +
                          (g.netChangeCents < 0
                            ? "text-rose-700"
                            : "text-gray-900")
                        }
                      >
                        {formatSignedCents(g.netChangeCents)}
                      </div>
                      <div className="text-right text-gray-900">
                        {formatSignedCents(
                          g.entries[g.entries.length - 1]?.runningBalanceCents ??
                            0,
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
            <div>
              {items.length} of {total} entries
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---------------- Entry detail side-panel ---------------- */}
      {selected ? (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex justify-end"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white w-full max-w-xl h-full overflow-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  GL Entry · #{selected.id}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <TypeChip type={selected.txn_type} />
                  <span className="text-xs text-gray-500 capitalize">
                    via {selected.source}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* Headline amount */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  {selected.debit_cents > 0 ? "Debit" : "Credit"}
                </div>
                <div className="text-2xl font-semibold text-gray-900 mt-0.5">
                  {formatCents(
                    selected.debit_cents > 0
                      ? selected.debit_cents
                      : selected.credit_cents,
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {selected.txn_date.slice(0, 10)} ·{" "}
                  {selected.account_name ?? "(unassigned account)"}
                </div>
              </div>

              {/* Field grid */}
              <dl className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
                <dt className="text-xs uppercase tracking-wide text-gray-500">
                  Account
                </dt>
                <dd className="col-span-2 text-gray-900">
                  {selected.account_name ?? "—"}
                </dd>

                <dt className="text-xs uppercase tracking-wide text-gray-500">
                  Description
                </dt>
                <dd className="col-span-2 text-gray-900">
                  {selectedRaw?.Description ?? selected.memo ?? "—"}
                </dd>

                {selected.memo && selectedRaw?.Description &&
                  selected.memo !== selectedRaw.Description && (
                    <>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">
                        Memo
                      </dt>
                      <dd className="col-span-2 text-gray-900">{selected.memo}</dd>
                    </>
                  )}

                <dt className="text-xs uppercase tracking-wide text-gray-500">
                  Property / Entity
                </dt>
                <dd className="col-span-2 text-gray-900">
                  {entityLabel(selectedRaw)}
                </dd>

                <dt className="text-xs uppercase tracking-wide text-gray-500">
                  Doc number
                </dt>
                <dd className="col-span-2 text-gray-900">
                  {selected.doc_number ??
                    selectedRaw?.CheckNumber ??
                    selectedRaw?.ReferenceNumber ??
                    "—"}
                </dd>

                <dt className="text-xs uppercase tracking-wide text-gray-500">
                  Buildium ID
                </dt>
                <dd className="col-span-2 text-gray-900 font-mono text-xs">
                  {selected.source_id || "—"}
                </dd>

                {selected.property_id != null && (
                  <>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">
                      Local property id
                    </dt>
                    <dd className="col-span-2 text-gray-900 font-mono text-xs">
                      {selected.property_id}
                    </dd>
                  </>
                )}

                {selected.vendor_id != null && (
                  <>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">
                      Local vendor id
                    </dt>
                    <dd className="col-span-2 text-gray-900 font-mono text-xs">
                      {selected.vendor_id}
                    </dd>
                  </>
                )}
              </dl>

              {/* Raw payload (collapsed by default) */}
              <div className="border-t border-gray-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRaw((v) => !v)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <span>{showRaw ? "▾" : "▸"}</span>
                  {showRaw ? "Hide" : "Show"} raw Buildium payload
                </button>
                {showRaw && (
                  <pre className="mt-2 text-[11px] bg-gray-50 border border-gray-200 p-3 rounded overflow-auto whitespace-pre-wrap font-mono text-gray-700">
                    {(() => {
                      if (!selected.raw_payload) return "(no raw payload)";
                      try {
                        return JSON.stringify(
                          JSON.parse(selected.raw_payload),
                          null,
                          2,
                        );
                      } catch {
                        return selected.raw_payload;
                      }
                    })()}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageTemplate>
  );
}
