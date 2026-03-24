import { useState, useEffect } from "react";
import { accountingAPI } from "@/api/accounting";
import { fetchJSON } from "@/api/fetchJSON";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
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

interface RevenueExpenseRow {
  category: string;
  amount_cents: number;
}

interface IncomeStatement {
  period: string;
  revenue: RevenueExpenseRow[];
  expenses: RevenueExpenseRow[];
  total_revenue_cents: number;
  total_expenses_cents: number;
  net_income_cents: number;
}

interface Property {
  id: number;
  name: string;
  address?: string;
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
// Main
// ---------------------------------------------------------------------------

export default function AccountingPnL() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [startMonth, setStartMonth] = useState(currentMonth);
  const [endMonth, setEndMonth] = useState(currentMonth);
  const [propertyId, setPropertyId] = useState<number | undefined>(undefined);
  const [properties, setProperties] = useState<Property[]>([]);

  const [data, setData] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load properties for the dropdown
  useEffect(() => {
    fetchJSON("/properties")
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.properties ?? [];
        setProperties(
          list.map((p: any) => ({
            id: p.id,
            name: p.name || p.address || `Property ${p.id}`,
          })),
        );
      })
      .catch(() => {});
  }, []);

  const runReport = () => {
    setLoading(true);
    setError(null);
    accountingAPI
      .getIncomeStatement(startMonth, endMonth, propertyId)
      .then((result: IncomeStatement) => {
        setData(result);
      })
      .catch((err: any) => {
        const msg = err?.message || "Failed to load income statement";
        toast.error(msg);
        setError(msg);
        setData(null);
      })
      .finally(() => setLoading(false));
  };

  // Chart data
  const chartData = data
    ? [
        {
          name: data.period || "Period",
          Revenue: data.total_revenue_cents,
          Expenses: data.total_expenses_cents,
        },
      ]
    : [];

  const netIncome = data?.net_income_cents ?? 0;
  const isPositive = netIncome >= 0;

  return (
    <PageTemplate>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Income Statement
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Profit & Loss report for the selected period
          </p>
        </div>

        {/* Net Income card (top right) */}
        {data && (
          <div
            className={`rounded-lg border-l-4 px-6 py-4 shadow-sm ${
              isPositive
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50"
            }`}
          >
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Net Income
            </div>
            <div
              className={`text-2xl font-bold ${isPositive ? "text-green-700" : "text-red-700"}`}
            >
              {isPositive ? "" : "-"}
              {formatCents(netIncome)}
            </div>
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-end gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Month
          </label>
          <input
            type="month"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Month
          </label>
          <input
            type="month"
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property
          </label>
          <select
            value={propertyId ?? ""}
            onChange={(e) =>
              setPropertyId(e.target.value ? Number(e.target.value) : undefined)
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[200px]"
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={runReport}
          disabled={loading}
          className="px-5 py-2 bg-[#013764] text-white text-sm font-medium rounded-lg hover:bg-[#003a73] transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Run Report"}
        </button>
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
      {!loading && !error && !data && (
        <div className="text-center py-16 text-gray-500 text-sm">
          Select a date range and click "Run Report" to generate the income
          statement.
        </div>
      )}

      {/* Results */}
      {!loading && data && (
        <>
          {/* Revenue vs Expenses chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue vs Expenses
            </h2>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} />
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
                    dataKey="Revenue"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Expenses"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Income Statement table */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Income Statement Detail
            </h2>
            <table className="w-full text-sm">
              <tbody>
                {/* REVENUE header */}
                <tr>
                  <td
                    colSpan={2}
                    className="pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-gray-500"
                  >
                    Revenue
                  </td>
                </tr>

                {data.revenue.length === 0 ? (
                  <tr>
                    <td className="pl-6 py-1 text-gray-400 italic">
                      No revenue items
                    </td>
                    <td className="text-right py-1 text-gray-400">$0.00</td>
                  </tr>
                ) : (
                  data.revenue.map((item, i) => (
                    <tr key={`rev-${i}`} className="hover:bg-gray-50">
                      <td className="pl-6 py-1.5 text-gray-700">
                        {item.category}
                      </td>
                      <td className="text-right py-1.5 font-mono text-gray-900">
                        {formatCents(item.amount_cents)}
                      </td>
                    </tr>
                  ))
                )}

                {/* Revenue total */}
                <tr className="border-t border-gray-300">
                  <td className="py-2 font-semibold text-gray-900">
                    Total Revenue
                  </td>
                  <td className="text-right py-2 font-semibold font-mono text-gray-900">
                    {formatCents(data.total_revenue_cents)}
                  </td>
                </tr>

                {/* Spacer */}
                <tr>
                  <td colSpan={2} className="py-3" />
                </tr>

                {/* EXPENSES header */}
                <tr>
                  <td
                    colSpan={2}
                    className="pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-gray-500"
                  >
                    Expenses
                  </td>
                </tr>

                {data.expenses.length === 0 ? (
                  <tr>
                    <td className="pl-6 py-1 text-gray-400 italic">
                      No expense items
                    </td>
                    <td className="text-right py-1 text-gray-400">$0.00</td>
                  </tr>
                ) : (
                  data.expenses.map((item, i) => (
                    <tr key={`exp-${i}`} className="hover:bg-gray-50">
                      <td className="pl-6 py-1.5 text-gray-700">
                        {item.category}
                      </td>
                      <td className="text-right py-1.5 font-mono text-gray-900">
                        {formatCents(item.amount_cents)}
                      </td>
                    </tr>
                  ))
                )}

                {/* Expenses total */}
                <tr className="border-t border-gray-300">
                  <td className="py-2 font-semibold text-gray-900">
                    Total Expenses
                  </td>
                  <td className="text-right py-2 font-semibold font-mono text-gray-900">
                    {formatCents(data.total_expenses_cents)}
                  </td>
                </tr>

                {/* Spacer */}
                <tr>
                  <td colSpan={2} className="py-3" />
                </tr>

                {/* NET INCOME */}
                <tr className="border-t-2 border-gray-800">
                  <td className="py-3 text-lg font-bold text-gray-900">
                    Net Income
                  </td>
                  <td
                    className={`text-right py-3 text-lg font-bold font-mono ${
                      isPositive ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {isPositive ? "" : "-"}
                    {formatCents(netIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageTemplate>
  );
}
