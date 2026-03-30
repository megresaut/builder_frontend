import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, DatesSetArg, EventClickArg, EventContentArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import { fetchCalendarFeed, type CalendarItem, type CalendarFilters as CalendarFiltersType } from "@/data/operations";
import { fetchJSON } from "@/api/fetchJSON";
import { toast } from "sonner";
import CalendarSidebar from "./CalendarFilters";
import AdvancedFiltersModal from "./AdvancedFiltersModal";
import CreateEventDialog from "./CreateEventDialog";
import EventDetailPopover from "./EventDetailPopover";
import EditEventDialog from "./EditEventDialog";
import CreateFTOModal from "@/components/CreateFTOModal";
import CreateRecurringTaskModal from "@/components/CreateRecurringTaskModal";

const EVENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  task:              { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF" },
  work_order:        { bg: "#FFEDD5", border: "#F97316", text: "#9A3412" },
  field_team_order:  { bg: "#DCFCE7", border: "#22C55E", text: "#166534" },
  inspection:        { bg: "#F3E8FF", border: "#A855F7", text: "#6B21A8" },
  recurring_task:    { bg: "#CCFBF1", border: "#14B8A6", text: "#115E59" },
  calendar_event:    { bg: "#F3F4F6", border: "#6B7280", text: "#374151" },
};

const TYPE_LABELS: Record<string, string> = {
  task: "Task",
  work_order: "WO",
  field_team_order: "FTO",
  inspection: "Insp",
  recurring_task: "Rec",
  calendar_event: "Event",
};

function mapItemsToEvents(items: CalendarItem[]): EventInput[] {
  return items.map((item) => {
    const colors = EVENT_COLORS[item.type] ?? EVENT_COLORS.calendar_event;
    const isAllDay = item.all_day || item.type !== "calendar_event";

    // For all-day events, extract the UTC date (YYYY-MM-DD) to avoid
    // timezone shifts. The backend stores all-day events at UTC midnight,
    // so "2026-03-15T20:00:00-04:00" is actually "2026-03-16" in UTC.
    let start: string = item.start_at;
    let end: string = item.end_at;
    if (isAllDay) {
      const s = new Date(item.start_at);
      const e = new Date(item.end_at);
      start = `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, "0")}-${String(s.getUTCDate()).padStart(2, "0")}`;
      end = `${e.getUTCFullYear()}-${String(e.getUTCMonth() + 1).padStart(2, "0")}-${String(e.getUTCDate()).padStart(2, "0")}`;
    }

    return {
      id: `${item.type}-${item.id}`,
      title: item.title,
      start,
      end,
      allDay: isAllDay,
      backgroundColor: colors.bg,
      borderColor: "transparent",
      textColor: colors.text,
      extendedProps: { ...item },
    };
  });
}

function renderEventContent(arg: EventContentArg) {
  const item = arg.event.extendedProps as CalendarItem;
  const colors = EVENT_COLORS[item.type] ?? EVENT_COLORS.calendar_event;
  const isTimeGrid = arg.view.type.startsWith("timeGrid");
  const label = TYPE_LABELS[item.type] ?? "";

  if (isTimeGrid && !arg.event.allDay) {
    return (
      <div className="flex flex-col gap-0.5 px-2 py-1.5 overflow-hidden w-full h-full rounded" style={{ borderLeft: `3px solid ${colors.border}` }}>
        <span className="text-[11px] font-semibold truncate leading-tight" style={{ color: colors.text }}>
          {arg.event.title}
        </span>
        {arg.timeText && (
          <span className="text-[10px] opacity-60 leading-tight" style={{ color: colors.text }}>
            {arg.timeText}
          </span>
        )}
      </div>
    );
  }

  // Month view & all-day bar
  const timeStr = arg.timeText;
  return (
    <div className="flex items-center gap-1 px-1.5 overflow-hidden w-full min-w-0 rounded" style={{ borderLeft: `2px solid ${colors.border}`, lineHeight: "20px", padding: "2px 6px" }}>
      {timeStr && (
        <span className="text-[11px] font-medium flex-shrink-0 opacity-70" style={{ color: colors.text }}>
          {timeStr}
        </span>
      )}
      <span className="text-[11px] font-medium truncate" style={{ color: colors.text }}>
        {arg.event.title}
      </span>
      {label && (
        <span className="text-[9px] font-medium opacity-40 flex-shrink-0 uppercase tracking-wide" style={{ color: colors.text }}>
          {label}
        </span>
      )}
    </div>
  );
}

