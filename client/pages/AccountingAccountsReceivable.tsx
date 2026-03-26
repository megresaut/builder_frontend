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

interface OutstandingInvoice {
  invoice_id: number;
  invoice_number: string | null;
  property_id: number;
  property_name: string;
  invoice_date: string;
  total_cents: number;
  paid_cents: number;
  balance_cents: number;
  days_outstanding: number;
  status: string;
}

interface OutstandingInvoicesResponse {
  total_balance_cents: number;
  invoice_count: number;
  invoices: OutstandingInvoice[];
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

function getRowColorClass(daysOutstanding: number): string {
  if (daysOutstanding > 60) return "bg-red-50";
  if (daysOutstanding >= 30) return "bg-yellow-50";
  return "bg-green-50";
}

// ---------------------------------------------------------------------------
// Aging Report column definitions
// ---------------------------------------------------------------------------

const AGING_COLUMNS = [
  { key: "invoice_number", label: "Invoice #" },
  { key: "property_name", label: "Property" },
  { key: "total_cents", label: "Amount" },
  { key: "due_date", label: "Due Date" },
  { key: "days_overdue", label: "Days Overdue" },
  { key: "aging_bucket", label: "Aging Bucket" },
];

const DEFAULT_AGING_KEYS = AGING_COLUMNS.map((c) => c.key);

// ---------------------------------------------------------------------------
// Outstanding Balances column definitions
// ---------------------------------------------------------------------------

const OUTSTANDING_COLUMNS = [
  { key: "property_name", label: "Property" },
  { key: "invoice_number", label: "Invoice #" },
  { key: "invoice_date", label: "Date" },
  { key: "total_cents", label: "Total" },
  { key: "paid_cents", label: "Paid" },
  { key: "balance_cents", label: "Balance" },
  { key: "days_outstanding", label: "Days Outstanding" },
];

const DEFAULT_OUTSTANDING_KEYS = OUTSTANDING_COLUMNS.map((c) => c.key);

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type TabKey = "outstanding" | "aging";

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AccountingAccountsReceivable() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("outstanding");

  // Aging report state
  const [agingData, setAgingData] = useState<ARAgingSummary | null>(null);
  const [agingLoading, setAgingLoading] = useState(false);
  const [agingError, setAgingError] = useState<string | null>(null);

  // Outstanding balances state
  const [outstandingData, setOutstandingData] =
    useState<OutstandingInvoicesResponse | null>(null);
  const [outstandingLoading, setOutstandingLoading] = useState(false);
  const [outstandingError, setOutstandingError] = useState<string | null>(null);

  // Derived data (must be before hooks that depend on them)
  const agingInvoices = agingData?.invoices ?? [];
  const outstandingInvoices = outstandingData?.invoices ?? [];

  // Aging table state
  const [agingPage, setAgingPage] = usePageState("arAgingPage", 1);
  const [agingPerPage, setAgingPerPage] = usePageState("arAgingPerPage", 25);
  const [agingPageSizeDropdown, setAgingPageSizeDropdown] = useState(false);
  const [agingMenuId, setAgingMenuId] = useState<string | number | null>(null);
  const [agingColumnModal, setAgingColumnModal] = useState(false);
  const [agingSearch, setAgingSearch] = useState("");
  const agingSortingHook = useSortingTable(agingInvoices, "arAging");
  const agingColumnHook = useColumnManagement(DEFAULT_AGING_KEYS);

