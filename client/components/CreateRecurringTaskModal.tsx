import { useState, useEffect } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import {
  TextField,
  SelectField,
  TextAreaField,
  DateField,
  MultiSelectField,
  NumberField,
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
  const [collaborators, setCollaborators] = useState<MultiSelectOption[]>([]);
  const [property, setProperty] = useState("");
  const [unit, setUnit] = useState("");
  const [dueAfterValue, setDueAfterValue] = useState("");
  const [dueAfterUnit, setDueAfterUnit] = useState("days");
  const [repeat, setRepeat] = useState("monthly");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endCondition, setEndCondition] = useState("never");
  const [endAfterTimes, setEndAfterTimes] = useState("");
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<
    MultiSelectOption[]
  >([]);
  const [priority, setPriority] = useState("normal");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setTaskName("");
      setDescription("");
      setCollaborators([]);
      setProperty("");
      setUnit("");
      setDueAfterValue("");
      setDueAfterUnit("days");
      setRepeat("monthly");
      setStartDate(null);
      setEndCondition("never");
      setEndAfterTimes("");
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
        dueAfter: `${dueAfterValue} ${dueAfterUnit}`,
        repeat,
        startDate,
        endCondition,
        endAfterTimes: endCondition === "after" ? endAfterTimes : null,
        endDate: endCondition === "onDate" ? endDate : null,
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
          confirmLabel={
            editData ? "Update Recurring Task" : "Create Recurring Task"
          }
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
            rows={4}
          />
        </FormSection>

        <FormSection title="Property & Scheduling">
          {/* Property and Unit in same row */}
          <div className="grid grid-cols-2 gap-4">
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
              placeholder="Select Unit"
              options={[
                { value: "unit1", label: "Unit 1" },
                { value: "unit2", label: "Unit 2" },
              ]}
              disabled={!property}
            />
          </div>

          {/* Due After with days/weeks/months selector */}
          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Due After"
              value={dueAfterValue}
              onChange={(e) => setDueAfterValue(e.target.value)}
              placeholder="Enter number"
            />
            <SelectField
              label="Unit"
              value={dueAfterUnit}
              onChange={setDueAfterUnit}
              options={[
                { value: "days", label: "days" },
                { value: "weeks", label: "weeks" },
                { value: "months", label: "months" },
              ]}
            />
          </div>

          {/* Repeat field */}
          <SelectField
            label="Repeat"
            value={repeat}
            onChange={setRepeat}
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly" },
            ]}
          />

          {/* Start Date */}
          <DateField
            label="Start Date"
            required
            value={startDate}
            onChange={setStartDate}
            error={errors.startDate}
            placeholder="mm/dd/yyyy"
          />

          {/* End Condition with conditional fields */}
          <SelectField
            label="End"
            value={endCondition}
            onChange={setEndCondition}
            options={[
              { value: "never", label: "Never" },
              { value: "after", label: "After" },
              { value: "onDate", label: "On date" },
            ]}
          />

          {endCondition === "after" && (
            <NumberField
              label="After"
              value={endAfterTimes}
              onChange={(e) => setEndAfterTimes(e.target.value)}
              placeholder="Enter number"
              description="time(s)"
            />
          )}

          {endCondition === "onDate" && (
            <DateField
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              placeholder="mm/dd/yyyy"
            />
          )}
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
}
