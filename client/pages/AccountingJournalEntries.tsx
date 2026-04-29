import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";

interface JournalEntry {
  id: number;
  txn_date: string;
  memo: string | null;
  status: string;
  qbo_journal_entry_id: string | null;
  qbo_sync_error: string | null;
  buildium_journal_entry_id: string | null;
  buildium_sync_error: string | null;
  created_at: string;
}

const STATUS_TABS = ["all", "draft", "posted", "void"];

function formatDate(s: string) {
  return s.slice(0, 10);
}

export default function AccountingJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    accountingAPI
      .listJournalEntries({ status: status === "all" ? undefined : status })
      .then((data: { entries: JournalEntry[] }) => setEntries(data?.entries ?? []))
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <PageTemplate>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Journal Entries</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manual debit/credit GL adjustments. Posting fans out to QBO + Buildium.
          </p>
        </div>
        <Link
          to="/accounting/journal-entries/new"
          className="px-3 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700"
        >
          New entry
        </Link>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setStatus(t)}
            className={`px-3 py-1 text-sm rounded border capitalize ${
              status === t
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="text-sm text-gray-500">No journal entries.</div>
      ) : (
        <div className="border border-gray-200 rounded overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Memo</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">QBO</th>
                <th className="px-3 py-2 text-left">Buildium</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2">{formatDate(e.txn_date)}</td>
                  <td className="px-3 py-2 max-w-md truncate">{e.memo ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded border capitalize ${
                        e.status === "posted"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : e.status === "draft"
                            ? "bg-gray-100 text-gray-700 border-gray-200"
                            : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {e.qbo_journal_entry_id ? "✓" : e.qbo_sync_error ? "✗" : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {e.buildium_journal_entry_id
                      ? "✓"
                      : e.buildium_sync_error
                        ? "✗"
                        : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      to={`/accounting/journal-entries/${e.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageTemplate>
  );
}
