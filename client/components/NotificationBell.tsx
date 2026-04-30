import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  type CalendarNotification,
} from "@/data/notifications";

// ---------------------------------------------------------------------------
// Mode config
// ---------------------------------------------------------------------------

export type NotificationMode = "reminders";

const MODE_CONFIG: Record<
  NotificationMode,
  {
    title: string;
    types: string[];
    icon: React.ReactNode;
    emptyText: string;
  }
> = {
  reminders: {
    title: "Reminders",
    types: [
      "deadline_1day",
      "deadline_1hour",
      "overdue_warning",
      "conflict_detected",
    ],
    emptyText: "No upcoming reminders",
    icon: (
      // Calendar icon
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-700"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const SEVERITY_BAR: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-400",
  info: "bg-blue-400",
};

// Soft row tint per severity — used in the dropdown panel so the user can
// scan urgency at a glance. Light enough to coexist with the hover state.
const SEVERITY_ROW_TINT: Record<string, string> = {
  critical: "bg-red-50 hover:bg-red-100",
  warning: "bg-amber-50 hover:bg-amber-100",
  info: "bg-green-50 hover:bg-green-100",
};

const SEVERITY_BADGE: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  critical: { bg: "bg-red-100", text: "text-red-700", label: "Critical" },
  warning: { bg: "bg-amber-100", text: "text-amber-700", label: "Warning" },
  info: { bg: "bg-blue-100", text: "text-blue-700", label: "Info" },
};

const TYPE_LABELS: Record<string, string> = {
  deadline_1day: "Deadline Reminder (24h)",
  deadline_1hour: "Starting Soon (1h)",
  conflict_detected: "Scheduling Conflict",
  overdue_warning: "Overdue Warning",
};

const ENTITY_LABELS: Record<string, string> = {
  task: "Task",
  field_team_order: "FTO",
  work_order: "Work Order",
  calendar_event: "Calendar Event",
  recurring_task: "Recurring Task",
  inspection: "Inspection",
  personal_todo: "To-Do",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NotificationBellProps {
  mode?: NotificationMode;
}

export default function NotificationBell({
  mode = "reminders",
}: NotificationBellProps) {
  const navigate = useNavigate();
  const cfg = MODE_CONFIG[mode];

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<CalendarNotification[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CalendarNotification | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const userId = useMemo(() => {
    const raw = localStorage.getItem("avm_user_id");
    return raw ? Number(raw) : 0;
  }, []);

  // ---- Poll unread count ----
  const loadUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const count = await fetchUnreadCount(userId, cfg.types);
      setUnreadCount(count);
    } catch {
      // silently ignore polling errors
    }
  }, [userId, cfg.types]);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  // ---- Load notifications when panel opens ----
  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await fetchNotifications(userId, 15, cfg.types);
      setNotifications(data);

      if (mode === "reminders") {
        const criticals = data.filter(
          (n) =>
            n.severity === "critical" &&
            !n.read_by_user_ids.includes(userId) &&
            !n.dismissed,
        );
        if (criticals.length > 0 && !open) {
          for (const c of criticals.slice(0, 2)) {
            toast.error(c.title, { description: c.message });
          }
        }
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [userId, cfg.types, mode, open]);

  useEffect(() => {
    if (open) loadNotifications();
  }, [open, loadNotifications]);

  // ---- Close on outside click / Escape ----
  useEffect(() => {
    if (!open || selected) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, selected]);

  // ---- Actions ----
  // Mark-read removes the item from the bell view (matches the backend's
  // ListForUser, which now excludes already-read notifications). Once read
  // or dismissed, a notification stays gone — the dedup_key on the row keeps
  // the intelligence agent from regenerating it on the next tick.
  const handleMarkRead = useCallback(
    async (id: number) => {
      if (!userId) return;
      try {
        await markNotificationRead(id, userId);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    },
    [userId],
  );

  const handleDismiss = useCallback(
    async (id: number) => {
      try {
        await dismissNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (selected?.id === id) setSelected(null);
      } catch {
        // ignore
      }
    },
    [selected],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!userId) return;
    await markAllNotificationsRead(userId);
    setNotifications([]);
    setUnreadCount(0);
  }, [userId]);

  const handleNotificationClick = useCallback(
    (n: CalendarNotification) => {
      if (!isRead(n)) handleMarkRead(n.id);
      setSelected(n);
    },
    [handleMarkRead],
  );

  const isRead = (n: CalendarNotification) =>
    n.read_by_user_ids.includes(userId);

  return (
    <div className="relative">
      {/* Icon button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        title={
          unreadCount > 0
            ? `${unreadCount} unread ${cfg.title.toLowerCase()}`
            : cfg.title
        }
        className={`p-2 hover:bg-gray-100 rounded-lg border transition-colors flex-shrink-0 relative ${
          open ? "border-[#2463eb] bg-blue-50" : "border-gray-300"
        }`}
      >
        {cfg.icon}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-lg border border-gray-200 shadow-lg z-50 flex flex-col"
          style={{ maxHeight: "440px" }}
        >
          {/* Header — sized + spaced to match the Activity dropdown */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {cfg.title}
              </h3>
              {mode === "reminders" && (
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/operations?tab=reminders");
                  }}
                  title="Go to Reminders"
                  className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-300 mb-3"
                >
                  <path
                    d="M10.268 21a2 2 0 0 0 3.464 0"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <p className="text-sm text-gray-500">{cfg.emptyText}</p>
              </div>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`px-4 py-3 flex items-start gap-3 border-b border-gray-50 last:border-b-0 transition-colors cursor-pointer ${
                  SEVERITY_ROW_TINT[n.severity] ?? "hover:bg-gray-50"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {n.title}
                    </p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 whitespace-nowrap mt-0.5">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                    {n.message}
                  </p>
                </div>

                {/* Dismiss — kept per the user's request, styled subtle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(n.id);
                  }}
                  className="flex-shrink-0 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
                  title="Dismiss"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M15 5L5 15M5 5L15 15"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Footer — mirrors the Activity dropdown's "View all" link */}
          {mode === "reminders" && notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/operations?tab=reminders");
                }}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
              >
                View all reminders
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---- Detail Modal ---- */}
      <Dialog
        open={!!selected}
        onOpenChange={(v) => {
          if (!v) setSelected(null);
        }}
      >
        <DialogContent className="bg-white rounded-lg w-full max-w-md p-0 overflow-hidden">
          {selected && (
            <>
              {/* Severity banner */}
              <div
                className={`h-1.5 w-full ${SEVERITY_BAR[selected.severity] ?? "bg-gray-300"}`}
              />

              <div className="px-5 pt-4 pb-5">
                {/* Header row */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      SEVERITY_BADGE[selected.severity]?.bg ?? "bg-gray-100"
                    } ${SEVERITY_BADGE[selected.severity]?.text ?? "text-gray-600"}`}
                  >
                    {SEVERITY_BADGE[selected.severity]?.label ??
                      selected.severity}
                  </span>
                  <span className="text-xs text-gray-400">
                    {TYPE_LABELS[selected.notification_type] ??
                      selected.notification_type}
                  </span>
                </div>

                <DialogTitle className="text-base font-semibold text-gray-900 mb-2">
                  {selected.title}
                </DialogTitle>

                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {selected.message}
                </p>

                {/* Metadata */}
                {selected.metadata &&
                  Object.keys(selected.metadata).length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Details
                      </p>
                      <div className="space-y-1.5">
                        {selected.metadata.entity_type &&
                          selected.metadata.entity_id && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Related entity
                              </span>
                              <span className="text-xs font-medium text-gray-700">
                                {ENTITY_LABELS[selected.metadata.entity_type] ??
                                  // Fallback: strip underscores and title-case
                                  // unknown entity types so we never show
                                  // raw enum values like "recurring_task".
                                  String(selected.metadata.entity_type)
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (c) => c.toUpperCase())}{" "}
                                #{selected.metadata.entity_id}
                              </span>
                            </div>
                          )}
                        {selected.metadata.submission_id && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Submission
                            </span>
                            <span className="text-xs font-medium text-gray-700">
                              #{selected.metadata.submission_id}
                            </span>
                          </div>
                        )}
                        {selected.metadata.user_id && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Affected user
                            </span>
                            <span className="text-xs font-medium text-gray-700">
                              User #{selected.metadata.user_id}
                            </span>
                          </div>
                        )}
                        {selected.metadata.conflict_event_id && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Conflicting event
                            </span>
                            <span className="text-xs font-medium text-gray-700">
                              #{selected.metadata.conflict_event_id}
                            </span>
                          </div>
                        )}
                        {selected.metadata.date && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Date</span>
                            <span className="text-xs font-medium text-gray-700">
                              {selected.metadata.date}
                            </span>
                          </div>
                        )}
                        {selected.metadata.count && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Items scheduled
                            </span>
                            <span className="text-xs font-medium text-gray-700">
                              {selected.metadata.count}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Timestamps */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-4">
                  <span>Created {formatDate(selected.created_at)}</span>
                  {selected.expires_at && (
                    <span>Expires {formatDate(selected.expires_at)}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!isRead(selected) && (
                    <button
                      onClick={() => {
                        handleMarkRead(selected.id);
                        setSelected({
                          ...selected,
                          read_by_user_ids: [
                            ...selected.read_by_user_ids,
                            userId,
                          ],
                        });
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(selected.id)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
