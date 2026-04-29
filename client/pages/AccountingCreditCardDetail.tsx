import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";

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

const NETWORKS = ["", "visa", "mc", "amex", "disc", "other"];

function formatCents(cents: number | null | undefined) {
  const v = typeof cents === "number" ? cents : 0;
  return (v / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function AccountingCreditCardDetail() {
  const { id } = useParams<{ id: string }>();
  const accountId = Number(id);
  const [acct, setAcct] = useState<CreditCardAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // form state
  const [last4, setLast4] = useState("");
  const [network, setNetwork] = useState("");
  const [holder, setHolder] = useState("");
  const [billingDay, setBillingDay] = useState<string>("");
  const [creditLimit, setCreditLimit] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    accountingAPI
      .getCreditCardAccount(accountId)
      .then((a: CreditCardAccount) => {
        setAcct(a);
        setLast4(a.card_last4 ?? "");
        setNetwork(a.network ?? "");
        setHolder(a.holder_name ?? "");
        setBillingDay(a.billing_day ? String(a.billing_day) : "");
        setCreditLimit(
          typeof a.credit_limit_cents === "number"
            ? String(a.credit_limit_cents / 100)
            : "",
        );
        setNotes(a.notes ?? "");
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (Number.isFinite(accountId)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  async function save() {
    setSaving(true);
    try {
      const data: any = {
        card_last4: last4,
        network,
        holder_name: holder,
        notes,
      };
      if (billingDay !== "") data.billing_day = Number(billingDay);
      if (creditLimit !== "") data.credit_limit_cents = Math.round(Number(creditLimit) * 100);
      await accountingAPI.updateCreditCardAccount(accountId, data);
      toast.success("Saved");
      setEditing(false);
      load();
    } catch (e: any) {
      toast.error("Save failed: " + (e?.message ?? "unknown"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageTemplate>
      <div className="text-sm text-gray-500 mb-2">
        <Link to="/accounting/credit-cards" className="hover:underline">
          ← All credit cards
        </Link>
      </div>
      {loading || !acct ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{acct.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {acct.network?.toUpperCase() ?? ""}
                {acct.card_last4 ? ` ••${acct.card_last4}` : ""}
                {typeof acct.current_balance_cents === "number"
                  ? ` · ${formatCents(acct.current_balance_cents)}`
                  : ""}
              </p>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Network</label>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                >
                  {NETWORKS.map((n) => (
                    <option key={n} value={n}>
                      {n || "—"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Card last 4</label>
                <input
                  value={last4}
                  onChange={(e) => setLast4(e.target.value)}
                  maxLength={4}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Holder</label>
                <input
                  value={holder}
                  onChange={(e) => setHolder(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Billing day (1-31)</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={billingDay}
                  onChange={(e) => setBillingDay(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Credit limit ($)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-900 text-white text-sm rounded disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded p-4 max-w-xl">
              <dl className="text-sm space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Holder</dt>
                  <dd>{acct.holder_name ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Billing day</dt>
                  <dd>{acct.billing_day ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Credit limit</dt>
                  <dd>{formatCents(acct.credit_limit_cents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Notes</dt>
                  <dd className="max-w-md text-right">{acct.notes ?? "—"}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500 italic border border-dashed border-gray-200 rounded p-4">
            Statement upload and per-card transaction sync are coming in a later phase.
          </div>
        </>
      )}
    </PageTemplate>
  );
}
