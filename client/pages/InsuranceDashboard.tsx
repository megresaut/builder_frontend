import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchJSON } from "@/api/fetchJSON";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardSummary {
  total_active_policies: number;
  expiring_soon: number;
  lapsed_or_missing: number;
  renters_coverage_pct: number;
  total_units: number;
  units_with_renters: number;
}

interface AttentionPolicy {
  id: number;
  property_id: number;
  property_name: string;
  property_type: string;
  policy_type: string;
  renewal_status: string;
  expiration_date: string;
  days_remaining: number;
  agent_name: string | null;
  agent_email: string | null;
  agent_phone: string | null;
}

interface RiskFlag {
  id: number;
  property_id: number;
  severity: "critical" | "warning" | "advisory";
  title: string;
  message: string;
  work_order_link: string | null;
  policy_link: string | null;
  dismissed_at: string | null;
  dismissed_by: number | null;
  computed_at: string;
  created_at: string;
  property_name: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPolicyType(code: string): string {
  return code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPropertyType(code: string): string {
  const map: Record<string, string> = {
    HOA: "HOA",
    OR: "Office/Retail",
    C: "Commercial",
    R: "Rental",
    COMM: "Commercial",
  };
  return map[code] || code;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${m}/${d}/${y}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({
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
  const clickable = !!onClick;
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (clickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`bg-white rounded-lg shadow-sm border-l-4 p-5 ${accentColor} ${
        clickable
          ? "cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
          : ""
      }`}
    >
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
      {subtitle && (
        <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
      )}
      {clickable && (
        <div className="text-xs text-blue-600 mt-2 font-medium">View details →</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Drilldown Modal
// ---------------------------------------------------------------------------

type DrilldownCategory = "active" | "expiring" | "lapsed" | "renters_covered";

interface DrilldownPolicyRow {
  id: number;
  property_id: number;
  property_name: string;
  property_type: string;
  policy_type: string;
  carrier_name: string;
  renewal_status: string;
  expiration_date: string;
  days_remaining: number;
  category: string;
}

interface DrilldownUnitRow {
  unit_id: number;
  unit_name: string;
  property_id: number;
  property_name: string;
  tenant_name: string | null;
  has_coverage: boolean;
  category: string;
}

interface DrilldownPayload {
  policies: DrilldownPolicyRow[];
  units: DrilldownUnitRow[];
}

const CATEGORY_LABELS: Record<DrilldownCategory, string> = {
  active: "Active",
  expiring: "Expiring Soon",
  lapsed: "Lapsed / Expired",
  renters_covered: "Renters Coverage",
};

function KpiDrilldownModal({
  initialCategory,
  onClose,
}: {
  initialCategory: DrilldownCategory;
  onClose: () => void;
}) {
  const [data, setData] = useState<DrilldownPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<DrilldownCategory>(initialCategory);
  const [search, setSearch] = useState("");
  // For the renters tile, sub-toggle between covered and uncovered.
  const [rentersFilter, setRentersFilter] = useState<"covered" | "uncovered">("uncovered");

  useEffect(() => {
    fetchJSON("/insurance/dashboard/drilldown")
      .then((d: DrilldownPayload) => setData(d))
      .catch((err) => setError(err?.message || "Failed to load details"))
      .finally(() => setLoading(false));
  }, []);

  // ESC closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const counts = {
    active: data?.policies.filter((p) => p.category === "active").length ?? 0,
    expiring: data?.policies.filter((p) => p.category === "expiring").length ?? 0,
    lapsed: data?.policies.filter((p) => p.category === "lapsed").length ?? 0,
    renters_covered: data?.units.filter((u) => u.category === "covered").length ?? 0,
    renters_uncovered: data?.units.filter((u) => u.category === "uncovered").length ?? 0,
  };

  const isRenters = category === "renters_covered";

  const visiblePolicies = (data?.policies ?? [])
    .filter((p) => p.category === category)
    .filter((p) => p.property_name.toLowerCase().includes(search.toLowerCase()));
  const visibleUnits = (data?.units ?? [])
    .filter((u) => u.category === rentersFilter)
    .filter(
      (u) =>
        u.property_name.toLowerCase().includes(search.toLowerCase()) ||
        u.unit_name.toLowerCase().includes(search.toLowerCase()) ||
        (u.tenant_name?.toLowerCase().includes(search.toLowerCase()) ?? false),
    );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[1100px] max-h-[85vh] overflow-hidden flex flex-col rounded-xl border border-[#E5E5E5] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-[#303030] font-semibold text-lg">Insurance Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Filter pills + search */}
        <div className="p-5 border-b border-gray-200 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABELS) as DrilldownCategory[]).map((cat) => {
              const isSelected = category === cat;
              const count =
                cat === "renters_covered"
                  ? counts.renters_covered + counts.renters_uncovered
                  : counts[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-[#013764] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {CATEGORY_LABELS[cat]} ({count})
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder={isRenters ? "Search property, unit, tenant..." : "Search by property..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-auto px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
        </div>

        {/* Renters sub-toggle */}
        {isRenters && (
          <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-2">
            <button
              onClick={() => setRentersFilter("uncovered")}
              className={`px-3 py-1 rounded-md text-xs font-medium ${
                rentersFilter === "uncovered"
                  ? "bg-red-100 text-red-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Uncovered ({counts.renters_uncovered})
            </button>
            <button
              onClick={() => setRentersFilter("covered")}
              className={`px-3 py-1 rounded-md text-xs font-medium ${
                rentersFilter === "covered"
                  ? "bg-green-100 text-green-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Covered ({counts.renters_covered})
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Loading...
            </div>
          ) : error ? (
            <div className="m-5 p-4 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          ) : isRenters ? (
            visibleUnits.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                {search ? "No units match your search." : "No units in this category."}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visibleUnits.map((u) => (
                    <tr key={u.unit_id} className={u.has_coverage ? "" : "bg-red-50"}>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          to={`/property/${u.property_id}/Insurance`}
                          onClick={onClose}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {u.property_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{u.unit_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{u.tenant_name ?? "--"}</td>
                      <td className="px-4 py-3 text-sm">
                        {u.has_coverage ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Covered
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Uncovered
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : visiblePolicies.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              {search ? "No policies match your search." : "No policies in this category."}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Policy Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carrier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {visiblePolicies.map((p) => (
                  <tr
                    key={p.id}
                    className={
                      p.category === "lapsed"
                        ? "bg-red-50"
                        : p.category === "expiring"
                        ? "bg-yellow-50"
                        : ""
                    }
                  >
                    <td className="px-4 py-3 text-sm">
                      <Link
                        to={`/property/${p.property_id}/Insurance`}
                        onClick={onClose}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {p.property_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatPolicyType(p.policy_type)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.carrier_name}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge
                        status={p.category === "expiring" ? "expiring" : p.category === "lapsed" ? "lapsed" : p.renewal_status}
                        daysRemaining={p.category === "expiring" ? p.days_remaining : undefined}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <ExpirationLabel
                        daysRemaining={p.days_remaining}
                        dateStr={p.expiration_date}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-500">
          {isRenters
            ? `Showing ${visibleUnits.length} of ${counts.renters_covered + counts.renters_uncovered} units`
            : `Showing ${visiblePolicies.length} ${CATEGORY_LABELS[category].toLowerCase()} policies`}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  daysRemaining,
}: {
  status: string;
  daysRemaining?: number;
}) {
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
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      {status}
    </span>
  );
}

function ExpirationLabel({ daysRemaining, dateStr }: { daysRemaining: number; dateStr: string }) {
  const formatted = formatDate(dateStr);
  if (daysRemaining < 0) {
    return (
      <span>
        {formatted}{" "}
        <span className="text-red-600 text-xs">({Math.abs(daysRemaining)} days ago)</span>
      </span>
    );
  }
  return (
    <span>
      {formatted}{" "}
      <span className="text-gray-500 text-xs">({daysRemaining} days remaining)</span>
    </span>
  );
}

const severityBorderColor: Record<string, string> = {
  critical: "border-red-500",
  warning: "border-yellow-500",
  advisory: "border-blue-500",
};

const severityBadgeBg: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  warning: "bg-yellow-100 text-yellow-800",
  advisory: "bg-blue-100 text-blue-800",
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function InsuranceDashboard() {
  // Summary
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Attention
  const [attention, setAttention] = useState<AttentionPolicy[]>([]);
  const [attentionLoading, setAttentionLoading] = useState(true);
  const [attentionError, setAttentionError] = useState<string | null>(null);

  // Flags
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [flagsError, setFlagsError] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState("");

  // KPI drilldown modal state
  const [drilldown, setDrilldown] = useState<DrilldownCategory | null>(null);

  useEffect(() => {
    fetchJSON("/insurance/dashboard/summary")
      .then((data) => setSummary(data))
      .catch((err) => setSummaryError(err.message || "Failed to load summary"))
      .finally(() => setSummaryLoading(false));

    fetchJSON("/insurance/dashboard/attention")
      .then((data) => setAttention(data || []))
      .catch((err) => setAttentionError(err.message || "Failed to load attention policies"))
      .finally(() => setAttentionLoading(false));

    fetchJSON("/insurance/dashboard/flags")
      .then((data) => setFlags((data || []).filter((f: RiskFlag) => !f.dismissed_at)))
      .catch((err) => setFlagsError(err.message || "Failed to load risk flags"))
      .finally(() => setFlagsLoading(false));
  }, []);

  const handleDismissFlag = async (flagId: number) => {
    const prev = [...flags];
    setFlags((f) => f.filter((flag) => flag.id !== flagId));
    try {
      await fetchJSON(`/insurance/dashboard/flags?id=${flagId}`, {
        method: "PATCH",
      });
    } catch {
      setFlags(prev);
      toast.error("Failed to dismiss flag. Please try again.");
    }
  };

  const filteredAttention = attention.filter((p) =>
    p.property_name.toLowerCase().includes(search.toLowerCase())
  );

  const activeFlags = flags.filter((f) => !f.dismissed_at);

  return (
    <PageTemplate>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Insurance Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Portfolio-wide insurance overview
          </p>
        </div>
        <button
          onClick={() => {
            if (!attention.length) return;
            const headers = ["Property", "Type", "Policy Type", "Status", "Expiration Date", "Days Remaining", "Agent Name", "Agent Email", "Agent Phone"];
            const rows = attention.map((p) => [
              p.property_name,
              formatPropertyType(p.property_type),
              formatPolicyType(p.policy_type),
              p.renewal_status,
              formatDate(p.expiration_date),
              String(p.days_remaining),
              p.agent_name || "",
              p.agent_email || "",
              p.agent_phone || "",
            ]);
            const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `insurance-attention-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          disabled={!attention.length}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export
        </button>
      </div>

      {/* Section 1: Summary Cards */}
      {summaryLoading ? (
        <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
          Loading summary...
        </div>
      ) : summaryError ? (
        <div className="text-red-600 text-sm mb-6 p-4 bg-red-50 rounded-lg">
          {summaryError}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            label="Total Active Policies"
            value={summary.total_active_policies}
            accentColor="border-green-500"
            onClick={() => setDrilldown("active")}
          />
          <SummaryCard
            label="Expiring Soon (60 days)"
            value={summary.expiring_soon}
            accentColor="border-yellow-500"
            onClick={() => setDrilldown("expiring")}
          />
          <SummaryCard
            label="Lapsed / Missing"
            value={summary.lapsed_or_missing}
            accentColor="border-red-500"
            onClick={() => setDrilldown("lapsed")}
          />
          <SummaryCard
            label="Renters Coverage"
            value={`${summary.renters_coverage_pct.toFixed(2)}%`}
            subtitle={`${summary.units_with_renters} / ${summary.total_units} units`}
            accentColor="border-blue-500"
            onClick={() => setDrilldown("renters_covered")}
          />
        </div>
      ) : null}

      {/* Section 2: Policies Needing Attention */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Policies Needing Attention
            </h2>
            {!attentionLoading && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                {filteredAttention.length}
              </span>
            )}
          </div>
          <input
            type="text"
            placeholder="Search by property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
        </div>

        {attentionLoading ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
            Loading policies...
          </div>
        ) : attentionError ? (
          <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg">
            {attentionError}
          </div>
        ) : filteredAttention.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-lg">
            {search
              ? "No policies match your search."
              : "No policies need attention at this time."}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Policy Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAttention.map((policy) => (
                  <tr
                    key={policy.id}
                    className={
                      policy.renewal_status === "lapsed"
                        ? "bg-red-50"
                        : policy.renewal_status === "expiring"
                        ? "bg-yellow-50"
                        : ""
                    }
                  >
                    <td className="px-4 py-3 text-sm">
                      <Link
                        to={`/property/${policy.property_id}/Insurance`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {policy.property_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatPropertyType(policy.property_type)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatPolicyType(policy.policy_type)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge
                        status={policy.renewal_status}
                        daysRemaining={
                          policy.renewal_status === "expiring"
                            ? policy.days_remaining
                            : undefined
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <ExpirationLabel
                        daysRemaining={policy.days_remaining}
                        dateStr={policy.expiration_date}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {policy.agent_name ? (
                        policy.agent_email ? (
                          <a
                            href={`mailto:${policy.agent_email}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {policy.agent_name}
                          </a>
                        ) : (
                          policy.agent_name
                        )
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        to={`/property/${policy.property_id}/Insurance`}
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

      {/* Section 3: AI Risk Flags */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">AI Risk Flags</h2>
          {!flagsLoading && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
              {activeFlags.length}
            </span>
          )}
        </div>

        {flagsLoading ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
            Loading risk flags...
          </div>
        ) : flagsError ? (
          <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg">
            {flagsError}
          </div>
        ) : activeFlags.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-lg">
            No risk flags. All clear.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeFlags.map((flag) => (
              <div
                key={flag.id}
                className={`relative bg-white border border-gray-200 rounded-lg shadow-sm p-4 border-l-4 ${
                  severityBorderColor[flag.severity] || "border-gray-300"
                }`}
              >
                {/* Dismiss button */}
                <button
                  onClick={() => handleDismissFlag(flag.id)}
                  className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Dismiss"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 4L4 12M4 4L12 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <div className="flex items-start gap-3 pr-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">
                        {flag.title}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          severityBadgeBg[flag.severity] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {flag.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{flag.message}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-600">
                        {flag.property_name}
                      </span>
                      {flag.policy_link && (
                        <Link
                          to={`/property/${flag.property_id}/Insurance`}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          View Policy
                        </Link>
                      )}
                      {flag.work_order_link && (
                        <span className="text-xs text-gray-500">
                          WO #{flag.work_order_link}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {drilldown && (
        <KpiDrilldownModal
          initialCategory={drilldown}
          onClose={() => setDrilldown(null)}
        />
      )}
    </PageTemplate>
  );
}
