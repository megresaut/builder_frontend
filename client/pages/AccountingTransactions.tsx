import { useState, useEffect } from "react";
import { accountingAPI } from "@/api/accounting";
import { fetchJSON } from "@/api/fetchJSON";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import GlobalTable from "@/components/GlobalTable";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Transaction {
  id: number;
  transaction_date: string;
  description: string;
  amount_cents: number;
  property_id: number;
  property_name: string;
  vendor_id: number;
  vendor_name: string;
  expense_category: string;
  status: string;
  uploaded_by_name: string;
  uploaded_at: string;
  tagged_by: number;
  tagged_by_name: string;
  tagged_at: string;
}

interface Property {
  id: number;
  name: string;
  address_line1?: string;
}

interface Vendor {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
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

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const COLUMNS = [
  { key: "transaction_date", label: "Date" },
  { key: "description", label: "Description" },
  { key: "amount_cents", label: "Amount" },
  { key: "property_name", label: "Property" },
  { key: "vendor_name", label: "Vendor" },
  { key: "expense_category", label: "Category" },
  { key: "status", label: "Status" },
  { key: "tagged_by_name", label: "Tagged By" },
  { key: "tagged_at", label: "Tagged At" },
];

const DEFAULT_COLUMNS = COLUMNS.map((c) => c.key);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AccountingTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [uploadedByFilter, setUploadedByFilter] = useState("");
  const [taggedByFilter, setTaggedByFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);

  const sortingHook = useSortingTable(transactions, "accounting-transactions", {
    initialSortBy: "transaction_date",
    initialSortOrder: "desc",
  });
  const columnManagementHook = useColumnManagement(DEFAULT_COLUMNS);

  // Load properties and vendors for filter dropdowns
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

    fetchJSON("/vendors")
      .then((data: any[]) =>
        setVendors(
          (data || []).map((v: any) => ({ id: v.id, name: v.name }))
        )
      )
      .catch(() => {});

    fetchJSON("/users/all")
      .then((data: any[]) =>
        setUsers(
          (data || []).map((u: any) => ({ id: u.id, name: u.name }))
        )
      )
      .catch(() => {});
  }, []);

  // Collect unique categories from loaded transactions
  const categories = Array.from(
    new Set(
      transactions
        .map((t) => t.expense_category)
        .filter((c): c is string => !!c)
    )
  ).sort();

  const loadTransactions = () => {
    setLoading(true);
    const filters: {
      property_id?: number;
      start_date?: string;
      end_date?: string;
      uploaded_by?: number;
      tagged_by?: number;
    } = {};
    if (propertyFilter) filters.property_id = Number(propertyFilter);
    if (startDate) filters.start_date = startDate;
    if (endDate) filters.end_date = endDate;
    if (uploadedByFilter) filters.uploaded_by = Number(uploadedByFilter);
    if (taggedByFilter) filters.tagged_by = Number(taggedByFilter);

    accountingAPI
      .getTransactionsLedger(filters)
      .then((data) => setTransactions(data || []))
      .catch((err) =>
        toast.error(err.message || "Failed to load transactions")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTransactions();
  }, [propertyFilter, startDate, endDate, uploadedByFilter, taggedByFilter]);

  // Client-side filters for search, vendor, status, category
  const filteredTransactions = sortingHook.getSortedData().filter((txn: Transaction) => {
    if (
      searchFilter &&
      !(txn.description || "")
        .toLowerCase()
        .includes(searchFilter.toLowerCase())
    ) {
      return false;
    }
    if (vendorFilter && String(txn.vendor_id) !== vendorFilter) {
      return false;
    }
    if (statusFilter && txn.status !== statusFilter) {
      return false;
    }
    if (categoryFilter && txn.expense_category !== categoryFilter) {
      return false;
    }
    return true;
  });

  const renderCell = (row: Transaction, columnKey: string) => {
    switch (columnKey) {
      case "transaction_date":
        return (
          <span className="text-gray-900">{formatDate(row.transaction_date)}</span>
        );
      case "description":
        return (
          <span className="text-gray-700 max-w-xs truncate block">
            {row.description || "-"}
          </span>
        );
      case "amount_cents": {
        const isPositive = row.amount_cents >= 0;
        return (
          <span
            className={`font-medium ${isPositive ? "text-green-700" : "text-red-700"}`}
          >
            {formatCents(row.amount_cents)}
          </span>
        );
      }
      case "property_name":
        return <span className="text-gray-700">{row.property_name || "-"}</span>;
      case "vendor_name":
        return <span className="text-gray-700">{row.vendor_name || "-"}</span>;
      case "expense_category":
        return (
          <span className="text-gray-700">{row.expense_category || "-"}</span>
        );
      case "status": {
        const colors: Record<string, string> = {
          untagged: "bg-yellow-100 text-yellow-800",
          tagged: "bg-green-100 text-green-800",
          excluded: "bg-gray-100 text-gray-500",
        };
        const label = (row.status || "untagged")
          .charAt(0)
          .toUpperCase() + (row.status || "untagged").slice(1);
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[row.status] || "bg-gray-100 text-gray-700"}`}
          >
            {label}
          </span>
        );
      }
      case "tagged_by_name":
        return <span className="text-gray-700">{row.tagged_by_name || "-"}</span>;
      case "tagged_at":
        return (
          <span className="text-gray-700">{formatDate(row.tagged_at)}</span>
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
          <h1 className="text-2xl font-semibold text-gray-900">
            Transaction Ledger
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            All-properties transaction ledger
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => {
            setSearchFilter(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search descriptions..."
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-56"
        />
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
          value={vendorFilter}
          onChange={(e) => {
            setVendorFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
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
          <option value="untagged">Untagged</option>
          <option value="tagged">Tagged</option>
          <option value="excluded">Excluded</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={uploadedByFilter}
          onChange={(e) => {
            setUploadedByFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Uploaders</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select
          value={taggedByFilter}
          onChange={(e) => {
            setTaggedByFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Taggers</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="From"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="To"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">
            Loading transactions...
          </span>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No transactions found</p>
        </div>
      ) : (
        <GlobalTable
          columns={COLUMNS}
          data={filteredTransactions}
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
