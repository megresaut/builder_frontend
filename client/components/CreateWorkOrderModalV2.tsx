import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
      // Reset form
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
  };

  const handleCancel = () => {
    onOpenChange(false);
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-8 gap-0 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px]">
              Create Work Order
            </DialogTitle>
          </div>

          {/* Task Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[#303030] font-semibold text-lg">Task</h3>

            {/* Property and Unit Row */}
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Select Property"
                required
                value={formData.property}
                onChange={handlePropertyChange}
                placeholder="Select a Property"
                options={PROPERTIES.map((prop) => ({
                  value: prop,
                  label: prop,
                }))}
                error={errors.property}
              />

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
            </div>

            {/* Create Task */}
            <SelectField
              label="Create Task"
              required
              value={formData.task}
              onChange={handleTaskChange}
              placeholder="Select Task Or Create A New Task"
              options={TASKS.map((task) => ({
                value: task,
                label: task,
              }))}
              error={errors.task}
            />
          </div>

          {/* Work Order Details Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[#303030] font-semibold text-lg">Work Order Details</h3>

            {/* Work Order Name and Vendor Row */}
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Work Order Name"
                required
                value={formData.workOrderName}
                onChange={handleWorkOrderNameChange}
                placeholder="Type Work Order Name"
                error={errors.workOrderName}
              />

              <SelectField
                label="Select Vendor"
                required
                value={formData.vendor}
                onChange={handleVendorChange}
                placeholder="Select a Vendor"
                options={VENDORS.map((vendor) => ({
                  value: vendor,
                  label: vendor,
                }))}
                error={errors.vendor}
              />
            </div>

            {/* Status and Priority Row */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Due Date */}
            <DateField
              label="Due Date"
              required
              value={formData.dueDate}
              onChange={handleDueDateChange}
              placeholder="mm/dd/yyyy"
              error={errors.dueDate}
            />

            {/* Notes */}
            <TextAreaField
              label="Notes"
              value={formData.notes}
              onChange={handleNotesChange}
              placeholder="Notes for your work Order"
              autoGrow
            />

            {/* File Upload */}
            <FileUploadField
              label="Upload File"
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={500}
              onFilesSelected={() => {}}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end mt-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#303030] font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded-lg bg-[#2463EB] text-white font-medium text-sm hover:bg-[#1d4cc8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!formData.property || !formData.task || !formData.workOrderName || !formData.vendor || !formData.dueDate}
            >
              Create Work Order
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
