import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { fetchReminders, type ReminderItem } from "@/data/reminders";
import { fetchJSON } from "@/api/fetchJSON";

// ─── Config ───────────────────────────────────────────────────────────────────

type ReminderType = ReminderItem["type"];

const TYPE_CONFIG: Record<
  ReminderType,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  task: {
    label: "Task",
    color: "#1E40AF",
    bg: "#DBEAFE",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <path
          d="M4 10l4 4 8-8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  work_order: {
    label: "Work Order",
    color: "#9A3412",
    bg: "#FFEDD5",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <path
          d="M5 5l8.75 8.75M5 5H2.5L1.667 2.5 2.5 1.667 5 2.5V5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  field_team_order: {
    label: "FTO",
    color: "#166534",
    bg: "#DCFCE7",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  inspection: {
    label: "Inspection",
    color: "#6B21A8",
    bg: "#F3E8FF",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <rect
          x="4"
          y="2"
          width="12"
          height="16"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M7 7h6M7 10h6M7 13h4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  recurring_task: {
    label: "Recurring",
    color: "#115E59",
    bg: "#CCFBF1",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <path
          d="M4 10a6 6 0 016-6 6 6 0 014.243 1.757M16 10a6 6 0 01-6 6 6 6 0 01-4.243-1.757"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M14 7.5V10h-2.5M6 12.5V10h2.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  calendar_event: {
    label: "Event",
    color: "#374151",
    bg: "#F3F4F6",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <rect
          x="2.5"
          y="3.333"
          width="15"
          height="13.333"
          rx="1.667"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M13.333 1.667V5M6.667 1.667V5M2.5 8.333h15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
};

// DB uses low/medium/high/urgent — map to display labels + colors.
const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  low:    { label: "Low",    color: "#6B7280", bg: "#F3F4F6" },
  medium: { label: "Normal", color: "#D97706", bg: "#FFFBEB" },
  normal: { label: "Normal", color: "#D97706", bg: "#FFFBEB" },
  high:   { label: "High",   color: "#DC2626", bg: "#FEF2F2" },
  urgent: { label: "Urgent", color: "#7C3AED", bg: "#EDE9FE" },
};

const TYPE_FILTER_OPTIONS: Array<{ value: ReminderType | "all"; label: string }> = [
  { value: "all",              label: "All" },
  { value: "task",             label: "Tasks" },
  { value: "work_order",       label: "Work Orders" },
  { value: "field_team_order", label: "FTOs" },
  { value: "inspection",       label: "Inspections" },
  { value: "recurring_task",   label: "Recurring" },
  { value: "calendar_event",   label: "Events" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dueLabel(iso: string): { text: string; urgent: boolean } {
  const due = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / 864e5);
  if (diffDays < 0)   return { text: "Overdue",               urgent: true };
  if (diffDays === 0) return { text: "Due today",              urgent: true };
  if (diffDays === 1) return { text: "Due tomorrow",           urgent: true };
  if (diffDays <= 3)  return { text: `Due in ${diffDays} days`, urgent: true };
  return {
    text: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    urgent: false,
  };
}

function groupByWeek(
  items: ReminderItem[],
): Array<{ label: string; items: ReminderItem[] }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endThisWeek = new Date(today);
  endThisWeek.setDate(today.getDate() + (6 - today.getDay()));
  const endNextWeek = new Date(endThisWeek);
  endNextWeek.setDate(endThisWeek.getDate() + 7);

  const buckets: Record<string, ReminderItem[]> = {
    "This Week": [],
    "Next Week": [],
    Later: [],
  };
  for (const item of items) {
    const d = new Date(item.due_at);
    if (d <= endThisWeek)      buckets["This Week"].push(item);
    else if (d <= endNextWeek) buckets["Next Week"].push(item);
    else                       buckets["Later"].push(item);
  }
  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Reminders() {
  const navigate = useNavigate();

  const [items, setItems] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<ReminderType | "all">("all");
  const [showAssigned, setShowAssigned] = useState(true);
  const [showCollaborating, setShowCollaborating] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchReminders(60)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load reminders.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeFilterCount =
    (typeFilter !== "all" ? 1 : 0) +
    (!showAssigned ? 1 : 0) +
    (!showCollaborating ? 1 : 0);

  const filtered = useMemo(() => {
    return items
      .filter((item) => {
        if (typeFilter !== "all" && item.type !== typeFilter) return false;
        if (!showAssigned && item.relation === "assignee") return false;
        if (!showCollaborating && item.relation === "collaborator") return false;
        return true;
      })
      .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
  }, [items, typeFilter, showAssigned, showCollaborating]);

  const groups = useMemo(() => groupByWeek(filtered), [filtered]);

  async function handleItemClick(item: ReminderItem) {
    switch (item.type) {
      case "task":
        navigate(`/tasks/${item.id}`);
        break;
      case "recurring_task":
        // Recurring series have no standalone detail page — open the edit
        // modal on the Recurring Tasks list instead. The list reads ?edit=
        // and auto-opens the modal pre-filled.
        navigate(`/recurring-tasks?edit=${item.id}`);
        break;
      case "work_order": {
        // Work order detail lives at /tasks/<task_id>/workorders/<wo_id>.
        // The reminders payload doesn't carry task_id, so fetch it on click.
        try {
          const wo: any = await fetchJSON(`/maintenance/work-orders/${item.id}`);
          if (wo?.task_id) {
            navigate(`/tasks/${wo.task_id}/workorders/${item.id}`);
          } else {
            navigate(`/work-orders`);
          }
        } catch {
          navigate(`/work-orders`);
        }
        break;
      }
      case "field_team_order":
        // Approval / submission view, same destination as the FTO row click.
        navigate(`/field-team-orders/approve/${item.id}`);
        break;
      case "inspection":
        if (item.property_id) {
          navigate(`/property/${item.property_id}/Inspections`);
        }
        break;
      case "calendar_event":
        break;
    }
  }

  function clearFilters() {
    setTypeFilter("all");
    setShowAssigned(true);
    setShowCollaborating(true);
  }

  // ── Loading / error states ──
  if (loading) {
    return (
      <div className="flex flex-col px-8 pt-6 pb-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[#1a1a1a]">Reminders</h2>
          <p className="text-sm text-[#717179] mt-0.5">
            Upcoming items you're assigned to or collaborating on
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-[72px] rounded-xl border border-[#e8e8e8] bg-[#f5f5f5] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#a1a1a9] px-8">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-8 pt-6 pb-8">
      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a1a]">Reminders</h2>
          <p className="text-sm text-[#717179] mt-0.5">
            Upcoming items you're assigned to or collaborating on
          </p>
        </div>

        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors flex-shrink-0 mt-0.5",
            filtersOpen || activeFilterCount > 0
              ? "bg-[#013764] text-white border-[#013764]"
              : "bg-white text-[#555] border-[#e5e5e5] hover:border-[#c0c0c0]",
          )}
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 5h14M6 10h8M9 15h2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white text-[#013764] text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Collapsible filter panel ── */}
      {filtersOpen && (
        <div className="mb-4 p-3 rounded-xl border border-[#e8e8e8] bg-[#fafafa] flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Type pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-[#717179] mr-0.5">
              Type:
            </span>
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  typeFilter === opt.value
                    ? "bg-[#013764] text-white border-[#013764]"
                    : "bg-white text-[#555] border-[#e5e5e5] hover:border-[#c0c0c0]",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-[#e5e5e5] self-center hidden sm:block" />

          {/* Relation toggles */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-[#717179] mr-0.5">
              Show:
            </span>
            <button
              onClick={() => setShowAssigned((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                showAssigned
                  ? "bg-[#013764]/8 text-[#013764] border-[#013764]/25"
                  : "bg-white text-[#a1a1a9] border-[#e5e5e5]",
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#013764] inline-block" />
              Assigned to me
            </button>
            <button
              onClick={() => setShowCollaborating((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                showCollaborating
                  ? "bg-[#6B7280]/8 text-[#4B5563] border-[#6B7280]/25"
                  : "bg-white text-[#a1a1a9] border-[#e5e5e5]",
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280] inline-block" />
              Collaborating
            </button>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-[#a1a1a9] hover:text-[#555] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Groups ── */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#a1a1a9]">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            className="mb-3"
          >
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-sm">No upcoming reminders</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(({ label, items: groupItems }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-[#717179] uppercase tracking-wide whitespace-nowrap">
                  {label}
                </span>
                <div className="flex-1 h-px bg-[#e8e8e8]" />
                <span className="text-xs text-[#a1a1a9]">
                  {groupItems.length} item{groupItems.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {groupItems.map((item) => {
                  const typeCfg = TYPE_CONFIG[item.type];
                  const priCfg =
                    PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.medium;
                  const due = dueLabel(item.due_at);
                  const showPriority = item.priority !== "medium";

                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleItemClick(item)}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-[#e8e8e8] bg-white hover:border-[#c0c0c0] hover:shadow-sm transition-all text-left group"
                    >
                      {/* Type icon */}
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: typeCfg.bg,
                          color: typeCfg.color,
                        }}
                      >
                        {typeCfg.icon}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#1a1a1a] truncate group-hover:text-[#013764] transition-colors">
                              {item.title}
                            </p>
                            <p className="text-xs text-[#717179] mt-0.5">
                              {item.property_name}
                              {item.unit_name && (
                                <span className="text-[#a1a1a9]">
                                  {" "}
                                  · {item.unit_name}
                                </span>
                              )}
                            </p>
                            {item.detail && (
                              <p className="text-xs text-[#a1a1a9] mt-0.5">
                                {item.detail}
                              </p>
                            )}
                          </div>

                          {/* Right column */}
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span
                              className={cn(
                                "text-xs font-semibold",
                                due.urgent
                                  ? "text-[#DC2626]"
                                  : "text-[#717179]",
                              )}
                            >
                              {due.text}
                            </span>
                            <div className="flex items-center gap-1">
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                style={{
                                  backgroundColor: typeCfg.bg,
                                  color: typeCfg.color,
                                }}
                              >
                                {typeCfg.label}
                              </span>
                              {showPriority && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                  style={{
                                    backgroundColor: priCfg.bg,
                                    color: priCfg.color,
                                  }}
                                >
                                  {priCfg.label}
                                </span>
                              )}
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                  item.relation === "assignee"
                                    ? "bg-[#013764]/8 text-[#013764]"
                                    : "bg-[#f3f4f6] text-[#6B7280]",
                                )}
                              >
                                {item.relation === "assignee"
                                  ? "Assigned"
                                  : "Collab"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
