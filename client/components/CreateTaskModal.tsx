import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { format, parse, isValid, getDaysInMonth, startOfMonth, getDay } from "date-fns";

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Assignee {
  id: string;
  name: string;
  initials: string;
}

const AVAILABLE_ASSIGNEES: Assignee[] = [
  { id: "1", name: "David Harris", initials: "DH" },
  { id: "2", name: "Sarah Johnson", initials: "SJ" },
  { id: "3", name: "Michael Chen", initials: "MC" },
  { id: "4", name: "Emily Rodriguez", initials: "ER" },
  { id: "5", name: "James Wilson", initials: "JW" },
];

export default function CreateTaskModal({
  open,
  onOpenChange,
}: CreateTaskModalProps) {
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });
  const [selectedAssignees, setSelectedAssignees] = useState<Assignee[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeButtonRef = useRef<HTMLButtonElement>(null);
  const [assigneeDropdownPos, setAssigneeDropdownPos] = useState({ top: 0, left: 0 });

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

  const removeAssignee = (assigneeId: string) => {
    setSelectedAssignees((prev) => prev.filter((a) => a.id !== assigneeId));
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
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
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[694px] p-0 gap-0">
        <div className="flex flex-col gap-4 p-6">
          {/* Title */}
          <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px]">
            Create Task
          </DialogTitle>

          {/* Property and Unit Row */}
          <div className="flex gap-3 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Property <span className="text-red-600">*</span>
              </label>
              <Select>
                <SelectTrigger className="h-11 rounded-lg border-[#E5E5E5]">
                  <SelectValue
                    placeholder="Select Property"
                    className="text-[#A1A1A9] capitalize"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property1">22 Indian Chase Dr</SelectItem>
                  <SelectItem value="property2">Property 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Unit
              </label>
              <Select>
                <SelectTrigger className="h-11 rounded-lg border-[#E5E5E5]">
                  <SelectValue
                    placeholder="Select Unit If Applicable"
                    className="text-[#A1A1A9] capitalize"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit1">Unit 1</SelectItem>
                  <SelectItem value="unit2">Unit 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task Name and Priority Row */}
          <div className="flex gap-3 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Task Name <span className="text-red-600">*</span>
              </label>
              <Input
                placeholder="Type Task Name"
                className="h-11 rounded-lg border-[#E5E5E5] placeholder:text-[#A1A1A9] placeholder:capitalize"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Priority <span className="text-red-600">*</span>
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-11 rounded-lg border-[#E5E5E5]">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-2xl" style={{ backgroundColor: getPriorityBgColor() }}>
                    {getPriorityIcon()}
                    <span className="text-sm capitalize" style={{ color: getPriorityTextColor() }}>
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
          </div>

          {/* Due Date and Assignees Row */}
          <div className="flex gap-3 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Due Date <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Input
                  type="date"
                  placeholder="MM/DD/YYYY"
                  className="h-11 rounded-lg border-[#E5E5E5] placeholder:text-[#A1A1A9] placeholder:capitalize"
                />
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
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
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Assignees <span className="text-red-600">*</span>
              </label>
              <Select>
                <SelectTrigger className="h-11 rounded-lg border-[#E5E5E5]">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex w-[22px] h-[22px] justify-center items-center rounded-full border border-[#2463EB]">
                      <span className="text-[#2463EB] font-semibold text-[9px]">
                        DH
                      </span>
                    </div>
                    <div className="flex w-[22px] h-[22px] justify-center items-center rounded-full border border-[#2463EB]">
                      <span className="text-[#2463EB] font-semibold text-[9px]">
                        DH
                      </span>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignee1">Assignee 1</SelectItem>
                  <SelectItem value="assignee2">Assignee 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-5">
              Category
            </label>
            <Select>
              <SelectTrigger className="h-11 rounded-lg border-[#E5E5E5]">
                <SelectValue
                  placeholder="Select Category"
                  className="text-[#A1A1A9] capitalize"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category1">Maintenance</SelectItem>
                <SelectItem value="category2">Repair</SelectItem>
                <SelectItem value="category3">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-5">
              Description
            </label>
            <Textarea
              placeholder="Insert Description Here"
              className="min-h-[169px] rounded-lg border-[#E5E5E5] placeholder:text-[#A1A1A9] placeholder:capitalize resize-none"
            />
          </div>

          {/* Create Task Button */}
          <button className="flex h-9 justify-center items-center gap-2 rounded-lg border border-white bg-[#002D5A] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003d7a] transition-colors">
            <span className="text-white font-medium text-base">
              Create Task
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
