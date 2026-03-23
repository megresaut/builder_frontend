import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import GlobalTable from "@/components/GlobalTable";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import StatementUploadModal from "@/components/accounting/StatementUploadModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Statement {
  id: number;
  account_name: string;
  statement_month: string;
  status: string;
  total_transactions: number;
  tagged_transactions: number;
  total_amount_cents: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  return "$" + (Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMonth(monthStr: string): string {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const COLUMNS = [
  { key: "statement_month", label: "Month" },
  { key: "account_name", label: "Account" },
  { key: "status", label: "Status" },
  { key: "total_transactions", label: "Transactions" },
  { key: "tagged_transactions", label: "Tagged" },
  { key: "total_amount_cents", label: "Total" },
];

const DEFAULT_COLUMNS = COLUMNS.map((c) => c.key);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AccountingStatements() {
  const navigate = useNavigate();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Filters
  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);

  const sortingHook = useSortingTable(statements, "accounting-statements", {
    initialSortBy: "statement_month",
    initialSortOrder: "desc",
  });
  const columnManagementHook = useColumnManagement(DEFAULT_COLUMNS);

  const loadStatements = () => {
    setLoading(true);
    accountingAPI
      .getStatements(monthFilter || undefined, statusFilter || undefined)
      .then((data) => setStatements(data || []))
      .catch((err) => toast.error(err.message || "Failed to load statements"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStatements();
  }, [monthFilter, statusFilter]);

  const renderCell = (row: Statement, columnKey: string) => {
    switch (columnKey) {
      case "statement_month":
        return <span className="font-medium text-gray-900">{formatMonth(row.statement_month)}</span>;
      case "account_name":
        return <span className="text-gray-700">{row.account_name}</span>;
      case "status": {
        const colors: Record<string, string> = {
          pending: "bg-yellow-100 text-yellow-800",
          in_progress: "bg-blue-100 text-blue-800",
          reconciled: "bg-green-100 text-green-800",
          locked: "bg-gray-100 text-gray-700",
        };
        const label = row.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[row.status] || "bg-gray-100 text-gray-700"}`}>
            {label}
          </span>
        );
      }
      case "total_transactions":
        return <span className="text-gray-700">{row.total_transactions}</span>;
      case "tagged_transactions": {
        const pct = row.total_transactions > 0
          ? Math.round((row.tagged_transactions / row.total_transactions) * 100)
          : 0;
        return (
          <span className="text-gray-700">
            {row.tagged_transactions}/{row.total_transactions}{" "}
            <span className="text-gray-400">({pct}%)</span>
          </span>
        );
      }
      case "total_amount_cents":
        return <span className="font-medium text-gray-900">{formatCents(row.total_amount_cents)}</span>;
      default:
        return null;
    }
  };

  return (
    <PageTemplate>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bank Statements</h1>
          <p className="text-sm text-gray-500 mt-1">Upload and reconcile bank statements</p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upload Statement
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => {
            setMonthFilter(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Filter by month"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="reconciled">Reconciled</option>
          <option value="locked">Locked</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">Loading statements...</span>
        </div>
      ) : statements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No statements found</p>
          <button
            onClick={() => setUploadOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Your First Statement
          </button>
        </div>
      ) : (
        <GlobalTable
          columns={COLUMNS}
          data={sortingHook.getSortedData()}
          rowKey="id"
          onRowClick={(row) => navigate(`/accounting/statements/${row.id}`)}
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
          getRowClassName={() => "cursor-pointer"}
        />
      )}

      <StatementUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={loadStatements}
      />
    </PageTemplate>
  );
}
