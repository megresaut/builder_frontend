import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJSON } from "@/api/fetchJSON";
import { fetchActivityFeed, type ActivityEvent, type ActivityEventType } from "@/data/activityData";
import EditEventDialog from "./Operations/EditEventDialog";
import CreateFTOModal from "@/components/CreateFTOModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type CardId =
  | "recent-activity"
  | "open-maintenance"
  | "my-day"
  | "recently-booked-bills"
  | "expiring-renters-insurance";

type CardSize = "half" | "full";

interface CardMeta {
  title: string;
  description: string;
  defaultSize: CardSize;
}

// ─── Card Registry ────────────────────────────────────────────────────────────

const CARD_REGISTRY: Record<CardId, CardMeta> = {
  "recent-activity":             { title: "Recent Activity",              description: "Stay up-to-date — see recent account activity from all users as well as automatic actions.", defaultSize: "full" },
  "open-maintenance":            { title: "Open Maintenance",             description: "Keep on top of incoming tasks, work orders, FTOs, and inspections.", defaultSize: "full" },
  "my-day":                      { title: "My Day",                       description: "See what's on your schedule for today.", defaultSize: "full" },
  "recently-booked-bills":       { title: "Recently Booked Bills",        description: "View bills that have been recently booked.", defaultSize: "half" },
  "expiring-renters-insurance":  { title: "Expiring Renters Insurance",   description: "Keep an eye on expiring renters' insurance policies within 30, 60, and 90 days.", defaultSize: "half" },
};

const LS_ORDER_KEY   = "avm_dashboard_order_v3";
const LS_ENABLED_KEY = "avm_dashboard_enabled_v3";
const LS_SIZES_KEY   = "avm_dashboard_sizes_v3";

const DEFAULT_ENABLED: CardId[] = [
  "recent-activity",
  "open-maintenance",
  "my-day",
  "recently-booked-bills",
  "expiring-renters-insurance",
];

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadDashboardState() {
  const validIds = Object.keys(CARD_REGISTRY) as CardId[];
  try {
    const rawOrder   = localStorage.getItem(LS_ORDER_KEY);
    const rawEnabled = localStorage.getItem(LS_ENABLED_KEY);
    const rawSizes   = localStorage.getItem(LS_SIZES_KEY);

    const order: CardId[]  = rawOrder   ? (JSON.parse(rawOrder)   as CardId[]).filter((id) => validIds.includes(id)) : [...DEFAULT_ENABLED];
    const enabled: CardId[] = rawEnabled ? (JSON.parse(rawEnabled) as CardId[]).filter((id) => validIds.includes(id)) : [...DEFAULT_ENABLED];
    const sizes: Partial<Record<CardId, CardSize>> = rawSizes ? JSON.parse(rawSizes) : {};

    return { order, enabled: new Set<CardId>(enabled), sizes };
  } catch {
    return { order: [...DEFAULT_ENABLED], enabled: new Set<CardId>(DEFAULT_ENABLED), sizes: {} as Partial<Record<CardId, CardSize>> };
  }
}

function saveDashboardState(order: CardId[], enabled: Set<CardId>, sizes: Partial<Record<CardId, CardSize>>) {
  localStorage.setItem(LS_ORDER_KEY,   JSON.stringify(order));
  localStorage.setItem(LS_ENABLED_KEY, JSON.stringify([...enabled]));
  localStorage.setItem(LS_SIZES_KEY,   JSON.stringify(sizes));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCardSize(id: CardId, sizes: Partial<Record<CardId, CardSize>>): CardSize {
  return sizes[id] ?? CARD_REGISTRY[id].defaultSize;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatCurrency(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 0 });
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return "12AM";
  if (hour === 12) return "12PM";
  if (hour < 12)  return `${hour}AM`;
  return `${hour - 12}PM`;
}

