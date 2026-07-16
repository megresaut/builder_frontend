import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import { fetchJSON } from "@/api/fetchJSON";

// ---------------------------------------------------------------------------
// Types (match backend models)
// ---------------------------------------------------------------------------

interface DashboardSummary {
  total_vendors: number;
  vendors_with_insurance: number;
  vendors_with_tax_docs: number;
  vendors_with_agreement: number;
  lapsed_count: number;
}

interface AttentionDoc {
  id: number;
  vendor_id: number;
  vendor_name: string;
  document_type: string;
  document_name: string;
  expiration_date: string;
  status: "current" | "expiring" | "lapsed";
  days_remaining: number;
  uploaded_by: string;
  uploaded_at: string;
}

interface RiskFlag {
  id: number;
  vendor_id: number;
  vendor_name: string;
  severity: "critical" | "warning";
  title: string;
  message: string;
}

interface KpiVendorRow {
  vendor_id: number;
  vendor_name: string;
  has_doc: boolean;
  doc_name: string;
  status: string;
  expiration_date: string;
}

type KpiType = "insurance" | "tax" | "agreement" | "lapsed";

interface Report1099Row {
  qbo_vendor_id: string;
  vendor_name: string;
  total_cents: number;
  payment_count: number;
  excluded_card_cents: number;
  over_threshold: boolean;
}