  // Outstanding table state
  const [outstandingPage, setOutstandingPage] = usePageState(
    "arOutstandingPage",
    1,
  );
  const [outstandingPerPage, setOutstandingPerPage] = usePageState(
    "arOutstandingPerPage",
    25,
  );
  const [outstandingPageSizeDropdown, setOutstandingPageSizeDropdown] =
    useState(false);
  const [outstandingMenuId, setOutstandingMenuId] = useState<
    string | number | null
  >(null);
  const [outstandingColumnModal, setOutstandingColumnModal] = useState(false);
  const [outstandingSearch, setOutstandingSearch] = useState("");
  const outstandingSortingHook = useSortingTable(outstandingInvoices, "arOutstanding");
  const outstandingColumnHook = useColumnManagement(DEFAULT_OUTSTANDING_KEYS);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "aging" && !agingData && !agingLoading) {
      loadAgingData();
    }
    if (activeTab === "outstanding" && !outstandingData && !outstandingLoading) {
      loadOutstandingData();
    }
  }, [activeTab]);

  // Load outstanding on mount
  useEffect(() => {
    loadOutstandingData();
  }, []);

  const loadAgingData = () => {
    setAgingLoading(true);
    setAgingError(null);
    accountingAPI
      .getARaging()
      .then((result: ARAgingSummary) => {
        setAgingData(result);
      })
      .catch((err: any) => {
        const msg = err?.message || "Failed to load AR aging data";
        toast.error(msg);
        setAgingError(msg);
        setAgingData(null);
      })
      .finally(() => setAgingLoading(false));
  };

  const loadOutstandingData = () => {
    setOutstandingLoading(true);
    setOutstandingError(null);
    accountingAPI
      .getAROutstandingInvoices()
      .then((result: OutstandingInvoicesResponse) => {
        setOutstandingData(result);
      })
      .catch((err: any) => {
        const msg = err?.message || "Failed to load outstanding invoices";
        toast.error(msg);
        setOutstandingError(msg);
        setOutstandingData(null);
      })
      .finally(() => setOutstandingLoading(false));
  };

  // ---------------------------------------------------------------------------
  // Aging tab rendering
  // ---------------------------------------------------------------------------

  const filteredAgingInvoices = agingSearch
    ? agingInvoices.filter(
        (inv) =>
          (inv.invoice_number ?? "")
            .toLowerCase()
            .includes(agingSearch.toLowerCase()) ||
          inv.property_name
            .toLowerCase()
            .includes(agingSearch.toLowerCase()) ||
          inv.aging_bucket
            .toLowerCase()
            .includes(agingSearch.toLowerCase()),
      )
    : agingInvoices;

  const chartData = agingData
    ? [
        {
          name: "Current (0-30)",
          amount: agingData.current_cents,
          fill: CHART_COLORS[0],
        },
        {
          name: "31-60 Days",
          amount: agingData.days_30_cents,
          fill: CHART_COLORS[1],
        },
        {
          name: "61-90 Days",
          amount: agingData.days_60_cents,
          fill: CHART_COLORS[2],
        },
        {
          name: "90+ Days",
          amount: agingData.days_90_plus_cents,
          fill: CHART_COLORS[3],
        },
      ]
    : [];

  const renderAgingCell = (row: ARInvoice, columnKey: string) => {
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
        return (
          <span className="text-gray-600">{formatDate(row.due_date)}</span>
        );
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

  // ---------------------------------------------------------------------------
  // Outstanding tab rendering
  // ---------------------------------------------------------------------------

  const filteredOutstandingInvoices = outstandingSearch
    ? outstandingInvoices.filter(
        (inv) =>
          (inv.invoice_number ?? "")
            .toLowerCase()
            .includes(outstandingSearch.toLowerCase()) ||
          inv.property_name
            .toLowerCase()
            .includes(outstandingSearch.toLowerCase()),
      )
    : outstandingInvoices;

  const renderOutstandingCell = (
    row: OutstandingInvoice,
    columnKey: string,
  ) => {
    switch (columnKey) {
      case "property_name":
        return <span className="text-gray-700">{row.property_name}</span>;
      case "invoice_number":
        return (
          <span className="font-medium text-gray-900">
            {row.invoice_number || "-"}
          </span>
        );
      case "invoice_date":
        return (
          <span className="text-gray-600">{formatDate(row.invoice_date)}</span>
        );
      case "total_cents":
        return (
          <span className="font-mono text-gray-900">
            {formatCents(row.total_cents)}
          </span>
        );
      case "paid_cents":
        return (
          <span className="font-mono text-gray-500">
            {formatCents(row.paid_cents)}
          </span>
        );
      case "balance_cents":
        return (
          <span className="font-mono font-semibold text-gray-900">
            {formatCents(row.balance_cents)}
          </span>
        );
      case "days_outstanding": {
        let colorClass = "text-green-600";
        if (row.days_outstanding > 60) colorClass = "text-red-600";
        else if (row.days_outstanding >= 30) colorClass = "text-yellow-600";
        return (
          <span className={`font-medium ${colorClass}`}>
            {row.days_outstanding}d
          </span>
        );
      }
      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Tab component
  // ---------------------------------------------------------------------------

  const TABS: { key: TabKey; label: string }[] = [
    { key: "outstanding", label: "Outstanding Balances" },
    { key: "aging", label: "Aging Report" },
  ];

  return (
    <PageTemplate>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Accounts Receivable
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track outstanding balances and aging across all properties
        </p>
      </div>

      {/* Tab switcher */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ================================================================= */}
      {/* Outstanding Balances Tab                                          */}
      {/* ================================================================= */}
      {activeTab === "outstanding" && (
        <>
          {/* Loading */}
          {outstandingLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Error */}
          {outstandingError && !outstandingLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-6">
              {outstandingError}
            </div>
          )}

          {/* Content */}
          {!outstandingLoading && outstandingData && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg shadow-sm p-5">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCents(outstandingData.total_balance_cents)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Total Outstanding
                  </div>
                </div>
                <div className="bg-gray-50 border-l-4 border-gray-400 rounded-lg shadow-sm p-5">
                  <div className="text-2xl font-bold text-gray-900">
                    {outstandingData.invoice_count}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Unpaid Invoices
                  </div>
                </div>
                <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg shadow-sm p-5">
                  <div className="text-2xl font-bold text-gray-900">
                    {outstandingData.invoice_count > 0
                      ? Math.round(
                          outstandingInvoices.reduce(
                            (sum, inv) => sum + inv.days_outstanding,
                            0,
                          ) / outstandingData.invoice_count,
                        )
                      : 0}
                    d
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Avg Days Outstanding
                  </div>
                </div>
              </div>

              {/* Invoice table */}
              {filteredOutstandingInvoices.length === 0 &&
              !outstandingSearch ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  No outstanding invoices.
                </div>
              ) : (
                <GlobalTable
                  columns={OUTSTANDING_COLUMNS}
                  data={filteredOutstandingInvoices}
                  rowKey="invoice_id"
                  onRowClick={(row) =>
                    navigate(`/accounting/invoices/${row.invoice_id}`)
                  }
                  renderCell={renderOutstandingCell}
                  sortingHook={outstandingSortingHook}
                  columnManagementHook={outstandingColumnHook}
                  currentPage={outstandingPage}
                  onPageChange={setOutstandingPage}
                  itemsPerPage={outstandingPerPage}
                  onItemsPerPageChange={setOutstandingPerPage}
                  showPageSizeDropdown={outstandingPageSizeDropdown}
                  onShowPageSizeDropdownChange={setOutstandingPageSizeDropdown}
                  openMenuId={outstandingMenuId}
                  onOpenMenuIdChange={setOutstandingMenuId}
                  title="Outstanding Invoices"
                  showColumnModal={outstandingColumnModal}
                  onShowColumnModalChange={setOutstandingColumnModal}
                  showSearchBar={true}
                  searchValue={outstandingSearch}
                  onSearchChange={setOutstandingSearch}
                  showFilterButton={false}
                  getRowClassName={(row: OutstandingInvoice) =>
                    `cursor-pointer hover:bg-gray-50 ${getRowColorClass(row.days_outstanding)}`
                  }
                />
              )}
            </>
          )}
        </>
      )}

      {/* ================================================================= */}
      {/* Aging Report Tab                                                  */}
      {/* ================================================================= */}
      {activeTab === "aging" && (
        <>
          {/* Loading */}
          {agingLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Error */}
          {agingError && !agingLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-6">
              {agingError}
            </div>
          )}

          {/* Content */}
          {!agingLoading && agingData && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-green-50 border-l-4 border-green-400 rounded-lg shadow-sm p-5">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCents(agingData.current_cents)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Current (0-30 days)
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg shadow-sm p-5">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCents(agingData.days_30_cents)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">31-60 Days</div>
                </div>
                <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg shadow-sm p-5">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCents(agingData.days_60_cents)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">61-90 Days</div>
                </div>
                <div className="bg-red-50 border-l-4 border-red-400 rounded-lg shadow-sm p-5">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCents(agingData.days_90_plus_cents)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">90+ Days</div>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg shadow-sm p-5">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCents(agingData.total_cents)}
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
              {filteredAgingInvoices.length === 0 && !agingSearch ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  No outstanding invoices.
                </div>
              ) : (
                <GlobalTable
                  columns={AGING_COLUMNS}
                  data={filteredAgingInvoices}
                  rowKey="invoice_id"
                  onRowClick={(row) =>
                    navigate(`/accounting/invoices/${row.invoice_id}`)
                  }
                  renderCell={renderAgingCell}
                  sortingHook={agingSortingHook}
                  columnManagementHook={agingColumnHook}
                  currentPage={agingPage}
                  onPageChange={setAgingPage}
                  itemsPerPage={agingPerPage}
                  onItemsPerPageChange={setAgingPerPage}
                  showPageSizeDropdown={agingPageSizeDropdown}
                  onShowPageSizeDropdownChange={setAgingPageSizeDropdown}
                  openMenuId={agingMenuId}
                  onOpenMenuIdChange={setAgingMenuId}
                  title="Outstanding Invoices"
                  showColumnModal={agingColumnModal}
                  onShowColumnModalChange={setAgingColumnModal}
                  showSearchBar={true}
                  searchValue={agingSearch}
                  onSearchChange={setAgingSearch}
                  showFilterButton={false}
                  getRowClassName={() => "cursor-pointer hover:bg-gray-50"}
                />
              )}
            </>
          )}
        </>
      )}
    </PageTemplate>
  );
}
