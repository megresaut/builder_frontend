import React, { useState, useEffect } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { SelectField } from "@/components/forms/SelectField";
import { DateField } from "@/components/forms/DateField";
import { ComboboxFieldWithCustomInput } from "@/components/forms/ComboboxFieldWithCustomInput";
import { DEFAULT_INSPECTION_TEMPLATES } from "@/data/inspections";
import { FieldManager } from "./Inspections";

interface ScheduleInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldManagers: FieldManager[];
  onConfirm: (fieldManager: FieldManager, dueDate: string, templateName: string, inspectionName: string) => void;
}

export default function ScheduleInspectionModal({
  open,
  onOpenChange,
  fieldManagers,
  onConfirm,
}: ScheduleInspectionModalProps) {
  const [inspectionName, setInspectionName] = useState<string>("");
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setInspectionName("");
      setSelectedManagerId("");
      setDueDate(null);
      setSelectedTemplate("");
      setErrors({});
    }
  }, [open]);

  const handleConfirm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedTemplate) {
      newErrors.template = "Please select or create a template";
    }
    if (!selectedManagerId) {
      newErrors.fieldManager = "Please select a field manager";
    }
    if (!dueDate) {
      newErrors.dueDate = "Please select a due date";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedManager = fieldManagers.find(
      (fm) => fm.id.toString() === selectedManagerId
    );

    if (selectedManager && dueDate) {
      // Convert date to full date format (e.g., "Nov 15, 2025")
      const fullDate = dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      onConfirm(selectedManager, fullDate, selectedTemplate);
    }
  };

  const fieldManagerOptions = fieldManagers.map((fm) => ({
    value: fm.id.toString(),
    label: fm.name,
  }));

  const templateOptions = DEFAULT_INSPECTION_TEMPLATES.map((template) => ({
    value: template.id,
    label: template.name,
  }));

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Schedule Inspection"
      size="md"
      footer={
        <ModalButtons
          cancelLabel="Cancel"
          confirmLabel="Schedule"
          onCancel={() => onOpenChange(false)}
          onConfirm={handleConfirm}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <ComboboxFieldWithCustomInput
          label="Inspection Template"
          options={templateOptions}
          value={selectedTemplate}
          onChange={(value) => {
            setSelectedTemplate(value);
            setErrors((prev) => {
              const updated = { ...prev };
              delete updated.template;
              return updated;
            });
          }}
          placeholder="Select or create a template"
          customInputPlaceholder="Enter new template name"
          customButtonLabel="+ Create new template"
          error={errors.template}
        />

        <SelectField
          label="Field Manager"
          options={fieldManagerOptions}
          value={selectedManagerId}
          onChange={(value) => {
            setSelectedManagerId(value as string);
            setErrors((prev) => {
              const updated = { ...prev };
              delete updated.fieldManager;
              return updated;
            });
          }}
          placeholder="Select a field manager"
          error={errors.fieldManager}
        />

        <DateField
          label="Monthly Due Date"
          value={dueDate}
          onChange={(date) => {
            setDueDate(date instanceof Date ? date : date ? new Date(date) : null);
            setErrors((prev) => {
              const updated = { ...prev };
              delete updated.dueDate;
              return updated;
            });
          }}
          error={errors.dueDate}
          placeholder="Select a Due Date"
          returnFormat="Date"
        />
      </div>
    </ModalTemplate>
  );
}
