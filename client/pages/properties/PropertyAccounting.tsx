import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { fetchJSON } from "@/api/fetchJSON";
import { toast } from "sonner";
import InvoiceGenerateModal from "@/components/accounting/InvoiceGenerateModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Invoice {
  id: number;
  property_id: number;
  invoice_month: string;
  total_cents: number;
  management_fee_cents: number;
  expense_total_cents: number;
  status: string;
  qbo_invoice_id?: string;
  created_at: string;
}

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount_cents: number;
  expense_category: string;
  vendor_name?: string;
  status: string;
}

interface VendorRate {
  id: number;
  vendor_id: number;
  vendor_name: string;
  property_id?: number;
  rate_type: string;
  flat_fee_cents?: number;
  percentage?: number;
  markup_type?: string;
  markup_value?: number;
  effective_date: string;
  end_date?: string;
}

interface DashboardSummary {
  total_expenses_cents: number;
  total_invoiced_cents: number;
  outstanding_ar_cents: number;
  pending_statements: number;
  reconciled_pct: number;
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
// Sub-tabs
// ---------------------------------------------------------------------------

const SUB_TABS = ["Overview", "Invoices", "Expenses", "Vendor Rates"] as const;
type SubTab = (typeof SUB_TABS)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PropertyAccountingProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
  propertyId: number;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function PropertyAccounting({
  propertyId,
}: PropertyAccountingProps) {
  const [activeTab, setActiveTab] = useState<SubTab>("Overview");

  return (
    <div>
      {/* Sub-tab navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && <OverviewTab propertyId={propertyId} />}
      {activeTab === "Invoices" && <InvoicesTab propertyId={propertyId} />}
      {activeTab === "Expenses" && <ExpensesTab propertyId={propertyId} />}
      {activeTab === "Vendor Rates" && <VendorRatesTab propertyId={propertyId} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

function OverviewTab({ propertyId }: { propertyId: number }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const month = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      accountingAPI.getDashboardSummary(month).catch(() => null),
      accountingAPI.getInvoices({ property_id: propertyId, status: "pending" }).catch(() => []),
    ])
      .then(([sum, invs]) => {
        setSummary(sum);
        setInvoices(invs || []);
      })
      .finally(() => setLoading(false));
  }, [propertyId, month]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        <span className="ml-2 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="text-2xl font-bold text-gray-900">
          {summary ? formatCents(summary.total_expenses_cents) : "$0.00"}
        </div>
        <div className="text-sm text-gray-500 mt-1">Total Expenses ({formatMonth(month)})</div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="text-2xl font-bold text-gray-900">{invoices.length}</div>
        <div className="text-sm text-gray-500 mt-1">Outstanding Invoices</div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="text-2xl font-bold text-gray-900">
          {summary ? formatCents(summary.outstanding_ar_cents) : "$0.00"}
        </div>
        <div className="text-sm text-gray-500 mt-1">Outstanding AR</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invoices Tab
// ---------------------------------------------------------------------------

function InvoicesTab({ propertyId }: { propertyId: number }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateOpen, setGenerateOpen] = useState(false);

  const loadInvoices = () => {
    setLoading(true);
    accountingAPI
      .getInvoices({ property_id: propertyId })
      .then((data) => setInvoices(data || []))
      .catch((err) => toast.error(err.message || "Failed to load invoices"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
  }, [propertyId]);

  const handleApprove = async (id: number) => {
    try {
      await accountingAPI.approveInvoice(id);
      toast.success("Invoice approved");
      loadInvoices();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Approve failed");
    }
  };

  const handleVoid = async (id: number) => {
    if (!confirm("Void this invoice?")) return;
    try {
      await accountingAPI.voidInvoice(id);
      toast.success("Invoice voided");
      loadInvoices();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Void failed");
    }
  };

  const handleSync = async (id: number) => {
    try {
      await accountingAPI.syncInvoiceToQBO(id);
      toast.success("Synced to QuickBooks");
      loadInvoices();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
        <button
          onClick={() => setGenerateOpen(true)}
          className="px-4 py-2 bg-[#013764] text-white text-sm font-medium rounded-lg hover:bg-[#003a73] transition-colors"
        >
          Generate Invoice
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">No invoices for this property.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-500">Month</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Expenses</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Mgmt Fee</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Total</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">QBO</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const statusColors: Record<string, string> = {
                  draft: "bg-gray-100 text-gray-700",
                  pending: "bg-yellow-100 text-yellow-800",
                  approved: "bg-green-100 text-green-800",
                  sent: "bg-blue-100 text-blue-800",
                  voided: "bg-red-100 text-red-800",
                };
                return (
                  <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-900">
                      {formatMonth(inv.invoice_month)}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || "bg-gray-100 text-gray-700"}`}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-gray-700">
                      {formatCents(inv.expense_total_cents)}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-700">
                      {formatCents(inv.management_fee_cents)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-gray-900">
                      {formatCents(inv.total_cents)}
                    </td>
                    <td className="py-2 px-3">
                      {inv.qbo_invoice_id ? (
                        <span className="text-xs text-green-600">Synced</span>
                      ) : (
                        <span className="text-xs text-gray-400">Not synced</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status === "draft" && (
                          <button
                            onClick={() => handleApprove(inv.id)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Approve
                          </button>
                        )}
                        {inv.status !== "voided" && (
                          <button
                            onClick={() => handleVoid(inv.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Void
                          </button>
                        )}
                        {inv.status === "approved" && !inv.qbo_invoice_id && (
                          <button
                            onClick={() => handleSync(inv.id)}
                            className="text-xs text-green-600 hover:underline"
                          >
                            Sync
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InvoiceGenerateModal
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        defaultPropertyId={propertyId}
        onSuccess={loadInvoices}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expenses Tab
// ---------------------------------------------------------------------------

function ExpensesTab({ propertyId }: { propertyId: number }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    accountingAPI
      .getTransactions({ property_id: propertyId, status: "tagged" })
      .then((data) => setTransactions(data || []))
      .catch((err) => toast.error(err.message || "Failed to load expenses"))
      .finally(() => setLoading(false));
  }, [propertyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No reconciled expenses for this property.</p>;
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-medium text-gray-500">Date</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">Description</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">Category</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">Vendor</th>
            <th className="text-right py-2 px-3 font-medium text-gray-500">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                {new Date(txn.date).toLocaleDateString()}
              </td>
              <td className="py-2 px-3 text-gray-900 max-w-[250px] truncate">
                {txn.description}
              </td>
              <td className="py-2 px-3 text-gray-600">{txn.expense_category || "-"}</td>
              <td className="py-2 px-3 text-gray-600">{txn.vendor_name || "-"}</td>
              <td className={`py-2 px-3 text-right font-medium ${txn.amount_cents < 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCents(txn.amount_cents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vendor Rates Tab
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  borderRadius: "8px",
  backgroundColor: "rgba(255, 255, 255, 1)",
  borderColor: "rgba(229, 229, 229, 1)",
  borderStyle: "solid",
  borderWidth: "1px",
  padding: "6px 10px",
  fontSize: "14px",
  fontWeight: 400,
  color: "#303030",
  width: "100%",
  boxSizing: "border-box" as const,
};

function VendorRatesTab({ propertyId }: { propertyId: number }) {
  const [rates, setRates] = useState<VendorRate[]>([]);
  const [vendors, setVendors] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form state
  const [formVendorId, setFormVendorId] = useState<number | undefined>();
  const [formRateType, setFormRateType] = useState("flat");
  const [formFlatFee, setFormFlatFee] = useState("");
  const [formPercentage, setFormPercentage] = useState("");
  const [formMarkupType, setFormMarkupType] = useState("");
  const [formMarkupValue, setFormMarkupValue] = useState("");
  const [formEffDate, setFormEffDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const loadRates = () => {
    setLoading(true);
    accountingAPI
      .getVendorRates({ property_id: propertyId })
      .then((data) => setRates(data || []))
      .catch((err) => toast.error(err.message || "Failed to load rates"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRates();
    fetchJSON("/vendors")
      .then((data: any[]) =>
        setVendors((data || []).map((v: any) => ({ id: v.id, name: v.name })))
      )
      .catch(() => {});
  }, [propertyId]);

  const resetForm = () => {
    setFormVendorId(undefined);
    setFormRateType("flat");
    setFormFlatFee("");
    setFormPercentage("");
    setFormMarkupType("");
    setFormMarkupValue("");
    setFormEffDate("");
    setFormEndDate("");
    setShowAdd(false);
    setEditId(null);
  };

  const handleEdit = (rate: VendorRate) => {
    setEditId(rate.id);
    setFormVendorId(rate.vendor_id);
    setFormRateType(rate.rate_type);
    setFormFlatFee(rate.flat_fee_cents != null ? String(rate.flat_fee_cents / 100) : "");
    setFormPercentage(rate.percentage != null ? String(rate.percentage) : "");
    setFormMarkupType(rate.markup_type || "");
    setFormMarkupValue(rate.markup_value != null ? String(rate.markup_value) : "");
    setFormEffDate(rate.effective_date);
    setFormEndDate(rate.end_date || "");
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!formVendorId) {
      toast.error("Please select a vendor");
      return;
    }
    if (!formEffDate) {
      toast.error("Please enter an effective date");
      return;
    }

    setFormSaving(true);
    try {
      const payload = {
        vendor_id: formVendorId,
        property_id: propertyId,
        rate_type: formRateType,
        flat_fee_cents: formFlatFee ? Math.round(Number(formFlatFee) * 100) : undefined,
        percentage: formPercentage ? Number(formPercentage) : undefined,
        markup_type: formMarkupType || undefined,
        markup_value: formMarkupValue ? Number(formMarkupValue) : undefined,
        effective_date: formEffDate,
        end_date: formEndDate || undefined,
      };

      if (editId) {
        await accountingAPI.updateVendorRate(editId, payload);
        toast.success("Rate updated");
      } else {
        await accountingAPI.createVendorRate(payload);
        toast.success("Rate created");
      }
      resetForm();
      loadRates();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save rate");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this vendor rate?")) return;
    try {
      await accountingAPI.deleteVendorRate(id);
      toast.success("Rate deleted");
      loadRates();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Vendor Rates</h3>
        {!showAdd && (
          <button
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
            className="px-4 py-2 bg-[#013764] text-white text-sm font-medium rounded-lg hover:bg-[#003a73] transition-colors"
          >
            Add Rate
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            {editId ? "Edit Rate" : "New Rate"}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vendor *</label>
              <select
                value={formVendorId || ""}
                onChange={(e) => setFormVendorId(e.target.value ? Number(e.target.value) : undefined)}
                style={inputStyle}
                disabled={!!editId}
              >
                <option value="">Select vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rate Type</label>
              <select
                value={formRateType}
                onChange={(e) => setFormRateType(e.target.value)}
                style={inputStyle}
              >
                <option value="flat">Flat Fee</option>
                <option value="percentage">Percentage</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
            {formRateType === "flat" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Flat Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formFlatFee}
                  onChange={(e) => setFormFlatFee(e.target.value)}
                  style={inputStyle}
                  placeholder="0.00"
                />
              </div>
            )}
            {formRateType === "percentage" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formPercentage}
                  onChange={(e) => setFormPercentage(e.target.value)}
                  style={inputStyle}
                  placeholder="0"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Markup Type</label>
              <select
                value={formMarkupType}
                onChange={(e) => setFormMarkupType(e.target.value)}
                style={inputStyle}
              >
                <option value="">None</option>
                <option value="flat">Flat</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>
            {formMarkupType && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Markup Value {formMarkupType === "percentage" ? "(%)" : "($)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formMarkupValue}
                  onChange={(e) => setFormMarkupValue(e.target.value)}
                  style={inputStyle}
                  placeholder="0"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Effective Date *</label>
              <input
                type="date"
                value={formEffDate}
                onChange={(e) => setFormEffDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={formSaving}
              className="px-4 py-2 bg-[#013764] text-white text-sm font-medium rounded-lg hover:bg-[#003a73] disabled:opacity-50 transition-colors"
            >
              {formSaving ? "Saving..." : editId ? "Update" : "Create"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rates Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : rates.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">No vendor rates configured for this property.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-500">Vendor</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Rate Type</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Rate</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Markup</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Effective</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 text-gray-900 font-medium">{rate.vendor_name}</td>
                  <td className="py-2 px-3 text-gray-600 capitalize">{rate.rate_type}</td>
                  <td className="py-2 px-3 text-gray-700">
                    {rate.flat_fee_cents != null
                      ? formatCents(rate.flat_fee_cents)
                      : rate.percentage != null
                        ? `${rate.percentage}%`
                        : "-"}
                  </td>
                  <td className="py-2 px-3 text-gray-600">
                    {rate.markup_type
                      ? `${rate.markup_type === "percentage" ? `${rate.markup_value}%` : formatCents(Math.round((rate.markup_value || 0) * 100))}`
                      : "-"}
                  </td>
                  <td className="py-2 px-3 text-gray-600">
                    {rate.effective_date}
                    {rate.end_date ? ` - ${rate.end_date}` : ""}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(rate)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rate.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
