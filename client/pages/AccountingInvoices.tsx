import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJSON } from "@/api/fetchJSON";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import GlobalTable from "@/components/GlobalTable";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";

interface InvoiceRow {
  id: number;
  property_id: number;
  property_address: string;
  invoice_month: string;
  status: string;
  total_amount: number;
  pdf_object_key: string;
  pdf_sha256: string;
  issued_at: string | null;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatMonth(monthStr: string): string {
  if (!monthStr) return "—";
  const d = new Date(monthStr);
  if (isNaN(d.getTime())) return monthStr;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const COLUMNS = [
  { key: "id", label: "Invoice #" },
  { key: "property_address", label: "Property" },
  { key: "invoice_month", label: "Invoice Month" },
  { key: "total_amount", label: "Amount" },
  { key: "finalized_at", label: "Finalized" },
  { key: "status", label: "Status" },
];

const DEFAULT_COLUMNS = COLUMNS.map((c) => c.key);

export default function AccountingInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [propertyFilter, setPropertyFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);

  const filtered = invoices.filter((inv) => {
    if (propertyFilter && String(inv.property_id) !== propertyFilter) return false;
    if (monthFilter) {
      const m = inv.invoice_month?.slice(0, 7);
      if (m !== monthFilter) return false;
    }
    return true;
  });

  const sortingHook = useSortingTable(filtered, "accounting-invoices-portfolio", {
    initialSortBy: "invoice_month",
    initialSortOrder: "desc",
  });
  const columnManagementHook = useColumnManagement(DEFAULT_COLUMNS);

  useEffect(() => {
    setLoading(true);
    fetchJSON("/invoicing/all")
      .then((data: any) => setInvoices(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(err.message || "Failed to load invoices"))
      .finally(() => setLoading(false));
  }, []);

  const propertyOptions = Array.from(
    new Map(
      invoices.map((inv) => [
        inv.property_id,
        { id: inv.property_id, address: inv.property_address || `Property ${inv.property_id}` },
      ])
    ).values()
  ).sort((a, b) => a.address.localeCompare(b.address));

  const renderCell = (row: InvoiceRow, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return <span className="font-medium text-gray-900">INV-{row.id}</span>;
      case "property_address":
        return (
          <span className="text-gray-700">{row.property_address || "—"}</span>
        );
      case "invoice_month":
        return <span className="text-gray-700">{formatMonth(row.invoice_month)}</span>;
      case "total_amount":
        return (
          <span className="font-medium text-gray-900">
            {formatMoney(row.total_amount)}
          </span>
        );
      case "finalized_at":
        return <span className="text-gray-700">{formatDate(row.finalized_at)}</span>;
      case "status": {
        const colors: Record<string, string> = {
          finalized: "bg-green-100 text-green-800",
          draft: "bg-gray-100 text-gray-700",
          void: "bg-red-100 text-red-800",
        };
        const label = row.status.charAt(0).toUpperCase() + row.status.slice(1);
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              colors[row.status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {label}
          </span>
        );
      }
      default:
        return null;
    }
  };

  return (
    <PageTemplate>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            Portfolio-wide finalized invoices across all properties
          </p>
        </div>
      </div>

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
          {propertyOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.address}
            </option>
          ))}
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">Loading invoices...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No finalized invoices found</p>
        </div>
      ) : (
        <GlobalTable
          columns={COLUMNS}
          data={sortingHook.getSortedData()}
          rowKey="id"
          onRowClick={(row) =>
            navigate(`/properties/${row.property_id}?tab=Invoicing`)
          }
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
    </PageTemplate>
  );
}
