import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { fetchJSON } from "@/api/fetchJSON";
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

interface UnlabeledTxn {
  id: number;
  txn_date: string;
  amount_cents: number;
  counterparty: string | null;
  memo: string | null;
}

interface VendorLite {
  id: number;
  name: string;
}

interface CoALite {
  id: number;
  name: string;
  account_type: string;
  qbo_account_id: string;
  active: boolean;
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

  // statement import + labeling state
  const [unlabeled, setUnlabeled] = useState<UnlabeledTxn[]>([]);
  const [unlabeledLoading, setUnlabeledLoading] = useState(false);
  const [vendors, setVendors] = useState<VendorLite[]>([]);
  const [coa, setCoa] = useState<CoALite[]>([]);
  const [uploading, setUploading] = useState(false);
  const [labelingTxnId, setLabelingTxnId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  function loadUnlabeled() {
    if (!Number.isFinite(accountId)) return;
    setUnlabeledLoading(true);
    accountingAPI
      .ccListUnlabeled(accountId)
      .then((data: { transactions?: UnlabeledTxn[] }) =>
        setUnlabeled(data?.transactions ?? []),
      )
      .catch((e: Error) => toast.error("Load unlabeled failed: " + e.message))
      .finally(() => setUnlabeledLoading(false));
  }

  useEffect(() => {
    if (!Number.isFinite(accountId)) return;
    loadUnlabeled();
    fetchJSON("/vendors")
      .then((data: VendorLite[]) =>
        setVendors((data ?? []).map((v) => ({ id: v.id, name: v.name }))),
      )
      .catch(() => {});
    accountingAPI
      .getCachedChartOfAccounts()
      .then((data: { accounts?: CoALite[] }) => setCoa(data?.accounts ?? []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  async function uploadStatement() {
    const f = fileRef.current?.files?.[0];
    if (!f) {
      toast.error("Pick a CSV or XLSX file first");
      return;
    }
    setUploading(true);
    try {
      const res: { imported: number; skipped: number } =
        await accountingAPI.ccImportStatement(accountId, f);
      toast.success(
        `Imported ${res.imported}, skipped ${res.skipped} (duplicates)`,
      );
      if (fileRef.current) fileRef.current.value = "";
      loadUnlabeled();
    } catch (e: any) {
      toast.error("Import failed: " + (e?.message ?? "unknown"));
    } finally {
      setUploading(false);
    }
  }

  async function labelTxn(
    txnId: number,
    vendorId: number,
    coaId: number,
  ) {
    const acct = coa.find((a) => a.id === coaId);
    if (!acct) {
      toast.error("Pick a GL account");
      return;
    }
    if (!acct.qbo_account_id) {
      toast.error("That GL account has no QBO id — pick another");
      return;
    }
    try {
      await accountingAPI.ccLabelTransaction(txnId, {
        vendor_id: vendorId,
        gl_account_qbo_id: acct.qbo_account_id,
        gl_account_name: acct.name,
      });
      toast.success("Labeled");
      setLabelingTxnId(null);
      loadUnlabeled();
    } catch (e: any) {
      toast.error("Label failed: " + (e?.message ?? "unknown"));
    }
  }

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

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded p-4">
              <h2 className="text-base font-medium mb-2">Import statement</h2>
              <p className="text-xs text-gray-500 mb-3">
                CSV or XLSX export from the card issuer. Charges import as
                negative; payments and refunds as positive. Re-uploads of the
                same statement are deduped.
              </p>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="text-sm"
                />
                <button
                  onClick={uploadStatement}
                  disabled={uploading}
                  className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded disabled:opacity-50"
                >
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded p-4">
              <h2 className="text-base font-medium mb-2">Reconcile</h2>
              <p className="text-xs text-gray-500 mb-3">
                Open a session, auto-match high-confidence rows against bills,
                and finalize when cleared total matches statement balance.
              </p>
              <Link
                to={`/accounting/bank-accounts/${accountId}/reconcile?kind=credit_card`}
                className="inline-block px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Open reconciliation →
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-medium">Unlabeled transactions</h2>
              <button
                onClick={loadUnlabeled}
                className="text-xs text-gray-500 hover:underline"
              >
                Refresh
              </button>
            </div>
            {unlabeledLoading ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : unlabeled.length === 0 ? (
              <div className="text-sm text-gray-500">
                Nothing waiting. Upload a statement or label rows from a
                reconciliation session.
              </div>
            ) : (
              <div className="border border-gray-200 rounded overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {unlabeled.map((t) => (
                      <UnlabeledRow
                        key={t.id}
                        txn={t}
                        active={labelingTxnId === t.id}
                        vendors={vendors}
                        coa={coa}
                        onActivate={() => setLabelingTxnId(t.id)}
                        onCancel={() => setLabelingTxnId(null)}
                        onLabel={(vendorId, coaId) =>
                          labelTxn(t.id, vendorId, coaId)
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </PageTemplate>
  );
}

function UnlabeledRow({
  txn,
  active,
  vendors,
  coa,
  onActivate,
  onCancel,
  onLabel,
}: {
  txn: UnlabeledTxn;
  active: boolean;
  vendors: VendorLite[];
  coa: CoALite[];
  onActivate: () => void;
  onCancel: () => void;
  onLabel: (vendorId: number, coaId: number) => void;
}) {
  const [vendorId, setVendorId] = useState<string>("");
  const [coaId, setCoaId] = useState<string>("");

  const desc = txn.counterparty || txn.memo || "—";
  const amountClass = txn.amount_cents < 0 ? "text-gray-900" : "text-green-700";

  return (
    <>
      <tr className="border-t border-gray-100">
        <td className="px-3 py-2">{txn.txn_date.slice(0, 10)}</td>
        <td className="px-3 py-2">{desc}</td>
        <td className={`px-3 py-2 text-right ${amountClass}`}>
          {formatCents(txn.amount_cents)}
        </td>
        <td className="px-3 py-2 text-right">
          {active ? (
            <button
              onClick={onCancel}
              className="text-xs text-gray-500 hover:underline"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={onActivate}
              className="text-xs text-blue-700 hover:underline"
            >
              Label
            </button>
          )}
        </td>
      </tr>
      {active && (
        <tr className="border-t border-gray-100 bg-gray-50">
          <td colSpan={4} className="px-3 py-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs text-gray-600 mb-0.5">
                  Vendor
                </label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">— pick vendor —</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs text-gray-600 mb-0.5">
                  GL account
                </label>
                <select
                  value={coaId}
                  onChange={(e) => setCoaId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">— pick account —</option>
                  {coa
                    .filter((a) => a.active)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.account_type})
                      </option>
                    ))}
                </select>
              </div>
              <button
                onClick={() => {
                  const vid = Number(vendorId);
                  const cid = Number(coaId);
                  if (!vid || !cid) {
                    toast.error("Pick vendor and GL account");
                    return;
                  }
                  onLabel(vid, cid);
                }}
                className="px-3 py-1 text-sm bg-gray-900 text-white rounded"
              >
                Save
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
