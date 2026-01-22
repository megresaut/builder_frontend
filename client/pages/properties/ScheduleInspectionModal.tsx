import React, { useState, useEffect } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { SelectField } from "@/components/forms/SelectField";
import { DateField } from "@/components/forms/DateField";
import { FieldManager } from "./Inspections";

interface ScheduleInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldManagers: FieldManager[];
  onConfirm: (fieldManager: FieldManager, dueDate: string) => void;
}

export default function ScheduleInspectionModal({
  open,
  onOpenChange,
  fieldManagers,
  onConfirm,
}: ScheduleInspectionModalProps) {
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedManagerId("");
      setDueDate(null);
      setErrors({});
    }
  }, [open]);

  const handleConfirm = () => {
    const newErrors: Record<string, string> = {};

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
      onConfirm(selectedManager, fullDate);
    }
  };

  const fieldManagerOptions = fieldManagers.map((fm) => ({
    value: fm.id.toString(),
    label: fm.name,
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
