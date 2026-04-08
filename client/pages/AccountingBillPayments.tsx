import { useState, useEffect } from "react";
import { accountingAPI } from "@/api/accounting";
import { fetchJSON } from "@/api/fetchJSON";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import SyncBillPaymentModal, {
  type BillPaymentRow,
} from "@/components/accounting/SyncBillPaymentModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BillPayment extends BillPaymentRow {
  vendor_id: number;
  property_id: number;
  status: string;
  qbo_bill_id: string | null;
  qbo_payment_id: string | null;
  qbo_synced: boolean;
  qbo_sync_error: string | null;
  qbo_synced_at: string | null;
}

interface Property {
  id: number;
  name: string;
}

interface Vendor {
  id: number;
  name: string;
}

type QBOSyncFilter = "all" | "unsynced" | "synced" | "failed";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function QBOStatusBadge({
  synced,
  error,
  billId,
}: {
  synced: boolean;
  error: string | null;
  billId: string | null;
}) {
  if (synced) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Synced{billId ? ` · ${billId}` : ""}
      </span>
    );
  }
  if (error) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 cursor-help"
        title={error}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Not Synced
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AccountingBillPayments() {
  const [billPayments, setBillPayments] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Filters
  const [propertyId, setPropertyId] = useState<number | "">("");
  const [vendorId, setVendorId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [syncFilter, setSyncFilter] = useState<QBOSyncFilter>("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Modal
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncTargets, setSyncTargets] = useState<BillPaymentRow[]>([]);

  const loadBillPayments = () => {
    setLoading(true);
    const filters: Parameters<typeof accountingAPI.getBillPayments>[0] = {};
    if (propertyId) filters.property_id = Number(propertyId);
    if (vendorId) filters.vendor_id = Number(vendorId);
    if (startDate) filters.start_date = startDate;
    if (endDate) filters.end_date = endDate;
    if (syncFilter !== "all") filters.qbo_sync_status = syncFilter;

    accountingAPI
      .getBillPayments(filters)
      .then((data) => setBillPayments(data || []))
      .catch((err) => {
        toast.error(err.message || "Failed to load bill payments");
        setBillPayments([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJSON("/properties?page_size=200")
      .then((data) => setProperties(data?.properties || data || []))
      .catch(() => {});
    fetchJSON("/vendors?page_size=200")
      .then((data) => setVendors(data?.vendors || data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadBillPayments();
  }, [propertyId, vendorId, startDate, endDate, syncFilter]);

  // Derived stats
  const unsyncedItems = billPayments.filter((b) => !b.qbo_synced && !b.qbo_sync_error);
  const failedItems = billPayments.filter((b) => !b.qbo_synced && b.qbo_sync_error);
  const unsyncedTotal = unsyncedItems.reduce((sum, b) => sum + b.amount_cents, 0);

  // Selection helpers
  const allPageIds = billPayments.map((b) => b.id);
  const allSelected =
    allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allPageIds));
    }
  };

  const toggleRow = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Open sync modal for a single row
  const openSingleSync = (bp: BillPayment) => {
    setSyncTargets([bp]);
    setSyncModalOpen(true);
  };

  // Open sync modal for selected rows (only unsynced ones)
  const openBulkSync = () => {
    const targets = billPayments.filter(
      (bp) => selectedIds.has(bp.id) && !bp.qbo_synced
    );
    if (targets.length === 0) {
      toast.warning("No unsynced transactions selected");
      return;
    }
    setSyncTargets(targets);
    setSyncModalOpen(true);
  };

  const handleSyncSuccess = () => {
    setSelectedIds(new Set());
    loadBillPayments();
  };

  return (
    <PageTemplate>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bill Payments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sync vendor expense payments to QuickBooks as Bills + BillPayments
          </p>
        </div>
        {someSelected && (
          <button
            onClick={openBulkSync}
            className="px-4 py-2 bg-[#013764] text-white text-sm font-medium rounded-lg hover:bg-[#003a73] transition-colors"
          >
            Sync Selected ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Summary banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{billPayments.length}</div>
          <div className="text-sm text-gray-500 mt-0.5">Total transactions</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-900">{unsyncedItems.length}</div>
          <div className="text-sm text-amber-700 mt-0.5">
            Unsynced · {formatCents(unsyncedTotal)}
          </div>
        </div>
        <div
          className={`rounded-lg p-4 border ${
            failedItems.length > 0
              ? "bg-red-50 border-red-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <div
            className={`text-2xl font-bold ${
              failedItems.length > 0 ? "text-red-900" : "text-green-900"
            }`}
          >
            {failedItems.length > 0 ? failedItems.length : billPayments.filter((b) => b.qbo_synced).length}
          </div>
          <div
            className={`text-sm mt-0.5 ${
              failedItems.length > 0 ? "text-red-700" : "text-green-700"
            }`}
          >
            {failedItems.length > 0 ? "Sync errors — hover for details" : "Synced to QBO"}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          {/* QBO Status filter */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(["all", "unsynced", "synced", "failed"] as QBOSyncFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setSyncFilter(f)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  syncFilter === f
                    ? "bg-[#013764] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Property filter */}
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value ? Number(e.target.value) : "")}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700"
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Vendor filter */}
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value ? Number(e.target.value) : "")}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700"
          >
            <option value="">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          {/* Date range */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700"
            placeholder="From"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700"
            placeholder="To"
          />

          {(propertyId || vendorId || startDate || endDate || syncFilter !== "all") && (
            <button
              onClick={() => {
                setPropertyId("");
                setVendorId("");
                setStartDate("");
                setEndDate("");
                setSyncFilter("all");
              }}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Loading...</span>
          </div>
        ) : billPayments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm">No bill payments found.</p>
            <p className="text-gray-400 text-xs mt-1">
              Bill payments are vendor-tagged transactions from reconciled bank statements.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-3 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Vendor</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Property</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Category</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Description</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">QBO Status</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Synced At</th>
                  <th className="py-3 px-3 font-medium text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {billPayments.map((bp) => (
                  <tr
                    key={bp.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      selectedIds.has(bp.id) ? "bg-blue-50 hover:bg-blue-50" : ""
                    }`}
                  >
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(bp.id)}
                        onChange={() => toggleRow(bp.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                      {formatDate(bp.transaction_date)}
                    </td>
                    <td className="py-3 px-3 text-gray-900 font-medium">
                      {bp.vendor_name || (
                        <span className="text-gray-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      {bp.property_name || (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      {bp.expense_category || (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-600 max-w-[200px] truncate">
                      {bp.description || "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900">
                      {formatCents(bp.amount_cents)}
                    </td>
                    <td className="py-3 px-3">
                      <QBOStatusBadge
                        synced={bp.qbo_synced}
                        error={bp.qbo_sync_error}
                        billId={bp.qbo_bill_id}
                      />
                    </td>
                    <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                      {formatDate(bp.qbo_synced_at)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!bp.qbo_synced && (
                        <button
                          onClick={() => openSingleSync(bp)}
                          className="text-[#013764] hover:text-[#003a73] text-xs font-medium hover:underline"
                        >
                          Sync to QBO
                        </button>
                      )}
                      {bp.qbo_sync_error && !bp.qbo_synced && (
                        <button
                          onClick={() => openSingleSync(bp)}
                          className="ml-2 text-red-600 hover:text-red-800 text-xs font-medium hover:underline"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table footer with total */}
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {billPayments.length} transaction{billPayments.length !== 1 ? "s" : ""}
                {someSelected ? ` · ${selectedIds.size} selected` : ""}
              </span>
              <span className="font-medium text-gray-900">
                Total: {formatCents(billPayments.reduce((s, b) => s + b.amount_cents, 0))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sync Modal */}
      <SyncBillPaymentModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        onSuccess={handleSyncSuccess}
        transactions={syncTargets}
      />
    </PageTemplate>
  );
}
