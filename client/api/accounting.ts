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
  syncBillToQBO: (id: number) =>
    fetchJSON(`/accounting/qbo/sync-bill/${id}`, { method: "POST" }),

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

  // Ledger view
  getTransactionsLedger: (filters?: { property_id?: number; start_date?: string; end_date?: string; uploaded_by?: number; tagged_by?: number }) => {
    const params = new URLSearchParams();
    if (filters?.property_id) params.set("property_id", String(filters.property_id));
    if (filters?.start_date) params.set("start_date", filters.start_date);
    if (filters?.end_date) params.set("end_date", filters.end_date);
    if (filters?.uploaded_by) params.set("uploaded_by", String(filters.uploaded_by));
    if (filters?.tagged_by) params.set("tagged_by", String(filters.tagged_by));
    return fetchJSON(`/accounting/transactions/ledger?${params}`);
  },

  // Reports
  getIncomeStatement: (startMonth?: string, endMonth?: string, propertyId?: number) => {
    const params = new URLSearchParams();
    if (startMonth) params.set("start_month", startMonth);
    if (endMonth) params.set("end_month", endMonth);
    if (propertyId) params.set("property_id", String(propertyId));
    return fetchJSON(`/accounting/reports/income-statement?${params}`);
  },
  getARaging: () => fetchJSON("/accounting/reports/ar-aging"),
  getAROutstandingInvoices: () => fetchJSON("/accounting/reports/outstanding-invoices"),
  getPropertyComparison: (month?: string) =>
    fetchJSON(`/accounting/reports/property-comparison${month ? `?month=${month}` : ""}`),

  // QBO Chart of Accounts (live fetch, legacy)
  getChartOfAccounts: (accountType?: string) =>
    fetchJSON(`/accounting/qbo/chart-of-accounts${accountType ? `?account_type=${accountType}` : ""}`),

  // Cached Chart of Accounts (preferred for dropdowns)
  getCachedChartOfAccounts: (accountType?: string, includeInactive = false) => {
    const params = new URLSearchParams();
    if (accountType) params.set("account_type", accountType);
    if (includeInactive) params.set("include_inactive", "true");
    const qs = params.toString();
    return fetchJSON(`/accounting/chart-of-accounts${qs ? `?${qs}` : ""}`);
  },
  syncChartOfAccounts: () =>
    fetchJSON("/accounting/chart-of-accounts/sync", { method: "POST" }),
  getCoABankAccounts: () =>
    fetchJSON("/accounting/chart-of-accounts/bank-accounts"),
  importChartOfAccountsCSV: (path?: string) =>
    fetchJSON("/accounting/chart-of-accounts/import-csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: path ?? "" }),
    }),

  // Bill Payments (AP — per-bill payments)
  listBillPayments: (billId: number) =>
    fetchJSON(`/bills/${billId}/payments`),
  recordBillPayment: (
    billId: number,
    data: {
      amount_cents: number;
      payment_date: string;
      payment_method: "check" | "ach" | "credit_card" | "cash" | "other";
      bank_account_id?: number;
      paid_from_account_id?: number;
      account_category?: string;
      reference_number?: string;
      memo?: string;
    },
  ) =>
    fetchJSON(`/bills/${billId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  voidBillPayment: (billId: number, paymentId: number) =>
    fetchJSON(`/bills/${billId}/payments/${paymentId}`, { method: "DELETE" }),
  recalculateBillMarkup: (billId: number) =>
    fetchJSON(`/bills/${billId}/calculate-markup`, { method: "PATCH" }),

  // Reconciliation matching
  getSuggestedMatches: (statementId: number) =>
    fetchJSON(`/accounting/statements/${statementId}/suggested-matches`),
  confirmMatches: (statementId: number, matches: { transaction_id: number; bill_id: number }[]) =>
    fetchJSON(`/accounting/statements/${statementId}/confirm-matches`, {
      method: "POST",
      body: JSON.stringify({ matches }),
    }),
  createDraftsFromUnmatched: (statementId: number) =>
    fetchJSON(`/accounting/statements/${statementId}/create-drafts`, { method: "POST" }),

  // Payments
  recordPayment: (invoiceId: number, data: { amount_cents: number; payment_date: string; payment_method: string; reference_number: string; notes: string }) =>
    fetchJSON(`/accounting/invoices/${invoiceId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  getInvoicePayments: (invoiceId: number) =>
    fetchJSON(`/accounting/invoices/${invoiceId}/payments`),
  voidPayment: (paymentId: number) =>
    fetchJSON(`/accounting/payments/${paymentId}`, { method: "DELETE" }),

  // Bill Payments (AP vendor expense sync to QBO)
  getBillPayments: (filters?: {
    property_id?: number;
    vendor_id?: number;
    start_date?: string;
    end_date?: string;
    qbo_sync_status?: "unsynced" | "synced" | "failed";
  }) => {
    const params = new URLSearchParams();
    if (filters?.property_id) params.set("property_id", String(filters.property_id));
    if (filters?.vendor_id) params.set("vendor_id", String(filters.vendor_id));
    if (filters?.start_date) params.set("start_date", filters.start_date);
    if (filters?.end_date) params.set("end_date", filters.end_date);
    if (filters?.qbo_sync_status) params.set("qbo_sync_status", filters.qbo_sync_status);
    return fetchJSON(`/accounting/bill-payments?${params}`);
  },
  syncBillPaymentToQBO: (transactionId: number) =>
    fetchJSON(`/accounting/bill-payments/${transactionId}/sync`, { method: "POST" }),
  bulkSyncBillPaymentsToQBO: (ids: number[]) =>
    fetchJSON("/accounting/bill-payments/bulk-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }),

  // Accounting config (Phase 0)
  getConfig: () => fetchJSON("/accounting/config"),
  patchConfig: (data: {
    payment_source_of_truth?: "manual" | "buildium_pull";
    buildium_pull_interval_min?: number;
    gl_refresh_interval_min?: number;
    bank_txn_sync_interval_min?: number;
    default_currency?: string;
  }) =>
    fetchJSON("/accounting/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // Bank Accounts (Phase A)
  listBankAccounts: (activeOnly = true, kind?: "bank" | "credit_card") => {
    const params = new URLSearchParams();
    if (!activeOnly) params.set("active", "false");
    if (kind) params.set("kind", kind);
    const qs = params.toString();
    return fetchJSON(`/accounting/bank-accounts${qs ? `?${qs}` : ""}`);
  },
  getBankAccount: (id: number) => fetchJSON(`/accounting/bank-accounts/${id}`),
  updateBankAccount: (
    id: number,
    data: Partial<{
      purpose: string;
      holder_name: string;
      routing_last4: string;
      account_last4: string;
      notes: string;
    }>,
  ) =>
    fetchJSON(`/accounting/bank-accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  syncBankAccountsBuildium: () =>
    fetchJSON("/accounting/bank-accounts/sync-buildium", { method: "POST" }),
  getBankTransactions: (
    id: number,
    filters?: { date_from?: string; date_to?: string; kind?: string },
  ) => {
    const params = new URLSearchParams();
    if (filters?.date_from) params.set("date_from", filters.date_from);
    if (filters?.date_to) params.set("date_to", filters.date_to);
    if (filters?.kind) params.set("kind", filters.kind);
    const qs = params.toString();
    return fetchJSON(`/accounting/bank-accounts/${id}/transactions${qs ? `?${qs}` : ""}`);
  },
  syncBankTransactions: (id: number, since?: string, until?: string) => {
    const params = new URLSearchParams();
    if (since) params.set("since", since);
    if (until) params.set("until", until);
    const qs = params.toString();
    return fetchJSON(
      `/accounting/bank-accounts/${id}/sync-transactions${qs ? `?${qs}` : ""}`,
      { method: "POST" },
    );
  },
  getBankAccountChecks: (
    id: number,
    filters?: { date_from?: string; date_to?: string },
  ) => {
    const params = new URLSearchParams();
    if (filters?.date_from) params.set("date_from", filters.date_from);
    if (filters?.date_to) params.set("date_to", filters.date_to);
    const qs = params.toString();
    return fetchJSON(
      `/accounting/bank-accounts/${id}/checks${qs ? `?${qs}` : ""}`,
    );
  },
  syncBankAccountChecks: (id: number, since?: string, until?: string) => {
    const params = new URLSearchParams();
    if (since) params.set("since", since);
    if (until) params.set("until", until);
    const qs = params.toString();
    return fetchJSON(
      `/accounting/bank-accounts/${id}/sync-checks${qs ? `?${qs}` : ""}`,
      { method: "POST" },
    );
  },
  syncAllBankAccountChecks: (since?: string, until?: string) => {
    const params = new URLSearchParams();
    if (since) params.set("since", since);
    if (until) params.set("until", until);
    const qs = params.toString();
    return fetchJSON(
      `/accounting/bank-accounts/sync-all-checks${qs ? `?${qs}` : ""}`,
      { method: "POST" },
    );
  },

  // Credit Cards. Storage was unified into bank_accounts in migration 072 —
  // these helpers query the same endpoints with kind=credit_card.
  listCreditCardAccounts: (activeOnly = true) => {
    const params = new URLSearchParams({ kind: "credit_card" });
    if (!activeOnly) params.set("active", "false");
    return fetchJSON(`/accounting/bank-accounts?${params.toString()}`);
  },
  getCreditCardAccount: (id: number) => fetchJSON(`/accounting/bank-accounts/${id}`),
  updateCreditCardAccount: (
    id: number,
    data: Partial<{
      card_last4: string;
      network: string;
      holder_name: string;
      billing_day: number;
      credit_limit_cents: number;
      notes: string;
    }>,
  ) =>
    fetchJSON(`/accounting/bank-accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // General Ledger (Phase C)
  refreshGL: (since?: string, until?: string) =>
    fetchJSON("/accounting/general-ledger/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ since, until }),
    }),
  listGL: (filters?: {
    account_id?: number;
    property_id?: number;
    date_from?: string;
    date_to?: string;
    source?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.account_id) params.set("account_id", String(filters.account_id));
    if (filters?.property_id) params.set("property_id", String(filters.property_id));
    if (filters?.date_from) params.set("date_from", filters.date_from);
    if (filters?.date_to) params.set("date_to", filters.date_to);
    if (filters?.source) params.set("source", filters.source);
    if (filters?.search) params.set("search", filters.search);
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.page_size) params.set("page_size", String(filters.page_size));
    const qs = params.toString();
    return fetchJSON(`/accounting/general-ledger${qs ? `?${qs}` : ""}`);
  },
  getTrialBalance: (asOf: string) =>
    fetchJSON(`/accounting/general-ledger/trial-balance?as_of=${asOf}`),

  // Buildium payment pull (Phase D)
  pullBuildiumPayments: () =>
    fetchJSON("/accounting/buildium/pull-payments", { method: "POST" }),
  getBuildiumSyncStatus: () => fetchJSON("/accounting/buildium/sync-status"),

  // Reconciliation sessions (Phase E)
  openReconciliationSession: (data: {
    account_kind: "bank" | "credit_card";
    account_id: number;
    period_start: string;
    period_end: string;
    statement_balance_cents: number;
    notes?: string;
  }) =>
    fetchJSON("/accounting/reconciliation/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  getReconciliationSession: (id: number) =>
    fetchJSON(`/accounting/reconciliation/sessions/${id}`),
  getReconciliationSuggestions: (id: number) =>
    fetchJSON(`/accounting/reconciliation/sessions/${id}/suggestions`),
  confirmReconciliationMatches: (
    id: number,
    matches: { bank_txn_id: number; bill_payment_id?: number; invoice_payment_id?: number }[],
  ) =>
    fetchJSON(`/accounting/reconciliation/sessions/${id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matches }),
    }),
  clearReconciliationTxns: (id: number, bankTxnIds: number[]) =>
    fetchJSON(`/accounting/reconciliation/sessions/${id}/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bank_txn_ids: bankTxnIds }),
    }),
  finalizeReconciliationSession: (id: number) =>
    fetchJSON(`/accounting/reconciliation/sessions/${id}/finalize`, { method: "POST" }),
  rejectReconciliationSession: (id: number) =>
    fetchJSON(`/accounting/reconciliation/sessions/${id}/reject`, { method: "POST" }),

  // CC / Bank statement import + per-txn labeling (cc_statements module).
  // Routes are mounted bare (no /accounting prefix) because the module is
  // shared between bank and credit-card accounts.
  ccImportStatement: (
    bankAccountID: number,
    file: File,
    inflowSign?: "positive" | "negative",
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    const qs = inflowSign ? `?inflow_sign=${inflowSign}` : "";
    return authUpload(
      `/bank-accounts/${bankAccountID}/import-statement${qs}`,
      formData,
    );
  },
  ccListUnlabeled: (
    bankAccountID: number,
    filters?: { from?: string; to?: string },
  ) => {
    const params = new URLSearchParams();
    if (filters?.from) params.set("from", filters.from);
    if (filters?.to) params.set("to", filters.to);
    const qs = params.toString();
    return fetchJSON(
      `/bank-accounts/${bankAccountID}/unlabeled-transactions${qs ? `?${qs}` : ""}`,
    );
  },
  ccLabelTransaction: (
    txnID: number,
    data: {
      vendor_id: number;
      gl_account_qbo_id: string;
      gl_account_name: string;
      bill_id?: number;
      memo?: string;
    },
  ) =>
    fetchJSON(`/bank-transactions/${txnID}/label`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  ccUnlabelTransaction: (txnID: number) =>
    fetchJSON(`/bank-transactions/${txnID}/unlabel`, { method: "POST" }),

  // Journal Entries (Phase F)
  listJournalEntries: (filters?: { date_from?: string; date_to?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.date_from) params.set("date_from", filters.date_from);
    if (filters?.date_to) params.set("date_to", filters.date_to);
    if (filters?.status) params.set("status", filters.status);
    const qs = params.toString();
    return fetchJSON(`/accounting/journal-entries${qs ? `?${qs}` : ""}`);
  },
  getJournalEntry: (id: number) => fetchJSON(`/accounting/journal-entries/${id}`),
  createJournalEntry: (data: {
    txn_date: string;
    memo?: string;
    lines: { account_id: number; debit_cents: number; credit_cents: number; memo?: string; property_id?: number; vendor_id?: number }[];
  }) =>
    fetchJSON("/accounting/journal-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  postJournalEntry: (id: number) =>
    fetchJSON(`/accounting/journal-entries/${id}/post`, { method: "POST" }),
  voidJournalEntry: (id: number) =>
    fetchJSON(`/accounting/journal-entries/${id}/void`, { method: "POST" }),
};
