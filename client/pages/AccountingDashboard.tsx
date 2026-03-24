import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import ReconciliationProgressBar from "@/components/accounting/ReconciliationProgressBar";
import StatementUploadModal from "@/components/accounting/StatementUploadModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardSummary {
  total_expenses_cents: number;
  total_invoiced_cents: number;
  total_markup_cents: number;
  total_outstanding_cents: number;
  total_paid_cents: number;
  pending_statements: number;
  reconciled_pct: number;
}

interface ReconciliationRow {
  statement_id: number;
  account_name: string;
  statement_month: string;
  total_transactions: number;
  tagged_transactions: number;
  status: string;
}

interface RevenueRow {
  property_id: number;
  property_name: string;
  revenue_cents: number;
}

interface OutstandingInvoice {
  id: number;
  property_id: number;
  property_name: string;
  invoice_month: string;
  total_cents: number;
  status: string;
  created_at: string;
  days_overdue?: number;
}

interface ExpenseCategory {
  category: string;
  total_cents: number;
  transaction_count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  return (
    "$" +
    (Math.abs(cents) / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatMonth(monthStr: string): string {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const PIE_COLORS = ["#22c55e", "#f59e0b"];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  subtitle,
  accentColor,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  accentColor: string;
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-l-4 p-5 ${accentColor}`}
    >
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
      {subtitle && (
        <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    sent: "bg-blue-100 text-blue-800",
    voided: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function SkeletonCards({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-sm border-l-4 border-gray-200 p-5 animate-pulse"
        >
          <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
      ))}
    </div>
  );
}

// Custom tooltip for currency values in charts
function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-900">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {formatCents(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AccountingDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [reconciliation, setReconciliation] = useState<ReconciliationRow[]>([]);
  const [reconciliationLoading, setReconciliationLoading] = useState(true);
  const [revenue, setRevenue] = useState<RevenueRow[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [outstanding, setOutstanding] = useState<OutstandingInvoice[]>([]);
  const [outstandingLoading, setOutstandingLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseCategory[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const loadData = () => {
    setSummaryLoading(true);
    setReconciliationLoading(true);
    setRevenueLoading(true);
    setOutstandingLoading(true);
    setExpensesLoading(true);

    Promise.all([
      accountingAPI
        .getDashboardSummary(month)
        .then((data) => setSummary(data))
        .catch((err) => {
          toast.error(err.message || "Failed to load summary");
          setSummary(null);
        })
        .finally(() => setSummaryLoading(false)),

      accountingAPI
        .getReconciliationStatus()
        .then((data) => setReconciliation(data || []))
        .catch(() => setReconciliation([]))
        .finally(() => setReconciliationLoading(false)),

      accountingAPI
        .getRevenueBreakdown(month)
        .then((data) => setRevenue(data || []))
        .catch(() => setRevenue([]))
        .finally(() => setRevenueLoading(false)),

      accountingAPI
        .getOutstandingInvoices()
        .then((data) => setOutstanding(data || []))
        .catch((err) => {
          toast.error(err.message || "Failed to load invoices");
          setOutstanding([]);
        })
        .finally(() => setOutstandingLoading(false)),

      accountingAPI
        .getExpensesByCategory(month)
        .then((data) => setExpenses(data || []))
        .catch((err) => {
          toast.error(err.message || "Failed to load expenses");
          setExpenses([]);
        })
        .finally(() => setExpensesLoading(false)),
    ]);
  };

  useEffect(() => {
    loadData();
  }, [month]);

  // Prepare pie chart data for paid vs outstanding
  const pieData =
    summary
      ? [
          { name: "Paid", value: summary.total_paid_cents },
          { name: "Outstanding", value: summary.total_outstanding_cents },
        ].filter((d) => d.value > 0)
      : [];

  // Prepare bar chart data (cents to dollars for display)
  const revenueChartData = revenue.map((r) => ({
    name:
      r.property_name.length > 18
        ? r.property_name.slice(0, 16) + "..."
        : r.property_name,
    revenue: r.revenue_cents,
  }));

  return (
    <PageTemplate>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Accounting Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Portfolio-wide financial overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={() => setUploadOpen(true)}
            className="px-4 py-2 bg-[#013764] text-white text-sm font-medium rounded-lg hover:bg-[#003a73] transition-colors"
          >
            Upload Statement
          </button>
          <Link
            to="/accounting/statements"
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Statements
          </Link>
        </div>
      </div>

      {/* Summary Cards — 6 cards */}
      {summaryLoading ? (
        <SkeletonCards count={6} />
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <SummaryCard
            label="Total Expenses"
            value={formatCents(summary.total_expenses_cents)}
            subtitle={formatMonth(month)}
            accentColor="border-red-400"
          />
          <SummaryCard
            label="Total Invoiced"
            value={formatCents(summary.total_invoiced_cents)}
            subtitle={formatMonth(month)}
            accentColor="border-blue-400"
          />
          <SummaryCard
            label="Markup Revenue"
            value={formatCents(summary.total_markup_cents)}
            subtitle={formatMonth(month)}
            accentColor="border-purple-400"
          />
          <SummaryCard
            label="Outstanding AR"
            value={formatCents(summary.total_outstanding_cents)}
            accentColor="border-yellow-400"
          />
          <SummaryCard
            label="Paid"
            value={formatCents(summary.total_paid_cents)}
            accentColor="border-green-400"
          />
          <SummaryCard
            label="Pending Statements"
            value={summary.pending_statements}
            subtitle={`${summary.reconciled_pct}% reconciled`}
            accentColor="border-gray-400"
          />
        </div>
      ) : null}

      {/* Charts Row — Revenue by Property bar chart + Paid vs Outstanding donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Property */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue by Property
          </h2>
          {revenueLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : revenueChartData.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No revenue data for this period.
            </p>
          ) : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueChartData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
                >
                  <XAxis
                    dataKey="name"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    height={70}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 100).toLocaleString()}`}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    width={70}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Paid vs Outstanding Donut */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Paid vs Outstanding
          </h2>
          {summaryLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : pieData.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No invoice data available.
            </p>
          ) : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) =>
                      `${name}: ${formatCents(value)}`
                    }
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCents(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Reconciliation Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Reconciliation Status
        </h2>
        {reconciliationLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 bg-gray-100 rounded animate-pulse"
              />
            ))}
          </div>
        ) : reconciliation.length === 0 ? (
          <p className="text-sm text-gray-500">No statements to reconcile.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-500">
                    Account
                  </th>
                  <th className="text-left py-2 font-medium text-gray-500">
                    Month
                  </th>
                  <th className="text-left py-2 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left py-2 font-medium text-gray-500 w-1/3">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody>
                {reconciliation.map((row) => {
                  const statusColors: Record<string, string> = {
                    pending: "bg-yellow-100 text-yellow-800",
                    in_progress: "bg-blue-100 text-blue-800",
                    reconciled: "bg-green-100 text-green-800",
                    locked: "bg-gray-100 text-gray-700",
                  };
                  const label = row.status
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <tr
                      key={row.statement_id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/accounting/statements/${row.statement_id}`)
                      }
                    >
                      <td className="py-2 text-gray-900">
                        {row.account_name}
                      </td>
                      <td className="py-2 text-gray-600">
                        {formatMonth(row.statement_month)}
                      </td>
                      <td className="py-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[row.status] || "bg-gray-100 text-gray-700"}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="py-2">
                        <ReconciliationProgressBar
                          taggedCount={row.tagged_transactions}
                          totalCount={row.total_transactions}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom row: Expenses by Category + Outstanding Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Expenses by Category
          </h2>
          {expensesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-6 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-sm text-gray-500">
              No expense data for this period.
            </p>
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => {
                const maxCents = Math.max(
                  ...expenses.map((e) => e.total_cents),
                  1,
                );
                const pct = Math.round((exp.total_cents / maxCents) * 100);
                return (
                  <div key={exp.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">
                        {exp.category || "Uncategorized"}
                      </span>
                      <span className="text-gray-900 font-medium">
                        {formatCents(exp.total_cents)}{" "}
                        <span className="text-gray-400 font-normal">
                          ({exp.transaction_count})
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#013764] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Outstanding Invoices */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Outstanding Invoices
          </h2>
          {outstandingLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : outstanding.length === 0 ? (
            <p className="text-sm text-gray-500">No outstanding invoices.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-500">
                      Property
                    </th>
                    <th className="text-left py-2 font-medium text-gray-500">
                      Month
                    </th>
                    <th className="text-left py-2 font-medium text-gray-500">
                      Days Overdue
                    </th>
                    <th className="text-left py-2 font-medium text-gray-500">
                      Status
                    </th>
                    <th className="text-right py-2 font-medium text-gray-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {outstanding.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 text-gray-900">
                        {inv.property_name}
                      </td>
                      <td className="py-2 text-gray-600">
                        {formatMonth(inv.invoice_month)}
                      </td>
                      <td className="py-2">
                        {inv.days_overdue != null && inv.days_overdue > 0 ? (
                          <span className="text-red-600 font-medium">
                            {inv.days_overdue}d
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        {formatCents(inv.total_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <StatementUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={loadData}
      />
    </PageTemplate>
  );
}
