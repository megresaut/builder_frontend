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
import { ChevronDown, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import {
  format,
  parse,
  isValid,
  getDaysInMonth,
  startOfMonth,
  getDay,
} from "date-fns";
import CreateTaskModal from "./CreateTaskModal";

interface Assignee {
  id: string;
  name: string;
  initials: string;
}

interface CreateWorkOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    task: string;
    dueDate: string;
    priority: string;
    status: string;
  };
}

const AVAILABLE_ASSIGNEES: Assignee[] = [
  { id: "1", name: "David Harris", initials: "DH" },
  { id: "2", name: "Sarah Johnson", initials: "SJ" },
  { id: "3", name: "Michael Chen", initials: "MC" },
  { id: "4", name: "Emily Rodriguez", initials: "ER" },
  { id: "5", name: "James Wilson", initials: "JW" },
];

export default function CreateWorkOrderModal({
  open,
  onOpenChange,
  editData,
}: CreateWorkOrderModalProps) {
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [task, setTask] = useState("");
  const [status, setStatus] = useState("inprogress");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");
  const [selectedDueDate, setSelectedDueDate] = useState<Date | null>(null);
  const [showDueDateCalendar, setShowDueDateCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const [dueDateCalendarPos, setDueDateCalendarPos] = useState({
    top: 0,
    left: 0,
  });
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
    task?: boolean;
    dueDate?: boolean;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: { task?: boolean; dueDate?: boolean } = {};
    if (!task.trim()) {
      newErrors.task = true;
    }
    if (!dueDate.trim()) {
      newErrors.dueDate = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log("Form submitted", { task, dueDate, priority, status });
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (editData) {
      setTask(editData.task);
      setDueDate(editData.dueDate);
      setPriority(editData.priority.toLowerCase());
      setStatus(editData.status === "In progress" ? "inprogress" : "completed");
    }
  }, [editData]);

  useEffect(() => {
    let animationFrameId: number;

    const updatePositions = () => {
      if (showDueDateCalendar && dueDateInputRef.current) {
        const rect = dueDateInputRef.current.getBoundingClientRect();
        setDueDateCalendarPos({
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

      if (showDueDateCalendar || showAssigneeDropdown) {
        animationFrameId = requestAnimationFrame(updatePositions);
      }
    };

    if (showDueDateCalendar || showAssigneeDropdown) {
      updatePositions();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showDueDateCalendar, showAssigneeDropdown]);

  const getStatusIcon = () => {
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
          stroke="#2463EB"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const getPriorityIcon = () => {
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
          stroke="#2463EB"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const getStatusLabel = () => {
    const labels: Record<string, string> = {
      inprogress: "In progress",
      completed: "Completed",
    };
    return labels[status] || "In progress";
  };

  const getPriorityLabel = () => {
    const labels: Record<string, string> = {
      low: "Low",
      normal: "Normal",
      high: "High",
    };
    return labels[priority] || "Normal";
  };

  const getStatusBgColor = () => {
    const colors: Record<string, string> = {
      inprogress: "#dbe9fe",
      completed: "#d1fae5",
    };
    return colors[status] || "#dbe9fe";
  };

  const getStatusTextColor = () => {
    const colors: Record<string, string> = {
      inprogress: "#2463eb",
      completed: "#059669",
    };
    return colors[status] || "#2463eb";
  };

  const getPriorityBgColor = () => {
    const colors: Record<string, string> = {
      low: "#d1fae5",
      normal: "#dbe9fe",
      high: "#fef3c7",
    };
    return colors[priority] || "#dbe9fe";
  };

  const getPriorityTextColor = () => {
    const colors: Record<string, string> = {
      low: "#059669",
      normal: "#2463eb",
      high: "#d97706",
    };
    return colors[priority] || "#2463eb";
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

  const handleDueDateSelect = (day: number) => {
    const selected = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day,
    );
    setSelectedDueDate(selected);
    const formatted = format(selected, "MM/dd/yyyy");
    setDueDate(formatted);
    setShowDueDateCalendar(false);
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

  const handleCreateTaskModalOpenChange = (isOpen: boolean) => {
    setShowCreateTaskModal(isOpen);
    if (!isOpen) {
      // When task modal closes, reopen the work order modal
      // (only if we manually closed the task modal)
    }
  };

  return (
    <>
      <Dialog open={open && !showCreateTaskModal} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[694px] p-8 gap-0 max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px]">
                {editData ? "Edit Work Order" : "Create Work Order"}
              </DialogTitle>
              <p className="text-[#717179] font-medium text-base leading-4">
                Create a task before a new work order, or connect to an existing
                task
              </p>
            </div>

            {/* Property and Unit Row */}
            <div className="flex gap-3 w-full">
              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <label className="text-[#303030] font-medium text-sm leading-5">
                  Property <span className="text-red-600">*</span>
                </label>
                <Select>
                  <SelectTrigger className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5]">
                    <SelectValue
                      placeholder="Select Property"
                      className="text-[#A1A1A9]"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="property1">
                      22 Indian Chase Dr
                    </SelectItem>
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
                      className="text-[#A1A1A9]"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit1">Unit 1</SelectItem>
                    <SelectItem value="unit2">Unit 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Task Section - "Add to Task" */}
            <div className="flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Add to Task <span className="text-red-600">*</span>
              </label>
              <Select>
                <SelectTrigger className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5]">
                  <SelectValue
                    placeholder="Select Task Or Create A New Task"
                    className="text-[#A1A1A9]"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task1">Task 1</SelectItem>
                  <SelectItem value="task2">Task 2</SelectItem>
                </SelectContent>
              </Select>
              <label className="text-[#303030] font-medium text-sm leading-5">
                <span
                  className="text-[#2463EB] cursor-pointer hover:underline"
                  onClick={() => setShowCreateTaskModal(true)}
                >
                  + Create New Task
                </span>
              </label>
            </div>

            {/* Work Order Details Header */}
            <div className="mt-2">
              <p className="text-[#717179] font-medium text-base leading-4">
                Work Order Details
              </p>
            </div>

            {/* WO Property and Unit Row */}
            <div className="flex gap-3 w-full">
              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <label className="text-[#303030] font-medium text-sm leading-5">
                  Property <span className="text-red-600">*</span>
                </label>
                <Select>
                  <SelectTrigger className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5]">
                    <SelectValue
                      placeholder="Select Property"
                      className="text-[#A1A1A9]"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="property1">
                      22 Indian Chase Dr
                    </SelectItem>
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
                      className="text-[#A1A1A9]"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit1">Unit 1</SelectItem>
                    <SelectItem value="unit2">Unit 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Work Order Name and Vendor Row */}
            <div className="flex gap-3 w-full">
              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <label className="text-[#303030] font-medium text-sm leading-5">
                  Work Order Name <span className="text-red-600">*</span>
                </label>
                <Input
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="Type Work Order Name"
                  className={`h-11 rounded-lg bg-[#F7F7F7] placeholder:text-[#A1A1A9] ${
                    errors.task ? "border-red-500 border-2" : "border-[#E5E5E5]"
                  }`}
                />
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <label className="text-[#303030] font-medium text-sm leading-5">
                  Vendor <span className="text-red-600">*</span>
                </label>
                <Select>
                  <SelectTrigger className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5]">
                    <SelectValue
                      placeholder="Select Vendor"
                      className="text-[#A1A1A9]"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor1">Vendor 1</SelectItem>
                    <SelectItem value="vendor2">Vendor 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status and Priority Row */}
            <div className="flex gap-3 w-full">
              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <label className="text-[#303030] font-medium text-sm leading-5">
                  Status
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5]">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getStatusTextColor() }}
                      />
                      <span
                        className="text-sm tracking-[-0.28px] leading-[1.4] text-[#303030]"
                      >
                        {getStatusLabel()}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inprogress">In progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                      <span
                        className="text-sm tracking-[-0.28px] leading-[1.4] text-[#303030]"
                      >
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

            {/* Due Date */}
            <div className="flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-5">
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
                      setSelectedDueDate(parsed);
                      setCalendarMonth(parsed);
                    }
                  }}
                  maxLength={10}
                  className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5] placeholder:text-[#A1A1A9]"
                />
                <button
                  onClick={() => setShowDueDateCalendar(!showDueDateCalendar)}
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

                {showDueDateCalendar &&
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
                        top: dueDateCalendarPos.top + "px",
                        left: dueDateCalendarPos.left + "px",
                        pointerEvents: "auto",
                      }}
                      onMouseLeave={() => setShowDueDateCalendar(false)}
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
                              day !== null && handleDueDateSelect(day)
                            }
                            disabled={day === null}
                            className={`w-8 h-8 flex items-center justify-center text-xs rounded transition-colors ${
                              day === null
                                ? "text-transparent cursor-default"
                                : selectedDueDate &&
                                    selectedDueDate.getDate() === day &&
                                    selectedDueDate.getMonth() ===
                                      calendarMonth.getMonth() &&
                                    selectedDueDate.getFullYear() ===
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

            {/* Work Order Notes */}
            <div className="flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Work Order Notes
              </label>
              <Textarea
                placeholder="Notes for your work Order"
                className="min-h-[169px] rounded-lg bg-[#F7F7F7] border-[#E5E5E5] placeholder:text-[#A1A1A9] resize-none"
              />
            </div>

            {/* Upload File */}
            <div className="flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Upload file
              </label>
              <div className="border border-dashed border-[#121212]/40 rounded-lg bg-white flex flex-col items-center justify-center py-8 px-4 gap-3">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FBFBFB] border border-[#DADADA] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4 text-[#303030]" />
                  <span className="text-[#303030] font-normal text-base">
                    Upload
                  </span>
                </button>
                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-[#09090B] font-normal text-xs leading-4">
                    Choose a file or drag & drop it here
                  </p>
                  <p className="text-[#09090B] font-normal text-xs leading-4">
                    Maximum 500 MB file size
                  </p>
                </div>
              </div>
            </div>

            {/* Create/Update Button */}
            <button className="flex h-9 justify-center items-center gap-2 rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors mt-0">
              <span className="text-white font-medium text-base">
                {editData ? "Update Work Order" : "Create New Work Order"}
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Modal */}
      <CreateTaskModal
        open={showCreateTaskModal}
        onOpenChange={handleCreateTaskModalOpenChange}
      />
    </>
  );
}
