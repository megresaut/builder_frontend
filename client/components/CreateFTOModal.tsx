import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  parse,
  isValid,
  getDaysInMonth,
  startOfMonth,
  getDay,
} from "date-fns";
import { fetchJSON } from "../api/fetchJSON"; // same helper used in FTOModal
import { getInitials } from "../utils/getInitials";

interface CreateFTOModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFTO: any | null;
}

const API_BASE = "/api";     
// const API_BASE = "http://localhost:8080";   

// --- Simple DTOs for dropdowns (same shape as FTOModal) ---
type SimpleTask = { id: number; name: string };
type SimpleProperty = {
  id: number;
  name?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
};

interface Assignee {
  id: number;
  name: string;
  initials: string;
}


export default function CreateFTOModal({
  open,
  onOpenChange,
  editingFTO,
}: CreateFTOModalProps) {
  // --- dropdown data loaded from API ---
  const [tasks, setTasks] = useState<SimpleTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<SimpleTask[]>([]);
  const [properties, setProperties] = useState<SimpleProperty[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // --- local UI state ---
  const [priority, setPriority] = useState("normal");
  const [timesheetStatus, setTimesheetStatus] = useState("outstanding");
  const [status, setStatus] = useState<"new" | "dispatched" | "completed" | "cancelled">("dispatched");
  const [dueDate, setDueDate] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });
  const [selectedAssignees, setSelectedAssignees] = useState<Assignee[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeButtonRef = useRef<HTMLButtonElement>(null);
  const [assigneeDropdownPos, setAssigneeDropdownPos] = useState({
    top: 0,
    left: 0,
  });

  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [pmAssignees, setPmAssignees] = useState<Assignee[]>([]);
  // Property / Task selection (IDs as strings)
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [associatedTaskLabel, setAssociatedTaskLabel] = useState<string | null>(
    null,
  );

  const [availableAssignees, setAvailableAssignees] = useState<Assignee[]>([]);

  const [selectedPmAssignees, setSelectedPmAssignees] = useState<Assignee[]>([]);

  const [showPmDropdown, setShowPmDropdown] = useState(false);
  const [pmDropdownPos, setPmDropdownPos] = useState({ top: 0, left: 0 });
  const pmButtonRef = useRef<HTMLButtonElement>(null);

  const [propertySearch, setPropertySearch] = useState("");

  

  // --------- LOAD DROPDOWN OPTIONS (tasks + properties) ----------
  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      try {
        setOptionsLoading(true);
        setOptionsError(null);

        const [tasksRes, propsRes] = await Promise.all([
          fetchJSON("/maintenance/tasks?limit=200").catch(  
            () => [],
          ),
          fetchJSON("/properties").catch(() => []),
        ]);

        if (cancelled) return;

        setTasks(tasksRes || []);
        setProperties(propsRes || []);
      } catch (err: any) {
        if (!cancelled) {
          setOptionsError(
            err?.message || "Failed to load properties/tasks options.",
          );
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    };

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  const renderPropertyLabel = (p: SimpleProperty) =>
    p.name ||
    [p.address_line1, p.city, p.state].filter(Boolean).join(", ") ||
    `Property #${p.id}`;



  useEffect(() => {
    let animationFrameId: number;

    const updatePositions = () => {
      if (showCalendar && dueDateInputRef.current) {
        const rect = dueDateInputRef.current.getBoundingClientRect();
        setCalendarPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
      
      if (showAssigneeDropdown && assigneeButtonRef.current) {
        const rect = assigneeButtonRef.current.getBoundingClientRect();
        setAssigneeDropdownPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
      
      /* ⭐ NEW: PM DROPDOWN POSITIONING ⭐ */
      if (showPmDropdown && pmButtonRef.current) {
        const rect = pmButtonRef.current.getBoundingClientRect();
        setPmDropdownPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
      
      /* Update loop */
      if (showCalendar || showAssigneeDropdown || showPmDropdown) {
        animationFrameId = requestAnimationFrame(updatePositions);
      }      
    };

    if (showCalendar || showAssigneeDropdown || showPmDropdown) {
      updatePositions();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showCalendar, showAssigneeDropdown, showPmDropdown]); 


  useEffect(() => {
    if (!selectedProperty) {
      setFilteredTasks([]);
      setSelectedTask(null);
      return;
    }
  
    let cancelled = false;
  
    const loadFilteredTasks = async () => {
      try {
        const data = await fetchJSON(`/maintenance/tasks/by-property/${selectedProperty}`)
          .catch(() => []);
  
        if (!cancelled) {
          setFilteredTasks(data || []);
        }
      } catch {
        if (!cancelled) setFilteredTasks([]);
      }
    };
  
    loadFilteredTasks();
    return () => {
      cancelled = true;
    };
  }, [selectedProperty]);
  

  useEffect(() => {
    if (!open) return; // only load when modal opens
  
    async function loadAssignees() {
      try {
        const data = await fetchJSON("/users/field-team");
  
        const mapped = data.map((u: any) => ({
          id: Number(u.id),
          name: u.name || u.email,
          initials: getInitials(u.name || u.email),
        }));
  
        setAvailableAssignees(mapped);
      } catch (err) {
        console.error("Failed to load field team members:", err);
      }
    }
  
    loadAssignees();
  }, [open]);
  

  useEffect(() => {
    if (!open) return;
  
    async function loadPMs() {
      try {
        const data = await fetchJSON("/users/property-managers");
  
        const mapped = data.map((u: any) => ({
          id: Number(u.id),
          name: u.name || u.email,
          initials: getInitials(u.name || u.email),
        }));
  
        setPmAssignees(mapped);
      } catch (err) {
        console.error("Failed to load property managers:", err);
      }
    }
  
    loadPMs();
  }, [open]);

  const toggleAssignee = (assignee: Assignee) => {
    setSelectedAssignees((prev) => {
      const isSelected = prev.some((a) => a.id === assignee.id);
      if (isSelected) {
        return prev.filter((a) => a.id !== assignee.id);
      } else {
        return [...prev, assignee];
      }
    });
  };

  const removeAssignee = (assigneeId: number) => {
    setSelectedAssignees((prev) => prev.filter((a) => a.id !== assigneeId));
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day,
    );
    setSelectedDate(selected);
    const formatted = format(selected, "MM/dd/yyyy");
    setDueDate(formatted);
    setShowCalendar(false);
  };

  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = getDaysInMonth(new Date(year, month, 1));
    const firstDay = getDay(startOfMonth(new Date(year, month, 1)));

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const previousMonth = () => {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1),
    );
  };

  // RESET fields when entering CREATE MODE
  useEffect(() => {
    if (!open) return; // modal must be open
    if (editingFTO !== null) return; // skip reset in edit mode

    setTaskName("");
    setDescription("");
    setPriority("normal");
    setStatus("dispatched");

    setDueDate("");
    setSelectedDate(null);
    setCalendarMonth(new Date());
    setShowCalendar(false);

    setSelectedAssignees([]);
    setShowAssigneeDropdown(false);

    setSelectedProperty(null);
    setSelectedTask(null);
    setAssociatedTaskLabel(null);
  }, [open, editingFTO]);

  // Load existing FTO when editing (kept for edit mode)
  useEffect(() => {
    if (!open || !editingFTO) return;
  
    // scalar fields (safe)
    setTaskName(editingFTO.name ?? "");
    setDescription(editingFTO.description ?? "");
    setPriority(editingFTO.priority ?? "normal");
  
    // setDueDate(editingFTO.dueDate ?? "");
    // setSelectedDate(
    //   editingFTO.dueDate ? new Date(editingFTO.dueDate) : null
    // );

      // ✅ FIX: convert YYYY-MM-DD → MM/DD/YYYY
    if (editingFTO.dueDate) {
      const parsed = parse(editingFTO.dueDate, "yyyy-MM-dd", new Date());
      if (isValid(parsed)) {
        setDueDate(format(parsed, "MM/dd/yyyy"));
        setSelectedDate(parsed);
        setCalendarMonth(parsed);
      }
    }
  
    setStatus(editingFTO.status ?? "new");
  
    // 🚨 DO NOT touch assignees here unless hydrated data exists
    // if (editingFTO.fieldTeam?.length) {
    //   setSelectedAssignees(editingFTO.fieldTeam);
    // }
  
  }, [open, editingFTO]);

  useEffect(() => {
    if (!open) return;
    if (!editingFTO) return;
    if (!Array.isArray(editingFTO.field_team_member_ids)) return;
    if (availableAssignees.length === 0) return;
  
    const hydrated = availableAssignees.filter(a =>
      editingFTO.field_team_member_ids.includes(a.id)
    );
  
    setSelectedAssignees(hydrated);
  }, [
    open,
    editingFTO?.id,              // 👈 important: rerun when switching FTOs
    availableAssignees.length,   // 👈 guarantees re-run after fetch
  ]);
  
  
  
  // --- helpers mimicking old FTOModal date logic ---
  const buildDateWithTodayTimeFromMMDDYYYY = (
    value: string,
  ): string | null => {
    if (!value) return null;
    const parsed = parse(value, "MM/dd/yyyy", new Date());
    if (!isValid(parsed)) return null;

    const now = new Date();
    parsed.setHours(now.getHours(), now.getMinutes(), 0, 0);
    return parsed.toISOString();
  };

  const mapTimesheetStatusToDB = (status: string): string => {
    switch (status) {
      case "outstanding":
        return "none";
      case "submitted":
        return "partial";
      case "approved":
        return "complete";
      default:
        return "none";
    }
  };
  
  // ---------- SUBMIT (CREATE + EDIT) ----------
  const handleSubmit = async () => {
    const nameTrimmed = taskName.trim();
    const descTrimmed = description.trim();

    if (!selectedProperty || !nameTrimmed || !descTrimmed || !dueDate) {
      alert("Please fill in Property, Task Name, Description, and Due Date.");
      return;
    }

    const dueISO = buildDateWithTodayTimeFromMMDDYYYY(dueDate);
    if (!dueISO) {
      alert("Invalid due date.");
      return;
    }

    const payload: any = {
      name: nameTrimmed,
      description: descTrimmed,
      priority: priority.toLowerCase(), 
      due_date: dueISO,
      status: status,
    };

    // CREATE ONLY: property + task
    if (!editingFTO) {
      payload.property_id = Number(selectedProperty);
      if (selectedTask) {
        payload.task_id = Number(selectedTask);
      }
    }

    // Optional assignee → both PM and tech for now
    payload.field_team_member_ids = selectedAssignees.map(a =>
      Number(a.id)
    );

    // PM assignees not yet implemented → send empty array for now
    payload.pm_assignee_ids = selectedPmAssignees.map(pm => Number(pm.id));
    
    try {
      if (!editingFTO) {
        await fetchJSON("/maintenance/ftos", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchJSON(`/maintenance/ftos/${editingFTO.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save FTO:", err);
      alert("Failed to save field team order.");
    }
  };

  const getPriorityIcon = (priorityLevel: string = priority) => {
    const colors: Record<string, string> = {
      low: "#059669",       // green
      normal: "#2463EB",    // blue
      high: "#D97706",      // amber
      urgent: "#DC2626",    // red
    };
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.91602 7H11.0827"
          stroke={colors[priorityLevel] || colors.normal}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };
  
  const getPriorityLabel = () => {
    const labels: Record<string, string> = {
      low: "Low",
      normal: "Normal",
      high: "High",
      urgent: "Urgent",
    };
    return labels[priority] || "Normal";
  };
  
  const getPriorityBgColor = () => {
    const colors: Record<string, string> = {
      low: "#d1fae5",     // green-100
      normal: "#dbe9fe",  // blue-100
      high: "#fef3c7",    // amber-100
      urgent: "#fee2e2",  // red-100
    };
    return colors[priority] || colors.normal;
  };
  
  const getPriorityTextColor = () => {
    const colors: Record<string, string> = {
      low: "#059669",      // green-600
      normal: "#2463eb",   // blue-600
      high: "#d97706",     // amber-600
      urgent: "#dc2626",   // red-600
    };
    return colors[priority] || colors.normal;
  };
  
  const getTimesheetStatusIcon = (status: string = timesheetStatus) => {
    const colors: Record<string, string> = {
      outstanding: "#D97706",
      submitted: "#059669",
      approved: "#2463EB",
    };
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke={colors[status] || colors.outstanding}
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  useEffect(() => {
    if (!open || !editingFTO) return;
    if (pmAssignees.length === 0) return;
  
    const hydratedPMs = pmAssignees.filter(pm =>
      editingFTO.pm_assignee_ids?.includes(pm.id)
    );
  
    setSelectedPmAssignees(hydratedPMs);
  }, [open, editingFTO, pmAssignees]);
  

  const getStatusColors = (s: string) => {
    switch (s) {
      case "new":
        return { bg: "#dbe9fe", text: "#2463EB" };       // blue
      case "dispatched":
        return { bg: "#fef3c7", text: "#d97706" };       // amber
      case "completed":
        return { bg: "#d1fae5", text: "#059669" };       // green
      case "cancelled":
        return { bg: "#fee2e2", text: "#dc2626" };       // red
      default:
        return { bg: "#e5e7eb", text: "#374151" };
    }
  };
  

  const getStatusUI = (status: string) => {
    switch (status) {
      case "new":
        return {
          label: "New",
          bg: "#DBE9FE",     // blue-100
          text: "#2463EB",   // blue-600
        };
      case "dispatched":
        return {
          label: "Dispatched",
          bg: "#FEF3C7",     // amber-100
          text: "#D97706",   // amber-600
        };
      case "completed":
        return {
          label: "Completed",
          bg: "#D1FAE5",     // green-100
          text: "#059669",   // green-600
        };
      case "cancelled":
        return {
          label: "Cancelled",
          bg: "#FEE2E2",     // red-100
          text: "#DC2626",   // red-600
        };
      default:
        return {
          label: "Dispatched",
          bg: "#FEF3C7",     // amber-100
          text: "#D97706",   // amber-600
        };
    }
  };
  

  const getTimesheetStatusLabel = () => {
    const labels: Record<string, string> = {
      outstanding: "Outstanding",
      submitted: "Submitted",
      approved: "Approved",
    };
    return labels[timesheetStatus] || "Outstanding";
  };

  const getTimesheetStatusBgColor = () => {
    const colors: Record<string, string> = {
      outstanding: "#fef3c7",
      submitted: "#d1fae5",
      approved: "#dbe9fe",
    };
    return colors[timesheetStatus] || colors.outstanding;
  };

  const getTimesheetStatusTextColor = () => {
    const colors: Record<string, string> = {
      outstanding: "#d97706",
      submitted: "#059669",
      approved: "#2463eb",
    };
    return colors[timesheetStatus] || colors.outstanding;
  };

  const togglePmAssignee = (pm: Assignee) => {
    setSelectedPmAssignees(prev => {
      const isSelected = prev.some(a => a.id === pm.id);
      return isSelected
        ? prev.filter(a => a.id !== pm.id)
        : [...prev, pm];
    });
  };
  
  const removePmAssignee = (pmId: number) => {
    setSelectedPmAssignees(prev => prev.filter(a => a.id !== pmId));
  };
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[694px] p-0 gap-0 font-['Geist',sans-serif]">
        <div className="flex flex-col gap-4 px-8 py-8 bg-white rounded-2xl">
          <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[1.25]">
            {editingFTO ? "Update Field Team Order" : "Create Field Team Order"}
          </DialogTitle>

          {/* Property, Unit, and Associated Task Row */}
          <div className="flex gap-3 w-full flex-wrap">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Property <span className="text-red-600">*</span>
              </label>
              {editingFTO ? (
                  // 🔒 UPDATE MODE — show property name, read-only
                  <Input
                    value={editingFTO.property}
                    disabled
                    className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5] text-[#303030]"
                  />
                ) : (
                  // ✏️ CREATE MODE — selectable
                  <Select
                    value={selectedProperty || ""}
                    onValueChange={setSelectedProperty}
                  >
                    <SelectTrigger className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5]">
                      <SelectValue placeholder="Select Property" />
                    </SelectTrigger>
                    <SelectContent
                      side="bottom"
                      align="start"
                      sideOffset={4}
                      avoidCollisions={false}
                      className="
                        z-[100000]
                        bg-white
                        border border-[#e5e5e5]
                        rounded-lg
                        shadow-lg
                        w-[var(--radix-select-trigger-width)]
                        max-w-[var(--radix-select-trigger-width)]
                        max-h-[320px]
                        overflow-y-auto
                        [scrollbar-gutter:stable]
                        box-border
                      "
                    >
                      {/* 🔍 Search input */}
                      <div className="p-2 sticky top-0 bg-white z-10 border-b border-[#e5e5e5]">
                        <Input
                          placeholder="Search properties..."
                          value={propertySearch}
                          onChange={(e) => setPropertySearch(e.target.value)}
                          className="h-9"
                        />
                      </div>

                      {/* Filtered results */}
                      {properties
                        .filter((p) =>
                          renderPropertyLabel(p)
                            .toLowerCase()
                            .includes(propertySearch.toLowerCase())
                        )
                        .map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {renderPropertyLabel(p)}
                          </SelectItem>
                        ))}

                      {/* Empty state */}
                      {properties.filter((p) =>
                        renderPropertyLabel(p)
                          .toLowerCase()
                          .includes(propertySearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No properties found
                        </div>
                      )}
                    </SelectContent>

                  </Select>
                )}
            </div>

            {/* Unit (smaller) – still static for now */}
            <div className="flex flex-col gap-2 min-w-[140px] flex-[0.4]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Unit
              </label>
              <Select disabled={editingFTO !== null}>
                <SelectTrigger className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5]">
                  <SelectValue
                    placeholder="Unit"
                    className="text-[#a1a1a9] text-base tracking-[-0.32px] leading-[1.4]"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit1">Unit 1</SelectItem>
                  <SelectItem value="unit2">Unit 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Associated Task Dropdown */}
            {/* <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Associated Task
              </label>
              <Select
                value={
                  editingFTO !== null ? associatedTaskLabel || "" : selectedTask || ""
                }
                onValueChange={setSelectedTask}
                disabled={editingFTO !== null || !selectedProperty}
              >
                <SelectTrigger className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5]">
                  {editingFTO !== null && associatedTaskLabel ? (
                    <span className="text-[#303030]">{associatedTaskLabel}</span>
                  ) : (
                    <SelectValue placeholder="Select Task" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {!selectedProperty ? (
                    <div className="p-2 text-sm text-gray-500">Select a property first</div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No tasks found for this property</div>
                  ) : (
                    filteredTasks.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div> */}
          </div>


          {/* FTO Name and Priority Row */}
          <div className="flex gap-3 w-full flex-wrap">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                FTO Name <span className="text-red-600">*</span>
              </label>
              <Input
                placeholder="Type Task Name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5] placeholder:text-[#a1a1a9] text-base tracking-[-0.32px] leading-[1.4]"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Priority <span className="text-red-600">*</span>
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5]">
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-2xl"
                    style={{ backgroundColor: getPriorityBgColor() }}
                  >
                    {getPriorityIcon()}
                    <span
                      className="text-sm tracking-[-0.28px] leading-[1.4]"
                      style={{ color: getPriorityTextColor() }}
                    >
                      {getPriorityLabel()}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent
                    className="
                      z-[100000]
                      bg-white
                      border border-[#e5e5e5]
                      rounded-lg
                      shadow-lg
                      min-w-[var(--radix-select-trigger-width)]
                      max-h-[280px]
                      overflow-y-auto
                    "
                  >
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 w-full flex-wrap">

            {/* --- Due Date --- */}
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Due Date <span className="text-red-600">*</span>
              </label>

              <div className="relative">
                <Input
                  ref={dueDateInputRef}
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={dueDate}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length > 0) {
                      if (value.length <= 2) value = value;
                      else if (value.length <= 4)
                        value = value.slice(0, 2) + "/" + value.slice(2);
                      else
                        value =
                          value.slice(0, 2) +
                          "/" +
                          value.slice(2, 4) +
                          "/" +
                          value.slice(4, 8);
                    }
                    setDueDate(value);
                    const parsed = parse(value, "MM/dd/yyyy", new Date());
                    if (isValid(parsed)) {
                      setSelectedDate(parsed);
                      setCalendarMonth(parsed);
                    }
                  }}
                  maxLength={10}
                  className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5] placeholder:text-[#a1a1a9] text-base"
                />

                {/* Calendar button */}
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:opacity-70"
                  type="button"
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
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </button>

                {/* Calendar Portal */}
                {showCalendar &&
                  createPortal(
                    <div
                      className="bg-white flex flex-col gap-3 p-4"
                      style={{
                        width: "280px",
                        border: "0.5px solid #DADADA",
                        borderRadius: "8px",
                        boxShadow:
                          "0 38px 11px rgba(0,0,0,0.00), 0 24px 10px rgba(0,0,0,0.01), 0 14px 8px rgba(0,0,0,0.04)",
                        zIndex: 99999,
                        position: "fixed",
                        top: calendarPos.top,
                        left: calendarPos.left,
                      }}
                      onMouseLeave={() => setShowCalendar(false)}
                    >
                      {/* Calendar Header */}
                      <div className="flex justify-between items-center mb-2">
                        <button onClick={previousMonth} className="p-1 hover:bg-gray-100 rounded">
                          <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <div className="font-medium text-gray-800">
                          {format(calendarMonth, "MMMM yyyy")}
                        </div>
                        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {/* Weekday Labels */}
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                          <div key={d} className="font-semibold text-gray-500 py-1 text-xs">
                            {d}
                          </div>
                        ))}

                        {/* Days */}
                        {getCalendarDays().map((day, index) => {
                          if (!day) {
                            return <div key={index} className="py-2" />;
                          }

                          const isSelected =
                            selectedDate &&
                            selectedDate.getDate() === day &&
                            selectedDate.getMonth() === calendarMonth.getMonth() &&
                            selectedDate.getFullYear() === calendarMonth.getFullYear();

                          return (
                            <button
                              key={index}
                              onClick={() => handleDateSelect(day)}
                              className={`
                                py-2 rounded-md transition
                                ${isSelected ? "bg-blue-600 text-white" : "hover:bg-gray-100"}
                              `}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                    </div>,
                    document.body
                  )}
              </div>
            </div>

            {/* --- PM Assignees (same structure as Field Team Members) --- */}
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                PM Assignees
              </label>

              <div className="relative">
                <button
                  type="button"
                  ref={pmButtonRef}
                  onClick={() => setShowPmDropdown(!showPmDropdown)}
                  className="h-11 rounded-lg bg-[#f7f7f7] border border-[#e5e5e5]
                            w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1.5 flex-wrap flex-1">
                    {selectedPmAssignees.length === 0 ? (
                      <span className="text-[#a1a1a9] text-sm">Select PMs</span>
                    ) : (
                      selectedPmAssignees.map((pm) => (
                        <div
                          key={pm.id}
                          className="flex items-center gap-1 bg-white rounded-full border border-[#2463eb] px-2 py-0.5"
                        >
                          <div className="flex w-[18px] h-[18px] justify-center items-center rounded-full bg-[#2463eb]">
                            <span className="text-white font-semibold text-[8px]">
                              {pm.initials}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removePmAssignee(pm.id);
                            }}
                            className="hover:opacity-70"
                          >
                            <X className="w-3 h-3 text-[#2463eb]" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <svg
                    className="w-4 h-4 text-gray-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>

                {/* Dropdown Portal */}
                {showPmDropdown &&
                  createPortal(
                    <div
                      className="bg-white flex flex-col justify-start items-start p-2 gap-1"
                      style={{
                        width: "280px",
                        border: "0.5px solid #DADADA",
                        borderRadius: "8px",
                        boxShadow:
                          "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
                        zIndex: 99999,
                        position: "fixed",
                        top: pmDropdownPos.top + "px",
                        left: pmDropdownPos.left + "px",
                        pointerEvents: "auto",
                      }}
                    >
                      {pmAssignees.map((pm) => {
                        const isSelected = selectedPmAssignees.some(
                          (a) => a.id === pm.id
                        );

                        return (
                          <button
                            key={pm.id}
                            onClick={() => togglePmAssignee(pm)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50 rounded transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex w-[24px] h-[24px] justify-center items-center rounded-full bg-[#2463EB]">
                                <span className="text-white font-semibold text-[10px]">
                                  {pm.initials}
                                </span>
                              </div>
                              <span className="text-[#303030] font-normal text-sm">
                                {pm.name}
                              </span>
                            </div>

                            {isSelected && (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M13.5 3L6 10.5L2.5 7"
                                  stroke="#2463EB"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>,
                    document.body
                  )}
              </div>
            </div>



          </div>


          {/* ============================ */}
          {/* ROW 2: Field Team Members + Timesheet Status */}
          {/* ============================ */}

          <div className="flex gap-3 w-full flex-wrap mt-3">

            {/* --- Field Team Members (now its own row) --- */}
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Field Team Members <span className="text-red-600">*</span>
              </label>

              <div className="relative">
                <button
                  ref={assigneeButtonRef}
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className="h-11 rounded-lg bg-[#f7f7f7] border border-[#e5e5e5]
                            w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1.5 flex-wrap flex-1">
                    {selectedAssignees.length === 0 ? (
                      <span className="text-[#a1a1a9] text-sm">Select</span>
                    ) : (
                      selectedAssignees.map((assignee) => (
                        <div
                          key={assignee.id}
                          className="flex items-center gap-1 bg-white rounded-full border border-[#2463eb] px-2 py-0.5"
                        >
                          <div className="flex w-[18px] h-[18px] justify-center items-center rounded-full bg-[#2463eb]">
                            <span className="text-white font-semibold text-[8px]">
                              {assignee.initials}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAssignee(assignee.id);
                            }}
                            className="hover:opacity-70"
                          >
                            <X className="w-3 h-3 text-[#2463eb]" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <svg
                    className="w-4 h-4 text-gray-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>

                {/* Dropdown Portal */}
                {showAssigneeDropdown &&
                  createPortal(
                    <div
                      className="bg-white flex flex-col justify-start items-start p-2 gap-1"
                      style={{
                        width: "280px",
                        border: "0.5px solid #DADADA",
                        borderRadius: "8px",
                        boxShadow:
                          "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
                        zIndex: 99999,
                        position: "fixed",
                        top: assigneeDropdownPos.top + "px",
                        left: assigneeDropdownPos.left + "px",
                        pointerEvents: "auto",
                      }}
                    >
                      {availableAssignees.map((assignee) => {
                        const isSelected = selectedAssignees.some(
                          (a) => a.id === assignee.id,
                        );

                        return (
                          <button
                            key={assignee.id}
                            onClick={() => toggleAssignee(assignee)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50 rounded transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex w-[24px] h-[24px] justify-center items-center rounded-full bg-[#2463EB]">
                                <span className="text-white font-semibold text-[10px]">
                                  {assignee.initials}
                                </span>
                              </div>
                              <span className="text-[#303030] font-normal text-sm">
                                {assignee.name}
                              </span>
                            </div>
                            {isSelected && (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M13.5 3L6 10.5L2.5 7"
                                  stroke="#2463EB"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>,
                    document.body,
                  )}


              </div>
            </div>

            {/* --- Timesheet Status (now next to Field Team Members) --- */}
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Status
              </label>

              <Select value={status} onValueChange={(value) => setStatus(value as "new" | "dispatched" | "completed" | "cancelled")}>
                <SelectTrigger className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5]">
                  {(() => {
                    const ui = getStatusUI(status);

                    return (
                      <div
                        className="flex items-center gap-1.5 px-3 py-1 rounded-2xl"
                        style={{ backgroundColor: ui.bg }}
                      >
                        <span
                          className="text-sm tracking-[-0.32px] leading-[1.4]"
                          style={{ color: ui.text }}
                        >
                          {ui.label}
                        </span>
                      </div>
                    );
                  })()}
                </SelectTrigger>

                <SelectContent
                  className="
                    z-[100000]
                    bg-white
                    border border-[#e5e5e5]
                    rounded-lg
                    shadow-lg
                    min-w-[var(--radix-select-trigger-width)]
                    max-h-[280px]
                    overflow-y-auto
                  "
                >
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>


          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              Description
            </label>
            <Textarea
              placeholder="Insert Description Here"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[169px] rounded-lg bg-[#f7f7f7] border-[#e5e5e5] placeholder:text-[#a1a1a9] text-base tracking-[-0.32px] leading-[1.4] resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="flex min-h-[36px] justify-center items-center gap-2 px-4 py-2 rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002d5a] hover:bg-[#014777] transition-colors"
            disabled={optionsLoading || loading}
          >
            <span className="text-white font-medium text-base">
              {!editingFTO
                ? "Create Field Team Order"
                : "Update Field Team Order"}
            </span>
          </button>

          {optionsError && (
            <p className="text-sm text-red-600 mt-1">{optionsError}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}