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
import { X } from "lucide-react";
import { format } from "date-fns";

interface Assignee {
  id: string;
  name: string;
  initials: string;
}

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    title: string;
    due: string;
    priority: string;
  };
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
  editData,
}: CreateTaskModalProps) {
  const [property, setProperty] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("normal");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<Assignee[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeButtonRef = useRef<HTMLButtonElement>(null);
  const [assigneeDropdownPos, setAssigneeDropdownPos] = useState({
    top: 0,
    left: 0,
  });
  const [errors, setErrors] = useState<{
    property?: boolean;
    title?: boolean;
    dueDate?: boolean;
    selectedAssignees?: boolean;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: {
      property?: boolean;
      title?: boolean;
      dueDate?: boolean;
      selectedAssignees?: boolean;
    } = {};
    if (!property.trim()) {
      newErrors.property = true;
    }
    if (!title.trim()) {
      newErrors.title = true;
    }
    if (!selectedDate) {
      newErrors.dueDate = true;
    }
    if (selectedAssignees.length === 0) {
      newErrors.selectedAssignees = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log("Form submitted", {
        property,
        title,
        priority,
        dueDate: selectedDate ? format(selectedDate, "MM/dd/yyyy") : "",
        selectedAssignees,
      });
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (editData) {
      setTitle(editData.title);
      setPriority(editData.priority.toLowerCase());
    }
  }, [editData]);

  useEffect(() => {
    let animationFrameId: number;

    const updatePositions = () => {
      if (showAssigneeDropdown && assigneeButtonRef.current) {
        const rect = assigneeButtonRef.current.getBoundingClientRect();
        setAssigneeDropdownPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }

      if (showAssigneeDropdown) {
        animationFrameId = requestAnimationFrame(updatePositions);
      }
    };

    if (showAssigneeDropdown) {
      updatePositions();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showAssigneeDropdown]);

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
    if (errors.dueDate) {
      setErrors((prev) => ({ ...prev, dueDate: false }));
    }
    setShowCalendar(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[694px] p-0 gap-0">
        <div className="flex flex-col gap-4 p-6">
          {/* Title */}
          <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px]">
            {editData ? "Edit Task" : "Create Task"}
          </DialogTitle>

          {/* Property and Unit Row */}
          <div className="flex gap-3 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-[#303030] font-medium text-sm leading-5">
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
                <SelectTrigger
                  className={`h-11 rounded-lg ${
                    errors.property
                      ? "border-red-500 border-2"
                      : "border-[#E5E5E5]"
                  }`}
                >
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
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title && e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, title: false }));
                  }
                }}
                placeholder="Type Task Name"
                className={`h-11 rounded-lg placeholder:text-[#A1A1A9] placeholder:capitalize ${
                  errors.title ? "border-red-500 border-2" : "border-[#E5E5E5]"
                }`}
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Priority <span className="text-red-600">*</span>
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-11 rounded-lg border-[#E5E5E5]">
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-2xl"
                    style={{ backgroundColor: getPriorityBgColor() }}
                  >
                    {getPriorityIcon()}
                    <span
                      className="text-sm capitalize"
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
          </div>

          {/* Due Date and Assignees Row */}
          <div className="flex gap-3 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Due Date <span className="text-red-600">*</span>
              </label>
              <DatePicker
                value={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  if (errors.dueDate && date) {
                    setErrors((prev) => ({ ...prev, dueDate: false }));
                  }
                }}
                error={errors.dueDate}
                placeholder="MM/DD/YYYY"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Assignees <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <div
                  ref={assigneeButtonRef}
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className={`h-11 rounded-lg w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors bg-white cursor-pointer ${
                    errors.selectedAssignees
                      ? "border-red-500 border-2"
                      : "border border-[#E5E5E5]"
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
                      <span className="text-[#A1A1A9] text-sm">
                        Select assignees
                      </span>
                    ) : (
                      selectedAssignees.map((assignee) => (
                        <div
                          key={assignee.id}
                          className="flex items-center gap-1 bg-white rounded-full border border-[#2463EB] px-2 py-0.5"
                        >
                          <div className="flex w-[18px] h-[18px] justify-center items-center rounded-full bg-[#2463EB]">
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
                          >
                            <X className="w-3 h-3 text-[#2463EB]" />
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

          {/* Create/Update Task Button */}
          <button
            onClick={handleSubmit}
            disabled={
              !property.trim() ||
              !title.trim() ||
              !dueDate.trim() ||
              selectedAssignees.length === 0
            }
            className="flex h-9 justify-center items-center gap-2 rounded-lg border border-white bg-[#002D5A] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003d7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-white font-medium text-base">
              {editData ? "Update Task" : "Create Task"}
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
