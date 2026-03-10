import { useEffect, useState, useRef, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCalendarEvent } from "@/data/operations";
import { fetchJSON } from "@/api/fetchJSON";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useConflictCheck } from "@/hooks/useConflictCheck";
import ConflictWarningBanner from "@/components/ConflictWarningBanner";
import { useAuth } from "@/auth/useAuth";
import { listChecklists, createChecklist, createInspection } from "@/api/inspections";
import type { BackendInspectionChecklist } from "@/api/inspections";
import { DEFAULT_INSPECTION_TEMPLATES } from "@/data/inspections";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  onEventCreated?: () => void;
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

interface SimpleTask {
  id: number;
  name: string;
}

interface Vendor {
  id: number;
  name: string;
}

type EventType = "calendar_event" | "task" | "fto" | "work_order" | "inspection";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "calendar_event", label: "Calendar Event" },
  { value: "task", label: "Task" },
  { value: "fto", label: "FTO" },
  { value: "work_order", label: "Work Order" },
  { value: "inspection", label: "Inspection" },
];

function formatDateTimeLocal(dateStr?: string, offsetHours = 0): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  if (offsetHours) {
    date.setHours(date.getHours() + offsetHours);
  }
  const minutes = date.getMinutes();
  date.setMinutes(minutes < 30 ? 30 : 60);
  date.setSeconds(0, 0);

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateOnly(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// ─── Shared multi-select dropdown ────────────────────────────────────────────

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

// ─── Footer buttons ──────────────────────────────────────────────────────────

function FormFooter({
  onCancel,
  submitting,
  label = "Create",
}: {
  onCancel: () => void;
  submitting: boolean;
  label?: string;
}) {
  return (
    <DialogFooter className="px-6 py-4 border-t border-gray-200">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 text-sm font-medium text-white bg-[#013764] rounded-md hover:bg-[#014578] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Creating..." : label}
      </button>
    </DialogFooter>
  );
}

// ─── Calendar Event Form ─────────────────────────────────────────────────────

function CalendarEventForm({
  properties,
  users,
  defaultDate,
  onClose,
  onCreated,
}: {
  properties: Property[];
  users: User[];
  defaultDate?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startAt, setStartAt] = useState(() => formatDateTimeLocal(defaultDate));
  const [endAt, setEndAt] = useState(() => formatDateTimeLocal(defaultDate, 1));
  const [propertyId, setPropertyId] = useState<string>("");
  const [assignees, setAssignees] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const conflictStartISO = startAt
    ? allDay ? `${startAt}T00:00:00Z` : new Date(startAt).toISOString()
    : undefined;
  const conflictEndISO = endAt
    ? allDay ? `${endAt}T23:59:59Z` : new Date(endAt).toISOString()
    : undefined;
  const { conflicts } = useConflictCheck(assignees, conflictStartISO, conflictEndISO);

  function toggleAssignee(id: number) {
    setAssignees((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

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
    if (!validate()) return;
    setSubmitting(true);
    try {
      const userId = localStorage.getItem("avm_user_id");
      await createCalendarEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        start_at: allDay ? `${startAt}T00:00:00Z` : new Date(startAt).toISOString(),
        end_at: allDay ? `${endAt}T23:59:59Z` : new Date(endAt).toISOString(),
        all_day: allDay,
        property_id: propertyId ? Number(propertyId) : undefined,
        created_by: Number(userId),
        assignees: assignees.length > 0 ? assignees : undefined,
      });
      toast.success("Event created");
      onCreated();
      onClose();
    } catch {
      toast.error("Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
            id="all-day"
            checked={allDay}
            onCheckedChange={(checked) => {
              const isAllDay = checked === true;
              setAllDay(isAllDay);
              if (isAllDay) { setStartAt(formatDateOnly(startAt)); setEndAt(formatDateOnly(endAt)); }
              else { setStartAt(formatDateTimeLocal(startAt)); setEndAt(formatDateTimeLocal(startAt, 1)); }
            }}
          />
          <label htmlFor="all-day" className="text-sm font-medium text-gray-700 cursor-pointer">All day</label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start <span className="text-red-500">*</span></label>
            <Input type={allDay ? "date" : "datetime-local"} value={startAt} onChange={(e) => setStartAt(e.target.value)} aria-invalid={!!errors.startAt} />
            {errors.startAt && <p className="text-red-500 text-xs mt-1">{errors.startAt}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End <span className="text-red-500">*</span></label>
            <Input type={allDay ? "date" : "datetime-local"} value={endAt} onChange={(e) => setEndAt(e.target.value)} aria-invalid={!!errors.endAt} />
            {errors.endAt && <p className="text-red-500 text-xs mt-1">{errors.endAt}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger><SelectValue placeholder="Select a property (optional)" /></SelectTrigger>
            <SelectContent>
              {properties.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <MultiSelectDropdown
          label="Assignees"
          placeholder="Select assignees (optional)"
          users={users}
          selected={assignees}
          onToggle={toggleAssignee}
        />

        <ConflictWarningBanner conflicts={conflicts} />
      </div>
      <FormFooter onCancel={onClose} submitting={submitting} />
    </form>
  );
}

// ─── Task Form ───────────────────────────────────────────────────────────────

function TaskForm({
  properties,
  users,
  defaultDate,
  onClose,
  onCreated,
}: {
  properties: Property[];
  users: User[];
  defaultDate?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { userId } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState(defaultDate ? formatDateOnly(defaultDate) : "");
  const [assignees, setAssignees] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const conflictStart = dueDate ? `${dueDate}T00:00:00Z` : undefined;
  const conflictEnd = dueDate ? `${dueDate}T23:59:59Z` : undefined;
  const { conflicts } = useConflictCheck(assignees, conflictStart, conflictEnd);

  function toggleAssignee(id: number) {
    setAssignees((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Task name is required";
    if (!selectedPropertyId) errs.property = "Property is required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const priorityMap: Record<string, string> = { low: "low", normal: "medium", high: "high", urgent: "urgent" };
      const payload: any = {
        property_id: Number(selectedPropertyId),
        name: title.trim(),
        priority: priorityMap[priority] || "medium",
        tags: [],
      };
      if (userId) payload.requested_by = userId;
      if (description.trim()) payload.description = description.trim();
      if (dueDate) payload.due_date = new Date(dueDate).toISOString();
      if (assignees.length > 0) payload.assignees = assignees;

      await fetchJSON("/maintenance/tasks", { method: "POST", body: JSON.stringify(payload) });
      toast.success("Task created");
      window.dispatchEvent(new CustomEvent("refreshAllTasks"));
      onCreated();
      onClose();
    } catch {
      toast.error("Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task Name <span className="text-red-500">*</span></label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task name" aria-invalid={!!errors.title} />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property <span className="text-red-500">*</span></label>
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className={errors.property ? "border-red-500" : ""}><SelectValue placeholder="Select a property" /></SelectTrigger>
            <SelectContent>
              {properties.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.property && <p className="text-red-500 text-xs mt-1">{errors.property}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <MultiSelectDropdown
          label="Assignees"
          placeholder="Select assignees (optional)"
          users={users}
          selected={assignees}
          onToggle={toggleAssignee}
        />

        <ConflictWarningBanner conflicts={conflicts} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
        </div>
      </div>
      <FormFooter onCancel={onClose} submitting={submitting} label="Create Task" />
    </form>
  );
}

// ─── FTO Form ────────────────────────────────────────────────────────────────

function FTOForm({
  properties,
  users,
  defaultDate,
  onClose,
  onCreated,
}: {
  properties: Property[];
  users: User[];
  defaultDate?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [ftoName, setFtoName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState(defaultDate ? formatDateOnly(defaultDate) : "");
  const [eventStartAt, setEventStartAt] = useState(defaultDate ? formatDateTimeLocal(defaultDate) : "");
  const [eventEndAt, setEventEndAt] = useState(defaultDate ? formatDateTimeLocal(defaultDate, 1) : "");
  const [fieldTeamMemberIds, setFieldTeamMemberIds] = useState<number[]>([]);
  const [pmAssigneeIds, setPmAssigneeIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Separate users by role
  const fieldTeamUsers = users.filter((u) => u.role === "field_team_member");
  const pmUsers = users.filter((u) => u.role === "property_manager" || u.role === "admin");

  const conflictStart = eventStartAt ? new Date(eventStartAt).toISOString()
    : dueDate ? `${dueDate}T00:00:00Z` : undefined;
  const conflictEnd = eventEndAt ? new Date(eventEndAt).toISOString()
    : dueDate ? `${dueDate}T23:59:59Z` : undefined;
  const { conflicts } = useConflictCheck(fieldTeamMemberIds, conflictStart, conflictEnd);

  function toggleFieldTeam(id: number) {
    setFieldTeamMemberIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function togglePM(id: number) {
    setPmAssigneeIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!selectedPropertyId) errs.property = "Property is required";
    if (!ftoName.trim()) errs.ftoName = "FTO name is required";
    if (!dueDate) errs.dueDate = "Due date is required";
    if (!description.trim()) errs.description = "Description is required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const payload: any = {
        name: ftoName.trim(),
        description: description.trim(),
        priority,
        status: "new",
        due_date: new Date(dueDate).toISOString(),
        property_id: Number(selectedPropertyId),
        field_team_member_ids: fieldTeamMemberIds,
        pm_assignee_ids: pmAssigneeIds,
        sync_to_outlook: true,
      };
      if (eventStartAt) payload.event_start_at = new Date(eventStartAt).toISOString();
      if (eventEndAt) payload.event_end_at = new Date(eventEndAt).toISOString();

      await fetchJSON("/maintenance/ftos", { method: "POST", body: JSON.stringify(payload) });
      toast.success("FTO created");
      window.dispatchEvent(new CustomEvent("refreshFieldTeamOrders"));
      onCreated();
      onClose();
    } catch {
      toast.error("Failed to create FTO");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">FTO Name <span className="text-red-500">*</span></label>
          <Input value={ftoName} onChange={(e) => setFtoName(e.target.value)} placeholder="FTO name" aria-invalid={!!errors.ftoName} />
          {errors.ftoName && <p className="text-red-500 text-xs mt-1">{errors.ftoName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property <span className="text-red-500">*</span></label>
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className={errors.property ? "border-red-500" : ""}><SelectValue placeholder="Select a property" /></SelectTrigger>
            <SelectContent>
              {properties.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.property && <p className="text-red-500 text-xs mt-1">{errors.property}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-invalid={!!errors.dueDate} />
            {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Start</label>
            <Input type="datetime-local" value={eventStartAt} onChange={(e) => setEventStartAt(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event End</label>
            <Input type="datetime-local" value={eventEndAt} onChange={(e) => setEventEndAt(e.target.value)} />
          </div>
        </div>

        <MultiSelectDropdown
          label="Field Team Members"
          placeholder="Select field team members"
          users={fieldTeamUsers.length > 0 ? fieldTeamUsers : users}
          selected={fieldTeamMemberIds}
          onToggle={toggleFieldTeam}
        />

        <MultiSelectDropdown
          label="PM Assignees"
          placeholder="Select PM assignees"
          users={pmUsers.length > 0 ? pmUsers : users}
          selected={pmAssigneeIds}
          onToggle={togglePM}
        />

        <ConflictWarningBanner conflicts={conflicts} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} aria-invalid={!!errors.description} />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>
      </div>
      <FormFooter onCancel={onClose} submitting={submitting} label="Create FTO" />
    </form>
  );
}

// ─── Work Order Form ─────────────────────────────────────────────────────────

function WorkOrderForm({
  properties,
  defaultDate,
  onClose,
  onCreated,
}: {
  properties: Property[];
  defaultDate?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { userId } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState(defaultDate ? formatDateOnly(defaultDate) : "");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tasks, setTasks] = useState<SimpleTask[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Fetch tasks when property changes
  useEffect(() => {
    if (!selectedPropertyId) { setTasks([]); return; }
    fetchJSON(`/maintenance/tasks?property_id=${selectedPropertyId}`)
      .then((data) => setTasks(data ?? []))
      .catch(() => setTasks([]));
  }, [selectedPropertyId]);

  // Fetch vendors once
  useEffect(() => {
    fetchJSON("/vendors")
      .then((data) => setVendors(data ?? []))
      .catch(() => setVendors([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Work order name is required";
    if (!selectedPropertyId) errs.property = "Property is required";
    if (!selectedTaskId) errs.task = "Task is required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const priorityMap: Record<string, string> = { low: "low", normal: "medium", high: "high", urgent: "urgent" };
      const statusMap: Record<string, string> = { new: "new" };
      const payload: any = {
        task_id: Number(selectedTaskId),
        property_id: Number(selectedPropertyId),
        name: name.trim(),
        description: description.trim(),
        status: "new",
        priority: priorityMap[priority] || "medium",
      };
      if (dueDate) payload.due_date = new Date(dueDate).toISOString();
      if (selectedVendorId) payload.vendor_id = Number(selectedVendorId);
      if (userId) payload.requested_by = userId;

      await fetchJSON("/maintenance/work-orders", { method: "POST", body: JSON.stringify(payload) });
      toast.success("Work order created");
      window.dispatchEvent(new CustomEvent("refreshWorkOrders"));
      onCreated();
      onClose();
    } catch {
      toast.error("Failed to create work order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Work Order Name <span className="text-red-500">*</span></label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Work order name" aria-invalid={!!errors.name} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property <span className="text-red-500">*</span></label>
          <Select value={selectedPropertyId} onValueChange={(v) => { setSelectedPropertyId(v); setSelectedTaskId(""); }}>
            <SelectTrigger className={errors.property ? "border-red-500" : ""}><SelectValue placeholder="Select a property" /></SelectTrigger>
            <SelectContent>
              {properties.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.property && <p className="text-red-500 text-xs mt-1">{errors.property}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task <span className="text-red-500">*</span></label>
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId} disabled={!selectedPropertyId}>
            <SelectTrigger className={errors.task ? "border-red-500" : ""}>
              <SelectValue placeholder={selectedPropertyId ? "Select a task" : "Select a property first"} />
            </SelectTrigger>
            <SelectContent>
              {tasks.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.task && <p className="text-red-500 text-xs mt-1">{errors.task}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
          <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
            <SelectTrigger><SelectValue placeholder="Select a vendor (optional)" /></SelectTrigger>
            <SelectContent>
              {vendors.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
        </div>
      </div>
      <FormFooter onCancel={onClose} submitting={submitting} label="Create Work Order" />
    </form>
  );
}

// ─── Inspection Form ─────────────────────────────────────────────────────────

function InspectionForm({
  properties,
  users,
  defaultDate,
  onClose,
  onCreated,
}: {
  properties: Property[];
  users: User[];
  defaultDate?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { userId } = useAuth();
  const [inspectionName, setInspectionName] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [dueDate, setDueDate] = useState(defaultDate ? formatDateOnly(defaultDate) : "");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<BackendInspectionChecklist[]>([]);

  // Field managers are field team members
  const fieldManagers = users.filter((u) => u.role === "field_team_member");

  // Fetch templates when property changes
  useEffect(() => {
    if (!selectedPropertyId) { setTemplates([]); return; }
    listChecklists(Number(selectedPropertyId))
      .then((data) => setTemplates(data ?? []))
      .catch(() => setTemplates([]));
  }, [selectedPropertyId]);

  // Combine backend templates with defaults for dropdown
  const templateOptions = [
    ...templates.map((t) => ({ value: t.name, label: t.name })),
    ...DEFAULT_INSPECTION_TEMPLATES
      .filter((dt) => !templates.some((t) => t.name === dt.name))
      .map((dt) => ({ value: dt.name, label: dt.name })),
  ];

  const conflictStart = dueDate ? `${dueDate}T00:00:00Z` : undefined;
  const conflictEnd = dueDate ? `${dueDate}T23:59:59Z` : undefined;
  const { conflicts } = useConflictCheck(
    selectedManagerId ? [Number(selectedManagerId)] : [],
    conflictStart,
    conflictEnd,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!inspectionName.trim()) errs.inspectionName = "Inspection name is required";
    if (!selectedPropertyId) errs.property = "Property is required";
    if (!selectedTemplate) errs.template = "Template is required";
    if (!selectedManagerId) errs.fieldManager = "Field manager is required";
    if (!dueDate) errs.dueDate = "Due date is required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const propertyId = Number(selectedPropertyId);

      // Find or create checklist
      const existingChecklists = await listChecklists(propertyId);
      let checklistId: number;
      const existing = existingChecklists.find((c) => c.name === selectedTemplate);
      if (existing) {
        checklistId = existing.id;
      } else {
        const template = DEFAULT_INSPECTION_TEMPLATES.find((t) => t.name === selectedTemplate);
        const checklistJson = template ? { sections: template.sections } : { sections: [] };
        const newChecklist = await createChecklist({
          property_id: propertyId,
          name: selectedTemplate,
          checklist_json: checklistJson,
          created_by_type: "user",
          created_by_id: userId!,
          is_active: true,
        });
        checklistId = newChecklist.id;
      }

      // Create inspection
      await createInspection({
        property_id: propertyId,
        unit_id: null,
        checklist_id: checklistId,
        assigned_field_team_member_id: Number(selectedManagerId),
        status: "In Progress",
        due_date: new Date(dueDate).toISOString(),
      });

      toast.success("Inspection scheduled");
      onCreated();
      onClose();
    } catch {
      toast.error("Failed to schedule inspection");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Name <span className="text-red-500">*</span></label>
          <Input value={inspectionName} onChange={(e) => setInspectionName(e.target.value)} placeholder="e.g., Monthly Building Inspection" aria-invalid={!!errors.inspectionName} />
          {errors.inspectionName && <p className="text-red-500 text-xs mt-1">{errors.inspectionName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property <span className="text-red-500">*</span></label>
          <Select value={selectedPropertyId} onValueChange={(v) => { setSelectedPropertyId(v); setSelectedTemplate(""); }}>
            <SelectTrigger className={errors.property ? "border-red-500" : ""}><SelectValue placeholder="Select a property" /></SelectTrigger>
            <SelectContent>
              {properties.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.property && <p className="text-red-500 text-xs mt-1">{errors.property}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Template <span className="text-red-500">*</span></label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate} disabled={!selectedPropertyId}>
            <SelectTrigger className={errors.template ? "border-red-500" : ""}>
              <SelectValue placeholder={selectedPropertyId ? "Select a template" : "Select a property first"} />
            </SelectTrigger>
            <SelectContent>
              {templateOptions.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.template && <p className="text-red-500 text-xs mt-1">{errors.template}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Field Manager <span className="text-red-500">*</span></label>
          <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
            <SelectTrigger className={errors.fieldManager ? "border-red-500" : ""}>
              <SelectValue placeholder="Select a field manager" />
            </SelectTrigger>
            <SelectContent>
              {(fieldManagers.length > 0 ? fieldManagers : users).map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.fieldManager && <p className="text-red-500 text-xs mt-1">{errors.fieldManager}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-invalid={!!errors.dueDate} />
          {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
        </div>

        <ConflictWarningBanner conflicts={conflicts} />
      </div>
      <FormFooter onCancel={onClose} submitting={submitting} label="Schedule Inspection" />
    </form>
  );
}

// ─── Main Dialog ─────────────────────────────────────────────────────────────

export default function CreateEventDialog({
  open,
  onOpenChange,
  defaultDate,
  onEventCreated,
}: CreateEventDialogProps) {
  const [selectedType, setSelectedType] = useState<EventType>("calendar_event");
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedType("calendar_event");
    }
  }, [open]);

  // Fetch shared data when dialog opens
  useEffect(() => {
    if (!open) return;
    const token = localStorage.getItem("avm_token");
    const headers = { Authorization: `Bearer ${token}` };

    fetchJSON("/properties", { headers })
      .then((data) => setProperties(data ?? []))
      .catch(() => setProperties([]));

    fetchJSON("/users/all", { headers })
      .then((data) => setUsers(data ?? []))
      .catch(() => setUsers([]));
  }, [open]);

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);
  const handleCreated = useCallback(() => onEventCreated?.(), [onEventCreated]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-lg w-full max-w-lg p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Create New Item</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new calendar event or other item
          </DialogDescription>
        </DialogHeader>

        {/* Type Selector */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {EVENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setSelectedType(type.value)}
                className={cn(
                  "relative flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  selectedType === type.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900",
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form content based on selected type */}
        {selectedType === "calendar_event" && (
          <CalendarEventForm
            properties={properties}
            users={users}
            defaultDate={defaultDate}
            onClose={handleClose}
            onCreated={handleCreated}
          />
        )}
        {selectedType === "task" && (
          <TaskForm
            properties={properties}
            users={users}
            defaultDate={defaultDate}
            onClose={handleClose}
            onCreated={handleCreated}
          />
        )}
        {selectedType === "fto" && (
          <FTOForm
            properties={properties}
            users={users}
            defaultDate={defaultDate}
            onClose={handleClose}
            onCreated={handleCreated}
          />
        )}
        {selectedType === "work_order" && (
          <WorkOrderForm
            properties={properties}
            defaultDate={defaultDate}
            onClose={handleClose}
            onCreated={handleCreated}
          />
        )}
        {selectedType === "inspection" && (
          <InspectionForm
            properties={properties}
            users={users}
            defaultDate={defaultDate}
            onClose={handleClose}
            onCreated={handleCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
