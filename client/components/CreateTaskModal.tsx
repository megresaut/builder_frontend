import { useState, useRef, useEffect } from "react";
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
import {
  ModalTemplate,
  ModalButtons,
  ModalField,
  FieldRow,
  FieldRowItem,
} from "@/components/ui/ModalTemplate";
import { createPortal } from "react-dom";

const ErrorMessage: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", fontWeight: 400 }}>
      {message}
    </div>
  );
};

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
  const [unit, setUnit] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("normal");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<Assignee[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
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
  const [errorMessages, setErrorMessages] = useState<{
    property?: string;
    title?: string;
    dueDate?: string;
    selectedAssignees?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: {
      property?: boolean;
      title?: boolean;
      dueDate?: boolean;
      selectedAssignees?: boolean;
    } = {};
    const newErrorMessages: {
      property?: string;
      title?: string;
      dueDate?: string;
      selectedAssignees?: string;
    } = {};

    if (!property.trim()) {
      newErrors.property = true;
      newErrorMessages.property = "Property is required";
    }
    if (!title.trim()) {
      newErrors.title = true;
      newErrorMessages.title = "Task name is required";
    }
    if (!selectedDate) {
      newErrors.dueDate = true;
      newErrorMessages.dueDate = "Due date is required";
    }
    if (selectedAssignees.length === 0) {
      newErrors.selectedAssignees = true;
      newErrorMessages.selectedAssignees = "At least one assignee is required";
    }

    setErrors(newErrors);
    setErrorMessages(newErrorMessages);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log("Form submitted", {
        property,
        unit,
        title,
        priority,
        dueDate: selectedDate ? format(selectedDate, "MM/dd/yyyy") : "",
        selectedAssignees,
        category,
        description,
      });
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
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
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      onClose={handleCancel}
      title={editData ? "Edit Task" : "Create Task"}
      size="lg"
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={editData ? "Update Task" : "Create Task"}
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Property and Unit Row */}
        <FieldRow columns={2}>
          <FieldRowItem>
            <ModalField label="Property *">
              <Select
                value={property}
                onValueChange={(value) => {
                  setProperty(value);
                  if (errors.property && value.trim()) {
                    setErrors((prev) => ({ ...prev, property: false }));
                    setErrorMessages((prev) => ({ ...prev, property: undefined }));
                  }
                }}
              >
                <SelectTrigger
                  style={{
                    borderColor: errors.property ? "#ef4444" : "var(--color-border-light)",
                    borderWidth: errors.property ? "2px" : "1px",
                  }}
                  className="h-11 rounded-lg"
                >
                  <SelectValue
                    placeholder="Select Property"
                    className="capitalize"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property1">22 Indian Chase Dr</SelectItem>
                  <SelectItem value="property2">Property 2</SelectItem>
                </SelectContent>
              </Select>
              <ErrorMessage message={errorMessages.property} />
            </ModalField>
          </FieldRowItem>
          <FieldRowItem>
            <ModalField label="Unit">
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Select Unit If Applicable" className="capitalize" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit1">Unit 1</SelectItem>
                  <SelectItem value="unit2">Unit 2</SelectItem>
                </SelectContent>
              </Select>
            </ModalField>
          </FieldRowItem>
        </FieldRow>

        {/* Task Name and Priority Row */}
        <FieldRow columns={2}>
          <FieldRowItem>
            <ModalField label="Task Name *">
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title && e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, title: false }));
                    setErrorMessages((prev) => ({ ...prev, title: undefined }));
                  }
                }}
                placeholder="Type Task Name"
                style={{
                  borderColor: errors.title ? "#ef4444" : "var(--color-border-light)",
                  borderWidth: errors.title ? "2px" : "1px",
                }}
                className="h-11 rounded-lg"
              />
              <ErrorMessage message={errorMessages.title} />
            </ModalField>
          </FieldRowItem>
          <FieldRowItem>
            <ModalField label="Priority *">
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-11 rounded-lg">
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
            </ModalField>
          </FieldRowItem>
        </FieldRow>

        {/* Due Date and Assignees Row */}
        <FieldRow columns={2}>
          <FieldRowItem>
            <ModalField label="Due Date *">
              <DatePicker
                value={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  if (errors.dueDate && date) {
                    setErrors((prev) => ({ ...prev, dueDate: false }));
                    setErrorMessages((prev) => ({ ...prev, dueDate: undefined }));
                  }
                }}
                error={errors.dueDate}
                placeholder="MM/DD/YYYY"
              />
              <ErrorMessage message={errorMessages.dueDate} />
            </ModalField>
          </FieldRowItem>
          <FieldRowItem>
            <ModalField label="Assignees *">
              <div className="relative">
                <button
                  ref={assigneeButtonRef}
                  onClick={() => {
                    setShowAssigneeDropdown(!showAssigneeDropdown);
                    if (errors.selectedAssignees) {
                      setErrors((prev) => ({ ...prev, selectedAssignees: false }));
                      setErrorMessages((prev) => ({ ...prev, selectedAssignees: undefined }));
                    }
                  }}
                  style={{
                    height: "44px",
                    borderRadius: "8px",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    paddingTop: "8px",
                    paddingBottom: "8px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    border: errors.selectedAssignees ? "2px solid #ef4444" : "1px solid var(--color-border-light)",
                    transition: "background-color 0.2s",
                  }}
                  className="hover:bg-gray-50"
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
                      <span style={{ color: "var(--color-text-placeholder)", fontSize: "14px" }}>
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
                </button>

                {showAssigneeDropdown &&
                  createPortal(
                    <div
                      className="bg-white flex flex-col justify-start items-start p-2 gap-1"
                      style={{
                        width: "280px",
                        borderColor: "var(--color-border-default)",
                        borderWidth: "0.5px",
                        borderStyle: "solid",
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
                              <span style={{ color: "var(--color-text-primary)", fontWeight: 400, fontSize: "14px" }}>
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
            </ModalField>
          </FieldRowItem>
        </FieldRow>

        {/* Category */}
        <ModalField label="Category">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 rounded-lg">
              <SelectValue placeholder="Select Category" className="capitalize" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="repair">Repair</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </ModalField>

        {/* Description */}
        <ModalField label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Insert Description Here"
            className="min-h-[169px] rounded-lg resize-none"
          />
        </ModalField>
      </div>
    </ModalTemplate>
  );
}
