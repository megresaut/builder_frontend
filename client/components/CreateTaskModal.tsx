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
      <FormLayout>
        <FormSection title="Task Details" showDivider={true}>
          <FormFieldRow columns={2}>
            <SelectField
              label="Property"
              required
              value={property}
              onChange={(value) => {
                setProperty(value);
                if (errors.property && value.trim()) {
                  setErrors((prev) => ({ ...prev, property: false }));
                  setErrorMessages((prev) => ({ ...prev, property: undefined }));
                }
              }}
              error={errorMessages.property}
              placeholder="Select Property"
              options={[
                { value: "property1", label: "22 Indian Chase Dr" },
                { value: "property2", label: "Property 2" },
              ]}
            />
            <SelectField
              label="Unit"
              value={unit}
              onChange={setUnit}
              placeholder="Select Unit If Applicable"
              options={[
                { value: "unit1", label: "Unit 1" },
                { value: "unit2", label: "Unit 2" },
              ]}
            />
          </FormFieldRow>

          <FormFieldRow columns={2}>
            <TextField
              label="Task Name"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title && e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, title: false }));
                  setErrorMessages((prev) => ({ ...prev, title: undefined }));
                }
              }}
              error={errorMessages.title}
              placeholder="Type Task Name"
            />
            <SelectField
              label="Priority"
              required
              value={priority}
              onChange={setPriority}
              placeholder="Select Priority"
              options={[
                { value: "low", label: "Low" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "High" },
              ]}
            />
          </FormFieldRow>
        </FormSection>

        <FormSection title="Assignment" showDivider={true}>
          <FormFieldRow columns={2}>
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
            <SelectField
              label="Due Date"
              required
              value={dueDate}
              onChange={setDueDate}
              error={errorMessages.dueDate}
              placeholder="MM/DD/YYYY"
              options={[
                { value: "today", label: "Today" },
                { value: "tomorrow", label: "Tomorrow" },
              ]}
            />
          </FormFieldRow>
        </FormSection>

        <FormSection title="Additional Information" showDivider={true}>
          <SelectField
            label="Category"
            value={category}
            onChange={setCategory}
            placeholder="Select Category"
            options={[
              { value: "maintenance", label: "Maintenance" },
              { value: "repair", label: "Repair" },
              { value: "other", label: "Other" },
            ]}
          />

          <TextAreaField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Insert Description Here"
          />
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
}
