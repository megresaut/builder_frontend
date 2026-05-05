import { useEffect, useMemo, useState } from "react";
import { fetchJSON } from "@/api/fetchJSON";
import { formatUSD } from "@/lib/utils";
import { toast } from "sonner";

type PaidBillOption = {
  id: number;
  label: string;
  vendor_id: number;
  vendor_name: string;
  amount_cents: number;
  invoice_number: string;
};

type StatementBill = {
  id: number;
  statement_date: string;
  due_date?: string;
  vendor_id?: number;
  vendor_name: string;
  invoice_number: string;
  memo: string;
  gl_account_name: string;
  amount_cents: number;
  paid_amount_cents: number;
  payment_status: string;
  books_owner: "HOA" | "AVMRE" | "Unknown";
  entity_property_id?: number;
  qbo_purchase_id?: string;
  qbo_synced_at?: string;
};

type StatementPayment = {
  id: number;
  bill_id: number;
  payment_date: string;
  vendor_name: string;
  bill_invoice_number: string;
  amount_cents: number;
  payment_method: string;
  bank_account_name: string;
  check_number?: string;
  books_owner: "HOA" | "AVMRE" | "Unknown";
  qbo_bill_payment_id?: string;
  qbo_synced_at?: string;
  qbo_sync_error?: string;
};

type StatementSummary = {
  bills_total_cents: number;
  bills_paid_cents: number;
  bills_outstanding_cents: number;
  bill_count: number;
  paid_by_hoa_cents: number;
  paid_by_avmre_cents: number;
  payment_count: number;
  vendor_credits_earned_cents: number;
  vendor_credits_open_cents: number;
  vendor_credit_count: number;
};

type BankAccountRow = {
  id: number;
  name: string;
  purpose: string;
  balance_cents: number;
  balance_source: "reconciled" | "buildium" | "unknown";
  last_reconciled_at?: string;
  qbo_account_id?: string | null;
  is_active: boolean;
};

type VendorCredit = {
  id: number;
  credit_date: string;
  vendor_id: number;
  vendor_name: string;
  total_cents: number;
  applied_cents: number;
  remaining_cents: number;
  rate_basis_points?: number | null;
  status: string;
  memo: string;
  source_bill_id?: number | null;
  source_invoice_number?: string;
  books_owner: "HOA" | "AVMRE" | "Unknown";
};

type StatementResponse = {
  property_id: number;
  property_type: string;
  from: string;
  to: string;
  summary: StatementSummary;
  bills: StatementBill[];
  payments: StatementPayment[];
  vendor_credits: VendorCredit[];
  bank_accounts: BankAccountRow[];
};

type Props = {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
  propertyId: number;
};

