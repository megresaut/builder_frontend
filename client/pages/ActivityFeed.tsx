import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import { cn } from "@/lib/utils";
import { fetchActivityFeed, type ActivityEvent, type ActivityEventType } from "@/data/activityData";

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ActivityEventType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  maintenance_submitted:      { label: "Maintenance",         color: "#9A3412", bg: "#FFEDD5", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  work_order_created:         { label: "WO Created",          color: "#1E40AF", bg: "#DBEAFE", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> },
  work_order_completed:       { label: "WO Completed",        color: "#166534", bg: "#DCFCE7", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> },
  fto_created:                { label: "FTO Created",         color: "#6B21A8", bg: "#F3E8FF", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  fto_completed:              { label: "FTO Completed",       color: "#166534", bg: "#DCFCE7", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  inspection_created:         { label: "Inspection Created",  color: "#115E59", bg: "#CCFBF1", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
  inspection_completed:       { label: "Inspection Done",     color: "#166534", bg: "#DCFCE7", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
  tenant_added:               { label: "Tenant Added",        color: "#166534", bg: "#DCFCE7", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> },
  tenant_moved_in:            { label: "Move-in",             color: "#166534", bg: "#DCFCE7", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> },
  tenant_moved_out:           { label: "Move-out",            color: "#9A3412", bg: "#FFEDD5", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg> },
  renters_insurance_uploaded: { label: "Renters Insurance",   color: "#065F46", bg: "#D1FAE5", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  insurance_policy_added:     { label: "Insurance Policy",    color: "#065F46", bg: "#D1FAE5", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  invoice_issued:             { label: "Invoice Issued",      color: "#1E40AF", bg: "#EFF6FF", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  vendor_compliance_uploaded: { label: "Vendor Compliance",   color: "#92400E", bg: "#FEF3C7", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
};

type FilterValue = ActivityEventType | "all";

const FILTER_OPTIONS: Array<{ value: FilterValue; label: string }> = [
  { value: "all",                        label: "All" },
  { value: "maintenance_submitted",      label: "Maintenance" },
  { value: "work_order_created",         label: "WO Created" },
  { value: "work_order_completed",       label: "WO Completed" },
  { value: "fto_created",               label: "FTO Created" },
  { value: "fto_completed",             label: "FTO Completed" },
  { value: "inspection_created",         label: "Inspection Created" },
  { value: "inspection_completed",       label: "Inspection Done" },
  { value: "tenant_added",              label: "Tenant Added" },
  { value: "tenant_moved_in",           label: "Move-in" },
  { value: "tenant_moved_out",          label: "Move-out" },
  { value: "renters_insurance_uploaded", label: "Renters Insurance" },
  { value: "insurance_policy_added",     label: "Insurance Policy" },
  { value: "invoice_issued",             label: "Invoice" },
  { value: "vendor_compliance_uploaded", label: "Vendor Compliance" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function groupByDate(items: ActivityEvent[]): Array<{ date: string; items: ActivityEvent[] }> {
  const map = new Map<string, ActivityEvent[]>();
  for (const item of items) {
    const d = item.occurred_at.slice(0, 10);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(item);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

function dayLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function ActivityFeed() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<FilterValue>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [allEvents, setAllEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchActivityFeed(PAGE_SIZE, 0)
      .then((res) => {
        setAllEvents(res.events);
        setTotal(res.total);
        setOffset(res.events.length);
      })
      .catch(() => setAllEvents([]))
      .finally(() => setLoading(false));
  }, []);

  function loadMore() {
    if (loadingMore || allEvents.length >= total) return;
    setLoadingMore(true);
    fetchActivityFeed(PAGE_SIZE, offset)
      .then((res) => {
        setAllEvents((prev) => [...prev, ...res.events]);
        setOffset((prev) => prev + res.events.length);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  const activeFilterCount = typeFilter !== "all" ? 1 : 0;

  const filtered = useMemo(() => {
    return allEvents.filter((item) => {
      if (typeFilter !== "all" && item.event_type !== typeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.property_address ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allEvents, typeFilter, searchQuery]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  function handleItemClick(item: ActivityEvent) {
    switch (item.entity_type) {
      case "task":
        navigate(`/tasks/${item.entity_id}`); break;
      case "work_order":
        navigate(`/work-orders`); break;
      case "fto":
        navigate(`/field-team-orders`); break;
      case "inspection":
        navigate(`/inspections`); break;
      case "tenant":
        navigate(`/properties`); break;
      case "invoice":
        navigate(`/invoicing`); break;
      case "insurance_policy":
      case "renters_insurance":
        if (item.property_id) {
          navigate(`/property/${item.property_id}/Insurance`);
        } else {
          navigate(`/insurance`);
        }
        break;
      case "vendor_compliance_doc":
        navigate(`/vendor-compliance`); break;
    }
  }

  return (
    <PageTemplate>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">Activity Feed</h1>
          <p className="text-[#717179] font-medium text-base mt-1">
            Portfolio-wide activity
            {total > 0 && <span className="text-[#a1a1a9]"> · {total.toLocaleString()} events</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1a9]" width="13" height="13" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M13.5 13.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-[#e5e5e5] rounded-lg bg-white text-[#303030] placeholder:text-[#a1a1a9] focus:outline-none focus:ring-1 focus:ring-[#013764] w-44"
            />
          </div>

          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
              filtersOpen || activeFilterCount > 0
                ? "bg-[#013764] text-white border-[#013764]"
                : "bg-white text-[#555] border-[#e5e5e5] hover:border-[#c0c0c0]"
            )}
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-white text-[#013764] text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Collapsible filter panel ── */}
      {filtersOpen && (
        <div className="mt-4 p-3 rounded-xl border border-[#e8e8e8] bg-[#fafafa] flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-[#717179] mr-1">Type:</span>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                typeFilter === opt.value
                  ? "bg-[#013764] text-white border-[#013764]"
                  : "bg-white text-[#555] border-[#e5e5e5] hover:border-[#c0c0c0]"
              )}
            >
              {opt.label}
            </button>
          ))}
          {activeFilterCount > 0 && (
            <button
              onClick={() => setTypeFilter("all")}
              className="ml-auto text-xs text-[#a1a1a9] hover:text-[#555] transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* ── Feed ── */}
      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-[#e5e5e5] border-t-[#013764] rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#a1a1a9]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-3">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-sm">No activity matches your filters</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {groups.map(({ date, items }) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-[#717179] uppercase tracking-wide whitespace-nowrap">
                    {dayLabel(date)}
                  </span>
                  <div className="flex-1 h-px bg-[#e8e8e8]" />
                  <span className="text-xs text-[#a1a1a9] whitespace-nowrap">{shortDate(date)}</span>
                </div>

                <div className="flex flex-col gap-2">
                  {items.map((item) => {
                    const cfg = TYPE_CONFIG[item.event_type];
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="flex items-start gap-4 px-4 py-3.5 rounded-xl border border-[#e8e8e8] bg-white hover:border-[#c0c0c0] hover:shadow-sm transition-all text-left group"
                      >
                        <div
                          className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}
                        >
                          {cfg.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#1a1a1a] truncate group-hover:text-[#013764] transition-colors">
                                {item.title}
                              </p>
                              <p className="text-xs text-[#717179] mt-0.5">{item.description}</p>
                              {item.property_address && (
                                <p className="text-xs text-[#a1a1a9] mt-0.5">{item.property_address}</p>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                                style={{ backgroundColor: cfg.bg, color: cfg.color }}
                              >
                                {cfg.label}
                              </span>
                              <span className="text-[11px] text-[#a1a1a9]">{relativeTime(item.occurred_at)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Load more */}
            {allEvents.length < total && typeFilter === "all" && !searchQuery && (
              <div className="flex justify-center pt-2 pb-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-5 py-2 rounded-lg border border-[#e5e5e5] text-sm text-[#555] hover:border-[#c0c0c0] transition-colors disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : `Load more (${total - allEvents.length} remaining)`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
