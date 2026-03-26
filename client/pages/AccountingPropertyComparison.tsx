import { useState, useEffect } from "react";
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
  Legend,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExpenseBreakdown {
  category: string;
  amount_cents: number;
}

interface PropertyRow {
  property_id: number;
  property_name: string;
  total_expenses_cents: number;
  total_invoiced_cents: number;
  total_markup_cents: number;
  total_mgmt_fee_cents: number;
  total_revenue_cents: number;
  expense_breakdown: ExpenseBreakdown[];
}

interface PropertyComparison {
  properties: PropertyRow[];
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

function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-900">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {formatCents(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const COLUMNS = [
  { key: "property_name", label: "Property" },
  { key: "total_expenses_cents", label: "Total Expenses" },
  { key: "total_markup_cents", label: "Markup Revenue" },
  { key: "total_mgmt_fee_cents", label: "Mgmt Fee" },
  { key: "total_revenue_cents", label: "Total Revenue" },
  { key: "total_invoiced_cents", label: "Invoiced" },
];

const DEFAULT_COLUMN_KEYS = COLUMNS.map((c) => c.key);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AccountingPropertyComparison() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<PropertyComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Table state
  const [currentPage, setCurrentPage] = usePageState("propCompPage", 1);
  const [itemsPerPage, setItemsPerPage] = usePageState("propCompPerPage", 25);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const columnManagementHook = useColumnManagement(DEFAULT_COLUMN_KEYS);

  const loadData = (m: string) => {
    setLoading(true);
    setError(null);
    accountingAPI
      .getPropertyComparison(m)
      .then((result: PropertyComparison) => {
        setData(result);
      })
      .catch((err: any) => {
        const msg = err?.message || "Failed to load property comparison";
        toast.error(msg);
        setError(msg);
        setData(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData(month);
  }, [month]);

  const properties = data?.properties ?? [];
  const filteredProperties = searchValue
    ? properties.filter((p) =>
        p.property_name.toLowerCase().includes(searchValue.toLowerCase()),
      )
    : properties;

  const sortingHook = useSortingTable(filteredProperties, "propComp");

  // Chart data
  const chartData = properties.map((p) => ({
    name:
      p.property_name.length > 18
        ? p.property_name.slice(0, 16) + "..."
        : p.property_name,
    Expenses: p.total_expenses_cents,
    Markup: p.total_markup_cents,
    "Mgmt Fee": p.total_mgmt_fee_cents,
  }));

  const renderCell = (row: PropertyRow, columnKey: string) => {
    switch (columnKey) {
      case "property_name":
        return (
          <span className="font-medium text-gray-900">
            {row.property_name}
          </span>
        );
      case "total_expenses_cents":
        return (
          <span className="font-mono text-gray-900">
            {formatCents(row.total_expenses_cents)}
          </span>
        );
      case "total_markup_cents":
        return (
          <span className="font-mono text-gray-900">
            {formatCents(row.total_markup_cents)}
          </span>
        );
      case "total_mgmt_fee_cents":
        return (
          <span className="font-mono text-gray-900">
            {formatCents(row.total_mgmt_fee_cents)}
          </span>
        );
      case "total_revenue_cents":
        return (
          <span className="font-mono font-semibold text-gray-900">
            {formatCents(row.total_revenue_cents)}
          </span>
        );
      case "total_invoiced_cents":
        return (
          <span className="font-mono text-gray-900">
            {formatCents(row.total_invoiced_cents)}
          </span>
        );
      default:
        return null;
    }
  };

  const handleRowClick = (row: PropertyRow) => {
    setExpandedId(expandedId === row.property_id ? null : row.property_id);
  };

  // Find the expanded row for rendering detail below the table
  const expandedProperty = expandedId
    ? properties.find((p) => p.property_id === expandedId)
    : null;

  return (
    <PageTemplate>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Property Financial Comparison
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Compare financial performance across properties
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
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

      {/* Empty state */}
      {!loading && !error && properties.length === 0 && (
        <div className="text-center py-16 text-gray-500 text-sm">
          No property data available for this month.
        </div>
      )}

      {/* Content */}
      {!loading && properties.length > 0 && (
        <>
          {/* Grouped bar chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue & Expenses by Property
            </h2>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                >
                  <XAxis
                    dataKey="name"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    height={80}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      `$${(v / 100).toLocaleString()}`
                    }
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    width={80}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="Expenses"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Markup"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Mgmt Fee"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary table */}
          <GlobalTable
            columns={COLUMNS}
            data={filteredProperties}
            rowKey="property_id"
            onRowClick={handleRowClick}
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
            title="Property Summary"
            subtitle="Click a row to view expense breakdown"
            showColumnModal={showColumnModal}
            onShowColumnModalChange={setShowColumnModal}
            showSearchBar={true}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            showFilterButton={false}
            getRowClassName={(row) =>
              `cursor-pointer hover:bg-gray-50 ${
                expandedId === row.property_id ? "bg-blue-50" : ""
              }`
            }
          />

          {/* Expanded expense breakdown */}
          {expandedProperty && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 mt-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Expense Breakdown: {expandedProperty.property_name}
              </h3>
              {expandedProperty.expense_breakdown.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No expense breakdown available.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-500">
                        Category
                      </th>
                      <th className="text-right py-2 font-medium text-gray-500">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expandedProperty.expense_breakdown.map((item, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-2 text-gray-700">{item.category}</td>
                        <td className="py-2 text-right font-mono text-gray-900">
                          {formatCents(item.amount_cents)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-gray-300">
                      <td className="py-2 font-semibold text-gray-900">
                        Total
                      </td>
                      <td className="py-2 text-right font-semibold font-mono text-gray-900">
                        {formatCents(expandedProperty.total_expenses_cents)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </PageTemplate>
  );
}
