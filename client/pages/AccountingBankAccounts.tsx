import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import AccountCard from "@/components/accounting/AccountCard";

interface BankAccount {
  id: number;
  name: string;
  purpose: string;
  routing_last4: string | null;
  account_last4: string | null;
  holder_name: string | null;
  buildium_bank_account_id: string | null;
  qbo_account_id: string | null;
  is_active: boolean;
  current_balance_cents: number | null;
  buildium_balance_cents: number | null;
  buildium_balance_synced_at: string | null;
  last_reconciled_at: string | null;
  notes: string | null;
}

function formatCents(cents: number | null | undefined): string {
  if (typeof cents !== "number") return "—";
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function relativeTime(ts: string | null): string {
  if (!ts) return "never";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "never";
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function AccountingBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    accountingAPI
      .listBankAccounts()
      .then((data: { accounts: BankAccount[] }) => {
        setAccounts(data?.accounts ?? []);
      })
      .catch((e: Error) => {
        toast.error("Failed to load bank accounts: " + (e?.message ?? "unknown"));
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) => {
      const haystack = [
        a.name,
        a.holder_name ?? "",
        a.account_last4 ?? "",
        a.routing_last4 ?? "",
        a.purpose,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [accounts, search]);

  return (
    <PageTemplate>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bank Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">
            All bank accounts in the system. Balances sync from Buildium automatically.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#013764] focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="text-sm text-gray-500">No accounts.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((a) => (
            <AccountCard
              key={a.id}
              to={`/accounting/bank-accounts/${a.id}`}
              name={a.name}
              subtitle={a.holder_name ?? undefined}
              balanceCents={a.buildium_balance_cents ?? a.current_balance_cents ?? null}
              rightChip={
                a.buildium_bank_account_id
                  ? { label: "Buildium ✓", tone: "good" }
                  : { label: "Local only", tone: "default" }
              }
              badges={[
                a.account_last4
                  ? { label: `••${a.account_last4}`, tone: "default" }
                  : null,
              ].filter(Boolean) as any}
              meta={[
                {
                  label: "Buildium",
                  value: a.buildium_bank_account_id
                    ? `${formatCents(a.buildium_balance_cents)} · ${relativeTime(a.buildium_balance_synced_at)}`
                    : "—",
                },
                {
                  label: "QBO",
                  value:
                    typeof a.current_balance_cents === "number"
                      ? formatCents(a.current_balance_cents)
                      : "—",
                },
                { label: "Last reconciled", value: relativeTime(a.last_reconciled_at) },
              ]}
            />
          ))}
        </div>
      )}
    </PageTemplate>
  );
}
