import { useEffect, useRef, useState } from "react";
import type { CalendarItem } from "@/data/operations";
import { fetchJSON } from "@/api/fetchJSON";

const EVENT_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  task:              { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF", badge: "#3B82F6" },
  work_order:        { bg: "#FFEDD5", border: "#F97316", text: "#9A3412", badge: "#F97316" },
  field_team_order:  { bg: "#DCFCE7", border: "#22C55E", text: "#166534", badge: "#22C55E" },
  inspection:        { bg: "#F3E8FF", border: "#A855F7", text: "#6B21A8", badge: "#A855F7" },
  recurring_task:    { bg: "#CCFBF1", border: "#14B8A6", text: "#115E59", badge: "#14B8A6" },
  calendar_event:    { bg: "#F3F4F6", border: "#6B7280", text: "#374151", badge: "#6B7280" },
};

const TYPE_LABELS: Record<string, string> = {
  task: "Task",
  work_order: "Work Order",
  field_team_order: "Field Team Order",
  inspection: "Inspection",
  recurring_task: "Recurring Task",
  calendar_event: "Calendar Event",
};

interface EventDetailPopoverProps {
  item: CalendarItem | null;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onViewDetails?: (item: CalendarItem) => void;
}

function formatDateTime(dateStr: string, allDay: boolean): string {
  if (allDay) {
    // For all-day events, use the UTC date to avoid timezone shifts
    // (e.g. "2026-03-15T20:00:00-04:00" is "2026-03-16" in UTC)
    const d = new Date(dateStr);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  }
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) +
    " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getStatusStyle(status: string): { bg: string; text: string } {
  switch (status) {
    case "completed":
    case "closed":
      return { bg: "#DCFCE7", text: "#166534" };
    case "in_progress":
    case "dispatched":
      return { bg: "#DBEAFE", text: "#1E40AF" };
    case "open":
    case "new":
      return { bg: "#FEF3C7", text: "#92400E" };
    case "cancelled":
      return { bg: "#FEE2E2", text: "#991B1B" };
    case "scheduled":
      return { bg: "#E0E7FF", text: "#3730A3" };
    default:
      return { bg: "#F3F4F6", text: "#374151" };
  }
}

export default function EventDetailPopover({ item, anchorRect, onClose, onViewDetails }: EventDetailPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [propertyName, setPropertyName] = useState<string | null>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (item) {
      // Delay so the click that opened this doesn't immediately close it
      const timer = setTimeout(() => document.addEventListener("mousedown", handle), 50);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handle);
      };
    }
  }, [item, onClose]);

  // Close on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (item) {
      document.addEventListener("keydown", handle);
      return () => document.removeEventListener("keydown", handle);
    }
  }, [item, onClose]);

  // Fetch property name
  useEffect(() => {
    if (!item?.property_id) { setPropertyName(null); return; }
    const token = localStorage.getItem("avm_token");
    fetchJSON(`/properties/${item.property_id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((p: any) => setPropertyName(p?.name || p?.address || `Property #${item.property_id}`))
      .catch(() => setPropertyName(`Property #${item.property_id}`));
  }, [item?.property_id]);

  if (!item || !anchorRect) return null;

  const colors = EVENT_COLORS[item.type] ?? EVENT_COLORS.calendar_event;
  const statusStyle = getStatusStyle(item.status);
  const isAllDay = item.all_day || item.type !== "calendar_event";

  // Position popover near the clicked event
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const popoverW = 340;
  const popoverH = 280;

  let left = anchorRect.right + 8;
  let top = anchorRect.top;

  // If overflows right, place left
  if (left + popoverW > viewportW - 16) {
    left = anchorRect.left - popoverW - 8;
  }
  // If overflows left, center it
  if (left < 16) {
    left = Math.max(16, anchorRect.left + anchorRect.width / 2 - popoverW / 2);
  }
  // If overflows bottom, shift up
  if (top + popoverH > viewportH - 16) {
    top = viewportH - popoverH - 16;
  }
  if (top < 16) top = 16;

  const hasViewDetails = true;

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: "none" }}>
      <div
        ref={ref}
        className="bg-white rounded-xl shadow-xl border border-[#e5e5e5] overflow-hidden"
        style={{
          position: "absolute",
          left,
          top,
          width: popoverW,
          pointerEvents: "auto",
        }}
      >
        {/* Color header bar */}
        <div className="h-1.5" style={{ backgroundColor: colors.border }} />

        <div className="p-4">
          {/* Type badge + close */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.badge }} />
              {TYPE_LABELS[item.type] ?? item.type}
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
          <h3 className="text-base font-semibold text-[#1a1a1a] mb-2 leading-snug">
            {item.title}
          </h3>

          {/* Date/time */}
          <div className="flex items-center gap-2 text-sm text-[#717179] mb-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
              <rect x="1.5" y="2.5" width="11" height="9.5" rx="1.5" stroke="#717179" strokeWidth="1.2" />
              <path d="M1.5 5.5h11" stroke="#717179" strokeWidth="1.2" />
              <path d="M4.5 1v2M9.5 1v2" stroke="#717179" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span>{formatDateTime(item.start_at, isAllDay)}</span>
          </div>

          {/* Status + Priority */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
            >
              {item.status.replace(/_/g, " ")}
            </span>
            {item.priority && item.priority !== "medium" && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                item.priority === "urgent" || item.priority === "high"
                  ? "bg-red-50 text-red-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {item.priority}
              </span>
            )}
          </div>

          {/* Property */}
          {propertyName && (
            <div className="flex items-center gap-2 text-sm text-[#717179] mb-3">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                <path d="M2 12.5V5.5L7 2l5 3.5v7H2z" stroke="#717179" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M5.5 12.5V9h3v3.5" stroke="#717179" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              <span className="truncate">{propertyName}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#ebebeb]">
            {hasViewDetails && (
              <button
                onClick={() => { onViewDetails?.(item); onClose(); }}
                className="flex-1 h-8 text-sm font-medium rounded-lg text-white transition-colors"
                style={{ backgroundColor: "#013764" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#014578")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#013764")}
              >
                View Details
              </button>
            )}
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
