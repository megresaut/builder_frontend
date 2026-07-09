import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { SelectField } from "@/components/forms/SelectField";
import { NumberField } from "@/components/forms/NumberField";
import { DateField } from "@/components/forms/DateField";
import {
  getInspectionSeries,
  updateInspectionSeries,
  InspectionFrequency,
  BackendInspectionSeries,
} from "@/api/inspections";

interface EditSeriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesId: number | null;
  onSaved?: (series: BackendInspectionSeries) => void;
}

const frequencyOptions: { value: InspectionFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function EditSeriesModal({
  open,
  onOpenChange,
  seriesId,
  onSaved,
}: EditSeriesModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [frequency, setFrequency] = useState<InspectionFrequency>("weekly");
  const [intervalCount, setIntervalCount] = useState<number>(1);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !seriesId) return;
    setLoading(true);
    setErrors({});
    getInspectionSeries(seriesId)
      .then((series) => {
        setFrequency(series.frequency);
        setIntervalCount(series.interval_count);
        setEndDate(series.end_at ? new Date(series.end_at) : null);
      })
      .catch((err) => {
        console.error("Failed to load inspection series:", err);
        toast.error("Couldn't load this series for editing.");
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, seriesId]);

  const handleConfirm = async () => {
    if (!seriesId) return;
    if (intervalCount < 1) {
      setErrors({ interval: "Interval must be at least 1" });
      return;
    }
    setSaving(true);
    try {
      const updated = await updateInspectionSeries(seriesId, {
        frequency,
        interval_count: intervalCount,
        end_at: endDate ? endDate.toISOString() : null,
      });
      toast.success("Series updated. Not-yet-started inspections were re-scheduled under the new cadence; in-progress or completed ones were left as-is.");
      onSaved?.(updated);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to update inspection series:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update series.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Series"
      size="md"
      footer={
        <ModalButtons
          cancelLabel="Cancel"
          confirmLabel={saving ? "Saving..." : "Save"}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleConfirm}
        />
      }
    >
      {loading ? (
        <div className="text-sm text-[#6b7280] py-4">Loading series...</div>
      ) : (
        <div className="flex flex-col gap-4">
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

          <p className="text-xs text-[#6b7280]">
            Not-yet-started inspections in this series will be deleted and regenerated under the new
            cadence. Inspections that are in progress, submitted, or reviewed are never touched.
          </p>
        </div>
      )}
    </ModalTemplate>
  );
}