/** Parse "9:00 AM" → decimal hours (e.g. 9.0) */
function parseTimeToHours(timeStr: string): number {
  const [timePart, meridiem] = timeStr.split(" ");
  const [hStr, mStr] = timePart.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  return h + m / 60;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const _now = Date.now();
const _h   = 3600000;
const _d   = 86400000;



// ─── Open Maintenance Types ───────────────────────────────────────────────────

interface OpenTask        { id: number; name: string; property: string; priority: string; created_at: string; }
interface OpenWorkOrder   { id: number; name: string; property: string; priority: string; status: string; created_at: string; }
interface OpenFTO         { id: number; name: string; property: string; priority: string; status: string; created_at: string; }
interface OpenInspection  { id: number; name: string; property: string; status: string; due_date: string | null; }

interface OpenMaintenanceData {
  tasks:       OpenTask[];
  work_orders: OpenWorkOrder[];
  ftos:        OpenFTO[];
  inspections: OpenInspection[];
}

interface RecentBill {
  id: number;
  vendor_name: string;
  property: string;
  category: string;
  amount_cents: number;
  statement_date: string;
  created_at: string;
}

const _today = new Date();
const _todayDateStr = _today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

type ScheduleItemType = "inspection" | "task" | "work-order" | "fto" | "calendar_event";

interface ScheduleItem {
  id: number;
  type: ScheduleItemType;
  title: string;
  property: string;
  property_id: number | null;
  time: string;        // "9:00 AM"
  durationHrs: number; // e.g. 1 = 1 hour block
  start_at: string;
  end_at: string | null;
  all_day: boolean;
}

interface ApiDayEvent {
  source_type: string;
  source_id: number;
  title: string;
  property: string;
  property_id?: number | null;
  start_at: string | null;
  end_at: string | null;
  all_day: boolean;
}

const SOURCE_TYPE_MAP: Record<string, ScheduleItemType> = {
  calendar_event: "calendar_event",
  work_order:     "work-order",
  inspection:     "inspection",
  task:           "task",
  fto:            "fto",
};

function apiEventToScheduleItem(e: ApiDayEvent): ScheduleItem | null {
  if (!e.start_at) return null;
  const start    = new Date(e.start_at);
  const timeStr  = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const durationHrs = e.end_at
    ? Math.max((new Date(e.end_at).getTime() - start.getTime()) / 3600000, 0.25)
    : 1;
  return {
    id:          e.source_id,
    type:        SOURCE_TYPE_MAP[e.source_type] ?? "calendar_event",
    title:       e.title,
    property:    e.property,
    property_id: e.property_id ?? null,
    time:        timeStr,
    durationHrs,
    start_at:    e.start_at,
    end_at:      e.end_at,
    all_day:     e.all_day,
  };
}


// ─── Expiring Leases / Insurance / Liabilities Types ─────────────────────────

interface ExpiringInsurance {
  id: number;
  tenant_name: string;
  unit_name: string;
  property: string;
  expiration_date: string;
  days_left: number;
}

// ─── Style Maps ───────────────────────────────────────────────────────────────

function priorityClass(p: string): string {
  switch (p.toLowerCase()) {
    case "high":   case "urgent": return "bg-red-100 text-red-700";
    case "medium":                return "bg-yellow-100 text-yellow-800";
    default:                      return "bg-gray-100 text-gray-600";
  }
}

function priorityLabel(p: string): string {
  if (!p) return "—";
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

function statusLabel(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusClass(s: string): string {
  switch (s) {
    case "in_progress": case "dispatched": return "bg-blue-100 text-blue-700";
    case "scheduled":                      return "bg-green-100 text-green-700";
    case "new":                            return "bg-gray-100 text-gray-600";
    case "submitted":                      return "bg-indigo-100 text-indigo-700";
    case "draft":                          return "bg-gray-100 text-gray-500";
    default:                               return "bg-gray-100 text-gray-600";
  }
}

function formatDueDate(d: string | null): string {
  if (!d) return "No due date";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const activityColors: Record<ActivityEventType, string> = {
  maintenance_submitted:       "bg-orange-100 text-orange-600",
  work_order_created:          "bg-blue-100 text-blue-600",
  work_order_completed:        "bg-blue-100 text-blue-600",
  fto_created:                 "bg-purple-100 text-purple-600",
  fto_completed:               "bg-purple-100 text-purple-600",
  inspection_created:          "bg-teal-100 text-teal-600",
  inspection_completed:        "bg-teal-100 text-teal-600",
  tenant_added:                "bg-green-100 text-green-600",
  tenant_moved_in:             "bg-green-100 text-green-600",
  tenant_moved_out:            "bg-green-100 text-green-600",
  renters_insurance_uploaded:  "bg-emerald-100 text-emerald-600",
  insurance_policy_added:      "bg-emerald-100 text-emerald-600",
  invoice_issued:              "bg-indigo-100 text-indigo-600",
  vendor_compliance_uploaded:  "bg-amber-100 text-amber-600",
};

// bg / border / text for calendar event blocks
const eventColors: Record<ScheduleItemType, { bg: string; border: string; text: string; dot: string }> = {
  inspection:     { bg: "bg-teal-50",   border: "border-teal-300",   text: "text-teal-800",   dot: "bg-teal-500"   },
  task:           { bg: "bg-amber-50",  border: "border-amber-300",  text: "text-amber-800",  dot: "bg-amber-500"  },
  "work-order":   { bg: "bg-blue-50",   border: "border-blue-300",   text: "text-blue-800",   dot: "bg-blue-500"   },
  fto:            { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-800", dot: "bg-purple-500" },
  calendar_event: { bg: "bg-gray-50",   border: "border-gray-300",   text: "text-gray-800",   dot: "bg-gray-500"   },
};

const _iconWrench    = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const _iconClipboard = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>;
const _iconTruck     = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const _iconSearch    = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const _iconUser      = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>;
const _iconShield    = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const _iconDoc       = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;

const activityIcons: Record<ActivityEventType, React.ReactNode> = {
  maintenance_submitted:       _iconWrench,
  work_order_created:          _iconClipboard,
  work_order_completed:        _iconClipboard,
  fto_created:                 _iconTruck,
  fto_completed:               _iconTruck,
  inspection_created:          _iconSearch,
  inspection_completed:        _iconSearch,
  tenant_added:                _iconUser,
  tenant_moved_in:             _iconUser,
  tenant_moved_out:            _iconUser,
  renters_insurance_uploaded:  _iconShield,
  insurance_policy_added:      _iconShield,
  invoice_issued:              _iconDoc,
  vendor_compliance_uploaded:  _iconDoc,
};

// ─── Card Shell (drag wrapper) ────────────────────────────────────────────────

interface CardShellProps {
  id: CardId;
  size: CardSize;
  isCustomizing: boolean;
  isSelected: boolean;
  isDragOver: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onRemove: () => void;
  onToggleSize: () => void;
  children: React.ReactNode;
}

function CardShell({ id, size, isCustomizing, isSelected, isDragOver, onSelect, onDragStart, onDragEnter, onDragLeave, onDragOver, onDrop, onDragEnd, onRemove, onToggleSize, children }: CardShellProps) {
  return (
    <div
      className={`${size === "full" ? "col-span-2" : "col-span-1"} flex flex-col transition-all duration-150 ${
        isDragOver && isCustomizing && !isSelected ? "opacity-40 scale-[0.97]" : ""
      }`}
      draggable={isCustomizing && isSelected}
      onClick={isCustomizing ? (e) => { e.stopPropagation(); onSelect(); } : undefined}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Customize toolbar — sits above the card, no overlap */}
      {isCustomizing && (
        <div className="flex items-center justify-between px-1 pb-1.5 flex-shrink-0">
          {isSelected ? (
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-blue-600">Selected — drag to reorder</span>
            </div>
          ) : (
            <span className="text-xs font-medium text-gray-400 truncate pl-0.5">{CARD_REGISTRY[id].title}</span>
          )}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSize(); }}
              title={size === "full" ? "Make half-width" : "Make full-width"}
              className="h-5 px-2 flex items-center gap-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors text-xs font-medium"
            >
              {size === "full" ? (
                <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg><span>½</span></>
              ) : (
                <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg><span>Full</span></>
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="h-5 w-5 flex items-center justify-center rounded bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className={`flex-1 min-h-0 rounded-xl transition-all duration-150 ${
        isCustomizing && isSelected
          ? "ring-2 ring-blue-500 ring-offset-2 cursor-grab shadow-lg"
          : isCustomizing
          ? "ring-1 ring-gray-200 cursor-pointer hover:ring-2 hover:ring-gray-300"
          : ""
      }`}>
        {children}
      </div>
    </div>
  );
}

// ─── Individual Card Components ───────────────────────────────────────────────

function relativeTimeISO(iso: string): string {
  return relativeTime(new Date(iso).getTime());
}

function RecentActivityCard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityFeed(10)
      .then((res) => setEvents(res.events))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  function handleActivityClick(item: ActivityEvent) {
    switch (item.entity_type) {
      case "task":
        navigate(`/tasks/${item.entity_id}`); break;
      case "work_order":
        navigate(`/work-orders`); break;
      case "fto":
        navigate(`/field-team-orders`); break;
      case "inspection":
        if (item.property_id) {
          navigate(`/property/${item.property_id}/Inspections?inspectionId=${item.entity_id}`);
        }
        break;
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
    <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
      </div>
      {loading ? (
        <div className="px-5 py-8 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">No recent activity</div>
      ) : (
        <div className="divide-y divide-gray-50 flex-1">
          {events.map((item) => (
            <div key={item.id} onClick={() => handleActivityClick(item)} className="px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50/50 transition-colors cursor-pointer">
              <div className={`${activityColors[item.event_type]} rounded-lg p-1.5 flex-shrink-0 mt-0.5`}>
                {activityIcons[item.event_type]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                <p className="text-sm text-gray-500 truncate">{item.description}</p>
                {item.property_address && (
                  <p className="text-xs text-gray-400 mt-0.5">{item.property_address}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap mt-0.5">
                {relativeTimeISO(item.occurred_at)}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="px-5 py-3 border-t border-gray-100">
        <a
          href="/activity-feed"
          className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
        >
          View all activity
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </a>
      </div>
    </div>
  );
}

type MaintenanceTab = "tasks" | "work-orders" | "ftos" | "inspections";

const MAINTENANCE_LIMIT = 8;

const VIEW_ALL_ROUTES: Record<MaintenanceTab, string> = {
  "tasks":       "/all-tasks",
  "work-orders": "/work-orders",
  "ftos":        "/field-team-orders",
  "inspections": "/inspection-dashboard",
};

function OpenMaintenanceCard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MaintenanceTab>("tasks");
  const [data, setData]           = useState<OpenMaintenanceData | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetchJSON("/operations/dashboard/open-maintenance")
      .then((d: OpenMaintenanceData) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tasks       = data?.tasks       ?? [];
  const workOrders  = data?.work_orders ?? [];
  const ftos        = data?.ftos        ?? [];
  const inspections = data?.inspections ?? [];

  const tabs: { key: MaintenanceTab; label: string; count: number }[] = [
    { key: "tasks",        label: "Tasks",       count: tasks.length       },
    { key: "work-orders",  label: "Work Orders", count: workOrders.length  },
    { key: "ftos",         label: "FTOs",        count: ftos.length        },
    { key: "inspections",  label: "Inspections", count: inspections.length },
  ];

  const visibleTasks       = tasks.slice(0, MAINTENANCE_LIMIT);
  const visibleWorkOrders  = workOrders.slice(0, MAINTENANCE_LIMIT);
  const visibleFtos        = ftos.slice(0, MAINTENANCE_LIMIT);
  const visibleInspections = inspections.slice(0, MAINTENANCE_LIMIT);

  const hasMore = {
    "tasks":       tasks.length       > MAINTENANCE_LIMIT,
    "work-orders": workOrders.length  > MAINTENANCE_LIMIT,
    "ftos":        ftos.length        > MAINTENANCE_LIMIT,
    "inspections": inspections.length > MAINTENANCE_LIMIT,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Open Maintenance</h2>
      </div>
      <div className="flex border-b border-gray-100">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors relative ${activeTab === tab.key ? "text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {tab.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
              {loading ? "–" : tab.count}
            </span>
            {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
          </button>
        ))}
      </div>
      <div className="min-h-[120px]">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="p-4">
              {activeTab === "tasks" && (
                <div className="space-y-2">
                  {visibleTasks.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No open tasks</p> : visibleTasks.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.property || "—"}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {item.priority && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityClass(item.priority)}`}>{priorityLabel(item.priority)}</span>}
                        <span className="text-xs text-gray-400 w-14 text-right">{relativeTimeISO(item.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "work-orders" && (
                <div className="space-y-2">
                  {visibleWorkOrders.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No open work orders</p> : visibleWorkOrders.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.property || "—"}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {item.priority && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityClass(item.priority)}`}>{priorityLabel(item.priority)}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "ftos" && (
                <div className="space-y-2">
                  {visibleFtos.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No open FTOs</p> : visibleFtos.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.property || "—"}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {item.priority && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityClass(item.priority)}`}>{priorityLabel(item.priority)}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "inspections" && (
                <div className="space-y-2">
                  {visibleInspections.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No open inspections</p> : visibleInspections.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.property || "—"}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                        <span className="text-xs text-gray-400 w-24 text-right">{formatDueDate(item.due_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => navigate(VIEW_ALL_ROUTES[activeTab])}
                className="w-full text-xs font-medium text-center text-gray-500 hover:text-gray-800 transition-colors"
              >
                {hasMore[activeTab]
                  ? `View all ${tabs.find(t => t.key === activeTab)?.count} →`
                  : `View all ${tabs.find(t => t.key === activeTab)?.label.toLowerCase()} →`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── My Day Calendar View ─────────────────────────────────────────────────────

const HOUR_HEIGHT  = 64;  // px per hour
const DAY_START_H  = 0;   // 12 AM
const DAY_END_H    = 24;  // 12 AM next day
const TIME_COL_W   = 52;  // px for the time label column
const TOTAL_HOURS  = DAY_END_H - DAY_START_H;
const TIMELINE_H   = TOTAL_HOURS * HOUR_HEIGHT; // total scrollable height
const VISIBLE_H    = 360; // px visible in the scroll container

function hourToTop(h: number): number {
  return (h - DAY_START_H) * HOUR_HEIGHT;
}

// ─── Day Event Popover ────────────────────────────────────────────────────────

const DAY_EVENT_COLORS: Record<ScheduleItemType, { bg: string; border: string; text: string }> = {
  task:           { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF" },
  "work-order":   { bg: "#FFEDD5", border: "#F97316", text: "#9A3412" },
  fto:            { bg: "#DCFCE7", border: "#22C55E", text: "#166534" },
  inspection:     { bg: "#F3E8FF", border: "#A855F7", text: "#6B21A8" },
  calendar_event: { bg: "#F3F4F6", border: "#6B7280", text: "#374151" },
};

const DAY_EVENT_LABELS: Record<ScheduleItemType, string> = {
  task:           "Task",
  "work-order":   "Work Order",
  fto:            "Field Team Order",
  inspection:     "Inspection",
  calendar_event: "Calendar Event",
};

function formatPopoverTime(start_at: string, end_at: string | null, all_day: boolean): string {
  if (all_day) return new Date(start_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const s = new Date(start_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (!end_at) return s;
  const e = new Date(end_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${s} – ${e}`;
}

interface DayEventPopoverProps {
  item: ScheduleItem;
  anchorRect: DOMRect;
  onClose: () => void;
  onViewDetails: (item: ScheduleItem) => void;
}

function DayEventPopover({ item, anchorRect, onClose, onViewDetails }: DayEventPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    const timer = setTimeout(() => document.addEventListener("mousedown", handle), 50);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", handle); };
  }, [onClose]);

  useEffect(() => {
    function handle(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  const colors = DAY_EVENT_COLORS[item.type];
  const popoverW = 300;
  const popoverH = 220;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = anchorRect.right + 10;
  let top  = anchorRect.top;
  if (left + popoverW > vw - 16) left = anchorRect.left - popoverW - 10;
  if (left < 16) left = Math.max(16, anchorRect.left + anchorRect.width / 2 - popoverW / 2);
  if (top + popoverH > vh - 16) top = vh - popoverH - 16;
  if (top < 16) top = 16;

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: "none" }}>
      <div
        ref={ref}
        className="bg-white rounded-xl shadow-xl border border-[#e5e5e5] overflow-hidden"
        style={{ position: "absolute", left, top, width: popoverW, pointerEvents: "auto" }}
      >
        <div className="h-1.5" style={{ backgroundColor: colors.border }} />
        <div className="p-4">
          {/* Type badge + close */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.border }} />
              {DAY_EVENT_LABELS[item.type]}
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-[#717179] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2 leading-snug">{item.title}</h3>

          {/* Time */}
          <div className="flex items-center gap-2 text-xs text-[#717179] mb-2">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
              <rect x="1.5" y="2.5" width="11" height="9.5" rx="1.5" stroke="#717179" strokeWidth="1.2" />
              <path d="M1.5 5.5h11" stroke="#717179" strokeWidth="1.2" />
              <path d="M4.5 1v2M9.5 1v2" stroke="#717179" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span>{formatPopoverTime(item.start_at, item.end_at, item.all_day)}</span>
          </div>

          {/* Property */}
          {item.property && (
            <div className="flex items-center gap-2 text-xs text-[#717179] mb-3">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                <path d="M2 12.5V5.5L7 2l5 3.5v7H2z" stroke="#717179" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M5.5 12.5V9h3v3.5" stroke="#717179" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              <span className="truncate">{item.property}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#ebebeb]">
            <button
              onClick={() => { onViewDetails(item); onClose(); }}
              className="flex-1 h-8 text-sm font-medium rounded-lg text-white transition-colors"
              style={{ backgroundColor: "#013764" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#014578")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#013764")}
            >
              View Details
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-8 text-sm font-medium rounded-lg border border-[#dadada] text-[#303030] bg-white hover:bg-[#f5f5f5] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyDayCard() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate  = useNavigate();
  const now       = new Date();
  const nowHours  = now.getHours() + now.getMinutes() / 60;
  const nowTop    = Math.min(hourToTop(nowHours), TIMELINE_H - 2);
  const isToday   = true;

  const [schedule, setSchedule]         = useState<ScheduleItem[]>([]);
  const [loading,  setLoading]          = useState(true);
  const [popoverItem, setPopoverItem]   = useState<ScheduleItem | null>(null);
  const [popoverRect, setPopoverRect]   = useState<DOMRect | null>(null);

  // Modals — match Operations calendar behaviour exactly
  const [editEventOpen,   setEditEventOpen]   = useState(false);
  const [editingEventId,  setEditingEventId]  = useState<number | null>(null);
  const [ftoModalOpen,    setFtoModalOpen]    = useState(false);
  const [editingFTO,      setEditingFTO]      = useState<any>(null);

  const handleEventClick = useCallback((item: ScheduleItem, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverItem(item);
    setPopoverRect(rect);
  }, []);

  const handleViewDetails = useCallback(async (item: ScheduleItem) => {
    setPopoverItem(null);
    setPopoverRect(null);
    switch (item.type) {
      case "task":
        navigate(`/tasks/${item.id}`);
        break;
      case "work-order":
        navigate(`/work-orders`);
        break;
      case "inspection":
        navigate(`/property/${item.property_id}/Inspections?inspectionId=${item.id}`);
        break;
      case "calendar_event":
        setEditingEventId(item.id);
        setEditEventOpen(true);
        break;
      case "fto":
        try {
          const ftoData = await fetchJSON(`/maintenance/ftos/${item.id}`);
          setEditingFTO({
            id: ftoData.id,
            name: ftoData.name,
            description: ftoData.description,
            priority: ftoData.priority,
            status: ftoData.status,
            due_date: ftoData.due_date,
            property_id: ftoData.property_id,
            property_name: ftoData.property_name,
            task_id: ftoData.task_id,
            field_team_member_ids: ftoData.field_team_member_ids ?? [],
            pm_assignee_ids: ftoData.pm_assignee_ids ?? [],
            unit_id: ftoData.unit_id,
            unit_name: ftoData.unit_name,
            event_start_at: ftoData.event_start_at ?? null,
            event_end_at: ftoData.event_end_at ?? null,
          });
          setFtoModalOpen(true);
        } catch {
          // fall back to list page
          navigate(`/field-team-orders`);
        }
        break;
    }
  }, [navigate]);

  useEffect(() => {
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    fetchJSON(`/operations/dashboard/my-day?date=${dateStr}`)
      .then((data: ApiDayEvent[]) => {
        const items = data.flatMap((e) => {
          const item = apiEventToScheduleItem(e);
          return item ? [item] : [];
        });
        setSchedule(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll so current time is ~120px from the top of the viewport
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, nowTop - 120);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => DAY_START_H + i);

  return (
    <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <h2 className="text-base font-semibold text-gray-900">My Day</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{_todayDateStr}</span>
          <a
            href="/operations?tab=calendar"
            title="Open calendar"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2H2.5C1.672 2 1 2.672 1 3.5v8C1 12.328 1.672 13 2.5 13h8c.828 0 1.5-.672 1.5-1.5V8"/>
              <path d="M8.5 1H13v4.5"/>
              <path d="M13 1L6 8"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Scrollable timeline */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ height: VISIBLE_H }}
      >
        <div className="relative" style={{ height: TIMELINE_H, minWidth: 0 }}>
          {/* Hour rows */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 flex"
              style={{ top: hourToTop(hour) }}
            >
              {/* Time label */}
              <div
                className="flex-shrink-0 flex items-start justify-end pr-3 pt-0"
                style={{ width: TIME_COL_W }}
              >
                <span className={`text-xs text-gray-400 select-none ${hour === 0 ? "" : "-mt-2"}`}>
                  {formatHour(hour)}
                </span>
              </div>
              {/* Hour divider line */}
              <div className="flex-1 border-t border-gray-100" />
            </div>
          ))}

          {/* Half-hour tick lines (lighter) */}
          {Array.from({ length: TOTAL_HOURS }, (_, i) => DAY_START_H + i).map((hour) => (
            <div
              key={`half-${hour}`}
              className="absolute right-0 border-t border-gray-50"
              style={{ top: hourToTop(hour) + HOUR_HEIGHT / 2, left: TIME_COL_W }}
            />
          ))}

          {/* Current time indicator */}
          {isToday && (
            <div
              className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
              style={{ top: nowTop }}
            >
              <div className="flex-shrink-0" style={{ width: TIME_COL_W }} />
              <div className="relative flex-1 flex items-center">
                <div className="absolute -left-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <div className="w-full border-t-2 border-red-500" />
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && schedule.length === 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ left: TIME_COL_W }}
            >
              <p className="text-sm text-gray-400">Nothing scheduled for today</p>
            </div>
          )}

          {/* Events */}
          {schedule.map((item) => {
            const startH = parseTimeToHours(item.time);
            const top    = hourToTop(startH);
            const height = Math.max(item.durationHrs * HOUR_HEIGHT - 4, 28);
            const c      = eventColors[item.type];
            const isActive = popoverItem?.id === item.id && popoverItem?.type === item.type;

            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={(e) => handleEventClick(item, e)}
                className={`absolute rounded-md border-l-4 px-2 py-1 overflow-hidden cursor-pointer hover:brightness-95 transition-all ${c.bg} ${c.border} ${isActive ? "ring-2 ring-offset-1 ring-gray-400" : ""}`}
                style={{
                  top: top + 1,
                  left: TIME_COL_W + 6,
                  right: 8,
                  height,
                }}
              >
                <div className="flex items-start gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${c.dot}`} />
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold leading-tight truncate ${c.text}`}>{item.title}</p>
                    {height > 36 && (
                      <p className={`text-xs leading-tight truncate opacity-80 ${c.text}`}>
                        {item.time} &middot; {item.property}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popover */}
      {popoverItem && popoverRect && (
        <DayEventPopover
          item={popoverItem}
          anchorRect={popoverRect}
          onClose={() => { setPopoverItem(null); setPopoverRect(null); }}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Calendar event edit dialog */}
      <EditEventDialog
        open={editEventOpen}
        onOpenChange={(open) => { setEditEventOpen(open); if (!open) setEditingEventId(null); }}
        eventId={editingEventId}
        onEventUpdated={() => {}}
      />

      {/* FTO edit modal */}
      <CreateFTOModal
        open={ftoModalOpen}
        onOpenChange={(open) => { setFtoModalOpen(open); if (!open) setEditingFTO(null); }}
        editingFTO={editingFTO}
        onSuccess={() => {}}
      />
    </div>
  );
}

// ─── Other Card Components ────────────────────────────────────────────────────

function RecentlyBookedBillsCard() {
  const navigate = useNavigate();
  const [bills, setBills]     = useState<RecentBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJSON("/operations/dashboard/recent-bills")
      .then((data: RecentBill[]) => setBills(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Recently Booked Bills</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
          {loading ? "–" : `${bills.length} bill${bills.length !== 1 ? "s" : ""}`}
        </span>
      </div>
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          </div>
        ) : bills.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No bills booked yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {bills.map((bill) => (
              <div key={bill.id} className="px-4 py-2 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{bill.vendor_name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {bill.property || "—"}
                    {bill.category ? <> &middot; {bill.category}</> : null}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(bill.amount_cents / 100)}</span>
                  <span className="text-xs text-gray-400 w-24 text-right">
                    {new Date(bill.statement_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-4 py-3 border-t border-gray-100">
        <button
          onClick={() => navigate("/bills")}
          className="w-full text-xs font-medium text-center text-gray-500 hover:text-gray-800 transition-colors"
        >
          View all bills →
        </button>
      </div>
    </div>
  );
}

function ExpiringRentersInsuranceCard() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<ExpiringInsurance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJSON<ExpiringInsurance[]>("/operations/dashboard/expiring-insurance")
      .then((d) => setPolicies(d))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, []);

  const urgencyClass = (d: number) => d <= 14 ? "text-red-500" : d <= 30 ? "text-orange-500" : "text-yellow-600";

  return (
    <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Expiring Renters Insurance</h2>
      </div>
      <div className="px-3 py-2 space-y-0.5 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
          </div>
        ) : policies.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No policies expiring in the next 60 days</p>
        ) : policies.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{item.tenant_name} — {item.unit_name}</p>
              <p className="text-xs text-gray-400">{item.property}</p>
            </div>
            <span className={`text-xs flex-shrink-0 ml-3 font-medium whitespace-nowrap ${urgencyClass(item.days_left)}`}>{item.days_left}d left</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-gray-100">
        <button onClick={() => navigate("/insurance")} className="text-xs text-blue-600 hover:underline">View all →</button>
      </div>
    </div>
  );
}


function renderCard(id: CardId) {
  switch (id) {
    case "recent-activity":            return <RecentActivityCard />;
    case "open-maintenance":           return <OpenMaintenanceCard />;
    case "my-day":                     return <MyDayCard />;
    case "recently-booked-bills":      return <RecentlyBookedBillsCard />;
    case "expiring-renters-insurance": return <ExpiringRentersInsuranceCard />;
  }
}

// ─── Add / Remove Cards Modal ─────────────────────────────────────────────────

interface AddRemoveModalProps {
  enabled: Set<CardId>;
  onToggle: (id: CardId) => void;
  onClose: () => void;
}

function AddRemoveModal({ enabled, onToggle, onClose }: AddRemoveModalProps) {
  const allCards = Object.entries(CARD_REGISTRY) as [CardId, CardMeta][];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add / remove cards</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Select cards for your dashboard.{" "}
                <span className="font-medium text-gray-700">{enabled.size} of {allCards.length} selected</span>
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ml-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${(enabled.size / allCards.length) * 100}%` }} />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allCards.map(([id, meta]) => {
              const on = enabled.has(id);
              return (
                <button key={id} onClick={() => onToggle(id)}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all ${on ? "border-green-500 bg-green-50/50" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"}`}>
                  <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all ${on ? "bg-green-500" : "border-2 border-gray-300 bg-white"}`}>
                    {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 pr-8">{meta.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{meta.description}</p>
                  {meta.defaultSize === "full" && (
                    <span className="inline-block mt-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Full width by default</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [firstName, setFirstName] = useState<string>("");

  useEffect(() => {
    fetchJSON("/users/me")
      .then((u: { name?: string | null }) => {
        if (u?.name) {
          setFirstName(u.name.split(" ")[0]);
        }
      })
      .catch(() => {});
  }, []);

  const initial = loadDashboardState();
  const [cardOrder,   setCardOrder]   = useState<CardId[]>(initial.order);
  const [enabledCards, setEnabledCards] = useState<Set<CardId>>(initial.enabled);
  const [cardSizes,   setCardSizes]   = useState<Partial<Record<CardId, CardSize>>>(initial.sizes);

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showAddRemove, setShowAddRemove] = useState(false);
  const [selectedCard, setSelectedCard]   = useState<CardId | null>(null);

  // Temp state while in customize mode
  const [tempOrder,   setTempOrder]   = useState<CardId[]>([]);
  const [tempEnabled, setTempEnabled] = useState<Set<CardId>>(new Set());
  const [tempSizes,   setTempSizes]   = useState<Partial<Record<CardId, CardSize>>>({});

  const dragCard     = useRef<CardId | null>(null);
  const dragOverCard = useRef<CardId | null>(null);
  const [dragOverId, setDragOverId] = useState<CardId | null>(null);
  const scrollRAF    = useRef<number | null>(null);
  const scrollDir    = useRef<number>(0);

  function enterCustomize() {
    setTempOrder([...cardOrder]);
    setTempEnabled(new Set(enabledCards));
    setTempSizes({ ...cardSizes });
    setIsCustomizing(true);
  }

  function saveCustomize() {
    setCardOrder(tempOrder);
    setEnabledCards(tempEnabled);
    setCardSizes(tempSizes);
    saveDashboardState(tempOrder, tempEnabled, tempSizes);
    setIsCustomizing(false);
    setSelectedCard(null);
  }

  function cancelCustomize() {
    setIsCustomizing(false);
    setSelectedCard(null);
  }

  function toggleCard(id: CardId) {
    const next = new Set(tempEnabled);
    if (next.has(id)) {
      next.delete(id);
      setTempOrder(tempOrder.filter((c) => c !== id));
    } else {
      next.add(id);
      setTempOrder([...tempOrder, id]);
    }
    setTempEnabled(next);
  }

  function removeCard(id: CardId) {
    const next = new Set(tempEnabled);
    next.delete(id);
    setTempEnabled(next);
    setTempOrder(tempOrder.filter((c) => c !== id));
  }

  function toggleSize(id: CardId) {
    const current = getCardSize(id, tempSizes);
    setTempSizes({ ...tempSizes, [id]: current === "full" ? "half" : "full" });
  }

  // DnD — auto-scroll helpers
  function stopScroll() {
    if (scrollRAF.current !== null) { cancelAnimationFrame(scrollRAF.current); scrollRAF.current = null; }
    scrollDir.current = 0;
  }

  function updateScroll(clientY: number) {
    const ZONE = 120;
    const vh   = window.innerHeight;
    const dir  = clientY < ZONE ? -1 : clientY > vh - ZONE ? 1 : 0;
    if (dir === scrollDir.current) return; // no change, keep existing RAF
    stopScroll();
    if (dir !== 0) {
      scrollDir.current = dir;
      const speed = dir * 12;
      const tick  = () => { window.scrollBy(0, speed); scrollRAF.current = requestAnimationFrame(tick); };
      scrollRAF.current = requestAnimationFrame(tick);
    }
  }

  // DnD — event handlers
  function handleDragStart(id: CardId) { dragCard.current = id; }

  function handleDragEnter(id: CardId, e: React.DragEvent) {
    // Ignore if event originates from a child of this element (bubbling)
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
    // Ignore if re-entering the source card itself
    if (id === dragCard.current) return;
    dragOverCard.current = id;
    setDragOverId(id);
  }

  function handleDragLeave(id: CardId, e: React.DragEvent) {
    // Ignore if still within this element (moving between children)
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
    if (dragOverCard.current === id) { dragOverCard.current = null; setDragOverId(null); }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    updateScroll(e.clientY);
  }

  function handleDrop() {
    stopScroll();
    if (!dragCard.current || !dragOverCard.current || dragCard.current === dragOverCard.current) {
      dragCard.current = dragOverCard.current = null; setDragOverId(null); return;
    }
    const list = [...tempOrder];
    const from = list.indexOf(dragCard.current);
    const to   = list.indexOf(dragOverCard.current);
    list.splice(from, 1);
    list.splice(to, 0, dragCard.current!);
    setTempOrder(list);
    dragCard.current = dragOverCard.current = null; setDragOverId(null);
    setSelectedCard(null);
  }

  function handleDragEnd() {
    stopScroll();
    dragCard.current = dragOverCard.current = null; setDragOverId(null);
    setSelectedCard(null);
  }

  const activeOrder   = isCustomizing ? tempOrder   : cardOrder;
  const activeEnabled = isCustomizing ? tempEnabled : enabledCards;
  const activeSizes   = isCustomizing ? tempSizes   : cardSizes;
  const visibleCards  = activeOrder.filter((id) => activeEnabled.has(id));

  return (
    <div className="min-h-full bg-gray-50/50">
      {/* Customize banner */}
      {isCustomizing && (
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Customize dashboard</p>
              <p className="text-xs text-gray-500">Click a card to select it, then drag to reorder. Use ½ / Full to resize. Click ✕ to remove.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setShowAddRemove(true)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium">
                Add / remove cards...
              </button>
              <button onClick={saveCustomize} className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
                Save changes
              </button>
              <button onClick={cancelCustomize} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome{firstName ? ` ${firstName}` : ""}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">Overview of your property management portfolio</p>
          </div>
          {!isCustomizing && (
            <button onClick={enterCustomize} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-600 font-medium bg-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Customize
            </button>
          )}
        </div>

        {/* Card Grid */}
        {visibleCards.length === 0 ? (
          <div className="mt-6 bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center">
            <p className="text-gray-500 text-sm">No cards selected.</p>
            <button onClick={isCustomizing ? () => setShowAddRemove(true) : enterCustomize} className="mt-3 text-sm text-blue-600 hover:underline">
              Add cards to your dashboard
            </button>
          </div>
        ) : (
          <div
            className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
            onClick={isCustomizing ? () => setSelectedCard(null) : undefined}
            onDragOver={isCustomizing ? handleDragOver : undefined}
            onDrop={isCustomizing ? handleDrop : undefined}
          >
            {visibleCards.map((id) => (
              <CardShell
                key={id}
                id={id}
                size={getCardSize(id, activeSizes)}
                isCustomizing={isCustomizing}
                isSelected={selectedCard === id}
                isDragOver={dragOverId === id}
                onSelect={() => setSelectedCard(prev => prev === id ? null : id)}
                onDragStart={() => handleDragStart(id)}
                onDragEnter={(e) => handleDragEnter(id, e)}
                onDragLeave={(e) => handleDragLeave(id, e)}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onRemove={() => removeCard(id)}
                onToggleSize={() => toggleSize(id)}
              >
                {renderCard(id)}
              </CardShell>
            ))}
          </div>
        )}
      </div>

      {showAddRemove && (
        <AddRemoveModal
          enabled={isCustomizing ? tempEnabled : enabledCards}
          onToggle={toggleCard}
          onClose={() => setShowAddRemove(false)}
        />
      )}
    </div>
  );
}
