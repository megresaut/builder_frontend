import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import StatementUploadModal from "@/components/accounting/StatementUploadModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardSummary {
  total_expenses_cents: number;
  total_invoiced_cents: number;
  outstanding_ar_cents: number;
  pending_statements: number;
  reconciled_pct: number;
}

interface OutstandingInvoice {
  id: number;
  property_id: number;
  property_name: string;
  invoice_month: string;
  total_cents: number;
  status: string;
  created_at: string;
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
  return "$" + (Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMonth(monthStr: string): string {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

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
    <div className={`bg-white rounded-lg shadow-sm border-l-4 p-5 ${accentColor}`}>
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AccountingDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
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
    setOutstandingLoading(true);
    setExpensesLoading(true);

    accountingAPI
      .getDashboardSummary(month)
      .then((data) => setSummary(data))
      .catch((err) => toast.error(err.message || "Failed to load summary"))
      .finally(() => setSummaryLoading(false));

    accountingAPI
      .getOutstandingInvoices()
      .then((data) => setOutstanding(data || []))
      .catch((err) => toast.error(err.message || "Failed to load invoices"))
      .finally(() => setOutstandingLoading(false));

    accountingAPI
      .getExpensesByCategory(month)
      .then((data) => setExpenses(data || []))
      .catch((err) => toast.error(err.message || "Failed to load expenses"))
      .finally(() => setExpensesLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [month]);

  return (
    <PageTemplate>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Accounting Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Portfolio-wide financial overview</p>
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
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border-l-4 border-gray-200 p-5 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            label="Outstanding AR"
            value={formatCents(summary.outstanding_ar_cents)}
            accentColor="border-yellow-400"
          />
          <SummaryCard
            label="Pending Statements"
            value={summary.pending_statements}
            subtitle={`${summary.reconciled_pct}% reconciled`}
            accentColor="border-green-400"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Expenses by Category
          </h2>
          {expensesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-sm text-gray-500">No expense data for this period.</p>
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => {
                const maxCents = Math.max(...expenses.map((e) => e.total_cents), 1);
                const pct = Math.round((exp.total_cents / maxCents) * 100);
                return (
                  <div key={exp.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{exp.category || "Uncategorized"}</span>
                      <span className="text-gray-900 font-medium">
                        {formatCents(exp.total_cents)}{" "}
                        <span className="text-gray-400 font-normal">({exp.transaction_count})</span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
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
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : outstanding.length === 0 ? (
            <p className="text-sm text-gray-500">No outstanding invoices.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-500">Property</th>
                    <th className="text-left py-2 font-medium text-gray-500">Month</th>
                    <th className="text-left py-2 font-medium text-gray-500">Status</th>
                    <th className="text-right py-2 font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {outstanding.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 text-gray-900">{inv.property_name}</td>
                      <td className="py-2 text-gray-600">{formatMonth(inv.invoice_month)}</td>
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
