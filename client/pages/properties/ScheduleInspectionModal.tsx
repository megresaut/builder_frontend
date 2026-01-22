import React, { useState, useEffect } from "react";
import { ModalTemplate, ModalField, ModalButtons } from "@/components/ui/ModalTemplate";
import { SelectField } from "@/components/forms/SelectField";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
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
  const [dueDate, setDueDate] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedManagerId("");
      setDueDate("");
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

    if (selectedManager) {
      onConfirm(selectedManager, dueDate);
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

        <FieldShell
          label="Monthly Due Date"
          error={errors.dueDate}
          htmlFor="due-date"
        >
          <Input
            id="due-date"
            type="month"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              setErrors((prev) => {
                const updated = { ...prev };
                delete updated.dueDate;
                return updated;
              });
            }}
            style={{
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 1)",
              borderColor: errors.dueDate ? "#dc2626" : "rgba(229, 229, 229, 1)",
              borderStyle: "solid",
              borderWidth: "1px",
              padding: "8px 12px",
              fontSize: "16px",
              fontWeight: 400,
              letterSpacing: "-0.32px",
              lineHeight: 1.4,
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              color: "#303030",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </FieldShell>

        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p>
            This will create an upcoming inspection scheduled for the selected month. 
            The inspection name will be "{new Date().toLocaleDateString("en-US", { month: "long" })} Inspection" 
            and the field manager will be assigned to conduct it.
          </p>
        </div>
      </div>
    </ModalTemplate>
  );
}
