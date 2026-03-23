import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import ReconciliationProgressBar from "@/components/accounting/ReconciliationProgressBar";
import TransactionTagForm from "@/components/accounting/TransactionTagForm";
import BulkTagModal from "@/components/accounting/BulkTagModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatementDetail {
  id: number;
  account_name: string;
  statement_month: string;
  status: string;
  total_transactions: number;
  tagged_transactions: number;
  total_amount_cents: number;
}

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount_cents: number;
  status: string;
  property_id?: number;
  property_name?: string;
  vendor_id?: number;
  vendor_name?: string;
  expense_category?: string;
  memo?: string;
  receipt_object_key?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return sign + "$" + (Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMonth(monthStr: string): string {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AccountingStatementReconcile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const statementId = Number(id);

  const [statement, setStatement] = useState<StatementDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [locking, setLocking] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([
      accountingAPI.getStatement(statementId),
      accountingAPI.getTransactions({ statement_id: statementId }),
    ])
      .then(([stmtData, txnData]) => {
        setStatement(stmtData);
        setTransactions(txnData || []);
      })
      .catch((err) => toast.error(err.message || "Failed to load statement"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (statementId) loadData();
  }, [statementId]);

  const handleLock = async () => {
    if (!confirm("Lock this statement? This prevents further changes.")) return;
    setLocking(true);
    try {
      await accountingAPI.lockStatement(statementId);
      toast.success("Statement locked");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to lock");
    } finally {
      setLocking(false);
    }
  };

  const handleExclude = async (txnId: number) => {
    try {
      await accountingAPI.excludeTransaction(txnId);
      toast.success("Transaction excluded");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to exclude");
    }
  };

  const toggleCheck = (txnId: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(txnId)) next.delete(txnId);
      else next.add(txnId);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === filteredTransactions.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const filteredTransactions = statusFilter
    ? transactions.filter((t) => t.status === statusFilter)
    : transactions;

  const taggedCount = transactions.filter((t) => t.status === "tagged").length;
  const isLocked = statement?.status === "locked";

  if (loading) {
    return (
      <PageTemplate>
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">Loading statement...</span>
        </div>
      </PageTemplate>
    );
  }

  if (!statement) {
    return (
      <PageTemplate>
        <div className="text-center py-12">
          <p className="text-gray-500">Statement not found</p>
          <button
            onClick={() => navigate("/accounting/statements")}
            className="mt-4 px-4 py-2 text-sm text-blue-600 hover:underline"
          >
            Back to Statements
          </button>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate>
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <button
            onClick={() => navigate("/accounting/statements")}
            className="text-sm text-blue-600 hover:underline mb-1"
          >
            &larr; Back to Statements
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {statement.account_name} &mdash; {formatMonth(statement.statement_month)}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-gray-500">
              Total: {formatCents(statement.total_amount_cents)}
            </span>
            {isLocked && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                Locked
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ReconciliationProgressBar
            taggedCount={taggedCount}
            totalCount={transactions.length}
          />
          {!isLocked && (
            <button
              onClick={handleLock}
              disabled={locking}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {locking ? "Locking..." : "Lock Statement"}
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {checkedIds.size > 0 && !isLocked && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-800 font-medium">
            {checkedIds.size} selected
          </span>
          <button
            onClick={() => setBulkTagOpen(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tag Selected
          </button>
          <button
            onClick={() => setCheckedIds(new Set())}
            className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900"
          >
            Clear
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          <option value="untagged">Untagged</option>
          <option value="tagged">Tagged</option>
          <option value="excluded">Excluded</option>
        </select>
      </div>

      {/* Split Layout */}
      <div className="flex gap-6" style={{ minHeight: "500px" }}>
        {/* Left: Transaction List */}
        <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="border-b border-gray-200">
                {!isLocked && (
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={checkedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                )}
                <th className="text-left px-3 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Description</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Property</th>
                <th className="text-right px-3 py-3 font-medium text-gray-500">Amount</th>
                {!isLocked && (
                  <th className="w-16 px-3 py-3" />
                )}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={isLocked ? 5 : 7} className="text-center py-8 text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => {
                  const isSelected = selectedTxn?.id === txn.id;
                  const statusColors: Record<string, string> = {
                    untagged: "bg-yellow-100 text-yellow-800",
                    tagged: "bg-green-100 text-green-800",
                    excluded: "bg-gray-100 text-gray-500",
                  };
                  return (
                    <tr
                      key={txn.id}
                      onClick={() => !isLocked && setSelectedTxn(txn)}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                      } ${txn.status === "excluded" ? "opacity-50" : ""}`}
                    >
                      {!isLocked && (
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checkedIds.has(txn.id)}
                            onChange={() => toggleCheck(txn.id)}
                            className="rounded"
                          />
                        </td>
                      )}
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(txn.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="px-3 py-3 text-gray-900 max-w-[250px] truncate">
                        {txn.description}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[txn.status] || "bg-gray-100 text-gray-700"}`}>
                          {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600 text-xs">
                        {txn.property_name || "-"}
                      </td>
                      <td className={`px-3 py-3 text-right font-medium whitespace-nowrap ${txn.amount_cents < 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCents(txn.amount_cents)}
                      </td>
                      {!isLocked && (
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          {txn.status !== "excluded" && (
                            <button
                              onClick={() => handleExclude(txn.id)}
                              className="text-xs text-gray-400 hover:text-red-500"
                              title="Exclude transaction"
                            >
                              Exclude
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Right: Tag Form */}
        {!isLocked && (
          <div className="w-[360px] flex-shrink-0 border border-gray-200 rounded-lg p-5 overflow-auto">
            {selectedTxn ? (
              <TransactionTagForm
                transaction={selectedTxn}
                onSaved={() => {
                  loadData();
                  setSelectedTxn(null);
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className="text-sm">Select a transaction to tag</p>
              </div>
            )}
          </div>
        )}
      </div>

      <BulkTagModal
        open={bulkTagOpen}
        onOpenChange={setBulkTagOpen}
        selectedIds={Array.from(checkedIds)}
        onSuccess={() => {
          loadData();
          setCheckedIds(new Set());
        }}
      />
    </PageTemplate>
  );
}
