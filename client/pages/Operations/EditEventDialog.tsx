import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ComboboxField } from "@/components/forms/ComboboxField";
import { DateField } from "@/components/forms/DateField";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { updateCalendarEvent, deleteCalendarEvent } from "@/data/operations";
import { fetchJSON } from "@/api/fetchJSON";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useConflictCheck } from "@/hooks/useConflictCheck";
import ConflictWarningBanner from "@/components/ConflictWarningBanner";

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number | null;
  onEventUpdated?: () => void;
}

interface Property {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  role?: string;
}

interface CalendarEventData {
  id: number;
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  property_id?: number;
  created_by?: number;
  assignees: number[];
  color?: string;
  source: string;
  show_as: string;
  is_private: boolean;
  organizer_name?: string;
  created_at: string;
  updated_at: string;
}

// ─── DateTime picker (reused from CreateEventDialog) ──────────────────────

function generateTimeSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const value = `${hh}:${mm}`;
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      const label = `${hour12}:${mm} ${ampm}`;
      slots.push({ value, label });
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

function parseDT(iso: string): { date: Date | null; time: string } {
  if (!iso) return { date: null, time: "" };
  const [datePart, timePart] = iso.split("T");
  const date = datePart ? new Date(datePart + "T00:00:00") : null;
  return { date: date && !isNaN(date.getTime()) ? date : null, time: timePart?.slice(0, 5) || "" };
}

function buildDT(date: Date | null, time: string): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return time ? `${d}T${time}` : d;
}

