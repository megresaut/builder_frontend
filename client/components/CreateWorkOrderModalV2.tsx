import { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalButtons,
  ModalSubheader,
  FieldRow,
  FieldRowItem,
} from "@/components/ui/ModalTemplate";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { DateField } from "@/components/forms/DateField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { FileUploadField } from "@/components/forms/FileUploadField";

interface CreateWorkOrderModalV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROPERTIES = ["22 Indian Creek Dr", "25 Park Ave", "100 Main St"];
const UNITS = ["N/A", "1", "2", "3", "4", "5"];
const TASKS = ["Task 1", "Task 2", "Task 3", "Task 4"];
const VENDORS = ["David Smith", "Elite HVAC", "ABC Plumbing", "Green Lawn Services", "Spark Electrical"];
const STATUSES = ["In progress", "Completed", "Pending"];
const PRIORITIES = ["Low", "Normal", "High"];

export default function CreateWorkOrderModalV2({
  open,
  onOpenChange,
}: CreateWorkOrderModalV2Props) {
  const [formData, setFormData] = useState({
    property: "",
    unit: "",
    task: "",
    workOrderName: "",
    vendor: "",
    status: "In progress",
    priority: "Normal",
    dueDate: null as Date | null,
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setFormData({
        property: "",
        unit: "",
        task: "",
        workOrderName: "",
        vendor: "",
        status: "In progress",
        priority: "Normal",
        dueDate: null,
        notes: "",
      });
      setErrors({});
    }
  }, [open]);

  const handlePropertyChange = (value: string) => {
    setFormData((prev) => ({ ...prev, property: value }));
    if (errors.property) {
      setErrors((prev) => ({ ...prev, property: "" }));
    }
  };

  const handleUnitChange = (value: string) => {
    setFormData((prev) => ({ ...prev, unit: value }));
  };

  const handleTaskChange = (value: string) => {
    setFormData((prev) => ({ ...prev, task: value }));
    if (errors.task) {
      setErrors((prev) => ({ ...prev, task: "" }));
    }
  };

  const handleWorkOrderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, workOrderName: e.target.value }));
    if (errors.workOrderName) {
      setErrors((prev) => ({ ...prev, workOrderName: "" }));
    }
  };

  const handleVendorChange = (value: string) => {
    setFormData((prev) => ({ ...prev, vendor: value }));
    if (errors.vendor) {
      setErrors((prev) => ({ ...prev, vendor: "" }));
    }
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handlePriorityChange = (value: string) => {
    setFormData((prev) => ({ ...prev, priority: value }));
  };

  const handleDueDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, dueDate: date }));
    if (errors.dueDate) {
      setErrors((prev) => ({ ...prev, dueDate: "" }));
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, notes: e.target.value }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.property.trim()) {
      newErrors.property = "Property is required";
    }
    if (!formData.task.trim()) {
      newErrors.task = "Task is required";
    }
    if (!formData.workOrderName.trim()) {
      newErrors.workOrderName = "Work Order Name is required";
    }
    if (!formData.vendor.trim()) {
      newErrors.vendor = "Vendor is required";
    }
    if (!formData.dueDate) {
      newErrors.dueDate = "Due Date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      console.log("Work Order Created:", formData);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Create Work Order"
      size="md"
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          cancelLabel="Cancel"
          confirmLabel="Create Work Order"
        />
      }
    >
      {/* Task Section */}
      <ModalSubheader>Task</ModalSubheader>

      <FieldRow columns={2}>
        <FieldRowItem>
          <SelectField
            label="Select Property"
            value={formData.property}
            onChange={handlePropertyChange}
            placeholder="Select a Property"
            options={PROPERTIES.map((prop) => ({
              value: prop,
              label: prop,
            }))}
            error={errors.property}
          />
        </FieldRowItem>
        <FieldRowItem>
          <SelectField
            label="Select Unit"
            value={formData.unit}
            onChange={handleUnitChange}
            placeholder="Select a Unit"
            options={UNITS.map((unit) => ({
              value: unit,
              label: unit,
            }))}
          />
        </FieldRowItem>
      </FieldRow>

      <SelectField
        label="Create Task"
        value={formData.task}
        onChange={handleTaskChange}
        placeholder="Select Task Or Create A New Task"
        options={TASKS.map((task) => ({
          value: task,
          label: task,
        }))}
        error={errors.task}
      />

      {/* Work Order Details Section */}
      <ModalSubheader>Work Order Details</ModalSubheader>

      <FieldRow columns={2}>
        <FieldRowItem>
          <TextField
            label="Work Order Name"
            value={formData.workOrderName}
            onChange={handleWorkOrderNameChange}
            placeholder="Type Work Order Name"
            error={errors.workOrderName}
          />
        </FieldRowItem>
        <FieldRowItem>
          <SelectField
            label="Select Vendor"
            value={formData.vendor}
            onChange={handleVendorChange}
            placeholder="Select a Vendor"
            options={VENDORS.map((vendor) => ({
              value: vendor,
              label: vendor,
            }))}
            error={errors.vendor}
          />
        </FieldRowItem>
      </FieldRow>

      <FieldRow columns={2}>
        <FieldRowItem>
          <SelectField
            label="Status"
            value={formData.status}
            onChange={handleStatusChange}
            placeholder="Select a Status"
            options={STATUSES.map((status) => ({
              value: status,
              label: status,
            }))}
          />
        </FieldRowItem>
        <FieldRowItem>
          <SelectField
            label="Priority"
            value={formData.priority}
            onChange={handlePriorityChange}
            placeholder="Select a Priority"
            options={PRIORITIES.map((priority) => ({
              value: priority,
              label: priority,
            }))}
          />
        </FieldRowItem>
      </FieldRow>

      <DateField
        label="Due Date"
        value={formData.dueDate}
        onChange={handleDueDateChange}
        placeholder="mm/dd/yyyy"
        error={errors.dueDate}
      />

      <TextAreaField
        label="Notes"
        value={formData.notes}
        onChange={handleNotesChange}
        placeholder="Notes for your work Order"
        autoGrow
      />

      <FileUploadField
        label="Upload File"
        accept=".pdf,.jpg,.jpeg,.png"
        maxSize={500}
        onFilesSelected={() => {}}
      />
    </ModalTemplate>
  );
}