// CSV download helper (browser-side). Converts a 2-D array into a properly
// quoted CSV string and triggers a download via an object URL.
function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) =>
      r
        .map((v) => {
          const s = String(v ?? "");
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Triggers a native browser save-as-PDF with the print-only stylesheet
// applied. Adding `printing` to <html> makes the @media print rules below
// hide everything except `.printable-report`.
function printReport() {
  document.documentElement.classList.add("printing");
  // Give the layout a tick to settle before the print dialog opens.
  setTimeout(() => {
    window.print();
    // Once the dialog closes (Cancel or Save), strip the class.
    setTimeout(() => document.documentElement.classList.remove("printing"), 100);
  }, 50);
}

// Global print stylesheet. When the user clicks Export PDF we toggle the
// `printing` class on <html>, hide the app chrome, and surface only the
// `printable-report` block at full width. The browser's native Save-as-PDF
// then captures a clean document. We inject this once at module load so we
// don't need to touch index.css.
const PRINT_STYLE_ID = "financials-print-styles";
function ensurePrintStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(PRINT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @media print {
      @page { margin: 0.5in; }
      html.printing body * { visibility: hidden !important; }
      html.printing .printable-report,
      html.printing .printable-report * { visibility: visible !important; }
      html.printing .printable-report {
        position: absolute !important;
        left: 0; top: 0; right: 0;
        width: 100% !important;
        max-width: none !important;
        padding: 0 !important;
        margin: 0 !important;
        background: white !important;
        color: #09090B !important;
        font-family: ui-sans-serif, system-ui, sans-serif !important;
      }
      html.printing .print-hidden { display: none !important; }
      html.printing .printable-report table { page-break-inside: auto; }
      html.printing .printable-report tr   { page-break-inside: avoid; page-break-after: auto; }
      html.printing .printable-report thead { display: table-header-group; }
    }
  `;
  document.head.appendChild(style);
}

// Sensible default: this calendar year through today.
function defaultRange(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return {
    from: start.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

type ReportTab = "activity" | "pnl" | "collections";

export default function Statements({ propertyId }: Props) {
  const [{ from, to }, setRange] = useState(defaultRange);
  const [data, setData] = useState<StatementResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [activeReport, setActiveReport] = useState<ReportTab>("activity");

  useEffect(() => {
    ensurePrintStyles();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchJSON(
      `/properties/${propertyId}/statements?from=${from}&to=${to}`,
    )
      .then((res: any) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((err: any) => toast.error(err?.message || "Failed to load statement"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId, from, to, reloadTick]);

  const summary = data?.summary;
  const bills = data?.bills ?? [];
  const payments = data?.payments ?? [];
  const credits = data?.vendor_credits ?? [];
  const bankAccounts = data?.bank_accounts ?? [];

  const summaryCards = useMemo(
    () => [
      { label: "Bills (period)", value: formatUSD((summary?.bills_total_cents ?? 0) / 100) },
      { label: "Paid", value: formatUSD((summary?.bills_paid_cents ?? 0) / 100) },
      { label: "Outstanding", value: formatUSD((summary?.bills_outstanding_cents ?? 0) / 100) },
      { label: "Paid by HOA", value: formatUSD((summary?.paid_by_hoa_cents ?? 0) / 100) },
      { label: "Paid by AVMRE", value: formatUSD((summary?.paid_by_avmre_cents ?? 0) / 100) },
      { label: "Rebates earned (AVMRE)", value: formatUSD((summary?.vendor_credits_earned_cents ?? 0) / 100) },
    ],
    [summary],
  );

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Report selector — own row, full-width underline */}
      <div className="flex border-b border-[#E5E7EB] print-hidden">
        {(
          [
            { id: "activity", label: "Statement of Activity" },
            { id: "pnl", label: "Profit & Loss" },
            { id: "collections", label: "Collections" },
          ] as { id: ReportTab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveReport(t.id)}
            className={`px-3 py-2 text-sm font-medium ${
              activeReport === t.id
                ? "text-[#013764] border-b-2 border-[#013764] -mb-px"
                : "text-[#717179] hover:text-[#303030]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Range pickers + export buttons on a single aligned row */}
      <div className="flex items-center justify-between gap-4 flex-wrap print-hidden">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#525252]">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="border border-[#DADADA] rounded-md px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#525252]">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="border border-[#DADADA] rounded-md px-2 py-1 text-sm"
            />
          </div>
          {loading && <span className="text-xs text-gray-500">Loading…</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={printReport}
            className="text-sm font-medium border border-[#DADADA] rounded-md px-3 py-1.5 hover:bg-gray-50"
          >
            Export PDF
          </button>
          <button
            onClick={() => exportActiveCSV(activeReport, { from, to }, data)}
            className="text-sm font-medium border border-[#DADADA] rounded-md px-3 py-1.5 hover:bg-gray-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="printable-report">
        <PrintHeader
          property={data?.property_id ? `Property #${data.property_id}` : "Property"}
          range={`${from} → ${to}`}
          report={
            activeReport === "pnl"
              ? "Profit & Loss"
              : activeReport === "collections"
              ? "Collections — HOA Dues"
              : "Statement of Activity"
          }
        />

      {activeReport === "pnl" && <ProfitLossReport from={from} to={to} />}
      {activeReport === "collections" && <CollectionsReport from={from} to={to} />}
      {activeReport === "activity" && (
      <>
      {/* — Statement of Activity (live data) — */}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            className="border border-[#E5E7EB] rounded-md p-4 bg-white"
          >
            <div className="text-xs text-[#525252]">{c.label}</div>
            <div className="text-xl font-semibold text-[#09090B] mt-1">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Bank accounts — operating + reserve, with current balance */}
      {bankAccounts.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-[#09090B] mb-2">
            Bank accounts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bankAccounts.map((a) => (
              <div
                key={a.id}
                className="border border-[#E5E7EB] rounded-md p-4 bg-white flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-[#09090B]">{a.name}</div>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-800 border-blue-200">
                    {a.purpose === "credit_card" ? "Credit Card" : "Bank"}
                  </span>
                </div>
                <div className="text-2xl font-semibold text-[#09090B] mt-1">
                  {formatUSD(a.balance_cents / 100)}
                </div>
                <div className="text-xs text-gray-500">
                  {a.balance_source === "reconciled" && a.last_reconciled_at
                    ? `Reconciled ${a.last_reconciled_at.slice(0, 10)}`
                    : a.balance_source === "buildium"
                    ? "Last Buildium-reported balance"
                    : "Balance not yet reconciled"}
                  {a.qbo_account_id && ` · QBO #${a.qbo_account_id}`}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bills */}
      <section>
        <h2 className="text-base font-semibold text-[#09090B] mb-2">
          Bills ({bills.length})
        </h2>
        <div className="border border-[#E5E7EB] rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAFA] text-[#525252] text-xs">
              <tr>
                <Th>Statement date</Th>
                <Th>Vendor</Th>
                <Th>GL account</Th>
                <Th className="text-right">Amount</Th>
                <Th>Status</Th>
                <Th>Books</Th>
                <Th>QBO</Th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-gray-400 text-sm">
                    No bills in this period.
                  </td>
                </tr>
              )}
              {bills.map((b) => (
                <tr key={b.id} className="border-t border-[#F0F0F0]">
                  <Td>{b.statement_date}</Td>
                  <Td>{b.vendor_name || "—"}</Td>
                  <Td className="truncate max-w-[200px]" title={b.gl_account_name}>
                    {b.gl_account_name || "—"}
                  </Td>
                  <Td className="text-right">{formatUSD(b.amount_cents / 100)}</Td>
                  <Td><PaymentStatusPill value={b.payment_status} /></Td>
                  <Td><BooksPill value={b.books_owner} /></Td>
                  <Td>
                    {b.qbo_purchase_id ? (
                      <span className="text-emerald-700 text-xs">#{b.qbo_purchase_id}</span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payments */}
      <section>
        <h2 className="text-base font-semibold text-[#09090B] mb-2">
          Payments ({payments.length})
        </h2>
        <div className="border border-[#E5E7EB] rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAFA] text-[#525252] text-xs">
              <tr>
                <Th>Date</Th>
                <Th>Vendor</Th>
                <Th>Bill #</Th>
                <Th className="text-right">Amount</Th>
                <Th>Method</Th>
                <Th>Paid from</Th>
                <Th>Books</Th>
                <Th>Check #</Th>
                <Th>QBO</Th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-gray-400 text-sm">
                    No payments in this period.
                  </td>
                </tr>
              )}
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-[#F0F0F0]">
                  <Td>{p.payment_date}</Td>
                  <Td>{p.vendor_name || "—"}</Td>
                  <Td>{p.bill_invoice_number || "—"}</Td>
                  <Td className="text-right">{formatUSD(p.amount_cents / 100)}</Td>
                  <Td className="capitalize">{p.payment_method.replace(/_/g, " ")}</Td>
                  <Td>{p.bank_account_name || "—"}</Td>
                  <Td><BooksPill value={p.books_owner} /></Td>
                  <Td>{p.check_number || <span className="text-gray-400">—</span>}</Td>
                  <Td>
                    {p.qbo_bill_payment_id ? (
                      <span className="text-emerald-700 text-xs">#{p.qbo_bill_payment_id}</span>
                    ) : p.qbo_sync_error ? (
                      <span
                        className="text-red-600 text-xs cursor-help"
                        title={p.qbo_sync_error}
                      >
                        sync error
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Vendor credits earned because of this property's bills.
          These live on AVMRE's books (or wherever the vendor relationship
          sits) but originated from this HOA's spend. */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-[#09090B]">
            Vendor credits earned ({credits.length})
          </h2>
          <button
            onClick={() => setCreditModalOpen(true)}
            className="text-sm font-medium text-white bg-[#013764] hover:bg-[#012a4f] rounded-md px-3 py-1.5 transition-colors"
          >
            + Book credit
          </button>
        </div>
        <div className="border border-[#E5E7EB] rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAFA] text-[#525252] text-xs">
              <tr>
                <Th>Date</Th>
                <Th>Vendor</Th>
                <Th>Source bill</Th>
                <Th>Rate</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">Remaining</Th>
                <Th>Status</Th>
                <Th>Books</Th>
                <Th>Memo</Th>
              </tr>
            </thead>
            <tbody>
              {credits.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-gray-400 text-sm">
                    No vendor credits earned in this period.
                  </td>
                </tr>
              )}
              {credits.map((c) => (
                <tr key={c.id} className="border-t border-[#F0F0F0]">
                  <Td>{c.credit_date}</Td>
                  <Td>{c.vendor_name || "—"}</Td>
                  <Td>{c.source_invoice_number || (c.source_bill_id ? `#${c.source_bill_id}` : "—")}</Td>
                  <Td>
                    {c.rate_basis_points != null
                      ? `${(c.rate_basis_points / 100).toFixed(2)}%`
                      : <span className="text-gray-400">—</span>}
                  </Td>
                  <Td className="text-right">{formatUSD(c.total_cents / 100)}</Td>
                  <Td className="text-right">{formatUSD(c.remaining_cents / 100)}</Td>
                  <Td><CreditStatusPill value={c.status} /></Td>
                  <Td><BooksPill value={c.books_owner} /></Td>
                  <Td className="truncate max-w-[260px]" title={c.memo}>{c.memo || "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </>
      )}
      </div>

      {creditModalOpen && (
        <BookVendorCreditModal
          propertyId={propertyId}
          onClose={() => setCreditModalOpen(false)}
          onCreated={() => {
            setCreditModalOpen(false);
            setReloadTick((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}

function BookVendorCreditModal({
  propertyId,
  onClose,
  onCreated,
}: {
  propertyId: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [bills, setBills] = useState<PaidBillOption[]>([]);
  const [sourceBillId, setSourceBillId] = useState<string>("");
  // Either rate (auto-computes amount from selected bill) OR explicit dollar amount.
  const [ratePct, setRatePct] = useState<string>("10");
  const [amountUSD, setAmountUSD] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [creditDate, setCreditDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [syncToQBO, setSyncToQBO] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJSON(`/properties/${propertyId}/paid-bills`)
      .then((res: any) => setBills(res?.bills ?? []))
      .catch((err: any) => toast.error(err?.message || "Failed to load bills"));
  }, [propertyId]);

  const selectedBill = useMemo(
    () => bills.find((b) => String(b.id) === sourceBillId),
    [bills, sourceBillId],
  );

  // When a bill + rate are set and amount is empty, preview the computed amount.
  const previewAmount = useMemo(() => {
    if (amountUSD) return Number.parseFloat(amountUSD);
    if (!selectedBill || !ratePct) return null;
    const rate = Number.parseFloat(ratePct);
    if (Number.isNaN(rate)) return null;
    return Math.round(selectedBill.amount_cents * rate) / 10000;
  }, [amountUSD, ratePct, selectedBill]);

  const handleSubmit = async () => {
    if (!selectedBill && !amountUSD) {
      toast.error("Pick a source bill (with a rate) or enter an explicit amount.");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        // Vendor for the credit defaults to the source bill's vendor; if no
        // bill is selected, the user must enter an amount and we still need
        // a vendor — for v1 we require a source bill.
        vendor_id: selectedBill?.vendor_id,
        entity_property_id: 585, // AVMRE — only realistic books-owner today
        source_bill_id: selectedBill?.id,
        source_property_id: propertyId,
        memo: memo ||
          (selectedBill && ratePct
            ? `${ratePct}% partner rebate on bill #${selectedBill.invoice_number || selectedBill.id}`
            : ""),
        credit_date: creditDate,
        sync_to_qbo: syncToQBO,
      };
      if (amountUSD) {
        body.total_cents = Math.round(Number.parseFloat(amountUSD) * 100);
      } else if (ratePct) {
        body.rate_basis_points = Math.round(Number.parseFloat(ratePct) * 100);
      }

      const res: any = await fetchJSON("/accounting/vendor-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res?.qbo_sync_error) {
        toast.warning(`Credit booked but QBO sync failed: ${res.qbo_sync_error}`);
      } else if (res?.qbo) {
        toast.success(`Credit booked and synced to QBO (#${res.qbo}).`);
      } else {
        toast.success("Credit booked.");
      }
      onCreated();
    } catch (err: any) {
      toast.error(err?.message || "Failed to book credit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#09090B]">Book vendor credit</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#525252] mb-1">Source bill</label>
            <select
              value={sourceBillId}
              onChange={(e) => setSourceBillId(e.target.value)}
              className="w-full border border-[#DADADA] rounded-md px-2 py-1.5 text-sm"
            >
              <option value="">— Pick a bill —</option>
              {bills.map((b) => (
                <option key={b.id} value={String(b.id)}>{b.label}</option>
              ))}
            </select>
            <div className="text-xs text-gray-400 mt-1">
              Vendor + GL account come from this bill. Required if you're using rate-based pricing.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#525252] mb-1">Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={ratePct}
                onChange={(e) => setRatePct(e.target.value)}
                disabled={!!amountUSD}
                placeholder="e.g. 10"
                className="w-full border border-[#DADADA] rounded-md px-2 py-1.5 text-sm disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs text-[#525252] mb-1">Amount ($) — overrides rate</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountUSD}
                onChange={(e) => setAmountUSD(e.target.value)}
                placeholder="e.g. 7.53"
                className="w-full border border-[#DADADA] rounded-md px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          {previewAmount != null && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
              Will book a credit of <strong>{formatUSD(previewAmount)}</strong>
              {selectedBill && !amountUSD && ratePct &&
                ` (${ratePct}% of ${formatUSD(selectedBill.amount_cents / 100)})`}
            </div>
          )}

          <div>
            <label className="block text-xs text-[#525252] mb-1">Credit date</label>
            <input
              type="date"
              value={creditDate}
              onChange={(e) => setCreditDate(e.target.value)}
              className="w-full border border-[#DADADA] rounded-md px-2 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-[#525252] mb-1">Memo</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="(defaults to '<rate>% partner rebate on bill #...')"
              className="w-full border border-[#DADADA] rounded-md px-2 py-1.5 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#303030] cursor-pointer">
            <input
              type="checkbox"
              checked={syncToQBO}
              onChange={(e) => setSyncToQBO(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Push to QuickBooks immediately
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-1.5 text-sm rounded-md border border-[#DADADA] text-[#303030] hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-3 py-1.5 text-sm rounded-md bg-[#013764] text-white hover:bg-[#012a4f] disabled:opacity-50"
          >
            {submitting ? "Booking…" : "Book credit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>
  );
}

function Td({ children, className = "", title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <td className={`px-3 py-2 text-[#303030] ${className}`} title={title}>
      {children}
    </td>
  );
}

function PaymentStatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    partial: "bg-amber-100 text-amber-800 border-amber-200",
    void: "bg-red-100 text-red-800 border-red-200",
    unpaid: "bg-gray-100 text-gray-700 border-gray-200",
  };
  const label =
    value === "paid" ? "Paid" :
    value === "partial" ? "Partial" :
    value === "void" ? "Void" :
    "Unpaid";
  const cls = map[value] || map.unpaid;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

function CreditStatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    open: "bg-emerald-100 text-emerald-800 border-emerald-200",
    applied: "bg-gray-100 text-gray-700 border-gray-200",
    redeemed: "bg-gray-100 text-gray-700 border-gray-200",
    cashed_out: "bg-blue-100 text-blue-800 border-blue-200",
    void: "bg-red-100 text-red-800 border-red-200",
  };
  const cls = map[value] || map.open;
  const label = value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

function BooksPill({ value }: { value: string }) {
  const cls =
    value === "HOA"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : value === "AVMRE"
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {value}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Demo / mock data — used by P&L and Collections reports below.
// All numbers are illustrative (Harbor House, 6 units, $450 monthly dues).
// Keep tightly self-contained so a future "real data" wiring is one swap.
// ─────────────────────────────────────────────────────────────────────

const DEMO_OWNERS = [
  { unit: "Unit 1", owner: "Alexandra Jennison", monthly: 450 },
  { unit: "Unit 2", owner: "Marcus Tan", monthly: 450 },
  { unit: "Unit 3", owner: "Priya Shah", monthly: 525 },
  { unit: "Unit 4", owner: "Daniel & Lisa Kowalski", monthly: 450 },
  { unit: "Unit 5", owner: "Robert Chen", monthly: 450 },
  { unit: "Unit 6", owner: "Sofia Reyes", monthly: 525 },
] as const;

const DEMO_INCOME_BY_GL = [
  { gl: "Association Fees Income", amount: 16200 },
  { gl: "Late Fee Income", amount: 175 },
  { gl: "A/V Income", amount: 320 },
  { gl: "Resale Package Fees", amount: 250 },
  { gl: "Move-out Fee Income", amount: 200 },
];

const DEMO_EXPENSES_BY_GL = [
  { gl: "Landscaping", amount: 3450 },
  { gl: "Snow Removal", amount: 2800 },
  { gl: "Basin Cleaning", amount: 275.35 },
  { gl: "Building Repairs", amount: 1240 },
  { gl: "Insurance", amount: 4150 },
  { gl: "Management Fees", amount: 2400 },
  { gl: "Tax Filing/Tax Return Fee", amount: 850 },
  { gl: "Utilities: Water", amount: 612 },
  { gl: "Utilities: Electric", amount: 945 },
  { gl: "Pest Control", amount: 200 },
];

// Months currently in the demo period (defaults YTD; we show Jan–Apr 2026
// as the populated demo range).
const DEMO_MONTHS = ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026"] as const;

// One row per owner per month with payment status. Mix of paid current,
// paid late, partially paid, and unpaid, so the demo shows the variety
// of states an HOA bookkeeper actually sees.
type DuesRow = { unit: string; owner: string; month: string; charged: number; paid: number; status: "paid" | "late" | "partial" | "unpaid"; paid_on?: string };

const DEMO_DUES: DuesRow[] = [
  // Unit 1 — current
  { unit: "Unit 1", owner: "Alexandra Jennison", month: "Jan 2026", charged: 450, paid: 450, status: "paid", paid_on: "2026-01-04" },
  { unit: "Unit 1", owner: "Alexandra Jennison", month: "Feb 2026", charged: 450, paid: 450, status: "paid", paid_on: "2026-02-03" },
  { unit: "Unit 1", owner: "Alexandra Jennison", month: "Mar 2026", charged: 450, paid: 450, status: "paid", paid_on: "2026-03-05" },
  { unit: "Unit 1", owner: "Alexandra Jennison", month: "Apr 2026", charged: 450, paid: 450, status: "paid", paid_on: "2026-04-02" },
  // Unit 2 — paid late twice
  { unit: "Unit 2", owner: "Marcus Tan", month: "Jan 2026", charged: 450, paid: 450, status: "paid", paid_on: "2026-01-10" },
  { unit: "Unit 2", owner: "Marcus Tan", month: "Feb 2026", charged: 450, paid: 475, status: "late", paid_on: "2026-02-22" },
  { unit: "Unit 2", owner: "Marcus Tan", month: "Mar 2026", charged: 450, paid: 475, status: "late", paid_on: "2026-03-25" },
  { unit: "Unit 2", owner: "Marcus Tan", month: "Apr 2026", charged: 450, paid: 450, status: "paid", paid_on: "2026-04-09" },
  // Unit 3 — current
  { unit: "Unit 3", owner: "Priya Shah", month: "Jan 2026", charged: 525, paid: 525, status: "paid", paid_on: "2026-01-01" },
  { unit: "Unit 3", owner: "Priya Shah", month: "Feb 2026", charged: 525, paid: 525, status: "paid", paid_on: "2026-02-01" },
  { unit: "Unit 3", owner: "Priya Shah", month: "Mar 2026", charged: 525, paid: 525, status: "paid", paid_on: "2026-03-01" },
  { unit: "Unit 3", owner: "Priya Shah", month: "Apr 2026", charged: 525, paid: 525, status: "paid", paid_on: "2026-04-01" },
  // Unit 4 — partial in March, behind in April
  { unit: "Unit 4", owner: "Daniel & Lisa Kowalski", month: "Jan 2026", charged: 450, paid: 450, status: "paid", paid_on: "2026-01-08" },
  { unit: "Unit 4", owner: "Daniel & Lisa Kowalski", month: "Feb 2026", charged: 450, paid: 450, status: "paid", paid_on: "2026-02-12" },
  { unit: "Unit 4", owner: "Daniel & Lisa Kowalski", month: "Mar 2026", charged: 450, paid: 200, status: "partial", paid_on: "2026-03-18" },
  { unit: "Unit 4", owner: "Daniel & Lisa Kowalski", month: "Apr 2026", charged: 450, paid: 0, status: "unpaid" },
  // Unit 5 — fully delinquent in March + April
  { unit: "Unit 5", owner: "Robert Chen", month: "Jan 2026", charged: 450, paid: 450, status: "paid", paid_on: "2026-01-06" },
  { unit: "Unit 5", owner: "Robert Chen", month: "Feb 2026", charged: 450, paid: 450, status: "paid", paid_on: "2026-02-06" },
  { unit: "Unit 5", owner: "Robert Chen", month: "Mar 2026", charged: 450, paid: 0, status: "unpaid" },
  { unit: "Unit 5", owner: "Robert Chen", month: "Apr 2026", charged: 450, paid: 0, status: "unpaid" },
  // Unit 6 — current
  { unit: "Unit 6", owner: "Sofia Reyes", month: "Jan 2026", charged: 525, paid: 525, status: "paid", paid_on: "2026-01-03" },
  { unit: "Unit 6", owner: "Sofia Reyes", month: "Feb 2026", charged: 525, paid: 525, status: "paid", paid_on: "2026-02-04" },
  { unit: "Unit 6", owner: "Sofia Reyes", month: "Mar 2026", charged: 525, paid: 525, status: "paid", paid_on: "2026-03-04" },
  { unit: "Unit 6", owner: "Sofia Reyes", month: "Apr 2026", charged: 525, paid: 525, status: "paid", paid_on: "2026-04-05" },
];

// ─── Profit & Loss report ─────────────────────────────────────────

function ProfitLossReport({ from, to }: { from: string; to: string }) {
  const incomeTotal = DEMO_INCOME_BY_GL.reduce((s, r) => s + r.amount, 0);
  const expenseTotal = DEMO_EXPENSES_BY_GL.reduce((s, r) => s + r.amount, 0);
  const net = incomeTotal - expenseTotal;
  return (
    <div className="border border-[#E5E7EB] rounded-md bg-white p-6 print:border-0 print:p-0">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-lg font-semibold text-[#09090B]">Profit & Loss</h2>
        <span className="text-xs text-gray-500">Demo data — for client preview</span>
      </div>
      <div className="text-sm text-gray-600 mb-6">{from} → {to}</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ReportSection title="Income">
          {DEMO_INCOME_BY_GL.map((r) => (
            <ReportRow key={r.gl} label={r.gl} value={r.amount} />
          ))}
          <ReportRow label="Total Income" value={incomeTotal} bold />
        </ReportSection>

        <ReportSection title="Expenses">
          {DEMO_EXPENSES_BY_GL.map((r) => (
            <ReportRow key={r.gl} label={r.gl} value={r.amount} />
          ))}
          <ReportRow label="Total Expenses" value={expenseTotal} bold />
        </ReportSection>
      </div>

      <div className="mt-8 border-t border-[#E5E7EB] pt-4 flex items-center justify-between">
        <span className="text-base font-semibold">Net Operating Income</span>
        <span className={`text-xl font-semibold ${net >= 0 ? "text-emerald-700" : "text-red-700"}`}>
          {formatUSD(net)}
        </span>
      </div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[#525252] uppercase tracking-wide mb-2 border-b border-[#E5E7EB] pb-1">
        {title}
      </h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function ReportRow({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-sm ${bold ? "font-semibold border-t border-[#E5E7EB] pt-1 mt-1" : ""}`}>
      <span>{label}</span>
      <span>{formatUSD(value)}</span>
    </div>
  );
}

// ─── Collections (HOA dues) report ────────────────────────────────

function CollectionsReport({ from, to }: { from: string; to: string }) {
  const totalCharged = DEMO_DUES.reduce((s, r) => s + r.charged, 0);
  const totalPaid = DEMO_DUES.reduce((s, r) => s + r.paid, 0);
  const balance = totalCharged - totalPaid;

  // Owner-level rollup for the per-owner table
  const byOwner = DEMO_OWNERS.map((o) => {
    const rows = DEMO_DUES.filter((d) => d.owner === o.owner);
    const charged = rows.reduce((s, r) => s + r.charged, 0);
    const paid = rows.reduce((s, r) => s + r.paid, 0);
    const owed = charged - paid;
    return { ...o, charged, paid, owed, status: owed > 0 ? (paid === 0 ? "delinquent" : "partial") : "current" as const };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-[#E5E7EB] rounded-md bg-white p-6 print:border-0 print:p-0">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="text-lg font-semibold text-[#09090B]">Collections — HOA Dues</h2>
          <span className="text-xs text-gray-500">Demo data — for client preview</span>
        </div>
        <div className="text-sm text-gray-600 mb-4">{from} → {to}</div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <SummaryCard label="Total charged" value={formatUSD(totalCharged)} />
          <SummaryCard label="Total collected" value={formatUSD(totalPaid)} sub={`${Math.round((totalPaid / totalCharged) * 100)}% of billings`} />
          <SummaryCard label="Outstanding balance" value={formatUSD(balance)} accent={balance > 0 ? "warn" : "ok"} />
          <SummaryCard label="Delinquent owners" value={String(byOwner.filter((o) => o.owed > 0).length)} sub={`of ${byOwner.length} units`} />
        </div>

        <h3 className="text-sm font-semibold text-[#525252] uppercase tracking-wide mb-2">Per-owner status</h3>
        <div className="border border-[#E5E7EB] rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAFA] text-[#525252] text-xs">
              <tr>
                <Th>Unit</Th>
                <Th>Owner</Th>
                <Th className="text-right">Monthly</Th>
                <Th className="text-right">Charged YTD</Th>
                <Th className="text-right">Paid YTD</Th>
                <Th className="text-right">Balance</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {byOwner.map((o) => (
                <tr key={o.unit} className="border-t border-[#F0F0F0]">
                  <Td>{o.unit}</Td>
                  <Td>{o.owner}</Td>
                  <Td className="text-right">{formatUSD(o.monthly)}</Td>
                  <Td className="text-right">{formatUSD(o.charged)}</Td>
                  <Td className="text-right">{formatUSD(o.paid)}</Td>
                  <Td className={`text-right font-medium ${o.owed > 0 ? "text-red-700" : "text-emerald-700"}`}>
                    {formatUSD(o.owed)}
                  </Td>
                  <Td><CollectionStatusPill value={o.status} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border border-[#E5E7EB] rounded-md bg-white p-6 print:border-0 print:p-0">
        <h3 className="text-sm font-semibold text-[#525252] uppercase tracking-wide mb-2">Monthly billings detail</h3>
        <div className="border border-[#E5E7EB] rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAFA] text-[#525252] text-xs">
              <tr>
                <Th>Month</Th>
                <Th>Unit</Th>
                <Th>Owner</Th>
                <Th className="text-right">Charged</Th>
                <Th className="text-right">Paid</Th>
                <Th>Paid on</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {DEMO_DUES.map((d, i) => (
                <tr key={i} className="border-t border-[#F0F0F0]">
                  <Td>{d.month}</Td>
                  <Td>{d.unit}</Td>
                  <Td>{d.owner}</Td>
                  <Td className="text-right">{formatUSD(d.charged)}</Td>
                  <Td className="text-right">{formatUSD(d.paid)}</Td>
                  <Td>{d.paid_on || <span className="text-gray-400">—</span>}</Td>
                  <Td><CollectionStatusPill value={d.status} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: "ok" | "warn" }) {
  const cls = accent === "warn" ? "text-red-700" : accent === "ok" ? "text-emerald-700" : "text-[#09090B]";
  return (
    <div className="border border-[#E5E7EB] rounded-md p-4 bg-white">
      <div className="text-xs text-[#525252]">{label}</div>
      <div className={`text-xl font-semibold mt-1 ${cls}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function CollectionStatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    current: "bg-emerald-100 text-emerald-800 border-emerald-200",
    late: "bg-amber-100 text-amber-800 border-amber-200",
    partial: "bg-amber-100 text-amber-800 border-amber-200",
    unpaid: "bg-red-100 text-red-800 border-red-200",
    delinquent: "bg-red-100 text-red-800 border-red-200",
  };
  const cls = map[value] || map.unpaid;
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Print header (shows on the PDF, hidden on screen) ───────────

function PrintHeader({ property, range, report }: { property: string; range: string; report: string }) {
  return (
    <div className="hidden print:block mb-6">
      <div className="text-xs uppercase tracking-wide text-gray-500">AVM Portal · {property}</div>
      <div className="text-2xl font-semibold text-[#09090B] mt-1">{report}</div>
      <div className="text-sm text-gray-600">{range}</div>
      <div className="border-b border-gray-300 mt-3" />
    </div>
  );
}

// ─── CSV export ────────────────────────────────────────────────────

function exportActiveCSV(
  report: ReportTab,
  range: { from: string; to: string },
  data: StatementResponse | null,
) {
  if (report === "pnl") {
    downloadCSV(`pnl_${range.from}_to_${range.to}.csv`, [
      ["Section", "GL Account", "Amount"],
      ...DEMO_INCOME_BY_GL.map((r) => ["Income", r.gl, r.amount.toFixed(2)] as (string | number)[]),
      ...DEMO_EXPENSES_BY_GL.map((r) => ["Expenses", r.gl, r.amount.toFixed(2)] as (string | number)[]),
    ]);
    return;
  }
  if (report === "collections") {
    downloadCSV(`collections_${range.from}_to_${range.to}.csv`, [
      ["Month", "Unit", "Owner", "Charged", "Paid", "Paid on", "Status"],
      ...DEMO_DUES.map((d) => [d.month, d.unit, d.owner, d.charged.toFixed(2), d.paid.toFixed(2), d.paid_on ?? "", d.status]),
    ]);
    return;
  }

  // Activity tab — full live dump from the loaded API response. Bills,
  // Payments, and Vendor Credits each get their own section in one file
  // (Excel/Numbers handle blank-row separators cleanly).
  const bills = data?.bills ?? [];
  const payments = data?.payments ?? [];
  const credits = data?.vendor_credits ?? [];
  const summary = data?.summary;

  const rows: (string | number)[][] = [
    ["Statement of Activity"],
    ["Property", String(data?.property_id ?? "")],
    ["Period", `${range.from} to ${range.to}`],
    [],
    ["Summary"],
    ["Bills total",       summary ? (summary.bills_total_cents / 100).toFixed(2) : "0.00"],
    ["Bills paid",        summary ? (summary.bills_paid_cents / 100).toFixed(2) : "0.00"],
    ["Bills outstanding", summary ? (summary.bills_outstanding_cents / 100).toFixed(2) : "0.00"],
    ["Paid by HOA",       summary ? (summary.paid_by_hoa_cents / 100).toFixed(2) : "0.00"],
    ["Paid by AVMRE",     summary ? (summary.paid_by_avmre_cents / 100).toFixed(2) : "0.00"],
    ["Vendor credits earned", summary ? (summary.vendor_credits_earned_cents / 100).toFixed(2) : "0.00"],
    [],
    ["Bills"],
    ["Statement date","Vendor","GL Account","Invoice #","Memo","Amount","Paid","Status","Books","QBO Bill ID"],
    ...bills.map((b) => [
      b.statement_date, b.vendor_name, b.gl_account_name, b.invoice_number, b.memo,
      (b.amount_cents / 100).toFixed(2),
      (b.paid_amount_cents / 100).toFixed(2),
      b.payment_status, b.books_owner, b.qbo_purchase_id ?? "",
    ] as (string | number)[]),
    [],
    ["Payments"],
    ["Date","Vendor","Bill #","Amount","Method","Paid from","Books","Check #","QBO BillPayment ID"],
    ...payments.map((p) => [
      p.payment_date, p.vendor_name, p.bill_invoice_number,
      (p.amount_cents / 100).toFixed(2),
      p.payment_method, p.bank_account_name, p.books_owner,
      p.check_number ?? "", p.qbo_bill_payment_id ?? "",
    ] as (string | number)[]),
    [],
    ["Vendor Credits Earned"],
    ["Date","Vendor","Source bill","Rate %","Total","Remaining","Status","Books","Memo"],
    ...credits.map((c) => [
      c.credit_date, c.vendor_name,
      c.source_invoice_number || (c.source_bill_id ? `#${c.source_bill_id}` : ""),
      c.rate_basis_points != null ? (c.rate_basis_points / 100).toFixed(2) : "",
      (c.total_cents / 100).toFixed(2),
      (c.remaining_cents / 100).toFixed(2),
      c.status, c.books_owner, c.memo,
    ] as (string | number)[]),
  ];

  downloadCSV(`statement_of_activity_${range.from}_to_${range.to}.csv`, rows);
}
