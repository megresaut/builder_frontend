import { useState, useEffect } from "react";
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
import { format } from "date-fns";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import {
  FormLayout,
  FormSection,
  FormFieldRow,
} from "@/components/ui/form-layout";
import {
  TextField,
  TextAreaField,
  SelectField,
  MultiSelectField,
  type MultiSelectOption,
} from "@/components/forms";

const ErrorMessage: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", fontWeight: 400 }}>
      {message}
    </div>
  );
};

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    title: string;
    due: string;
    priority: string;
  };
}

const AVAILABLE_ASSIGNEES: MultiSelectOption[] = [
  { id: "1", label: "David Harris", initials: "DH" },
  { id: "2", label: "Sarah Johnson", initials: "SJ" },
  { id: "3", label: "Michael Chen", initials: "MC" },
  { id: "4", label: "Emily Rodriguez", initials: "ER" },
  { id: "5", label: "James Wilson", initials: "JW" },
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
  const [selectedAssignees, setSelectedAssignees] = useState<MultiSelectOption[]>([]);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
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
    if (open) {
      // When modal opens with editData, populate it
      if (editData) {
        setTitle(editData.title);
        setPriority(editData.priority.toLowerCase());
      }
    } else {
      // When modal closes, clear all form state and errors
      setProperty("");
      setUnit("");
      setTitle("");
      setPriority("normal");
      setSelectedDate(null);
      setDueDate("");
      setSelectedAssignees([]);
      setCategory("");
      setDescription("");
      setErrors({});
      setErrorMessages({});
    }
  }, [open, editData]);

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
      {/* Property and Unit Row */}
      <FieldRow columns={2}>
        <FieldRowItem>
          <ModalField label="Property *" spacing="tight">
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
            <ModalField label="Unit" spacing="tight">
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
          <ModalField label="Task Name *" spacing="tight">
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
            <ModalField label="Priority *" spacing="tight">
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

      {/* Assignees and Due Date Row */}
      <FieldRow columns={2}>
        <FieldRowItem>
          <MultiSelectField
            label="Assignees"
            required
            value={selectedAssignees}
            onChange={(newAssignees) => {
              setSelectedAssignees(newAssignees);
              if (errors.selectedAssignees && newAssignees.length > 0) {
                setErrors((prev) => ({ ...prev, selectedAssignees: false }));
                setErrorMessages((prev) => ({ ...prev, selectedAssignees: undefined }));
              }
            }}
            error={errorMessages.selectedAssignees}
            placeholder="Select assignees"
            options={AVAILABLE_ASSIGNEES}
          />
        </FieldRowItem>
        <FieldRowItem>
          <ModalField label="Due Date *" spacing="tight">
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
      </FieldRow>

      {/* Category */}
      <ModalField label="Category" spacing="tight">
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
      <ModalField label="Description" spacing="tight">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Insert Description Here"
            className="min-h-[169px] rounded-lg resize-none"
          />
      </ModalField>
    </ModalTemplate>
  );
}
