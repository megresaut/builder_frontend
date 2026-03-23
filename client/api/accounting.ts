import { fetchJSON, authFetch } from "./fetchJSON";

// Helper for multipart uploads using the existing authFetch
async function authUpload(path: string, formData: FormData) {
  const res = await authFetch(path, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  if (res.status === 204 || res.status === 205) return null;
  return res.json();
}

export const accountingAPI = {
  // Dashboard
  getDashboardSummary: (month?: string) =>
    fetchJSON(`/accounting/dashboard/summary${month ? `?month=${month}` : ""}`),
  getReconciliationStatus: () =>
    fetchJSON("/accounting/dashboard/reconciliation"),
  getRevenueBreakdown: (month?: string) =>
    fetchJSON(`/accounting/dashboard/revenue${month ? `?month=${month}` : ""}`),
  getOutstandingInvoices: () =>
    fetchJSON("/accounting/dashboard/outstanding"),
  getExpensesByCategory: (month?: string, propertyId?: number) => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (propertyId) params.set("property_id", String(propertyId));
    return fetchJSON(`/accounting/dashboard/expenses?${params}`);
  },

  // Statements
  uploadStatement: (file: File, accountName: string, month: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("account_name", accountName);
    formData.append("month", month);
    return authUpload("/accounting/statements/upload", formData);
  },
  getStatements: (month?: string, status?: string) => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (status) params.set("status", status);
    return fetchJSON(`/accounting/statements?${params}`);
  },
  getStatement: (id: number) => fetchJSON(`/accounting/statements/${id}`),
  deleteStatement: (id: number) =>
    fetchJSON(`/accounting/statements/${id}`, { method: "DELETE" }),
  lockStatement: (id: number) =>
    fetchJSON(`/accounting/statements/${id}/lock`, { method: "PATCH" }),

  // Transactions
  tagTransaction: (id: number, data: {
    property_id?: number;
    vendor_id?: number;
    expense_category?: string;
    memo?: string;
  }) => fetchJSON(`/accounting/transactions/${id}/tag`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
  bulkTag: (ids: number[], data: {
    property_id?: number;
    vendor_id?: number;
    expense_category?: string;
  }) => fetchJSON("/accounting/transactions/bulk-tag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, ...data }),
  }),
  excludeTransaction: (id: number) =>
    fetchJSON(`/accounting/transactions/${id}/exclude`, { method: "PATCH" }),
  getTransactions: (filters?: { property_id?: number; status?: string; statement_id?: number }) => {
    const params = new URLSearchParams();
    if (filters?.property_id) params.set("property_id", String(filters.property_id));
    if (filters?.status) params.set("status", filters.status);
    if (filters?.statement_id) params.set("statement_id", String(filters.statement_id));
    return fetchJSON(`/accounting/transactions?${params}`);
  },
  uploadReceipt: (txnId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return authUpload(`/accounting/transactions/${txnId}/receipt`, formData);
  },

  // Invoices
  generateInvoice: (propertyId: number, month: string) =>
    fetchJSON("/accounting/invoices/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property_id: propertyId, invoice_month: month }),
    }),
  getInvoices: (filters?: { property_id?: number; status?: string; month?: string }) => {
    const params = new URLSearchParams();
    if (filters?.property_id) params.set("property_id", String(filters.property_id));
    if (filters?.status) params.set("status", filters.status);
    if (filters?.month) params.set("month", filters.month);
    return fetchJSON(`/accounting/invoices?${params}`);
  },
  getInvoice: (id: number) => fetchJSON(`/accounting/invoices/${id}`),
  approveInvoice: (id: number) =>
    fetchJSON(`/accounting/invoices/${id}/approve`, { method: "POST" }),
  voidInvoice: (id: number) =>
    fetchJSON(`/accounting/invoices/${id}/void`, { method: "POST" }),
  syncInvoiceToQBO: (id: number) =>
    fetchJSON(`/accounting/invoices/${id}/sync`, { method: "POST" }),

  // QBO
  getQBOAuthUrl: () => fetchJSON("/accounting/qbo/auth-url"),
  getQBOStatus: () => fetchJSON("/accounting/qbo/status"),
  disconnectQBO: () => fetchJSON("/accounting/qbo/disconnect", { method: "POST" }),
  triggerQBOSync: () => fetchJSON("/accounting/qbo/sync", { method: "POST" }),
  getQBOSyncLog: () => fetchJSON("/accounting/qbo/sync-log"),
  bootstrapQBO: () => fetchJSON("/accounting/qbo/bootstrap", { method: "POST" }),
  seedQBOData: () => fetchJSON("/accounting/qbo/seed", { method: "POST" }),

  // Vendor Rates
  getVendorRates: (filters?: { vendor_id?: number; property_id?: number }) => {
    const params = new URLSearchParams();
    if (filters?.vendor_id) params.set("vendor_id", String(filters.vendor_id));
    if (filters?.property_id) params.set("property_id", String(filters.property_id));
    return fetchJSON(`/accounting/vendor-rates?${params}`);
  },
  createVendorRate: (data: {
    vendor_id: number;
    property_id?: number;
    rate_type: string;
    flat_fee_cents?: number;
    percentage?: number;
    markup_type?: string;
    markup_value?: number;
    effective_date: string;
    end_date?: string;
  }) =>
    fetchJSON("/accounting/vendor-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  updateVendorRate: (id: number, data: Record<string, unknown>) =>
    fetchJSON(`/accounting/vendor-rates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteVendorRate: (id: number) =>
    fetchJSON(`/accounting/vendor-rates/${id}`, { method: "DELETE" }),
  calculateMarkupPreview: (amount: number, vendorId: number, propertyId?: number) => {
    const params = new URLSearchParams({ amount: String(amount), vendor_id: String(vendorId) });
    if (propertyId) params.set("property_id", String(propertyId));
    return fetchJSON(`/accounting/vendor-rates/calculate?${params}`);
  },
};
