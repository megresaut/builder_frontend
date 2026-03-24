import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { fetchJSON } from "@/api/fetchJSON";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import GlobalTable from "@/components/GlobalTable";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import InvoiceGenerateModal from "@/components/accounting/InvoiceGenerateModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Invoice {
  id: number;
  invoice_number: string;
  property_id: number;
  property_name: string;
  invoice_month: string;
  status: string;
  subtotal_cents: number;
  markup_cents: number;
  mgmt_fee_cents: number;
  total_cents: number;
  qbo_synced: boolean;
  created_at: string;
}

interface Property {
  id: number;
  name: string;
  address_line1?: string;
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
  { key: "invoice_number", label: "Invoice #" },
  { key: "property_name", label: "Property" },
  { key: "invoice_month", label: "Month" },
  { key: "status", label: "Status" },
  { key: "subtotal_cents", label: "Subtotal" },
  { key: "markup_cents", label: "Markup" },
  { key: "mgmt_fee_cents", label: "Mgmt Fee" },
  { key: "total_cents", label: "Total" },
  { key: "qbo_synced", label: "QBO" },
];

const DEFAULT_COLUMNS = COLUMNS.map((c) => c.key);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AccountingInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);

  // Filters
  const [propertyFilter, setPropertyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);

  const sortingHook = useSortingTable(invoices, "accounting-invoices", {
    initialSortBy: "invoice_month",
    initialSortOrder: "desc",
  });
  const columnManagementHook = useColumnManagement(DEFAULT_COLUMNS);

  // Load properties for filter dropdown
  useEffect(() => {
    fetchJSON("/properties")
      .then((data: any[]) =>
        setProperties(
          (data || []).map((p: any) => ({
            id: p.id,
            name: p.name || p.address_line1,
          }))
        )
      )
      .catch(() => {});
  }, []);

  const loadInvoices = () => {
    setLoading(true);
    const filters: { property_id?: number; status?: string; month?: string } = {};
    if (propertyFilter) filters.property_id = Number(propertyFilter);
    if (statusFilter) filters.status = statusFilter;
    if (monthFilter) filters.month = monthFilter;

    accountingAPI
      .getInvoices(filters)
      .then((data) => setInvoices(data || []))
      .catch((err) => toast.error(err.message || "Failed to load invoices"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
  }, [propertyFilter, statusFilter, monthFilter]);

  const renderCell = (row: Invoice, columnKey: string) => {
    switch (columnKey) {
      case "invoice_number":
        return (
          <span className="font-medium text-gray-900">
            {row.invoice_number || `INV-${row.id}`}
          </span>
        );
      case "property_name":
        return <span className="text-gray-700">{row.property_name || "-"}</span>;
      case "invoice_month":
        return (
          <span className="text-gray-700">{formatMonth(row.invoice_month)}</span>
        );
      case "status": {
        const colors: Record<string, string> = {
          draft: "bg-gray-100 text-gray-700",
          approved: "bg-blue-100 text-blue-800",
          synced: "bg-green-100 text-green-800",
          void: "bg-red-100 text-red-800",
        };
        const label = row.status.charAt(0).toUpperCase() + row.status.slice(1);
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[row.status] || "bg-gray-100 text-gray-700"}`}
          >
            {label}
          </span>
        );
      }
      case "subtotal_cents":
        return (
          <span className="text-gray-900">{formatCents(row.subtotal_cents)}</span>
        );
      case "markup_cents":
        return (
          <span className="text-gray-900">{formatCents(row.markup_cents)}</span>
        );
      case "mgmt_fee_cents":
        return (
          <span className="text-gray-900">{formatCents(row.mgmt_fee_cents)}</span>
        );
      case "total_cents":
        return (
          <span className="font-medium text-gray-900">
            {formatCents(row.total_cents)}
          </span>
        );
      case "qbo_synced":
        return row.qbo_synced ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Synced
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        );
      default:
        return null;
    }
  };

  return (
    <PageTemplate>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage property invoices and QBO sync
          </p>
        </div>
        <button
          onClick={() => setGenerateOpen(true)}
          className="px-4 py-2 bg-[#013764] text-white text-sm font-medium rounded-lg hover:bg-[#003a73] transition-colors"
        >
          Generate Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={propertyFilter}
          onChange={(e) => {
            setPropertyFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="synced">Synced</option>
          <option value="void">Void</option>
        </select>
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
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">Loading invoices...</span>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No invoices found</p>
          <button
            onClick={() => setGenerateOpen(true)}
            className="px-4 py-2 bg-[#013764] text-white text-sm font-medium rounded-lg hover:bg-[#003a73] transition-colors"
          >
            Generate Your First Invoice
          </button>
        </div>
      ) : (
        <GlobalTable
          columns={COLUMNS}
          data={sortingHook.getSortedData()}
          rowKey="id"
          onRowClick={(row) => navigate(`/accounting/invoices/${row.id}`)}
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

      <InvoiceGenerateModal
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onSuccess={loadInvoices}
      />
    </PageTemplate>
  );
}
