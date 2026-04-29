import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import GlobalTable from "@/components/GlobalTable";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Account {
  id: number;
  name: string;
  account_type: string;
  account_sub_type: string;
  balance_cents: number;
  active: boolean;
  qbo_account_id: string;
  push_error: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number | null | undefined): string {
  const v = typeof cents === "number" && Number.isFinite(cents) ? cents : 0;
  return (v / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

// describePushError collapses the verbose QBO error string we store in
// push_error into a short tag for the sync-state chip. Hover shows the full
// error via the title attribute.
function describePushError(err: string): string {
  if (!err) return "";
  if (err.includes("-11283") || err.toLowerCase().includes("usage limit"))
    return "QBO at limit";
  if (err.includes("duplicate name reported")) return "name conflict";
  if (err.includes("Min:1 Max:100")) return "field too long";
  if (err.toLowerCase().includes("colon")) return "invalid name";
  return "push failed";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCOUNT_TYPE_TABS = [
  { key: "", label: "All" },
  { key: "Income", label: "Income" },
  { key: "Expense", label: "Expense" },
  { key: "Asset", label: "Asset" },
  { key: "Liability", label: "Liability" },
  { key: "Equity", label: "Equity" },
  { key: "__unsynced__", label: "Unsynced" },
];

const COLUMNS = [
  { key: "name", label: "Account Name" },
  { key: "account_type", label: "Account Type" },
  { key: "account_sub_type", label: "Sub-Type" },
  { key: "balance_cents", label: "Balance" },
  { key: "active", label: "Active" },
  { key: "sync_state", label: "QBO Sync" },
];

const DEFAULT_COLUMNS = COLUMNS.map((c) => c.key);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AccountingChartOfAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [qboConnected, setQboConnected] = useState<boolean | null>(null);
  const [selectedType, setSelectedType] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);

  // "Unsynced" is a virtual tab — client-side filter on the same payload.
  const visibleAccounts =
    selectedType === "__unsynced__"
      ? accounts.filter((a) => !a.qbo_account_id)
      : accounts;

  const sortingHook = useSortingTable(visibleAccounts, "accounting-chart-of-accounts", {
    initialSortBy: "name",
    initialSortOrder: "asc",
  });
  const columnManagementHook = useColumnManagement(DEFAULT_COLUMNS);

  // Check QBO connection status on mount
  useEffect(() => {
    accountingAPI
      .getQBOStatus()
      .then((data) => {
        setQboConnected(data?.connected === true);
      })
      .catch(() => {
        setQboConnected(false);
      });
  }, []);

  const loadAccounts = () => {
    setLoading(true);
    // Cache-only. AVM is the source of truth for which accounts exist; rows
    // come from the CSV import + two-way sync. We deliberately do NOT fall
    // back to the live QBO query — that was surfacing sandbox seed data.
    // The "Unsynced" tab is a client-side filter on the same payload, so we
    // ignore it server-side (no `account_type` query param).
    const serverType =
      selectedType && selectedType !== "__unsynced__" ? selectedType : undefined;
    accountingAPI
      .getCachedChartOfAccounts(serverType)
      .then((data) => {
        const cached = data?.accounts || [];
        setAccounts(
          cached.map((a: any) => ({
            id: a.id,
            name: a.name,
            account_type: a.account_type,
            account_sub_type: a.account_sub_type,
            balance_cents: a.current_balance_cents,
            active: a.active,
            qbo_account_id: a.qbo_account_id || "",
            push_error: a.push_error || "",
          })),
        );
        setLastSyncedAt(data?.last_synced_at || null);
      })
      .catch((err) =>
        toast.error(err.message || "Failed to load chart of accounts"),
      )
      .finally(() => setLoading(false));
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result: any = await accountingAPI.syncChartOfAccounts();
      const parts: string[] = [];
      if (result?.pushed) parts.push(`${result.pushed} pushed`);
      if (result?.adopted) parts.push(`${result.adopted} adopted`);
      if (result?.push_failed) parts.push(`${result.push_failed} failed`);
      if (result?.pulled) parts.push(`${result.pulled} pulled`);
      const summary = parts.length ? parts.join(", ") : "no changes";
      toast.success(`Two-way sync complete — ${summary}`);
      if (result?.errors?.length) {
        toast.warning(`${result.errors.length} sync warning(s); see logs`);
      }
      loadAccounts();
    } catch (err: any) {
      toast.error(err.message || "Failed to sync chart of accounts");
    } finally {
      setSyncing(false);
    }
  };

  const handleImportCSV = async () => {
    if (
      !window.confirm(
        "Import chart of accounts from chartofaccountsfinal.csv? This will REPLACE the current local list (QuickBooks is not affected until the next sync).",
      )
    ) {
      return;
    }
    setImporting(true);
    try {
      const res: any = await accountingAPI.importChartOfAccountsCSV();
      const warn = (res?.warnings?.length ?? 0) > 0 ? ` (${res.warnings.length} warnings)` : "";
      toast.success(`Imported ${res?.imported ?? 0} accounts from CSV${warn}`);
      loadAccounts();
    } catch (err: any) {
      toast.error(err.message || "CSV import failed");
    } finally {
      setImporting(false);
    }
  };

  const formatLastSynced = (iso: string | null) => {
    if (!iso) return "Never synced";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Never synced";
    return `Last synced ${d.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })}`;
  };

  useEffect(() => {
    if (qboConnected === false) {
      setLoading(false);
      return;
    }
    if (qboConnected === true) {
      loadAccounts();
    }
  }, [selectedType, qboConnected]);

  const renderCell = (row: Account, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return (
          <span className="font-medium text-gray-900">{row.name}</span>
        );
      case "account_type":
        return <span className="text-gray-700">{row.account_type || "-"}</span>;
      case "account_sub_type":
        return (
          <span className="text-gray-700">{row.account_sub_type || "-"}</span>
        );
      case "balance_cents":
        return (
          <span className="font-medium text-gray-900">
            {formatCents(row.balance_cents)}
          </span>
        );
      case "active":
        return row.active ? (
          <span className="text-green-600 font-medium">&#10003;</span>
        ) : (
          <span className="text-red-500 font-medium">&#10007;</span>
        );
      case "sync_state": {
        if (row.qbo_account_id) {
          return (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-800 border-emerald-200"
              title={`QBO id: ${row.qbo_account_id}`}
            >
              Synced
            </span>
          );
        }
        const reason = describePushError(row.push_error);
        return (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-100 text-amber-800 border-amber-200"
            title={row.push_error || "Not yet pushed to QuickBooks"}
          >
            Unsynced{reason ? ` · ${reason}` : ""}
          </span>
        );
      }
      default:
        return null;
    }
  };

  // QBO not connected — show message
  if (qboConnected === false) {
    return (
      <PageTemplate>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Chart of Accounts
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              QuickBooks chart of accounts
            </p>
          </div>
        </div>
        <div className="text-center py-24">
          <p className="text-gray-500 mb-4">
            Connect to QuickBooks to view Chart of Accounts
          </p>
          <Link
            to="/accounting/qbo"
            className="px-4 py-2 bg-[#013764] text-white text-sm font-medium rounded-lg hover:bg-[#003a73] transition-colors"
          >
            Connect QuickBooks
          </Link>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Chart of Accounts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            QuickBooks chart of accounts · {formatLastSynced(lastSyncedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImportCSV}
            disabled={importing || syncing}
            className="px-4 py-2 bg-white text-[#013764] border border-[#013764] text-sm font-medium rounded-lg hover:bg-[#f5f8fb] transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {importing && (
              <span className="w-4 h-4 border-2 border-[#013764]/40 border-t-[#013764] rounded-full animate-spin" />
            )}
            {importing ? "Importing..." : "Import CSV"}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing || importing}
            className="px-4 py-2 bg-[#013764] text-white text-sm font-medium rounded-lg hover:bg-[#003a73] transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {syncing && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {syncing ? "Syncing..." : "Two-way Sync"}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        {ACCOUNT_TYPE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setSelectedType(tab.key);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedType === tab.key
                ? "border-[#013764] text-[#013764]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading || qboConnected === null ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">
            Loading accounts...
          </span>
        </div>
      ) : visibleAccounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No accounts found for this type</p>
        </div>
      ) : (
        <GlobalTable
          columns={COLUMNS}
          data={sortingHook.getSortedData()}
          rowKey="id"
          renderCell={renderCell}
          sortingHook={sortingHook}
          columnManagementHook={columnManagementHook}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          showPageSizeDropdown={showPageSizeDropdown}
          onShowPageSizeDropdownChange={setShowPageSizeDropdown}
          openMenuId={openMenuId}
          onOpenMenuIdChange={setOpenMenuId}
          showColumnModal={columnManagementHook.showColumnModal}
          onShowColumnModalChange={columnManagementHook.setShowColumnModal}
          showPagination={true}
        />
      )}
    </PageTemplate>
  );
}
