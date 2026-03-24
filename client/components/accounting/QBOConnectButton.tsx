import { useState, useEffect } from "react";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";

interface QBOStatus {
  connected: boolean;
  company_name?: string;
  last_synced?: string;
}

export default function QBOConnectButton() {
  const [status, setStatus] = useState<QBOStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStatus = () => {
    setLoading(true);
    accountingAPI
      .getQBOStatus()
      .then((data) => setStatus(data))
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      const data = await accountingAPI.getQBOAuthUrl();
      if (data?.auth_url) {
        window.open(data.auth_url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Could not get QuickBooks auth URL");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to get auth URL");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect QuickBooks?")) return;
    setActionLoading(true);
    try {
      await accountingAPI.disconnectQBO();
      toast.success("QuickBooks disconnected");
      loadStatus();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
        Checking connection...
      </div>
    );
  }

  if (status?.connected) {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          Connected
        </span>
        {status.company_name && (
          <span className="text-sm text-gray-600">{status.company_name}</span>
        )}
        <button
          onClick={handleDisconnect}
          disabled={actionLoading}
          className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {actionLoading ? "..." : "Disconnect"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={actionLoading}
      className="px-4 py-2 bg-[#013764] text-white text-sm font-medium rounded-lg hover:bg-[#003a73] disabled:opacity-50 transition-colors"
    >
      {actionLoading ? "Connecting..." : "Connect to QuickBooks"}
    </button>
  );
}
