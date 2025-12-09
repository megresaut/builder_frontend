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
import { X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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

interface CreateRecurringTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    task: string;
    nextDate: string;
    priority: string;
    category: string;
  };
}

const AVAILABLE_ASSIGNEES: Assignee[] = [
  { id: "1", name: "David Harris", initials: "DH" },
  { id: "2", name: "Sarah Johnson", initials: "SJ" },
  { id: "3", name: "Michael Chen", initials: "MC" },
  { id: "4", name: "Emily Rodriguez", initials: "ER" },
  { id: "5", name: "James Wilson", initials: "JW" },
];

export default function CreateRecurringTaskModal({
  open,
  onOpenChange,
  editData,
}: CreateRecurringTaskModalProps) {
  const [taskName, setTaskName] = useState("");
  const [priority, setPriority] = useState("normal");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);
  const [startCalendarPos, setStartCalendarPos] = useState({ top: 0, left: 0 });
  const [endCalendarPos, setEndCalendarPos] = useState({ top: 0, left: 0 });
  const [selectedAssignees, setSelectedAssignees] = useState<Assignee[]>([
    AVAILABLE_ASSIGNEES[0],
    AVAILABLE_ASSIGNEES[0],
  ]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeButtonRef = useRef<HTMLButtonElement>(null);
  const [assigneeDropdownPos, setAssigneeDropdownPos] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (editData) {
      setTaskName(editData.task);
      setStartDate(editData.nextDate);
      setPriority(editData.priority.toLowerCase());
      setCategory(editData.category);
    }
  }, [editData]);

  useEffect(() => {
    let animationFrameId: number;

    const updatePositions = () => {
      if (showStartCalendar && startDateInputRef.current) {
        const rect = startDateInputRef.current.getBoundingClientRect();
        setStartCalendarPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }

      if (showEndCalendar && endDateInputRef.current) {
        const rect = endDateInputRef.current.getBoundingClientRect();
        setEndCalendarPos({
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

      if (showStartCalendar || showEndCalendar || showAssigneeDropdown) {
        animationFrameId = requestAnimationFrame(updatePositions);
      }
    };

    if (showStartCalendar || showEndCalendar || showAssigneeDropdown) {
      updatePositions();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showStartCalendar, showEndCalendar, showAssigneeDropdown]);

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

  const removeAssignee = (index: number) => {
    setSelectedAssignees((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartDateSelect = (day: number) => {
    const selected = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day,
    );
    setSelectedStartDate(selected);
    const formatted = format(selected, "MM/dd/yyyy");
    setStartDate(formatted);
    setShowStartCalendar(false);
  };

  const handleEndDateSelect = (day: number) => {
    const selected = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day,
    );
    setSelectedEndDate(selected);
    const formatted = format(selected, "MM/dd/yyyy");
    setEndDate(formatted);
    setShowEndCalendar(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[694px] p-8 gap-0">
        <div className="flex flex-col gap-4">
          {/* Title */}
          <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px]">
            {editData ? "Edit Recurring Task" : "Create Recurring Task"}
          </DialogTitle>

          {/* Task Name */}
          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-5">
              Task Name <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Input
                placeholder="Type Task Name"
                className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5] placeholder:text-[#A1A1A9] placeholder:normal-case pr-10"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-5">
              Description
            </label>
            <Textarea
              placeholder="Insert Description Here"
              className="min-h-[169px] rounded-lg bg-[#F7F7F7] border-[#E5E5E5] placeholder:text-[#A1A1A9] placeholder:normal-case resize-none"
            />
          </div>

          {/* Property and Unit Row */}
          <div className="flex gap-3 w-full">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Property
              </label>
              <Select>
                <SelectTrigger className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5]">
                  <SelectValue
                    placeholder="Select Property"
                    className="text-[#A1A1A9] normal-case"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property1">22 Indian Chase Dr</SelectItem>
                  <SelectItem value="property2">Property 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Unit
              </label>
              <Select>
                <SelectTrigger className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5]">
                  <SelectValue
                    placeholder="Select Unit If Applicable"
                    className="text-[#A1A1A9] normal-case"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit1">Unit 1</SelectItem>
                  <SelectItem value="unit2">Unit 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due After and Repeat Row */}
          <div className="flex gap-3 w-full">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Due After
              </label>
              <Input
                placeholder="Insert Number Of Days"
                type="number"
                className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5] placeholder:text-[#A1A1A9] placeholder:normal-case"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Repeat
              </label>
              <Select>
                <SelectTrigger className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5]">
                  <SelectValue
                    placeholder="Daily, Monthly, Or Yearly, Etc"
                    className="text-[#A1A1A9] normal-case"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Date and End Row */}
          <div className="flex gap-3 w-full">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Start Date <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Input
                  ref={startDateInputRef}
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={startDate}
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
                    setStartDate(value);
                    const parsed = parse(value, "MM/dd/yyyy", new Date());
                    if (isValid(parsed)) {
                      setSelectedStartDate(parsed);
                      setCalendarMonth(parsed);
                    }
                  }}
                  maxLength={10}
                  className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5] placeholder:text-[#A1A1A9]"
                />
                <button
                  onClick={() => setShowStartCalendar(!showStartCalendar)}
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

                {showStartCalendar &&
                  createPortal(
                    <div
                      className="bg-white flex flex-col gap-3 p-4"
                      style={{
                        width: "280px",
                        border: "0.5px solid #DADADA",
                        borderRadius: "8px",
                        boxShadow:
                          "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
                        zIndex: 99999,
                        position: "fixed",
                        top: startCalendarPos.top + "px",
                        left: startCalendarPos.left + "px",
                        pointerEvents: "auto",
                      }}
                      onMouseLeave={() => setShowStartCalendar(false)}
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
                              day !== null && handleStartDateSelect(day)
                            }
                            disabled={day === null}
                            className={`w-8 h-8 flex items-center justify-center text-xs rounded transition-colors ${
                              day === null
                                ? "text-transparent cursor-default"
                                : selectedStartDate &&
                                    selectedStartDate.getDate() === day &&
                                    selectedStartDate.getMonth() ===
                                      calendarMonth.getMonth() &&
                                    selectedStartDate.getFullYear() ===
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
              <label className="text-[#303030] font-medium text-sm leading-5">
                End
              </label>
              <div className="relative">
                <Input
                  ref={endDateInputRef}
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={endDate}
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
                    setEndDate(value);
                    const parsed = parse(value, "MM/dd/yyyy", new Date());
                    if (isValid(parsed)) {
                      setSelectedEndDate(parsed);
                      setCalendarMonth(parsed);
                    }
                  }}
                  maxLength={10}
                  className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5] placeholder:text-[#A1A1A9]"
                />
                <button
                  onClick={() => setShowEndCalendar(!showEndCalendar)}
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

                {showEndCalendar &&
                  createPortal(
                    <div
                      className="bg-white flex flex-col gap-3 p-4"
                      style={{
                        width: "280px",
                        border: "0.5px solid #DADADA",
                        borderRadius: "8px",
                        boxShadow:
                          "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
                        zIndex: 99999,
                        position: "fixed",
                        top: endCalendarPos.top + "px",
                        left: endCalendarPos.left + "px",
                        pointerEvents: "auto",
                      }}
                      onMouseLeave={() => setShowEndCalendar(false)}
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
                              day !== null && handleEndDateSelect(day)
                            }
                            disabled={day === null}
                            className={`w-8 h-8 flex items-center justify-center text-xs rounded transition-colors ${
                              day === null
                                ? "text-transparent cursor-default"
                                : selectedEndDate &&
                                    selectedEndDate.getDate() === day &&
                                    selectedEndDate.getMonth() ===
                                      calendarMonth.getMonth() &&
                                    selectedEndDate.getFullYear() ===
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
          </div>

          {/* Assignees */}
          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-5">
              Assignees <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <button
                ref={assigneeButtonRef}
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                className="h-11 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  {selectedAssignees.length === 0 ? (
                    <span className="text-[#A1A1A9] text-sm">
                      Select assignees
                    </span>
                  ) : (
                    selectedAssignees.map((assignee, index) => (
                      <div
                        key={`${assignee.id}-${index}`}
                        className="flex w-[22px] h-[22px] justify-center items-center rounded-full bg-white border border-[#2463EB]"
                      >
                        <span className="text-[#2463EB] font-semibold text-[9px] leading-4">
                          {assignee.initials}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
              </button>

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

          {/* Priority and Category Row */}
          <div className="flex gap-3 w-full">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Priority
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5]">
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-2xl"
                    style={{ backgroundColor: getPriorityBgColor() }}
                  >
                    {getPriorityIcon()}
                    <span
                      className="text-sm normal-case"
                      style={{ color: getPriorityTextColor() }}
                    >
                      {getPriorityLabel()}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Category
              </label>
              <Select>
                <SelectTrigger className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5]">
                  <SelectValue
                    placeholder="Select Category"
                    className="text-[#A1A1A9] normal-case"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category1">Maintenance</SelectItem>
                  <SelectItem value="category2">Repair</SelectItem>
                  <SelectItem value="category3">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Create/Update Recurring Task Button */}
          <button className="flex h-9 justify-center items-center gap-2 rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors mt-0">
            <span className="text-white font-medium text-base">
              {editData ? "Update Recurring Task" : "Create Recurring Task"}
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
