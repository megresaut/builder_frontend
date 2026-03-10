import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  dismissNotification,
  type CalendarNotification,
} from "@/data/notifications";

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

const SEVERITY_BAR: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-400",
  info: "bg-blue-400",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<CalendarNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const prevUnreadRef = useRef(0);

  const userId = useMemo(() => {
    const raw = localStorage.getItem("avm_user_id");
    return raw ? Number(raw) : 0;
  }, []);

  // ---- Fetch unread count ----
  const loadUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const count = await fetchUnreadCount(userId);
      // Toast for new critical notifications when panel is closed
      if (count > prevUnreadRef.current && !open) {
        // We don't know exactly which are new, but signal the user
      }
      prevUnreadRef.current = count;
      setUnreadCount(count);
    } catch {
      // silently ignore polling errors
    }
  }, [userId, open]);

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
      const data = await fetchNotifications(userId, 15);
      setNotifications(data);

      // Check for new critical ones to toast
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
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [userId, open]);

  useEffect(() => {
    if (open) loadNotifications();
  }, [open, loadNotifications]);

  // ---- Close on outside click / Escape ----
  useEffect(() => {
    if (!open) return;

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
  }, [open]);

  // ---- Actions ----
  const handleMarkRead = useCallback(
    async (id: number) => {
      if (!userId) return;
      try {
        await markNotificationRead(id, userId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...n, read_by_user_ids: [...n.read_by_user_ids, userId] }
              : n,
          ),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    },
    [userId],
  );

  const handleDismiss = useCallback(async (id: number) => {
    try {
      await dismissNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    if (!userId) return;
    const unread = notifications.filter(
      (n) => !n.read_by_user_ids.includes(userId),
    );
    await Promise.allSettled(
      unread.map((n) => markNotificationRead(n.id, userId)),
    );
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read_by_user_ids: n.read_by_user_ids.includes(userId)
          ? n.read_by_user_ids
          : [...n.read_by_user_ids, userId],
      })),
    );
    setUnreadCount(0);
  }, [userId, notifications]);

  const isRead = (n: CalendarNotification) =>
    n.read_by_user_ids.includes(userId);

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        title={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
            : "Calendar Notifications"
        }
        className={`p-2 hover:bg-gray-100 rounded-lg border transition-colors flex-shrink-0 relative ${
          open ? "border-[#2463eb] bg-blue-50" : "border-gray-300"
        }`}
      >
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
          {/* Calendar icon */}
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
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
          className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-lg border border-gray-200 shadow-lg z-50 flex flex-col"
          style={{ maxHeight: "400px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Calendar Notifications
            </h3>
            {notifications.some((n) => !isRead(n)) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Loading */}
            {loading && notifications.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}

            {/* Empty state */}
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
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            )}

            {/* Notification list */}
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isRead(n) ? "bg-blue-50/50" : ""
                }`}
                onClick={() => {
                  if (!isRead(n)) handleMarkRead(n.id);
                }}
              >
                {/* Severity bar */}
                <div
                  className={`w-1 flex-shrink-0 ${SEVERITY_BAR[n.severity] ?? "bg-gray-300"}`}
                />

                {/* Content */}
                <div className="flex-1 min-w-0 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>

                    {/* Dismiss button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(n.id);
                      }}
                      className="flex-shrink-0 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Dismiss"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M15 5L5 15M5 5L15 15"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
