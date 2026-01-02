import { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import {
  TextField,
  SelectField,
  TextAreaField,
  DateField,
  MultiSelectField,
  type MultiSelectOption,
} from "@/components/forms";

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

const AVAILABLE_ASSIGNEES: MultiSelectOption[] = [
  { id: "1", label: "David Harris", initials: "DH" },
  { id: "2", label: "Sarah Johnson", initials: "SJ" },
  { id: "3", label: "Michael Chen", initials: "MC" },
  { id: "4", label: "Emily Rodriguez", initials: "ER" },
  { id: "5", label: "James Wilson", initials: "JW" },
];

export default function CreateRecurringTaskModal({
  open,
  onOpenChange,
  editData,
}: CreateRecurringTaskModalProps) {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [property, setProperty] = useState("");
  const [unit, setUnit] = useState("");
  const [dueAfter, setDueAfter] = useState("");
  const [repeat, setRepeat] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<MultiSelectOption[]>([]);
  const [priority, setPriority] = useState("normal");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setTaskName("");
      setDescription("");
      setProperty("");
      setUnit("");
      setDueAfter("");
      setRepeat("");
      setStartDate(null);
      setEndDate(null);
      setSelectedAssignees([]);
      setPriority("normal");
      setCategory("");
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (editData) {
      setTaskName(editData.task);
      setPriority(editData.priority.toLowerCase());
      setCategory(editData.category);
      if (editData.nextDate) {
        const date = new Date(editData.nextDate);
        setStartDate(date);
      }
    }
  }, [editData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!taskName.trim()) {
      newErrors.taskName = "Task Name is required";
    }
    if (!startDate) {
      newErrors.startDate = "Start Date is required";
    }
    if (selectedAssignees.length === 0) {
      newErrors.selectedAssignees = "At least one assignee is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log("Form submitted", {
        taskName,
        description,
        property,
        unit,
        dueAfter,
        repeat,
        startDate,
        endDate,
        selectedAssignees,
        priority,
        category,
      });
      onOpenChange(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={editData ? "Edit Recurring Task" : "Create Recurring Task"}
      size="lg"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={editData ? "Update Recurring Task" : "Create Recurring Task"}
        />
      }
    >
      <FormLayout>
        <FormSection showDivider={false}>
          <TextField
            label="Task Name"
            required
            value={taskName}
            onChange={setTaskName}
            error={errors.taskName}
            placeholder="Type Task Name"
          />
          <TextAreaField
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Insert Description Here"
            rows={6}
          />
        </FormSection>

        <FormSection title="Property & Scheduling">
          <SelectField
            label="Property"
            value={property}
            onChange={setProperty}
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
          <TextField
            label="Due After"
            value={dueAfter}
            onChange={setDueAfter}
            type="number"
            placeholder="Insert Number Of Days"
          />
          <SelectField
            label="Repeat"
            value={repeat}
            onChange={setRepeat}
            placeholder="Daily, Monthly, Or Yearly, Etc"
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly" },
            ]}
          />
          <DateField
            label="Start Date"
            required
            value={startDate}
            onChange={setStartDate}
            error={errors.startDate}
            placeholder="mm/dd/yyyy"
          />
          <DateField
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            placeholder="mm/dd/yyyy"
          />
        </FormSection>

        <FormSection title="Assignment & Priority">
          <MultiSelectField
            label="Assignees"
            required
            value={selectedAssignees}
            onChange={setSelectedAssignees}
            error={errors.selectedAssignees}
            placeholder="Select assignees"
            options={AVAILABLE_ASSIGNEES}
          />
          <SelectField
            label="Priority"
            value={priority}
            onChange={setPriority}
            options={[
              { value: "low", label: "Low" },
              { value: "normal", label: "Normal" },
              { value: "high", label: "High" },
            ]}
          />
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
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
}