export default function OperationsCalendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<CalendarFiltersType>({});
  // Tracks manager IDs that have been toggled OFF. Empty = all managers shown.
  const [deselectedManagerIds, setDeselectedManagerIds] = useState<Set<number>>(new Set());
  const [properties, setProperties] = useState<{ id: number; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: number; name: string }[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<number>>(new Set());
  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<number>>(new Set());
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  // Fetch properties & vendors for advanced filters
  useEffect(() => {
    Promise.all([
      fetchJSON("/properties").catch(() => []),
      fetchJSON("/vendors").catch(() => []),
    ]).then(([props, vends]) => {
      const p = Array.isArray(props) ? props : [];
      const v = Array.isArray(vends) ? vends : [];
      setProperties(p);
      setVendors(v);
      // Start with all selected (= no filtering)
      setSelectedPropertyIds(new Set(p.map((x: any) => x.id)));
      setSelectedVendorIds(new Set(v.map((x: any) => x.id)));
    });
  }, []);

  // Disable parent scroll container so only the calendar's internal scrolling works
  useLayoutEffect(() => {
    const scrollParent = document.querySelector('[data-testid="main-content"]') as HTMLElement | null;
    if (!scrollParent) return;
    const prevOverflow = scrollParent.style.overflow;
    const prevPadding = scrollParent.style.paddingBottom;
    scrollParent.style.overflow = "hidden";
    scrollParent.style.paddingBottom = "0px";
    return () => {
      scrollParent.style.overflow = prevOverflow;
      scrollParent.style.paddingBottom = prevPadding;
    };
  }, []);

  // Event detail popover state
  const [popoverItem, setPopoverItem] = useState<CalendarItem | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);

  // FTO edit modal state
  const [ftoModalOpen, setFtoModalOpen] = useState(false);
  const [editingFTO, setEditingFTO] = useState<any>(null);

  // Recurring task edit modal state
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<any>(null);

  // Calendar event edit modal state
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);

  const dateRangeRef = useRef<{ start: string; end: string } | null>(null);

  // Keep FullCalendar sized correctly on resize / sidebar toggle
  useLayoutEffect(() => {
    function updateCalSize() {
      calendarRef.current?.getApi()?.updateSize();
    }
    updateCalSize();
    window.addEventListener("resize", updateCalSize);

    let observer: ResizeObserver | null = null;
    if (containerRef.current) {
      observer = new ResizeObserver(() => updateCalSize());
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateCalSize);
      observer?.disconnect();
    };
  }, []);

  const loadEvents = useCallback(
    async (start: string, end: string, currentFilters: CalendarFiltersType) => {
      setLoading(true);
      try {
        const items = await fetchCalendarFeed(start, end, currentFilters);
        setEvents(mapItemsToEvents(Array.isArray(items) ? items : []));
      } catch (err) {
        console.error("Failed to load calendar events:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const start = arg.start.toISOString();
      const end = arg.end.toISOString();
      dateRangeRef.current = { start, end };
      loadEvents(start, end, filters);
    },
    [filters, loadEvents]
  );

  useEffect(() => {
    if (dateRangeRef.current) {
      const { start, end } = dateRangeRef.current;
      loadEvents(start, end, filters);
    }
  }, [filters, loadEvents]);

  // Click event -> show popover
  const handleEventClick = useCallback((arg: EventClickArg) => {
    arg.jsEvent.preventDefault();
    const item = arg.event.extendedProps as CalendarItem;
    const el = arg.el;
    const rect = el.getBoundingClientRect();
    setPopoverItem(item);
    setPopoverAnchor(rect);
  }, []);

  const handleDateClick = useCallback((arg: DateClickArg) => {
    setPopoverItem(null);
    setSelectedDate(arg.dateStr);
    setCreateDialogOpen(true);
  }, []);

  const handleEventCreated = useCallback(() => {
    if (dateRangeRef.current) {
      const { start, end } = dateRangeRef.current;
      loadEvents(start, end, filters);
    }
  }, [filters, loadEvents]);

  const handleFilterChange = useCallback((newFilters: CalendarFiltersType) => {
    setFilters(newFilters);
  }, []);

  const handleManagerToggle = useCallback((id: number) => {
    setDeselectedManagerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Filter events by deselected managers (client-side)
  // Are advanced filters active? (not all selected)
  const hasActiveAdvancedFilters = (
    (properties.length > 0 && selectedPropertyIds.size < properties.length) ||
    (vendors.length > 0 && selectedVendorIds.size < vendors.length)
  );

  // Client-side filtering by managers + properties + vendors
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const props = ev.extendedProps as any;

      // Manager filter
      if (deselectedManagerIds.size > 0) {
        const assignees: number[] = props?.assignees ?? [];
        if (assignees.length > 0 && !assignees.some((aid: number) => !deselectedManagerIds.has(aid))) {
          return false;
        }
      }

      // Property filter
      if (properties.length > 0 && selectedPropertyIds.size < properties.length) {
        const pid = props?.property_id;
        if (pid && !selectedPropertyIds.has(pid)) return false;
      }

      // Vendor filter
      if (vendors.length > 0 && selectedVendorIds.size < vendors.length) {
        const vid = props?.vendor_id;
        if (vid && !selectedVendorIds.has(vid)) return false;
      }

      return true;
    });
  }, [events, deselectedManagerIds, selectedPropertyIds, selectedVendorIds, properties.length, vendors.length]);

  // Compute event dates for mini calendar dots
  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    for (const ev of events) {
      if (ev.start) {
        const d = typeof ev.start === "string" ? ev.start : (ev.start as Date).toISOString();
        dates.add(d.slice(0, 10));
      }
    }
    return dates;
  }, [events]);

  // Mini calendar date click -> navigate main calendar to that date
  const handleSidebarDateClick = useCallback((dateStr: string) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.gotoDate(dateStr);
    }
  }, []);

  const handleViewDetails = useCallback(async (item: CalendarItem) => {
    switch (item.type) {
      case "calendar_event":
        setEditingEventId(item.id);
        setEditEventDialogOpen(true);
        break;
      case "task":
        navigate(`/tasks/${item.id}`);
        break;
      case "work_order":
        navigate(`/work-orders`);
        break;
      case "inspection":
        navigate(`/property/${item.property_id}/Inspections?inspectionId=${item.id}`);
        break;
      case "field_team_order":
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
          toast.error("Failed to load field team order");
        }
        break;
      case "recurring_task":
        try {
          const series = await fetchJSON(`/maintenance/recurring/${item.id}`);
          setEditingRecurring({
            id: series.id,
            task: item.title,
            series,
          });
          setRecurringModalOpen(true);
        } catch {
          toast.error("Failed to load recurring task");
        }
        break;
    }
  }, [navigate]);

  return (
    <div className="flex bg-white h-full overflow-hidden">
      {/* Left Sidebar */}
      <CalendarSidebar
        filters={filters}
        onChange={handleFilterChange}
        onDateClick={handleSidebarDateClick}
        eventDates={eventDates}
        onNewEvent={() => {
          setSelectedDate(new Date().toISOString().split("T")[0]);
          setCreateDialogOpen(true);
        }}
        deselectedManagerIds={deselectedManagerIds}
        onManagerToggle={handleManagerToggle}
        onOpenAdvancedFilters={() => setAdvancedFiltersOpen(true)}
        hasActiveAdvancedFilters={hasActiveAdvancedFilters}
      />

      {/* Calendar area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden min-w-0">
        {loading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 text-sm text-[#717179]">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading...
            </div>
          </div>
        )}

        <div className="h-full operations-calendar">
          <style>{`
            .operations-calendar .fc {
              height: 100%;
              font-family: inherit;
            }

            /* Toolbar */
            .operations-calendar .fc .fc-toolbar {
              padding: 8px 20px;
              margin-bottom: 0;
            }
            .operations-calendar .fc .fc-toolbar-title {
              font-size: 1rem;
              font-weight: 500;
              color: #1a1a1a;
            }

            /* Buttons */
            .operations-calendar .fc .fc-button {
              font-size: 0.75rem;
              padding: 4px 12px;
              border-radius: 6px;
              font-weight: 500;
              text-transform: capitalize;
              transition: all 0.15s;
            }
            .operations-calendar .fc .fc-button-primary {
              background-color: white;
              border: 1px solid #dadada;
              color: #303030;
            }
            .operations-calendar .fc .fc-button-primary:hover {
              background-color: #f5f5f5;
              border-color: #c0c0c0;
              color: #1a1a1a;
            }
            .operations-calendar .fc .fc-button-primary:not(:disabled).fc-button-active {
              background-color: #013764;
              border-color: #013764;
              color: white;
            }
            .operations-calendar .fc .fc-button-primary:not(:disabled).fc-button-active:hover {
              background-color: #014578;
              border-color: #014578;
            }
            .operations-calendar .fc .fc-button-primary:focus {
              box-shadow: 0 0 0 2px rgba(1, 55, 100, 0.15);
            }
            .operations-calendar .fc .fc-button-primary:disabled {
              background-color: #f5f5f5;
              border-color: #e5e5e5;
              color: #a1a1a9;
            }
            .operations-calendar .fc .fc-prev-button,
            .operations-calendar .fc .fc-next-button {
              padding: 6px 8px;
            }
            .operations-calendar .fc .fc-today-button {
              background-color: white !important;
              border: 1px solid #dadada !important;
              color: #303030 !important;
              font-weight: 500 !important;
            }
            .operations-calendar .fc .fc-today-button:hover {
              background-color: #f5f5f5 !important;
            }
            .operations-calendar .fc .fc-today-button:disabled {
              opacity: 0.4;
            }
            .operations-calendar .fc .fc-button-group > .fc-button {
              border-radius: 0;
            }
            .operations-calendar .fc .fc-button-group > .fc-button:first-child {
              border-radius: 8px 0 0 8px;
            }
            .operations-calendar .fc .fc-button-group > .fc-button:last-child {
              border-radius: 0 8px 8px 0;
            }

            /* Grid */
            .operations-calendar .fc .fc-scrollgrid {
              border-color: #e5e5e5;
              border-width: 0;
              border-top-width: 1px;
            }
            .operations-calendar .fc td,
            .operations-calendar .fc th {
              border-color: #e8e8e8;
            }
            .operations-calendar .fc .fc-col-header-cell {
              background-color: #fafafa;
              padding: 6px 8px;
              text-align: left;
            }
            .operations-calendar .fc .fc-col-header-cell-cushion {
              font-size: 0.6875rem;
              font-weight: 600;
              color: #717179;
              text-decoration: none;
              text-transform: capitalize;
            }

            /* Day cells — top-left number like Outlook */
            .operations-calendar .fc .fc-daygrid-day-top {
              flex-direction: row;
              justify-content: flex-start;
            }
            .operations-calendar .fc .fc-daygrid-day-number {
              font-size: 0.75rem;
              color: #555;
              padding: 4px 6px 4px;
              text-decoration: none;
              font-weight: 400;
            }
            .operations-calendar .fc .fc-day-other .fc-daygrid-day-number {
              color: #999;
            }
            .operations-calendar .fc .fc-day-other {
              background-color: #fafafa;
            }
            .operations-calendar .fc .fc-day-today {
              background-color: #f0f7ff !important;
            }
            .operations-calendar .fc .fc-day-today .fc-daygrid-day-number {
              background-color: #013764;
              color: white;
              border-radius: 50%;
              min-width: 24px;
              height: 24px;
              padding: 0 5px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: 0.75rem;
            }

            /* Events */
            .operations-calendar .fc .fc-daygrid-event {
              border-radius: 3px;
              border: none;
              margin: 0px 2px 2px;
              cursor: pointer;
            }
            .operations-calendar .fc .fc-daygrid-event:hover {
              opacity: 0.85;
            }

            /* Compact day cell content */
            .operations-calendar .fc .fc-daygrid-day-events {
              margin-top: 2px;
              padding-bottom: 4px;
            }
            .operations-calendar .fc .fc-daygrid-day-frame {
              min-height: 80px !important;
            }
            .operations-calendar .fc .fc-daygrid-day-bottom {
              margin-top: 0;
            }
            .operations-calendar .fc .fc-timegrid-event {
              border-radius: 6px;
              border: none !important;
              cursor: pointer;
              box-shadow: 0 1px 2px rgba(0,0,0,0.06);
            }
            .operations-calendar .fc .fc-timegrid-event:hover {
              opacity: 0.85;
              box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            }
            .operations-calendar .fc .fc-event {
              border: none;
            }
            .operations-calendar .fc .fc-daygrid-event-dot {
              display: none;
            }
            .operations-calendar .fc .fc-daygrid-dot-event {
              padding: 0;
            }

            /* More events link */
            .operations-calendar .fc .fc-daygrid-more-link {
              font-size: 0.625rem;
              font-weight: 600;
              color: #013764;
              padding: 1px 4px;
            }

            /* All-day section in week/day view */
            .operations-calendar .fc .fc-timegrid-axis-cushion {
              font-size: 0.6875rem;
              font-weight: 600;
              text-transform: uppercase;
              color: #a1a1a9;
              white-space: nowrap;
              padding: 4px 8px;
            }
            .operations-calendar .fc .fc-timegrid-divider {
              display: none;
            }
            .operations-calendar .fc .fc-daygrid-body {
              border-bottom: 1px solid #ebebeb;
            }

            /* Hide duplicate day numbers in the time grid columns (keep only the all-day header ones) */
            .operations-calendar .fc-timegrid-col-misc {
              display: none !important;
            }

            /* Time grid slots */
            .operations-calendar .fc .fc-timegrid-slot {
              height: 48px;
            }
            .operations-calendar .fc .fc-timegrid-slot-label-cushion {
              font-size: 0.6875rem;
              color: #a1a1a9;
              text-transform: uppercase;
            }
            .operations-calendar .fc .fc-timegrid-now-indicator-line {
              border-color: #EF4444;
              border-width: 2px;
            }
            .operations-calendar .fc .fc-timegrid-now-indicator-arrow {
              border-color: #EF4444;
            }

            /* Remove outer borders */
            .operations-calendar .fc .fc-scrollgrid > table {
              border: none;
            }
            .operations-calendar .fc .fc-scrollgrid-section > td {
              border: none;
            }

            /* Hover on day cells */
            .operations-calendar .fc .fc-daygrid-day:hover {
              background-color: #f8f9fb;
            }
            .operations-calendar .fc .fc-day-today:hover {
              background-color: #e8f1fd !important;
            }

            /* Week/day header - highlight today */
            .operations-calendar .fc .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion {
              color: #013764;
              font-weight: 700;
            }

            /* Day cell vertical alignment */
            .operations-calendar .fc .fc-daygrid-day-frame {
              display: flex;
              flex-direction: column;
            }
            .operations-calendar .fc .fc-daygrid-day-events {
              flex: 1;
            }
          `}</style>

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
            }}
            views={{
              timeGridWeek: {
                titleFormat: { year: "numeric", month: "long", day: "numeric" },
              },
            }}
            allDayText="All Day"
            events={filteredEvents}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            eventContent={renderEventContent}
            height="100%"
            nowIndicator
            dayMaxEvents={4}
            fixedWeekCount={false}
            showNonCurrentDates={true}
            eventDisplay="block"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            firstDay={0}
            stickyHeaderDates
            dayHeaderFormat={{ weekday: "long" }}
            eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
            dayCellContent={(arg) => {
              const day = arg.date.getDate();
              const month = arg.date.toLocaleString("en-US", { month: "short" });
              return { html: day === 1 ? `${month} ${day}` : `${day}` };
            }}
          />
        </div>
      </div>

      {/* Event detail popover */}
      <EventDetailPopover
        item={popoverItem}
        anchorRect={popoverAnchor}
        onClose={() => { setPopoverItem(null); setPopoverAnchor(null); }}
        onViewDetails={handleViewDetails}
      />

      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultDate={selectedDate ?? undefined}
        onEventCreated={handleEventCreated}
      />

      {/* Calendar Event Edit Modal */}
      <EditEventDialog
        open={editEventDialogOpen}
        onOpenChange={(open) => {
          setEditEventDialogOpen(open);
          if (!open) setEditingEventId(null);
        }}
        eventId={editingEventId}
        onEventUpdated={handleEventCreated}
      />

      {/* FTO Edit Modal */}
      <CreateFTOModal
        open={ftoModalOpen}
        onOpenChange={(open) => {
          setFtoModalOpen(open);
          if (!open) {
            setEditingFTO(null);
            handleEventCreated();
          }
        }}
        editingFTO={editingFTO}
      />

      {/* Recurring Task Edit Modal */}
      <CreateRecurringTaskModal
        open={recurringModalOpen}
        onOpenChange={(open) => {
          setRecurringModalOpen(open);
          if (!open) {
            setEditingRecurring(null);
            handleEventCreated();
          }
        }}
        editData={editingRecurring ?? undefined}
      />

      <AdvancedFiltersModal
        open={advancedFiltersOpen}
        onClose={() => setAdvancedFiltersOpen(false)}
        properties={properties}
        vendors={vendors}
        selectedPropertyIds={selectedPropertyIds}
        selectedVendorIds={selectedVendorIds}
        onApply={(pIds, vIds) => {
          setSelectedPropertyIds(pIds);
          setSelectedVendorIds(vIds);
        }}
      />
    </div>
  );
}
