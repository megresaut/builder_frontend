import { useState, useEffect } from "react";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import QBOConnectButton from "@/components/accounting/QBOConnectButton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SyncLogEntry {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  status: string;
  error_message?: string;
  synced_at: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AccountingQBOSettings() {
  const [syncLog, setSyncLog] = useState<SyncLogEntry[]>([]);
  const [syncLogLoading, setSyncLogLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);

  const loadSyncLog = () => {
    setSyncLogLoading(true);
    accountingAPI
      .getQBOSyncLog()
      .then((data) => setSyncLog(data || []))
      .catch(() => setSyncLog([]))
      .finally(() => setSyncLogLoading(false));
  };

  useEffect(() => {
    loadSyncLog();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await accountingAPI.triggerQBOSync();
      toast.success("Sync triggered successfully");
      loadSyncLog();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleBootstrap = async () => {
    if (!confirm("Bootstrap will create initial chart of accounts and items in QBO. Continue?")) return;
    setBootstrapping(true);
    try {
      await accountingAPI.bootstrapQBO();
      toast.success("Bootstrap completed");
      loadSyncLog();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bootstrap failed");
    } finally {
      setBootstrapping(false);
    }
  };

  const handleSeed = async () => {
    if (!confirm("Seed QBO data? This will push current data to QuickBooks.")) return;
    try {
      await accountingAPI.seedQBOData();
      toast.success("Seed completed");
      loadSyncLog();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Seed failed");
    }
  };

  return (
    <PageTemplate>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">QuickBooks Integration</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your QuickBooks Online connection and sync status</p>
      </div>

      {/* Connection Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h2>
        <QBOConnectButton />
      </div>

      {/* Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-[#013764] text-white text-sm font-medium rounded-lg hover:bg-[#003a73] disabled:opacity-50 transition-colors"
          >
            {syncing ? "Syncing..." : "Manual Sync"}
          </button>
          <button
            onClick={handleBootstrap}
            disabled={bootstrapping}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {bootstrapping ? "Bootstrapping..." : "Bootstrap QBO"}
          </button>
          <button
            onClick={handleSeed}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Seed QBO Data
          </button>
        </div>
      </div>

      {/* Sync Log */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Sync Log</h2>
          <button
            onClick={loadSyncLog}
            className="text-sm text-[#013764] hover:underline"
          >
            Refresh
          </button>
        </div>

        {syncLogLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Loading...</span>
          </div>
        ) : syncLog.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No sync activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Time</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Entity</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Action</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Error</th>
                </tr>
              </thead>
              <tbody>
                {syncLog.map((entry: any) => {
                  const isSuccess = entry.http_status >= 200 && entry.http_status < 300;
                  const statusLabel = isSuccess ? "success" : `error ${entry.http_status}`;
                  const statusColor = isSuccess
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800";
                  return (
                    <tr key={entry.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                        {entry.created_at ? new Date(entry.created_at).toLocaleString() : "-"}
                      </td>
                      <td className="py-2 px-3 text-gray-700">
                        {entry.entity_type} #{entry.entity_id}
                      </td>
                      <td className="py-2 px-3 text-gray-700">{entry.action}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-red-600 text-xs max-w-[300px] truncate">
                        {entry.error_message || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
