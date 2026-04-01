import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import { cn } from "@/lib/utils";
import { fetchJSON } from "@/api/fetchJSON";

// ─── API types ────────────────────────────────────────────────────────────────

interface DashboardInspectionItem {
  id: number;
  property_id: number;
  property_name: string;
  unit_name: string | null;
  checklist_name: string;
  inspector_name: string;
  status: string;
  due_date: string | null;
  updated_at: string;
  good_pct: number;
  fair_pct: number;
  poor_pct: number;
  photo_count: number;
  issues: number;
}

interface InspectorLoad {
  name: string;
  total: number;
  completed: number;
}

interface DashboardData {
  total: number;
  by_status: Record<string, number>;
  completed: number;
  condition_score: number;
  total_issues: number;
  by_inspector: InspectorLoad[];
  due_this_week: DashboardInspectionItem[];
  recent_completions: DashboardInspectionItem[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(iso: string | null): number {
  if (!iso) return 0;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / 86400000);
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  draft:       { label: "Draft",       color: "#6B7280", bg: "#F3F4F6" },
  scheduled:   { label: "Scheduled",   color: "#2563EB", bg: "#DBEAFE" },
  in_progress: { label: "In Progress", color: "#D97706", bg: "#FEF3C7" },
  submitted:   { label: "Submitted",   color: "#059669", bg: "#D1FAE5" },
  reviewed:    { label: "Reviewed",    color: "#7C3AED", bg: "#EDE9FE" },
  cancelled:   { label: "Cancelled",   color: "#9CA3AF", bg: "#F9FAFB" },
};

const STATUS_ORDER = ["reviewed", "submitted", "in_progress", "scheduled", "draft"];

// ─── Condition Score Gauge ────────────────────────────────────────────────────

function ConditionGauge({ pct }: { pct: number }) {
  const cx = 100; const cy = 90; const r = 72;
  const startAngle = 150; const sweepAngle = 240;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  function arcPoint(deg: number) {
    return { x: cx + r * Math.cos(toRad(deg)), y: cy + r * Math.sin(toRad(deg)) };
  }

  const endDeg = startAngle + sweepAngle;
  const s = arcPoint(startAngle);
  const e = arcPoint(endDeg);
  const trackPath = `M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${e.x} ${e.y}`;

  const fillDeg = startAngle + (sweepAngle * pct) / 100;
  const fillEnd = arcPoint(fillDeg);
  const largeArc = sweepAngle * pct / 100 > 180 ? 1 : 0;
  const fillPath = pct > 0 ? `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${fillEnd.x} ${fillEnd.y}` : null;

  const color = pct >= 75 ? "#059669" : pct >= 50 ? "#D97706" : "#DC2626";
  const label = pct >= 75 ? "Good" : pct >= 50 ? "Fair" : "Poor";

  return (
    <svg width="200" height="130" viewBox="0 0 200 130">
      <path d={trackPath} fill="none" stroke="#f3f4f6" strokeWidth="14" strokeLinecap="round" />
      {fillPath && <path d={fillPath} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="28" fontWeight="700" fill="#1a1a1a">{pct}%</text>
      <text x={cx} y={cy + 22} textAnchor="middle" fontSize="11" fill={color} fontWeight="600">{label}</text>
    </svg>
  );
}

// ─── Property Multi-Select Dropdown ──────────────────────────────────────────

function PropertyFilter({
  properties,
  selected,
  onChange,
}: {
  properties: { id: number; name: string }[];
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredProps = properties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(next);
  }

  const count = selected.size;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
          open || count > 0
            ? "bg-[#013764] text-white border-[#013764]"
            : "bg-white text-[#555] border-[#e5e5e5] hover:border-[#c0c0c0]"
        )}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {count > 0 ? `${count} propert${count === 1 ? "y" : "ies"}` : "Filter"}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={cn("transition-transform", open && "rotate-180")}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-white rounded-xl border border-[#e8e8e8] shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[#f3f4f6]">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#f9f9f9] border border-[#efefef]">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-[#a1a1a9] flex-shrink-0">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                autoFocus
                type="text"
                placeholder="Search properties…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-[#1a1a1a] placeholder-[#a1a1a9] outline-none"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredProps.length === 0 ? (
              <p className="px-4 py-6 text-xs text-[#a1a1a9] text-center">No properties match</p>
            ) : filteredProps.map(p => {
              const checked = selected.has(p.id);
              return (
                <button key={p.id} onClick={() => toggle(p.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f9f9f9] transition-colors">
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                    checked ? "bg-[#013764] border-[#013764]" : "border-[#d1d5db] bg-white"
                  )}>
                    {checked && (
                      <svg width="9" height="9" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-[#1a1a1a] truncate">{p.name}</span>
                </button>
              );
            })}
          </div>

          {count > 0 && (
            <div className="p-2 border-t border-[#f3f4f6]">
              <button
                onClick={() => { onChange(new Set()); setSearch(""); }}
                className="w-full text-xs text-[#717179] hover:text-[#DC2626] py-1 transition-colors"
              >
                Clear {count} selection{count !== 1 ? "s" : ""}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

const EMPTY_DASHBOARD: DashboardData = {
  total: 0,
  by_status: {},
  completed: 0,
  condition_score: 0,
  total_issues: 0,
  by_inspector: [],
  due_this_week: [],
  recent_completions: [],
};

export default function InspectionDashboard() {
  const navigate = useNavigate();
  const [selectedPropertyIDs, setSelectedPropertyIDs] = useState<Set<number>>(new Set());
  const [properties, setProperties] = useState<{ id: number; name: string }[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);

  // Load properties once
  useEffect(() => {
    fetchJSON("/properties")
      .then((data: any[]) => setProperties(data.map(p => ({ id: p.id, name: p.name ?? "" }))))
      .catch(() => {});
  }, []);

  // Load dashboard whenever filter changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    selectedPropertyIDs.forEach(id => params.append("property_ids", String(id)));
    const qs = params.toString();

    fetchJSON(`/inspections/dashboard${qs ? `?${qs}` : ""}`)
      .then((data: DashboardData) => setDashboard(data))
      .catch(() => setDashboard(EMPTY_DASHBOARD))
      .finally(() => setLoading(false));
  }, [selectedPropertyIDs]);

  const { total, by_status, completed, condition_score, total_issues, by_inspector, due_this_week, recent_completions } = dashboard;

  const statusBarSegments = useMemo(() =>
    STATUS_ORDER
      .map(key => ({ key, count: by_status[key] ?? 0, ...STATUS_CFG[key] }))
      .filter(s => s.count > 0),
    [by_status]
  );

  return (
    <PageTemplate>
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-[#303030] font-semibold text-2xl">Inspection Dashboard</h1>
          <p className="text-[#717179] text-base mt-1">Portfolio-wide inspection health & compliance</p>
        </div>
        <PropertyFilter
          properties={properties}
          selected={selectedPropertyIDs}
          onChange={setSelectedPropertyIDs}
        />
      </div>

      {/* ── Row 1: Total Inspections + Condition Score ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Total Inspections */}
        <div className="bg-white rounded-xl border border-[#e8e8e8] p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#DBEAFE] text-[#1E40AF]">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="4" y="2" width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1E40AF]">
              {completed} completed
            </span>
          </div>
          <div className="mt-4">
            <div className={cn("text-5xl font-bold text-[#1a1a1a] transition-opacity", loading && "opacity-40")}>
              {total}
            </div>
            <div className="text-base font-medium text-[#717179] mt-1">Total Inspections</div>
          </div>
          <div className="mt-4">
            {total > 0 ? (
              <>
                <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                  {statusBarSegments.map(s => (
                    <div key={s.key}
                      style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }}
                      className="h-full"
                      title={`${s.label}: ${s.count}`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {statusBarSegments.map(s => (
                    <span key={s.key} className="flex items-center gap-1 text-[11px] text-[#717179]">
                      <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: s.color }} />
                      {s.label} {s.count}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-2 rounded-full bg-[#f3f4f6]" />
            )}
          </div>
        </div>

        {/* Condition Score */}
        <div className="bg-white rounded-xl border border-[#e8e8e8] p-6 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-[#1a1a1a] mb-1">Condition Score</p>
          <p className="text-xs text-[#a1a1a9] mb-3">Based on photo tags across completed inspections</p>
          <ConditionGauge pct={condition_score} />
          <div className="flex items-center gap-6 mt-2 text-xs text-[#717179]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#059669] inline-block" /> Good</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D97706] inline-block" /> Fair</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] inline-block" /> Poor</span>
          </div>
          {total_issues > 0 && (
            <p className="text-xs text-[#DC2626] font-medium mt-3">{total_issues} items flagged</p>
          )}
        </div>
      </div>

      {/* ── Row 2: Inspector Load + Due This Week ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Inspector Load */}
        <div className="bg-white rounded-xl border border-[#e8e8e8] p-5">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">Inspections by Inspector</h3>
          {by_inspector.length === 0 ? (
            <p className="text-sm text-[#a1a1a9]">{loading ? "Loading…" : "No data"}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {by_inspector.map(insp => {
                const pct = total > 0 ? (insp.total / total) * 100 : 0;
                const initials = insp.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={insp.name} className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-[#013764]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-[#013764]">{initials}</span>
                    </div>
                    {/* Name + bar */}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-[#1a1a1a] truncate block mb-1">{insp.name}</span>
                      <div className="h-2 rounded-full bg-[#f3f4f6] overflow-hidden">
                        <div className="h-full rounded-full bg-[#013764]/40" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    {/* Stats — fixed width, right-aligned, tabular nums */}
                    <div className="flex-shrink-0 w-28 text-right tabular-nums">
                      <span className="text-xs text-[#a1a1a9]">{insp.completed} done</span>
                      <span className="text-xs font-semibold text-[#1a1a1a] ml-2">{insp.total} total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Due This Week */}
        <div className="bg-white rounded-xl border border-[#e8e8e8] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f3f4f6]">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Due This Week</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1E40AF]">
              {due_this_week.length} upcoming
            </span>
          </div>
          {due_this_week.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-[#a1a1a9]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mb-2">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-sm">{loading ? "Loading…" : "Nothing due this week"}</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f3f4f6]">
              {due_this_week.map(ins => {
                const days = daysUntil(ins.due_date);
                const cfg = STATUS_CFG[ins.status] ?? STATUS_CFG.draft;
                return (
                  <button key={ins.id}
                    onClick={() => navigate(`/property/${ins.property_id}/Inspections?inspectionId=${ins.id}`)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#fafafa] transition-colors text-left group">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <rect x="2.5" y="3" width="15" height="14" rx="1.5" stroke={cfg.color} strokeWidth="1.5"/>
                        <path d="M13 1.5V4M7 1.5V4M2.5 7h15" stroke={cfg.color} strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1a1a1a] truncate group-hover:text-[#013764]">
                        {ins.checklist_name || "Inspection"} — {ins.property_name}
                      </p>
                      <p className="text-xs text-[#717179] mt-0.5">
                        {ins.unit_name ?? "Common Area"} · {ins.inspector_name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      <p className="text-[11px] text-[#a1a1a9] mt-0.5">
                        {days <= 0 ? "Today" : `In ${days}d`} · {fmtDate(ins.due_date)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Recent Completions ── */}
      <div className="bg-white rounded-xl border border-[#e8e8e8] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f3f4f6]">
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Recent Completions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f3f4f6]">
                {["Inspection", "Property / Unit", "Inspector", "Completed", "Condition", "Issues", "Status"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[#717179] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent_completions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#a1a1a9]">
                    {loading ? "Loading…" : "No completed inspections yet"}
                  </td>
                </tr>
              ) : recent_completions.map(ins => {
                const cfg = STATUS_CFG[ins.status] ?? STATUS_CFG.submitted;
                return (
                  <tr key={ins.id}
                    className="border-b border-[#f9f9f9] hover:bg-[#fafafa] transition-colors cursor-pointer"
                    onClick={() => navigate(`/property/${ins.property_id}/Inspections?inspectionId=${ins.id}`)}>
                    <td className="px-4 py-3 font-medium text-[#1a1a1a] whitespace-nowrap">
                      #{ins.id} {ins.checklist_name || "Inspection"}
                    </td>
                    <td className="px-4 py-3 text-[#555] whitespace-nowrap">
                      <span className="font-medium">{ins.property_name}</span>
                      {ins.unit_name && <span className="text-[#a1a1a9]"> · {ins.unit_name}</span>}
                    </td>
                    <td className="px-4 py-3 text-[#555] whitespace-nowrap">{ins.inspector_name}</td>
                    <td className="px-4 py-3 text-[#555] whitespace-nowrap">{fmtDate(ins.updated_at)}</td>
                    <td className="px-4 py-3">
                      {ins.photo_count > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-2 rounded-full bg-[#f3f4f6] overflow-hidden flex">
                            <div style={{ width: `${ins.good_pct}%`, backgroundColor: "#059669" }} />
                            <div style={{ width: `${ins.fair_pct}%`, backgroundColor: "#D97706" }} />
                            <div style={{ width: `${ins.poor_pct}%`, backgroundColor: "#DC2626" }} />
                          </div>
                          <span className="text-xs font-semibold text-[#059669]">{ins.good_pct}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#a1a1a9]">No photos</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ins.issues > 0
                        ? <span className="text-xs font-semibold text-[#DC2626]">{ins.issues} flagged</span>
                        : <span className="text-xs text-[#059669]">None</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageTemplate>
  );
}
