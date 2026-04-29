import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";

interface JournalEntryLine {
  id: number;
  line_no: number;
  account_id: number;
  account_name: string | null;
  debit_cents: number;
  credit_cents: number;
  memo: string | null;
}

interface JournalEntry {
  id: number;
  txn_date: string;
  memo: string | null;
  status: string;
  qbo_journal_entry_id: string | null;
  qbo_synced_at: string | null;
  qbo_sync_error: string | null;
  buildium_journal_entry_id: string | null;
  buildium_synced_at: string | null;
  buildium_sync_error: string | null;
  lines: JournalEntryLine[];
}

function formatCents(cents: number): string {
  if (!cents) return "—";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function AccountingJournalEntryDetail() {
  const { id } = useParams<{ id: string }>();
  const entryId = Number(id);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    accountingAPI
      .getJournalEntry(entryId)
      .then((d: JournalEntry) => setEntry(d))
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (Number.isFinite(entryId)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  async function post() {
    setBusy(true);
    try {
      const updated = await accountingAPI.postJournalEntry(entryId);
      setEntry(updated);
      toast.success("Posted");
    } catch (e: any) {
      toast.error("Post failed: " + (e?.message ?? "unknown"));
    } finally {
      setBusy(false);
    }
  }

  async function voidEntry() {
    setBusy(true);
    try {
      const updated = await accountingAPI.voidJournalEntry(entryId);
      setEntry(updated);
      toast.success("Voided");
    } catch (e: any) {
      toast.error("Void failed: " + (e?.message ?? "unknown"));
    } finally {
      setBusy(false);
    }
  }

  if (!Number.isFinite(entryId)) {
    return (
      <PageTemplate>
        <div>Invalid journal entry ID.</div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate>
      <div className="text-sm text-gray-500 mb-2">
        <Link to="/accounting/journal-entries" className="hover:underline">
          ← All journal entries
        </Link>
      </div>
      {loading || !entry ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Journal entry #{entry.id}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {entry.txn_date.slice(0, 10)}
                {entry.memo ? ` · ${entry.memo}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {entry.status === "draft" ? (
                <button
                  onClick={post}
                  disabled={busy}
                  className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded disabled:opacity-50"
                >
                  Post
                </button>
              ) : null}
              {entry.status === "posted" ? (
                <button
                  onClick={voidEntry}
                  disabled={busy}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded disabled:opacity-50"
                >
                  Void
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white border border-gray-200 rounded p-3">
              <div className="text-xs text-gray-500">Status</div>
              <div className="text-sm font-medium capitalize">{entry.status}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-3">
              <div className="text-xs text-gray-500">QBO</div>
              <div className="text-sm">
                {entry.qbo_journal_entry_id
                  ? `✓ ${entry.qbo_journal_entry_id}`
                  : entry.qbo_sync_error
                    ? `✗ ${entry.qbo_sync_error}`
                    : "—"}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-3">
              <div className="text-xs text-gray-500">Buildium</div>
              <div className="text-sm">
                {entry.buildium_journal_entry_id
                  ? `✓ ${entry.buildium_journal_entry_id}`
                  : entry.buildium_sync_error
                    ? `✗ ${entry.buildium_sync_error}`
                    : "—"}
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Line</th>
                  <th className="px-3 py-2 text-left">Account</th>
                  <th className="px-3 py-2 text-right">Debit</th>
                  <th className="px-3 py-2 text-right">Credit</th>
                  <th className="px-3 py-2 text-left">Memo</th>
                </tr>
              </thead>
              <tbody>
                {entry.lines.map((l) => (
                  <tr key={l.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{l.line_no}</td>
                    <td className="px-3 py-2">{l.account_name ?? `#${l.account_id}`}</td>
                    <td className="px-3 py-2 text-right">{formatCents(l.debit_cents)}</td>
                    <td className="px-3 py-2 text-right">{formatCents(l.credit_cents)}</td>
                    <td className="px-3 py-2">{l.memo ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageTemplate>
  );
}
