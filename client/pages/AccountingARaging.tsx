import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import GlobalTable from "@/components/GlobalTable";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import { usePageState } from "@/hooks/usePageState";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ARInvoice {
  invoice_id: number;
  invoice_number: string | null;
  property_id: number;
  property_name: string;
  total_cents: number;
  due_date: string | null;
  days_overdue: number;
  aging_bucket: string;
}

interface ARAgingSummary {
  current_cents: number;
  days_30_cents: number;
  days_60_cents: number;
  days_90_plus_cents: number;
  total_cents: number;
  invoices: ARInvoice[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  return (Math.abs(cents) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const BUCKET_COLORS: Record<string, string> = {
  current: "bg-green-100 text-green-800",
  "1-30": "bg-green-100 text-green-800",
  "31-60": "bg-yellow-100 text-yellow-800",
  "61-90": "bg-orange-100 text-orange-800",
  "90+": "bg-red-100 text-red-800",
};

const CHART_COLORS = ["#22c55e", "#eab308", "#f97316", "#ef4444"];

function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-900">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color || entry.fill }}>
          {formatCents(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const COLUMNS = [
  { key: "invoice_number", label: "Invoice #" },
  { key: "property_name", label: "Property" },
  { key: "total_cents", label: "Amount" },
  { key: "due_date", label: "Due Date" },
  { key: "days_overdue", label: "Days Overdue" },
  { key: "aging_bucket", label: "Aging Bucket" },
];

const DEFAULT_COLUMN_KEYS = COLUMNS.map((c) => c.key);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AccountingARaging() {
  const navigate = useNavigate();
  const [data, setData] = useState<ARAgingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [currentPage, setCurrentPage] = usePageState("arAgingPage", 1);
  const [itemsPerPage, setItemsPerPage] = usePageState("arAgingPerPage", 25);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const sortingHook = useSortingTable();
  const columnManagementHook = useColumnManagement(DEFAULT_COLUMN_KEYS);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setError(null);
    accountingAPI
      .getARaging()
      .then((result: ARAgingSummary) => {
        setData(result);
      })
      .catch((err: any) => {
        const msg = err?.message || "Failed to load AR aging data";
        toast.error(msg);
        setError(msg);
        setData(null);
      })
      .finally(() => setLoading(false));
  };

  // Filter invoices by search
  const invoices = data?.invoices ?? [];
  const filteredInvoices = searchValue
    ? invoices.filter(
        (inv) =>
          (inv.invoice_number ?? "")
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          inv.property_name
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          inv.aging_bucket
            .toLowerCase()
            .includes(searchValue.toLowerCase()),
      )
    : invoices;

  // Chart data
  const chartData = data
    ? [
        { name: "Current (0-30)", amount: data.current_cents, fill: CHART_COLORS[0] },
        { name: "31-60 Days", amount: data.days_30_cents, fill: CHART_COLORS[1] },
        { name: "61-90 Days", amount: data.days_60_cents, fill: CHART_COLORS[2] },
        { name: "90+ Days", amount: data.days_90_plus_cents, fill: CHART_COLORS[3] },
      ]
    : [];

  const renderCell = (row: ARInvoice, columnKey: string) => {
    switch (columnKey) {
      case "invoice_number":
        return (
          <span className="font-medium text-gray-900">
            {row.invoice_number || "-"}
          </span>
        );
      case "property_name":
        return <span className="text-gray-700">{row.property_name}</span>;
      case "total_cents":
        return (
          <span className="font-mono text-gray-900">
            {formatCents(row.total_cents)}
          </span>
        );
      case "due_date":
        return <span className="text-gray-600">{formatDate(row.due_date)}</span>;
      case "days_overdue":
        return row.days_overdue > 0 ? (
          <span className="text-red-600 font-medium">{row.days_overdue}d</span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      case "aging_bucket": {
        const colorClass =
          BUCKET_COLORS[row.aging_bucket] || "bg-gray-100 text-gray-700";
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
          >
            {row.aging_bucket}
          </span>
        );
      }
      default:
        return null;
    }
  };

  return (
    <PageTemplate>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Accounts Receivable Aging
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Outstanding invoices grouped by aging bucket
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-green-50 border-l-4 border-green-400 rounded-lg shadow-sm p-5">
              <div className="text-2xl font-bold text-gray-900">
                {formatCents(data.current_cents)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Current (0-30 days)
              </div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg shadow-sm p-5">
              <div className="text-2xl font-bold text-gray-900">
                {formatCents(data.days_30_cents)}
              </div>
              <div className="text-sm text-gray-500 mt-1">31-60 Days</div>
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg shadow-sm p-5">
              <div className="text-2xl font-bold text-gray-900">
                {formatCents(data.days_60_cents)}
              </div>
              <div className="text-sm text-gray-500 mt-1">61-90 Days</div>
            </div>
            <div className="bg-red-50 border-l-4 border-red-400 rounded-lg shadow-sm p-5">
              <div className="text-2xl font-bold text-gray-900">
                {formatCents(data.days_90_plus_cents)}
              </div>
              <div className="text-sm text-gray-500 mt-1">90+ Days</div>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg shadow-sm p-5">
              <div className="text-2xl font-bold text-gray-900">
                {formatCents(data.total_cents)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Total Outstanding
              </div>
            </div>
          </div>

          {/* Aging Distribution Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Aging Distribution
            </h2>
            {chartData.every((d) => d.amount === 0) ? (
              <p className="text-sm text-gray-500 py-8 text-center">
                No outstanding amounts.
              </p>
            ) : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                    />
                    <YAxis
                      tickFormatter={(v) =>
                        `$${(v / 100).toLocaleString()}`
                      }
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      width={80}
                    />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Invoice table */}
          {filteredInvoices.length === 0 && !searchValue ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              No outstanding invoices.
            </div>
          ) : (
            <GlobalTable
              columns={COLUMNS}
              data={filteredInvoices}
              rowKey="invoice_id"
              onRowClick={(row) =>
                navigate(`/accounting/invoices/${row.invoice_id}`)
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
              title="Outstanding Invoices"
              showColumnModal={showColumnModal}
              onShowColumnModalChange={setShowColumnModal}
              showSearchBar={true}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              showFilterButton={false}
              getRowClassName={() => "cursor-pointer hover:bg-gray-50"}
            />
          )}
        </>
      )}
    </PageTemplate>
  );
}
