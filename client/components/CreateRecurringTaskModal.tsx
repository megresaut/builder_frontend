import { useState, useRef, useEffect } from "react";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { X, ChevronDown } from "lucide-react";
import { format } from "date-fns";

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
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
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
  const [errors, setErrors] = useState<{
    taskName?: boolean;
    startDate?: boolean;
    selectedAssignees?: boolean;
  }>({});

  useEffect(() => {
    if (editData) {
      setTaskName(editData.task);
      setStartDate(editData.nextDate);
      setPriority(editData.priority.toLowerCase());
      setCategory(editData.category);
    }
  }, [editData]);

  const validateForm = (): boolean => {
    const newErrors: {
      taskName?: boolean;
      startDate?: boolean;
      selectedAssignees?: boolean;
    } = {};
    if (!taskName.trim()) {
      newErrors.taskName = true;
    }
    if (!startDate.trim()) {
      newErrors.startDate = true;
    }
    if (selectedAssignees.length === 0) {
      newErrors.selectedAssignees = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Handle submit logic here
      console.log("Form submitted", {
        taskName,
        startDate,
        priority,
        category,
      });
      onOpenChange(false);
    }
  };

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
      let newAssignees;
      if (isSelected) {
        newAssignees = prev.filter((a) => a.id !== assignee.id);
      } else {
        newAssignees = [...prev, assignee];
      }
      if (errors.selectedAssignees && newAssignees.length > 0) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          selectedAssignees: false,
        }));
      }
      return newAssignees;
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
    if (errors.startDate) {
      setErrors((prev) => ({ ...prev, startDate: false }));
    }
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
    if (errors.endDate) {
      setErrors((prev) => ({ ...prev, endDate: false }));
    }
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
                value={taskName}
                onChange={(e) => {
                  setTaskName(e.target.value);
                  if (errors.taskName && e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, taskName: false }));
                  }
                }}
                placeholder="Type Task Name"
                className={`h-11 rounded-lg bg-[#F7F7F7] placeholder:text-[#A1A1A9] placeholder:normal-case pr-10 ${
                  errors.taskName
                    ? "border-red-500 border-2"
                    : "border-[#E5E5E5]"
                }`}
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
              <DatePicker
                value={selectedStartDate}
                onChange={(date) => {
                  setSelectedStartDate(date);
                  if (errors.startDate && date) {
                    setErrors((prev) => ({ ...prev, startDate: false }));
                  }
                }}
                error={errors.startDate}
                placeholder="MM/DD/YYYY"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-5">
                End
              </label>
              <DatePicker
                value={selectedEndDate}
                onChange={setSelectedEndDate}
                placeholder="MM/DD/YYYY"
              />
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
                className={`h-11 rounded-lg bg-[#F7F7F7] w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors ${
                  errors.selectedAssignees
                    ? "border-red-500 border-2"
                    : "border border-[#E5E5E5]"
                }`}
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
          <button
            onClick={handleSubmit}
            disabled={
              !taskName.trim() ||
              !startDate.trim() ||
              selectedAssignees.length === 0
            }
            className="flex h-9 justify-center items-center gap-2 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors mt-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-white font-medium text-base">
              {editData ? "Update Recurring Task" : "Create Recurring Task"}
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
