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

interface Assignee {
  id: string;
  name: string;
  initials: string;
}

interface CreateFTOModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    dueDate: string;
    priority: string;
    ftoStatus?: string;
  };
}

const AVAILABLE_ASSIGNEES: Assignee[] = [
  { id: "1", name: "David Harris", initials: "DH" },
  { id: "2", name: "Sarah Johnson", initials: "SJ" },
  { id: "3", name: "Michael Chen", initials: "MC" },
  { id: "4", name: "Emily Rodriguez", initials: "ER" },
  { id: "5", name: "James Wilson", initials: "JW" },
];

export default function CreateFTOModal({
  open,
  onOpenChange,
  editData,
}: CreateFTOModalProps) {
  const [property, setProperty] = useState("");
  const [ftoName, setFtoName] = useState("");
  const [priority, setPriority] = useState("normal");
  const [ftoStatus, setFtoStatus] = useState("pending-approval");
  const [dueDate, setDueDate] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const calendarDropdownRef = useRef<HTMLDivElement>(null);
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });
  const [selectedAssignees, setSelectedAssignees] = useState<Assignee[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeButtonRef = useRef<HTMLButtonElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const [assigneeDropdownPos, setAssigneeDropdownPos] = useState({
    top: 0,
    left: 0,
  });
  const [errors, setErrors] = useState<{
    property?: boolean;
    ftoName?: boolean;
    dueDate?: boolean;
    selectedAssignees?: boolean;
    ftoStatus?: boolean;
  }>({});

  useEffect(() => {
    if (editData) {
      setDueDate(editData.dueDate);
      setPriority(editData.priority.toLowerCase());
      setFtoStatus(editData.ftoStatus || "pending-approval");
    }
  }, [editData]);

  const validateForm = (): boolean => {
    const newErrors: {
      property?: boolean;
      ftoName?: boolean;
      dueDate?: boolean;
      selectedAssignees?: boolean;
      ftoStatus?: boolean;
    } = {};
    if (!property.trim()) {
      newErrors.property = true;
    }
    if (!ftoName.trim()) {
      newErrors.ftoName = true;
    }
    if (!dueDate.trim()) {
      newErrors.dueDate = true;
    }
    if (selectedAssignees.length === 0) {
      newErrors.selectedAssignees = true;
    }
    if (!ftoStatus.trim()) {
      newErrors.ftoStatus = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log("Form submitted", {
        ftoName,
        dueDate,
        priority,
        ftoStatus,
        selectedAssignees,
      });
      onOpenChange(false);
    }
  };

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

      if (showCalendar || showAssigneeDropdown) {
        animationFrameId = requestAnimationFrame(updatePositions);
      }
    };

    if (showCalendar || showAssigneeDropdown) {
      updatePositions();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showCalendar, showAssigneeDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (showCalendar) {
        const isClickInInput = dueDateInputRef.current?.contains(target);
        const isClickInDropdown = calendarDropdownRef.current?.contains(target);
        if (!isClickInInput && !isClickInDropdown) {
          setShowCalendar(false);
        }
      }

      if (showAssigneeDropdown) {
        const isClickInButton = assigneeButtonRef.current?.contains(target);
        const isClickInDropdown = assigneeDropdownRef.current?.contains(target);
        if (!isClickInButton && !isClickInDropdown) {
          setShowAssigneeDropdown(false);
        }
      }
    };

    if (showCalendar || showAssigneeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showCalendar, showAssigneeDropdown]);

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

  const removeAssignee = (assigneeId: string) => {
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

  const getPriorityIcon = (priorityLevel: string = priority) => {
    const colors: Record<string, string> = {
      low: "#059669",
      normal: "#2463EB",
      high: "#D97706",
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
    };
    return labels[priority] || "Normal";
  };

  const getPriorityBgColor = () => {
    const colors: Record<string, string> = {
      low: "#d1fae5",
      normal: "#dbe9fe",
      high: "#fef3c7",
    };
    return colors[priority] || colors.normal;
  };

  const getPriorityTextColor = () => {
    const colors: Record<string, string> = {
      low: "#059669",
      normal: "#2463eb",
      high: "#d97706",
    };
    return colors[priority] || colors.normal;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[694px] p-0 gap-0 font-['Geist',sans-serif]">
        <div className="flex flex-col gap-4 px-8 py-8 bg-white rounded-2xl">
          {/* Title */}
          <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[1.25]">
            {editData ? "Edit FTO" : "Create FTO"}
          </DialogTitle>

          {/* Property and Unit Row */}
          <div className="flex gap-3 w-full flex-wrap">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Property <span className="text-red-600">*</span>
              </label>
              <Select
                value={property}
                onValueChange={(value) => {
                  setProperty(value);
                  if (errors.property && value.trim()) {
                    setErrors((prev) => ({ ...prev, property: false }));
                  }
                }}
              >
                <SelectTrigger className={`h-11 rounded-lg bg-[#f7f7f7] ${
                  errors.property ? "border-red-500 border-2" : "border-[#e5e5e5]"
                }`}>
                  <SelectValue
                    placeholder="Select Property"
                    className="text-[#a1a1a9] text-base tracking-[-0.32px] leading-[1.4]"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property1">22 Indian Chase Dr</SelectItem>
                  <SelectItem value="property2">Property 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Unit
              </label>
              <Select>
                <SelectTrigger className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5]">
                  <SelectValue
                    placeholder="Select Unit If Applicable"
                    className="text-[#a1a1a9] text-base tracking-[-0.32px] leading-[1.4]"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit1">Unit 1</SelectItem>
                  <SelectItem value="unit2">Unit 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Select Task Section */}
          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              Select Task&nbsp;
            </label>
            <Select>
              <SelectTrigger className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5]">
                <SelectValue
                  placeholder="Select Task"
                  className="text-[#a1a1a9] text-base tracking-[-0.32px] leading-[1.4]"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="na">N/A</SelectItem>
                <SelectItem value="task1">Task 1</SelectItem>
                <SelectItem value="task2">Task 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* FTO Name and Priority Row */}
          <div className="flex gap-3 w-full flex-wrap">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                FTO Name <span className="text-red-600">*</span>
              </label>
              <Input
                value={ftoName}
                onChange={(e) => {
                  setFtoName(e.target.value);
                  if (errors.ftoName && e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, ftoName: false }));
                  }
                }}
                placeholder="Type FTO Name"
                className={`h-11 rounded-lg bg-[#f7f7f7] placeholder:text-[#a1a1a9] text-base tracking-[-0.32px] leading-[1.4] ${
                  errors.ftoName ? "border-red-500 border-2" : "border-[#e5e5e5]"
                }`}
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Priority <span className="text-red-600">*</span>
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5]">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getPriorityTextColor() }}
                    />
                    <span className="text-sm tracking-[-0.28px] leading-[1.4] text-[#303030]">
                      {getPriorityLabel()}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#059669]" />
                      <span>Low</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="normal">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#2463eb]" />
                      <span>Normal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#d97706]" />
                      <span>High</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date and Assignees Row */}
          <div className="flex gap-3 w-full flex-wrap">
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
                      if (value.length <= 2) {
                        value = value;
                      } else if (value.length <= 4) {
                        value = value.slice(0, 2) + "/" + value.slice(2);
                      } else {
                        value =
                          value.slice(0, 2) +
                          "/" +
                          value.slice(2, 4) +
                          "/" +
                          value.slice(4, 8);
                      }
                    }
                    setDueDate(value);
                    const parsed = parse(value, "MM/dd/yyyy", new Date());
                    if (isValid(parsed)) {
                      setSelectedDate(parsed);
                      setCalendarMonth(parsed);
                      if (errors.dueDate) {
                        setErrors((prev) => ({ ...prev, dueDate: false }));
                      }
                    }
                  }}
                  maxLength={10}
                  className={`h-11 rounded-lg bg-[#f7f7f7] placeholder:text-[#a1a1a9] text-base tracking-[-0.32px] leading-[1.4] ${
                    errors.dueDate ? "border-red-500 border-2" : "border-[#e5e5e5]"
                  }`}
                />
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity p-1"
                  type="button"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 6.66668H2M10.6667 1.33334V4.00001M5.33333 1.33334V4.00001M5.2 14.6667H10.8C11.9201 14.6667 12.4802 14.6667 12.908 14.4487C13.2843 14.2569 13.5903 13.951 13.782 13.5747C14 13.1468 14 12.5868 14 11.4667V5.86668C14 4.74657 14 4.18652 13.782 3.7587C13.5903 3.38237 13.2843 3.07641 12.908 2.88466C12.4802 2.66668 11.9201 2.66668 10.8 2.66668H5.2C4.0799 2.66668 3.51984 2.66668 3.09202 2.88466C2.71569 3.07641 2.40973 3.38237 2.21799 3.7587C2 4.18652 2 4.74657 2 5.86668V11.4667C2 12.5868 2 13.1468 2.21799 13.5747C2.40973 13.951 2.71569 14.2569 3.09202 14.4487C3.51984 14.6667 4.0799 14.6667 5.2 14.6667Z"
                      stroke="black"
                      strokeWidth="1.48576"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {showCalendar &&
                  createPortal(
                    <div
                      ref={calendarDropdownRef}
                      className="bg-white flex flex-col gap-3 p-4"
                      style={{
                        width: "280px",
                        border: "0.5px solid #DADADA",
                        borderRadius: "8px",
                        boxShadow:
                          "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
                        zIndex: 99999,
                        position: "fixed",
                        top: calendarPos.top + "px",
                        left: calendarPos.left + "px",
                        pointerEvents: "auto",
                      }}
                      onMouseLeave={() => setShowCalendar(false)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={previousMonth}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          type="button"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-[#303030]">
                          {format(calendarMonth, "MMMM yyyy")}
                        </span>
                        <button
                          onClick={nextMonth}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          type="button"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                          (day) => (
                            <div
                              key={day}
                              className="w-8 h-8 flex items-center justify-center text-xs font-medium text-[#8B8D8D]"
                            >
                              {day}
                            </div>
                          ),
                        )}

                        {getCalendarDays().map((day, idx) => (
                          <button
                            key={idx}
                            onClick={() =>
                              day !== null && handleDateSelect(day)
                            }
                            disabled={day === null}
                            className={`w-8 h-8 flex items-center justify-center text-xs rounded transition-colors ${
                              day === null
                                ? "text-transparent cursor-default"
                                : selectedDate &&
                                    selectedDate.getDate() === day &&
                                    selectedDate.getMonth() ===
                                      calendarMonth.getMonth() &&
                                    selectedDate.getFullYear() ===
                                      calendarMonth.getFullYear()
                                  ? "bg-[#2463EB] text-white font-medium"
                                  : "hover:bg-gray-100 text-[#303030]"
                            }`}
                            type="button"
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>,
                    document.body,
                  )}
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Assignees <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <div
                  ref={assigneeButtonRef}
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className={`h-11 rounded-lg bg-[#f7f7f7] w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors cursor-pointer ${
                    errors.selectedAssignees ? "border-red-500 border-2" : "border border-[#e5e5e5]"
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setShowAssigneeDropdown(!showAssigneeDropdown);
                    }
                  }}
                >
                  <div className="flex items-center gap-1.5 flex-wrap flex-1">
                    {selectedAssignees.length === 0 ? (
                      <span className="text-[#a1a1a9] text-sm">
                        Select assignees
                      </span>
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
                            className="hover:opacity-70 transition-opacity"
                            type="button"
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
                </div>

                {showAssigneeDropdown &&
                  createPortal(
                    <div
                      ref={assigneeDropdownRef}
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
                      onMouseLeave={() => setShowAssigneeDropdown(false)}
                    >
                      {AVAILABLE_ASSIGNEES.map((assignee) => {
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
                              <div className="flex w-[24px] h-[24px] justify-center items-center rounded-full bg-[#2463eb]">
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
          </div>

          {/* FTO Status */}
          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              FTO Status <span className="text-red-600">*</span>
            </label>
            <Select value={ftoStatus} onValueChange={setFtoStatus}>
              <SelectTrigger className={`h-11 rounded-lg bg-[#f7f7f7] ${
                errors.ftoStatus ? "border-red-500 border-2" : "border-[#e5e5e5]"
              }`}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        ftoStatus === "pending-approval"
                          ? "#1E40AF"
                          : ftoStatus === "dispatched"
                            ? "#B45309"
                            : ftoStatus === "completed"
                              ? "#166534"
                              : "#6B7280",
                    }}
                  />
                  <span className="text-sm tracking-[-0.28px] leading-[1.4] text-[#303030]">
                    {ftoStatus === "pending-approval"
                      ? "New"
                      : ftoStatus === "dispatched"
                        ? "Dispatched"
                        : ftoStatus === "completed"
                          ? "Completed"
                          : "Cancelled"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending-approval">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1E40AF]" />
                    <span>New</span>
                  </div>
                </SelectItem>
                <SelectItem value="dispatched">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#B45309]" />
                    <span>Dispatched</span>
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#166534]" />
                    <span>Completed</span>
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#6B7280]" />
                    <span>Cancelled</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              Description
            </label>
            <Textarea
              placeholder="Insert Description Here"
              className="min-h-[169px] rounded-lg bg-[#f7f7f7] border-[#e5e5e5] placeholder:text-[#a1a1a9] text-base tracking-[-0.32px] leading-[1.4] resize-none"
            />
          </div>

          {/* Create/Update Field Team Order Button */}
          <button
            onClick={handleSubmit}
            className="flex min-h-[36px] justify-center items-center gap-2 px-4 py-2 rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002d5a] hover:bg-[#014777] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={Object.keys(errors).length > 0}
          >
            <span className="text-white font-medium text-base">
              {editData ? "Update FTO" : "Create FTO"}
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
