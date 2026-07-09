import React, { useState, useEffect, useMemo } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { TextField } from "@/components/forms/TextField";
import { SelectField } from "@/components/forms/SelectField";
import { DateField } from "@/components/forms/DateField";
import { DateTimeField } from "@/components/forms/DateTimeField";
import { NumberField } from "@/components/forms/NumberField";
import { ComboboxFieldWithCustomInput } from "@/components/forms/ComboboxFieldWithCustomInput";
import { DEFAULT_INSPECTION_TEMPLATES } from "@/data/inspections";
import {
  BackendInspectionChecklist,
  InspectionFrequency,
  InspectionRecurrenceInput,
} from "@/api/inspections";
import { FieldManager } from "./Inspections";
import { useConflictCheck } from "@/hooks/useConflictCheck";
import ConflictWarningBanner from "@/components/ConflictWarningBanner";

export interface EditingInspection {
  id: number;
  inspectionName: string;
  templateName: string;
  inspectorId: number | null;
  dueISO: string; // ISO8601 with time
}

interface ScheduleInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldManagers: FieldManager[];
  templates: BackendInspectionChecklist[];
  onConfirm: (
    fieldManager: FieldManager,
    dueDateISO: string,
    templateName: string,
    inspectionName: string,
    recurrence: InspectionRecurrenceInput | null,
  ) => void;
  // When set, the modal runs in edit mode: recurrence UI is hidden and the
  // footer dispatches onSave with the existing inspection id instead of onConfirm.
  editing?: EditingInspection | null;
  onSave?: (
    id: number,
    fieldManager: FieldManager,
    dueDateISO: string,
    templateName: string,
    inspectionName: string,
  ) => void;
}