interface Report1099 {
  year: number;
  threshold_cents: number;
  generated_at: string;
  rows: Report1099Row[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DOC_TYPE_LABELS: Record<string, string> = {
  certificate_of_insurance: "Certificate of Insurance",
  w9: "W-9",
  "1099": "1099",
  business_license: "Business License",
  avm_agreement: "AVM Agreement",
  contractors_license: "Contractor's License",
  other: "Other",
};

const KPI_TITLES: Record<KpiType, string> = {
  insurance: "Insurance on File",
  tax: "Tax Documents on File",
  agreement: "Agreements Collected",
  lapsed: "Lapsed / Expired Documents",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${m}/${d}/${y}`;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function downloadReportCsv(report: Report1099) {
  const header = "Vendor,QBO Vendor ID,Payments,Total (non-card),Card Payments (excluded),Over Threshold";
  const lines = report.rows.map((r) =>
    [
      `"${r.vendor_name.replace(/"/g, '""')}"`,
      r.qbo_vendor_id,
      r.payment_count,
      (r.total_cents / 100).toFixed(2),
      (r.excluded_card_cents / 100).toFixed(2),
      r.over_threshold ? "yes" : "no",
    ].join(","),
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `1099-report-${report.year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  subtitle,
  accentColor,
  onClick,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  accentColor: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border-l-4 p-5 ${accentColor} ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
      {subtitle && (
        <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}

function StatusBadge({ status, daysRemaining }: { status: string; daysRemaining?: number }) {
  if (status === "lapsed") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Lapsed
      </span>
    );
  }
  if (status === "expiring") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Expiring
        {daysRemaining != null && (
          <span className="text-xs">({daysRemaining}d)</span>
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      Current
    </span>
  );
}

// ---------------------------------------------------------------------------
// KPI Detail Modal
// ---------------------------------------------------------------------------

function KpiModal({
  kpiType,
  vendors,
  loading,
  onClose,
}: {
  kpiType: KpiType;
  vendors: KpiVendorRow[];
  loading: boolean;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "has" | "missing">(
    kpiType === "lapsed" ? "all" : "all"
  );

  const filtered = vendors.filter((v) => {
    if (search && !v.vendor_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (kpiType !== "lapsed") {
      if (filterMode === "has" && !v.has_doc) return false;
      if (filterMode === "missing" && v.has_doc) return false;
    }
    return true;
  });

  const hasCount = vendors.filter((v) => v.has_doc).length;
  const missingCount = vendors.filter((v) => !v.has_doc).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {KPI_TITLES[kpiType]}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Search + Filter */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {kpiType !== "lapsed" && (
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-2.5 py-1 rounded-md ${filterMode === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                All ({vendors.length})
              </button>
              <button
                onClick={() => setFilterMode("has")}
                className={`px-2.5 py-1 rounded-md ${filterMode === "has" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100"}`}
              >
                Has ({hasCount})
              </button>
              <button
                onClick={() => setFilterMode("missing")}
                className={`px-2.5 py-1 rounded-md ${filterMode === "missing" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"}`}
              >
                Missing ({missingCount})
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500 text-sm">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-400 text-sm">No vendors match your search.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-24">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {kpiType === "lapsed" ? "Lapsed Document" : "Document"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Expiration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((v, idx) => (
                  <tr
                    key={`${v.vendor_id}-${idx}`}
                    className={
                      kpiType === "lapsed"
                        ? "bg-red-50"
                        : v.has_doc
                          ? ""
                          : "bg-gray-50"
                    }
                  >
                    <td className="px-6 py-3 text-sm">
                      <Link
                        to={`/vendors/${v.vendor_id}`}
                        onClick={onClose}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {v.vendor_name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-sm whitespace-nowrap">
                      {kpiType === "lapsed" ? (
                        <span className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Lapsed
                        </span>
                      ) : v.has_doc ? (
                        <span className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          On File
                        </span>
                      ) : (
                        <span className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                          Missing
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {v.doc_name || "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {v.expiration_date ? formatDate(v.expiration_date) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
          Showing {filtered.length} of {vendors.length} vendors
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function VendorComplianceDashboard() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [attentionDocs, setAttentionDocs] = useState<AttentionDoc[]>([]);
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);

  // KPI Modal state
  const [kpiModal, setKpiModal] = useState<KpiType | null>(null);
  const [kpiVendors, setKpiVendors] = useState<KpiVendorRow[]>([]);
  const [kpiLoading, setKpiLoading] = useState(false);

  // 1099 report state — click-driven, not part of the initial load (the
  // live QBO pull takes several seconds).
  const currentYear = new Date().getFullYear();
  const [reportYear, setReportYear] = useState(currentYear);
  const [report, setReport] = useState<Report1099 | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const generate1099Report = useCallback(async (year: number) => {
    setReportLoading(true);
    setReportError(null);
    try {
      const data: Report1099 = await fetchJSON(
        `/vendors/compliance/1099-report?year=${year}`,
      );
      setReport(data);
    } catch (err: any) {
      setReport(null);
      setReportError(err?.message ?? "Failed to generate the 1099 report");
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [summaryData, attentionData, flagsData] = await Promise.all([
          fetchJSON("/vendors/compliance/dashboard"),
          fetchJSON("/vendors/compliance/dashboard/attention"),
          fetchJSON("/vendors/compliance/dashboard/flags"),
        ]);
        setSummary(summaryData);
        setAttentionDocs(attentionData);
        setRiskFlags(flagsData);
      } catch (err) {
        console.error("Failed to load compliance dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDismissFlag = useCallback(async (flagId: number) => {
    try {
      await fetchJSON(`/vendors/compliance/dashboard/flags?id=${flagId}`, {
        method: "PATCH",
      });
      setRiskFlags((prev) => prev.filter((f) => f.id !== flagId));
    } catch (err) {
      console.error("Failed to dismiss flag:", err);
    }
  }, []);

  const openKpiModal = useCallback(async (type: KpiType) => {
    setKpiModal(type);
    setKpiVendors([]);
    setKpiLoading(true);
    try {
      const data = await fetchJSON(`/vendors/compliance/dashboard/vendors?type=${type}`);
      setKpiVendors(data);
    } catch (err) {
      console.error("Failed to load KPI vendors:", err);
    } finally {
      setKpiLoading(false);
    }
  }, []);

  const totalVendors = summary?.total_vendors ?? 0;

  // Client-side search filter on attention docs
  const filteredAttentionDocs = search
    ? attentionDocs.filter((d) =>
        d.vendor_name.toLowerCase().includes(search.toLowerCase())
      )
    : attentionDocs;

  return (
    <PageTemplate>
      {/* KPI Modal */}
      {kpiModal && (
        <KpiModal
          kpiType={kpiModal}
          vendors={kpiVendors}
          loading={kpiLoading}
          onClose={() => setKpiModal(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Vendor Compliance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Portfolio-wide vendor compliance overview
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading compliance data...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard
              label="Insurance on File"
              value={`${summary?.vendors_with_insurance ?? 0} / ${totalVendors}`}
              subtitle="vendors with current COI"
              accentColor="border-green-500"
              onClick={() => openKpiModal("insurance")}
            />
            <KpiCard
              label="Tax Documents on File"
              value={`${summary?.vendors_with_tax_docs ?? 0} / ${totalVendors}`}
              subtitle="vendors with W-9 or 1099"
              accentColor="border-blue-500"
              onClick={() => openKpiModal("tax")}
            />
            <KpiCard
              label="Agreements Collected"
              value={`${summary?.vendors_with_agreement ?? 0} / ${totalVendors}`}
              subtitle="vendors with AVM agreement"
              accentColor="border-yellow-500"
              onClick={() => openKpiModal("agreement")}
            />
            <KpiCard
              label="Lapsed / Expired"
              value={summary?.lapsed_count ?? 0}
              accentColor="border-red-500"
              onClick={() => openKpiModal("lapsed")}
            />
          </div>

          {/* Documents Needing Attention */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Documents Needing Attention
                </h2>
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                  {filteredAttentionDocs.length}
                </span>
              </div>
              <input
                type="text"
                placeholder="Search by vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>

            {filteredAttentionDocs.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-lg">
                No documents need attention at this time.
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded By
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAttentionDocs.map((doc) => (
                      <tr
                        key={doc.id}
                        className={
                          doc.status === "lapsed"
                            ? "bg-red-50"
                            : "bg-yellow-50"
                        }
                      >
                        <td className="px-4 py-3 text-sm">
                          <Link
                            to={`/vendors/${doc.vendor_id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          >
                            {doc.vendor_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {doc.document_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <StatusBadge
                            status={doc.status}
                            daysRemaining={doc.status === "expiring" ? doc.days_remaining : undefined}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span>{formatDate(doc.expiration_date)}</span>
                          {doc.days_remaining < 0 ? (
                            <span className="text-red-600 text-xs ml-1">
                              ({Math.abs(doc.days_remaining)} days ago)
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs ml-1">
                              ({doc.days_remaining} days remaining)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {doc.uploaded_by}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Link
                            to={`/vendors/${doc.vendor_id}`}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 1099 Payment Report (live from QBO) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  1099 Payment Report
                </h2>
                {report && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                    {report.rows.filter((r) => r.over_threshold).length} over threshold
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(Number(e.target.value))}
                  disabled={reportLoading}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[0, 1, 2, 3].map((back) => (
                    <option key={back} value={currentYear - back}>
                      {currentYear - back}
                    </option>
                  ))}
                </select>
                {report && !reportLoading && (
                  <button
                    onClick={() => downloadReportCsv(report)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Export CSV
                  </button>
                )}
                <button
                  onClick={() => generate1099Report(reportYear)}
                  disabled={reportLoading}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {reportLoading ? "Pulling from QuickBooks…" : "Generate Report"}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              Totals reflect QuickBooks (concierge) payments only, excluding
              card payments (reported on 1099-K by the processor). Final Box 1
              amounts come from QuickBooks' 1099 wizard.
            </p>

            {reportError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-3">
                {reportError}
              </div>
            )}

            {!report && !reportLoading && !reportError && (
              <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-lg">
                Pick a year and generate the report to see 1099-tracked vendor
                payment totals, live from QuickBooks.
              </div>
            )}

            {reportLoading && (
              <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-lg">
                Pulling vendors and payments from QuickBooks — this can take a
                few seconds…
              </div>
            )}

            {report && !reportLoading && (
              <>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payments
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total (non-card)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Card (excluded)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {formatCents(report.threshold_cents)} Threshold
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {report.rows.map((row) => (
                        <tr
                          key={row.qbo_vendor_id}
                          className={row.over_threshold ? "bg-blue-50" : ""}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {row.vendor_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">
                            {row.payment_count}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatCents(row.total_cents)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 text-right">
                            {row.excluded_card_cents > 0
                              ? formatCents(row.excluded_card_cents)
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {row.over_threshold ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                1099 required
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                under threshold
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {report.rows.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      No vendors are flagged for 1099 tracking in QuickBooks.
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Generated {new Date(report.generated_at).toLocaleString()} ·
                  tax year {report.year}
                </p>
              </>
            )}
          </div>

          {/* AI Risk Flags */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">AI Risk Flags</h2>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                {riskFlags.length}
              </span>
            </div>

            {riskFlags.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-lg">
                No risk flags. All clear.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {riskFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className={`rounded-lg border-l-4 p-4 ${
                      flag.severity === "critical"
                        ? "border-red-500 bg-red-50"
                        : "border-yellow-500 bg-yellow-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900">{flag.title}</span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              flag.severity === "critical"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {flag.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{flag.message}</p>
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/vendors/${flag.vendor_id}`}
                            className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            {flag.vendor_name}
                          </Link>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDismissFlag(flag.id)}
                        className="text-gray-400 hover:text-gray-600 ml-4 text-lg leading-none"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </PageTemplate>
  );
}
