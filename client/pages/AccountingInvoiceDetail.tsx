import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { accountingAPI } from "@/api/accounting";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import RecordPaymentModal from "@/components/accounting/RecordPaymentModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InvoiceLine {
  id: number;
  line_number: number;
  description: string;
  source_type: string;
  category: string;
  vendor_name: string;
  base_amount_cents: number;
  markup_cents: number;
  total_cents: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  property_id: number;
  property_name: string;
  invoice_month: string;
  billing_model: string;
  status: string;
  subtotal_cents: number;
  markup_cents: number;
  mgmt_fee_cents: number;
  tax_cents: number;
  total_cents: number;
  qbo_synced: boolean;
  qbo_invoice_id: string;
  issued_date: string;
  due_date: string;
  paid_date: string;
  created_by: string;
  created_at: string;
}

interface Payment {
  id: number;
  invoice_id: number;
  amount_cents: number;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  notes: string;
  qbo_payment_id: string;
  qbo_synced: boolean;
  voided: boolean;
  created_at: string;
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

function formatMonth(monthStr: string): string {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    approved: "bg-blue-100 text-blue-800",
    synced: "bg-green-100 text-green-800",
    void: "bg-red-100 text-red-800",
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}
    >
      {label}
    </span>
  );
}

function QBOBadge({ synced, invoiceId }: { synced: boolean; invoiceId?: string }) {
  if (!synced) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        Not Synced
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Synced{invoiceId ? ` (${invoiceId})` : ""}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AccountingInvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const loadInvoice = () => {
    if (!id) return;
    setLoading(true);
    accountingAPI
      .getInvoice(Number(id))
      .then((data) => {
        setInvoice(data.invoice || data);
        setLines(data.lines || []);
      })
      .catch((err) => toast.error(err.message || "Failed to load invoice"))
      .finally(() => setLoading(false));
  };

  const loadPayments = () => {
    if (!id) return;
    accountingAPI
      .getInvoicePayments(Number(id))
      .then((data) => setPayments(data || []))
      .catch(() => setPayments([]));
  };

  useEffect(() => {
    loadInvoice();
    loadPayments();
  }, [id]);

  const handleApprove = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      await accountingAPI.approveInvoice(invoice.id);
      toast.success("Invoice approved");
      loadInvoice();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to approve invoice");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSync = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      await accountingAPI.syncInvoiceToQBO(invoice.id);
      toast.success("Invoice synced to QuickBooks");
      loadInvoice();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to sync invoice");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoidPayment = async (paymentId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to void this payment?"
    );
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await accountingAPI.voidPayment(paymentId);
      toast.success("Payment voided");
      loadInvoice();
      loadPayments();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to void payment");
    } finally {
      setActionLoading(false);
    }
  };

  const paidCents = payments
    .filter((p) => !p.voided)
    .reduce((sum, p) => sum + p.amount_cents, 0);
  const remainingBalanceCents = (invoice?.total_cents || 0) - paidCents;
  const canRecordPayment =
    invoice &&
    (invoice.status === "approved" || invoice.status === "synced") &&
    remainingBalanceCents > 0;

  const handleVoid = async () => {
    if (!invoice) return;
    const confirmed = window.confirm(
      "Are you sure you want to void this invoice? This action cannot be undone."
    );
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await accountingAPI.voidInvoice(invoice.id);
      toast.success("Invoice voided");
      loadInvoice();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to void invoice");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PageTemplate>
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">Loading invoice...</span>
        </div>
      </PageTemplate>
    );
  }

  if (!invoice) {
    return (
      <PageTemplate>
        <div className="text-center py-24">
          <p className="text-gray-500 mb-4">Invoice not found</p>
          <Link
            to="/accounting/invoices"
            className="text-[#013764] hover:text-[#003a73] text-sm font-medium"
          >
            Back to Invoices
          </Link>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">
            {invoice.invoice_number || `Invoice #${invoice.id}`}
          </h1>
          <StatusBadge status={invoice.status} />
          <QBOBadge synced={invoice.qbo_synced} invoiceId={invoice.qbo_invoice_id} />
          {invoice.billing_model && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {invoice.billing_model}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mb-6">
        {invoice.status === "draft" && (
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="px-4 py-2 bg-[#013764] text-white text-sm font-medium rounded-lg hover:bg-[#003a73] transition-colors disabled:opacity-50"
          >
            {actionLoading ? "Processing..." : "Approve"}
          </button>
        )}
        {invoice.status === "approved" && (
          <button
            onClick={handleSync}
            disabled={actionLoading}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {actionLoading ? "Syncing..." : "Sync to QBO"}
          </button>
        )}
        {canRecordPayment && (
          <button
            onClick={() => setPaymentModalOpen(true)}
            disabled={actionLoading}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            Record Payment
          </button>
        )}
        {invoice.status !== "void" && (
          <button
            onClick={handleVoid}
            disabled={actionLoading}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Void
          </button>
        )}
        <Link
          to="/accounting/invoices"
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Invoices
        </Link>
      </div>

      {/* Invoice metadata */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Invoice Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Property</span>
              <p className="text-sm font-medium text-gray-900">
                {invoice.property_name || `Property #${invoice.property_id}`}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Invoice Month</span>
              <p className="text-sm font-medium text-gray-900">
                {formatMonth(invoice.invoice_month)}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Billing Model</span>
              <p className="text-sm font-medium text-gray-900">
                {invoice.billing_model || "-"}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Created By</span>
              <p className="text-sm font-medium text-gray-900">
                {invoice.created_by || "-"}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Issued Date</span>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(invoice.issued_date)}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Due Date</span>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(invoice.due_date)}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Paid Date</span>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(invoice.paid_date)}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Created</span>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(invoice.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Line Items
        </h2>
        {lines.length === 0 ? (
          <p className="text-sm text-gray-500">No line items.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-500 w-10">
                    #
                  </th>
                  <th className="text-left py-2 font-medium text-gray-500">
                    Description
                  </th>
                  <th className="text-left py-2 font-medium text-gray-500">
                    Source Type
                  </th>
                  <th className="text-left py-2 font-medium text-gray-500">
                    Category
                  </th>
                  <th className="text-left py-2 font-medium text-gray-500">
                    Vendor
                  </th>
                  <th className="text-right py-2 font-medium text-gray-500">
                    Base Amount
                  </th>
                  <th className="text-right py-2 font-medium text-gray-500">
                    Markup
                  </th>
                  <th className="text-right py-2 font-medium text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr
                    key={line.id || idx}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2 text-gray-500">
                      {line.line_number || idx + 1}
                    </td>
                    <td className="py-2 text-gray-900">
                      {line.description || "-"}
                    </td>
                    <td className="py-2 text-gray-700">
                      {line.source_type || "-"}
                    </td>
                    <td className="py-2 text-gray-700">
                      {line.category || "-"}
                    </td>
                    <td className="py-2 text-gray-700">
                      {line.vendor_name || "-"}
                    </td>
                    <td className="py-2 text-right text-gray-900">
                      {formatCents(line.base_amount_cents)}
                    </td>
                    <td className="py-2 text-right text-gray-900">
                      {formatCents(line.markup_cents)}
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900">
                      {formatCents(line.total_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals section */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">
                {formatCents(invoice.subtotal_cents)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Markup</span>
              <span className="text-gray-900">
                {formatCents(invoice.markup_cents)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Mgmt Fee</span>
              <span className="text-gray-900">
                {formatCents(invoice.mgmt_fee_cents)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span className="text-gray-900">
                {formatCents(invoice.tax_cents || 0)}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCents(invoice.total_cents)}
              </span>
            </div>
            {paidCents > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid</span>
                  <span className="text-green-700 font-medium">
                    -{formatCents(paidCents)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Balance Due</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCents(remainingBalanceCents)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payments section */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
          {canRecordPayment && (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              + Record Payment
            </button>
          )}
        </div>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500">No payments recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-500">Date</th>
                  <th className="text-right py-2 font-medium text-gray-500">Amount</th>
                  <th className="text-left py-2 font-medium text-gray-500">Method</th>
                  <th className="text-left py-2 font-medium text-gray-500">Reference</th>
                  <th className="text-left py-2 font-medium text-gray-500">QBO Status</th>
                  <th className="text-right py-2 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${payment.voided ? "opacity-50" : ""}`}
                  >
                    <td className="py-2 text-gray-900">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="py-2 text-right text-gray-900 font-medium">
                      {payment.voided ? (
                        <span className="line-through">{formatCents(payment.amount_cents)}</span>
                      ) : (
                        formatCents(payment.amount_cents)
                      )}
                    </td>
                    <td className="py-2 text-gray-700 capitalize">
                      {payment.payment_method || "-"}
                    </td>
                    <td className="py-2 text-gray-700">
                      {payment.reference_number || "-"}
                    </td>
                    <td className="py-2">
                      {payment.voided ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Voided
                        </span>
                      ) : payment.qbo_synced ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Synced{payment.qbo_payment_id ? ` (${payment.qbo_payment_id})` : ""}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Not Synced
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {!payment.voided && (
                        <button
                          onClick={() => handleVoidPayment(payment.id)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50"
                        >
                          Void
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          loadInvoice();
          loadPayments();
        }}
        invoiceId={invoice.id}
        remainingBalanceCents={remainingBalanceCents}
      />
    </PageTemplate>
  );
}
