import { useState, useEffect, useMemo } from "react";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import AccountCard from "@/components/accounting/AccountCard";

interface CreditCardAccount {
  id: number;
  name: string;
  card_last4: string | null;
  network: string | null;
  holder_name: string | null;
  billing_day: number | null;
  credit_limit_cents: number | null;
  is_active: boolean;
  current_balance_cents: number | null;
  notes: string | null;
}

const NETWORK_TABS = [
  { key: "all", label: "All" },
  { key: "visa", label: "Visa" },
  { key: "mc", label: "Mastercard" },
  { key: "amex", label: "Amex" },
  { key: "disc", label: "Discover" },
  { key: "other", label: "Other" },
];

export default function AccountingCreditCards() {
  const [accounts, setAccounts] = useState<CreditCardAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    accountingAPI
      .listCreditCardAccounts()
      .then((data: { accounts: CreditCardAccount[] }) => setAccounts(data?.accounts ?? []))
      .catch((e: Error) => toast.error("Load failed: " + e.message))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    if (filter === "all") return accounts;
    return accounts.filter((a) => (a.network ?? "other") === filter);
  }, [accounts, filter]);

  return (
    <PageTemplate>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Credit Cards</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cards on file. Statement upload coming in a later phase.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {NETWORK_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1 text-sm rounded border ${
              filter === t.key
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="text-sm text-gray-500">No credit card accounts.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((a) => (
            <AccountCard
              key={a.id}
              to={`/accounting/credit-cards/${a.id}`}
              name={a.name}
              subtitle={a.holder_name ?? undefined}
              balanceCents={a.current_balance_cents ?? null}
              rightChip={
                a.network
                  ? { label: a.network.toUpperCase(), tone: "info" }
                  : null
              }
              badges={[
                a.card_last4
                  ? { label: `••${a.card_last4}`, tone: "default" }
                  : null,
                typeof a.credit_limit_cents === "number"
                  ? {
                      label: `Limit ${(a.credit_limit_cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
                      tone: "default",
                    }
                  : null,
              ].filter(Boolean) as any}
              meta={
                a.billing_day
                  ? [{ label: "Billing day", value: String(a.billing_day) }]
                  : []
              }
            />
          ))}
        </div>
      )}
    </PageTemplate>
  );
}