export default function ScheduleInspectionModal({
  open,
  onOpenChange,
  fieldManagers,
  templates,
  onConfirm,
  editing,
  onSave,
}: ScheduleInspectionModalProps) {
  const isEditing = !!editing;
  const [inspectionName, setInspectionName] = useState<string>("");
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  // Stored as ISO string "YYYY-MM-DDTHH:MM" from DateTimeField.
  const [dueDateTime, setDueDateTime] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  // When true, the inspection is created with no checklist; only general
  // photos can be attached. Sends an empty templateName to the parent.
  const [noTemplate, setNoTemplate] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<InspectionFrequency>("monthly");
  const [intervalCount, setIntervalCount] = useState<number>(1);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Conflict check against the picked start time (1h reservation, matches backend).
  const conflictUserIds = selectedManagerId ? [Number(selectedManagerId)] : [];
  const conflictStart = dueDateTime ? new Date(dueDateTime).toISOString() : undefined;
  const conflictEnd = dueDateTime
    ? new Date(new Date(dueDateTime).getTime() + 60 * 60 * 1000).toISOString()
    : undefined;
  const { conflicts } = useConflictCheck(conflictUserIds, conflictStart, conflictEnd);

  useEffect(() => {
    if (!open) {
      setInspectionName("");
      setSelectedManagerId("");
      setDueDateTime("");
      setSelectedTemplate("");
      setNoTemplate(false);
      setIsRecurring(false);
      setFrequency("monthly");
      setIntervalCount(1);
      setEndDate(null);
      setErrors({});
      return;
    }
    // Prefill from `editing` when opening in edit mode. DateTimeField wants
    // "YYYY-MM-DDTHH:MM" in local time.
    if (editing) {
      setInspectionName(editing.inspectionName);
      setSelectedTemplate(editing.templateName);
      setNoTemplate(!editing.templateName);
      setSelectedManagerId(editing.inspectorId != null ? String(editing.inspectorId) : "");
      const d = new Date(editing.dueISO);
      const pad = (n: number) => String(n).padStart(2, "0");
      setDueDateTime(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
      );
    }
  }, [open, editing]);

  const handleConfirm = () => {
    const newErrors: Record<string, string> = {};
    if (!inspectionName.trim()) newErrors.inspectionName = "Please enter an inspection name";
    if (!noTemplate && !selectedTemplate) newErrors.template = "Please select or create a template";
    if (!selectedManagerId) newErrors.fieldManager = "Please select a field manager";
    if (!dueDateTime) newErrors.dueDate = "Please select a date and time";
    if (isRecurring) {
      if (intervalCount < 1) newErrors.interval = "Interval must be at least 1";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const manager = fieldManagers.find((fm) => fm.id.toString() === selectedManagerId);
    if (!manager || !dueDateTime) return;

    const startISO = new Date(dueDateTime).toISOString();
    // Templateless inspections send an empty name; the parent treats this
    // as "no checklist" and creates the inspection with checklist_id=null.
    const templateNameToSend = noTemplate ? "" : selectedTemplate;

    if (isEditing && editing && onSave) {
      onSave(editing.id, manager, startISO, templateNameToSend, inspectionName);
      return;
    }

    const recurrence: InspectionRecurrenceInput | null = isRecurring
      ? {
          frequency,
          interval_count: intervalCount,
          end_at: endDate ? endDate.toISOString() : null,
        }
      : null;

    onConfirm(manager, startISO, templateNameToSend, inspectionName, recurrence);
  };

  const fieldManagerOptions = fieldManagers.map((fm) => ({
    value: fm.id.toString(),
    label: fm.name,
  }));

  const templateOptions = useMemo(
    () => templates.map((t) => ({ value: t.name, label: t.name })),
    [templates],
  );

  const frequencyOptions: { value: InspectionFrequency; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Inspection" : "Schedule Inspection"}
      size="md"
      footer={
        <ModalButtons
          cancelLabel="Cancel"
          confirmLabel={isEditing ? "Save" : isRecurring ? "Schedule Series" : "Schedule"}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleConfirm}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <TextField
          label="Inspection Name"
          value={inspectionName}
          onChange={(e) => {
            setInspectionName(e.target.value);
            setErrors((prev) => ({ ...prev, inspectionName: "" }));
          }}
          placeholder="e.g., Monthly Building Inspection"
          error={errors.inspectionName}
        />

        <div className="flex flex-col gap-2">
          {!noTemplate && (
            <ComboboxFieldWithCustomInput
              label="Inspection Template"
              options={templateOptions}
              value={selectedTemplate}
              onChange={(value) => {
                setSelectedTemplate(value);
                setErrors((prev) => ({ ...prev, template: "" }));
              }}
              placeholder="Select or create a template"
              customInputPlaceholder="Enter new template name"
              customButtonLabel="template"
              error={errors.template}
            />
          )}
          <label className="flex items-center gap-2 text-sm text-[#303030]">
            <input
              type="checkbox"
              checked={noTemplate}
              onChange={(e) => {
                setNoTemplate(e.target.checked);
                if (e.target.checked) {
                  setSelectedTemplate("");
                  setErrors((prev) => ({ ...prev, template: "" }));
                }
              }}
              className="h-4 w-4"
            />
            No template — just upload photos
          </label>
        </div>

        <SelectField
          label="Field Manager"
          options={fieldManagerOptions}
          value={selectedManagerId}
          onChange={(value) => {
            setSelectedManagerId(value as string);
            setErrors((prev) => ({ ...prev, fieldManager: "" }));
          }}
          placeholder="Select a field manager"
          error={errors.fieldManager}
        />

        <DateTimeField
          label="Date & Time"
          required
          value={dueDateTime}
          onChange={(v) => {
            setDueDateTime(v);
            setErrors((prev) => ({ ...prev, dueDate: "" }));
          }}
          error={errors.dueDate}
        />

        {!isEditing && (
          <label className="flex items-center gap-2 text-sm text-[#303030]">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4"
            />
            Repeat this inspection
          </label>
        )}

        {!isEditing && isRecurring && (
          <div className="flex flex-col gap-4 pl-6 border-l-2 border-[#E5E5E5]">
            <SelectField
              label="Frequency"
              options={frequencyOptions}
              value={frequency}
              onChange={(v) => setFrequency(v as InspectionFrequency)}
              placeholder="Select frequency"
            />

            <NumberField
              label={`Every N ${frequency === "daily" ? "days" : frequency === "weekly" ? "weeks" : "months"}`}
              value={intervalCount}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setIntervalCount(Number.isNaN(n) ? 1 : n);
              }}
              min={1}
              error={errors.interval}
            />

            <DateField
              label="End Date (optional)"
              value={endDate}
              onChange={(date) => setEndDate(date instanceof Date ? date : date ? new Date(date) : null)}
              placeholder="Leave blank to generate up to 52 occurrences"
              returnFormat="Date"
            />
          </div>
        )}

        <ConflictWarningBanner conflicts={conflicts} />
      </div>
    </ModalTemplate>
  );
}
