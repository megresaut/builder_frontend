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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
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
];

const COLUMNS = [
  { key: "name", label: "Account Name" },
  { key: "account_type", label: "Account Type" },
  { key: "account_sub_type", label: "Sub-Type" },
  { key: "balance_cents", label: "Balance" },
  { key: "active", label: "Active" },
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

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);

  const sortingHook = useSortingTable(accounts, "accounting-chart-of-accounts", {
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
    accountingAPI
      .getChartOfAccounts(selectedType || undefined)
      .then((data) => setAccounts(data?.accounts || data || []))
      .catch((err) =>
        toast.error(err.message || "Failed to load chart of accounts")
      )
      .finally(() => setLoading(false));
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
            QuickBooks chart of accounts
          </p>
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
      ) : accounts.length === 0 ? (
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