function formatDisplay(iso: string): string {
  const { date, time } = parseDT(iso);
  if (!date) return "";
  const datePart = format(date, "MM/dd/yyyy");
  if (!time) return datePart;
  const [hh, mm] = time.split(":").map(Number);
  const hour12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  const ampm = hh < 12 ? "AM" : "PM";
  return `${datePart}, ${hour12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function DateTimeInput({
  label,
  required,
  value,
  onChange,
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const { date, time } = parseDT(value);
  const [calendarMonth, setCalendarMonth] = useState(date || new Date());
  const timeListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && time && timeListRef.current) {
      const el = timeListRef.current.querySelector(`[data-time="${time}"]`);
      if (el) el.scrollIntoView({ block: "center" });
    }
  }, [open, time]);

  useEffect(() => {
    if (date) setCalendarMonth(date);
  }, [date]);

  const handleDateSelect = (d: Date) => {
    const newTime = time || "09:00";
    onChange(buildDT(d, newTime));
  };

  const handleTimeSelect = (t: string) => {
    const d = date || new Date();
    onChange(buildDT(d, t));
    setOpen(false);
  };

  const days = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = getDaysInMonth(new Date(year, month, 1));
    const firstDay = getDay(startOfMonth(new Date(year, month, 1)));
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let i = 1; i <= daysInMonth; i++) result.push(i);
    return result;
  }, [calendarMonth]);

  const displayValue = formatDisplay(value);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative w-full text-left"
            style={{
              borderRadius: "0.5rem",
              backgroundColor: "white",
              padding: "0.5rem 2.5rem 0.5rem 0.75rem",
              minHeight: "44px",
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              fontSize: "14px",
              fontWeight: 400,
              letterSpacing: "-0.32px",
              lineHeight: 1.43,
              outline: "none",
              border: `1px solid ${error ? "var(--color-status-error)" : open ? "#000" : "var(--color-border-light)"}`,
              color: displayValue ? "var(--color-text-primary)" : "var(--color-text-placeholder)",
              cursor: "pointer",
            }}
          >
            {displayValue || "Select date & time"}
            <CalendarIcon
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "1rem",
                height: "1rem",
                color: "#303030",
                pointerEvents: "none",
              }}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="p-0 z-[52]"
          scrollable={false}
          syncTriggerWidth={false}
          style={{
            width: "auto",
            display: "flex",
            overflow: "hidden",
            maxHeight: "none",
          }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Calendar side */}
          <div style={{ padding: "12px", width: "240px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "4px", display: "flex" }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span style={{ fontSize: "13px", fontWeight: 500, fontFamily: "Geist, sans-serif" }}>
                {format(calendarMonth, "MMMM yyyy")}
              </span>
              <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "4px", display: "flex" }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 500, color: "#717179", padding: "4px 0" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
              {days.map((day, idx) => {
                const isSelected = date && day !== null &&
                  date.getDate() === day &&
                  date.getMonth() === calendarMonth.getMonth() &&
                  date.getFullYear() === calendarMonth.getFullYear();
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={day === null}
                    onClick={() => {
                      if (day !== null) {
                        handleDateSelect(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
                      }
                    }}
                    style={{
                      aspectRatio: "1",
                      border: "none",
                      borderRadius: "4px",
                      background: isSelected ? "rgba(36, 99, 235, 0.2)" : "transparent",
                      color: isSelected ? "#2463eb" : day === null ? "transparent" : "var(--color-text-primary)",
                      fontWeight: isSelected ? 500 : 400,
                      fontSize: "13px",
                      cursor: day === null ? "default" : "pointer",
                      fontFamily: "Geist, sans-serif",
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: "1px", backgroundColor: "var(--color-border-light)" }} />

          {/* Time slots side */}
          <div ref={timeListRef} style={{ width: "100px", maxHeight: "300px", overflowY: "auto", padding: "4px 0" }}>
            {TIME_SLOTS.map((slot) => {
              const isSelected = time === slot.value;
              return (
                <button
                  key={slot.value}
                  type="button"
                  data-time={slot.value}
                  onClick={() => handleTimeSelect(slot.value)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "6px 12px",
                    border: "none",
                    background: isSelected ? "rgba(36, 99, 235, 0.15)" : "transparent",
                    color: isSelected ? "#2463eb" : "var(--color-text-primary)",
                    fontWeight: isSelected ? 500 : 400,
                    fontSize: "13px",
                    fontFamily: "Geist, sans-serif",
                    textAlign: "left",
                    cursor: "pointer",
                    borderRadius: 0,
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ─── Multi-select dropdown ────────────────────────────────────────────────

function MultiSelectDropdown({
  label,
  placeholder,
  users,
  selected,
  onToggle,
}: {
  label: string;
  placeholder: string;
  users: User[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [dropdownOpen]);

  const names = selected
    .map((id) => users.find((u) => u.id === id)?.name)
    .filter(Boolean);

  return (
    <div ref={ref}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none"
      >
        <span className={cn(names.length === 0 && "text-[var(--color-text-placeholder)]")}>
          {names.length > 0 ? names.join(", ") : placeholder}
        </span>
        <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdownOpen && (
        <div className="mt-1 rounded-md border border-input bg-white shadow-md max-h-48 overflow-y-auto z-50">
          {users.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">No users available</p>
          ) : (
            users.map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
              >
                <Checkbox
                  checked={selected.includes(user.id)}
                  onCheckedChange={() => onToggle(user.id)}
                />
                {user.name}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helper to convert ISO datetime to local "YYYY-MM-DDTHH:MM" ──────────

function isoToLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isoToDateOnly(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ─── Main Dialog ──────────────────────────────────────────────────────────

export default function EditEventDialog({ open, onOpenChange, eventId, onEventUpdated }: EditEventDialogProps) {
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState<CalendarEventData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [assignees, setAssignees] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch event data + properties + users when dialog opens
  useEffect(() => {
    if (!open || !eventId) return;
    setLoading(true);
    Promise.all([
      fetchJSON(`/operations/events/${eventId}`),
      fetchJSON("/properties").catch(() => []),
      fetchJSON("/users/all").catch(() => []),
    ]).then(([ev, props, usrs]) => {
      const event = ev as CalendarEventData;
      setEventData(event);
      setProperties(Array.isArray(props) ? props : []);
      setUsers(Array.isArray(usrs) ? usrs : []);

      // Populate form
      setTitle(event.title);
      setDescription(event.description || "");
      setAllDay(event.all_day);
      if (event.all_day) {
        // For all-day events, use UTC date to avoid timezone shift
        const s = new Date(event.start_at);
        const e = new Date(event.end_at);
        const pad = (n: number) => String(n).padStart(2, "0");
        setStartAt(`${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`);
        setEndAt(`${e.getUTCFullYear()}-${pad(e.getUTCMonth() + 1)}-${pad(e.getUTCDate())}`);
      } else {
        setStartAt(isoToLocal(event.start_at));
        setEndAt(isoToLocal(event.end_at));
      }
      setPropertyId(event.property_id ? String(event.property_id) : "");
      setAssignees(event.assignees || []);
      setErrors({});
    }).catch(() => {
      toast.error("Failed to load event");
      onOpenChange(false);
    }).finally(() => setLoading(false));
  }, [open, eventId]);

  function handleStartChange(newStart: string) {
    setStartAt(newStart);
    if (newStart && !allDay) {
      const startDate = new Date(newStart);
      if (!isNaN(startDate.getTime())) {
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        const pad = (n: number) => String(n).padStart(2, "0");
        setEndAt(`${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`);
      }
    } else if (newStart && allDay) {
      setEndAt(newStart);
    }
  }

  function toggleAssignee(id: number) {
    setAssignees((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const conflictStartISO = startAt
    ? allDay ? `${startAt}T00:00:00Z` : new Date(startAt).toISOString()
    : undefined;
  const conflictEndISO = endAt
    ? allDay ? `${endAt}T23:59:59Z` : new Date(endAt).toISOString()
    : undefined;
  const { conflicts } = useConflictCheck(assignees, conflictStartISO, conflictEndISO, eventId ?? undefined);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!startAt) errs.startAt = "Start date is required";
    if (!endAt) errs.endAt = "End date is required";
    if (startAt && endAt && new Date(startAt) >= new Date(endAt)) errs.endAt = "End must be after start";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId || !validate()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        start_at: allDay ? `${startAt}T00:00:00Z` : new Date(startAt).toISOString(),
        end_at: allDay ? `${endAt}T23:59:59Z` : new Date(endAt).toISOString(),
        all_day: allDay,
        property_id: propertyId ? Number(propertyId) : undefined,
        assignees: assignees,
      };
      await updateCalendarEvent(eventId, payload);
      toast.success("Event updated");
      onEventUpdated?.();
      onOpenChange(false);
    } catch {
      toast.error("Failed to update event");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!eventId) return;
    if (!confirm("Are you sure you want to delete this event?")) return;
    setDeleting(true);
    try {
      await deleteCalendarEvent(eventId);
      toast.success("Event deleted");
      onEventUpdated?.();
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete event");
    } finally {
      setDeleting(false);
    }
  }

  const isOutlookEvent = eventData?.source === "outlook";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-lg w-full max-w-lg p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-semibold">
            {loading ? "Loading..." : "Edit Event"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {isOutlookEvent ? "This event was synced from Outlook." : "Update the event details below."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading event...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Source badge */}
              {eventData && (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                    isOutlookEvent ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {isOutlookEvent ? "From Outlook" : "Manual"}
                  </span>
                  {eventData.organizer_name && (
                    <span className="text-xs text-gray-400">
                      by {eventData.organizer_name}
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" aria-invalid={!!errors.title} />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-all-day"
                  checked={allDay}
                  onCheckedChange={(checked) => {
                    const isAllDay = checked === true;
                    setAllDay(isAllDay);
                    if (isAllDay) {
                      setStartAt(startAt.split("T")[0] || isoToDateOnly(startAt));
                      setEndAt(endAt.split("T")[0] || isoToDateOnly(endAt));
                    } else {
                      const pad = (n: number) => String(n).padStart(2, "0");
                      const now = new Date();
                      const defaultTime = `${pad(now.getHours())}:${now.getMinutes() < 30 ? "30" : "00"}`;
                      const s = startAt.includes("T") ? startAt : `${startAt}T${defaultTime}`;
                      setStartAt(s);
                      const sDate = new Date(s);
                      const eDate = new Date(sDate.getTime() + 60 * 60 * 1000);
                      setEndAt(`${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())}T${pad(eDate.getHours())}:${pad(eDate.getMinutes())}`);
                    }
                  }}
                />
                <label htmlFor="edit-all-day" className="text-sm font-medium text-gray-700 cursor-pointer">All day</label>
              </div>

              {allDay ? (
                <div className="grid grid-cols-2 gap-4">
                  <DateField
                    label="Start"
                    required
                    value={startAt || null}
                    onChange={(date) => {
                      const val = date instanceof Date ? date.toISOString().split("T")[0] : (date || "");
                      handleStartChange(val);
                    }}
                    returnFormat="ISO"
                    error={errors.startAt}
                  />
                  <DateField
                    label="End"
                    required
                    value={endAt || null}
                    onChange={(date) => {
                      const val = date instanceof Date ? date.toISOString().split("T")[0] : (date || "");
                      setEndAt(val);
                    }}
                    returnFormat="ISO"
                    error={errors.endAt}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <DateTimeInput
                    label="Start"
                    required
                    value={startAt}
                    onChange={handleStartChange}
                    error={errors.startAt}
                  />
                  <DateTimeInput
                    label="End"
                    required
                    value={endAt}
                    onChange={setEndAt}
                    error={errors.endAt}
                  />
                </div>
              )}

              <ComboboxField
                label="Property"
                value={propertyId}
                onChange={setPropertyId}
                placeholder="Select a property (optional)"
                searchPlaceholder="Search properties..."
                options={properties.map((p) => ({ value: String(p.id), label: p.name }))}
                emptyMessage="No properties found"
              />

              <MultiSelectDropdown
                label="Assignees"
                placeholder="Select assignees (optional)"
                users={users}
                selected={assignees}
                onToggle={toggleAssignee}
              />

              <ConflictWarningBanner conflicts={conflicts} />
            </div>

            <DialogFooter className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#013764] rounded-md hover:bg-[#014578] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
