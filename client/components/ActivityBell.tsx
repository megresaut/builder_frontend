import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchActivityFeed,
  type ActivityEvent,
  type ActivityEventType,
} from "@/data/activityData";

const ACTIVITY_LIMIT = 15;

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

const activityColors: Record<ActivityEventType, string> = {
  maintenance_submitted: "bg-orange-100 text-orange-600",
  work_order_created: "bg-blue-100 text-blue-600",
  work_order_completed: "bg-blue-100 text-blue-600",
  fto_created: "bg-purple-100 text-purple-600",
  fto_completed: "bg-purple-100 text-purple-600",
  inspection_created: "bg-teal-100 text-teal-600",
  inspection_completed: "bg-teal-100 text-teal-600",
  tenant_added: "bg-green-100 text-green-600",
  tenant_moved_in: "bg-green-100 text-green-600",
  tenant_moved_out: "bg-green-100 text-green-600",
  renters_insurance_uploaded: "bg-emerald-100 text-emerald-600",
  insurance_policy_added: "bg-emerald-100 text-emerald-600",
  invoice_issued: "bg-indigo-100 text-indigo-600",
  vendor_compliance_uploaded: "bg-amber-100 text-amber-600",
};

const iconWrench = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
const iconClipboard = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);
const iconTruck = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const iconSearch = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const iconUser = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);
const iconShield = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const iconDoc = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const activityIcons: Record<ActivityEventType, React.ReactNode> = {
  maintenance_submitted: iconWrench,
  work_order_created: iconClipboard,
  work_order_completed: iconClipboard,
  fto_created: iconTruck,
  fto_completed: iconTruck,
  inspection_created: iconSearch,
  inspection_completed: iconSearch,
  tenant_added: iconUser,
  tenant_moved_in: iconUser,
  tenant_moved_out: iconUser,
  renters_insurance_uploaded: iconShield,
  insurance_policy_added: iconShield,
  invoice_issued: iconDoc,
  vendor_compliance_uploaded: iconDoc,
};

export default function ActivityBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchActivityFeed(ACTIVITY_LIMIT);
      setEvents(res.events);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadEvents();
  }, [open, loadEvents]);

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

  function handleActivityClick(item: ActivityEvent) {
    setOpen(false);
    switch (item.entity_type) {
      case "task":
        navigate(`/tasks/${item.entity_id}`);
        break;
      case "work_order":
        if (item.parent_id) {
          navigate(`/tasks/${item.parent_id}/workorders/${item.entity_id}`);
        } else {
          navigate(`/work-orders`);
        }
        break;
      case "fto":
        navigate(`/field-team-orders/approve/${item.entity_id}`);
        break;
      case "inspection":
        if (item.property_id) {
          navigate(`/property/${item.property_id}/Inspections?inspectionId=${item.entity_id}`);
        }
        break;
      case "tenant":
        if (item.property_id) {
          navigate(`/property/${item.property_id}/Units`);
        } else {
          navigate(`/properties`);
        }
        break;
      case "invoice":
        navigate(`/invoicing`);
        break;
      case "insurance_policy":
      case "renters_insurance":
        if (item.property_id) {
          navigate(`/property/${item.property_id}/Insurance`);
        } else {
          navigate(`/insurance`);
        }
        break;
      case "vendor_compliance_doc":
        navigate(`/vendor-compliance`);
        break;
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        title="Activity"
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
          <polyline points="2,12 6,12 8,6 10,18 13,9 15,13 17,12 22,12" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-lg border border-gray-200 shadow-lg z-50 flex flex-col"
          style={{ maxHeight: "440px" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/activity-feed");
                }}
                title="Go to Activity Feed"
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
                  <polyline points="2,12 6,12 8,6 10,18 13,9 15,13 17,12 22,12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && events.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}

            {!loading && events.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-300 mb-3"
                >
                  <polyline
                    points="2,12 6,12 8,6 10,18 13,9 15,13 17,12 22,12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}

            {events.map((item) => (
              <div
                key={item.id}
                onClick={() => handleActivityClick(item)}
                className="px-4 py-3 flex items-start gap-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div
                  className={`${activityColors[item.event_type] ?? "bg-gray-100 text-gray-600"} rounded-lg p-1.5 flex-shrink-0 mt-0.5`}
                >
                  {activityIcons[item.event_type]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 whitespace-nowrap mt-0.5">
                      {timeAgo(item.occurred_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                    {item.description}
                  </p>
                  {item.property_address && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      {item.property_address}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {events.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/activity-feed");
                }}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
              >
                View all activity
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
    </div>
  );
}
