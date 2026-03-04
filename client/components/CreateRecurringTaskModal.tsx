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
  PrioritySelectField,
  PropertyLocationCombobox,
} from "@/components/forms";
import { fetchJSON } from "@/api/fetchJSON";
import { useAuth } from "@/auth/useAuth";

interface CreateRecurringTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: number;
    task: string;
    series: RecurringSeriesDetail;
  };
  /** When opening for create (no editData), preselect this property (e.g. from property page). */
  defaultPropertyId?: number;
}

interface SimpleProperty {
  id: number;
  name?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  locations_count?: number;
}

interface SimpleUnit {
  id: number;
  unit_name: string;
}

interface Assignee {
  id: number;
  name: string;
  email?: string;
}

interface AssigneeInfo {
  id: number;
  name: string;
  initials: string;
}

interface RecurringSeriesDetail {
  id: number;
  property_id: number;
  unit_id: number | null;
  assignees: AssigneeInfo[];
  collaborators: AssigneeInfo[];
  priority: string | null;
  category: string | null;
  frequency: string;
  interval: number;
  by_day: string[];
  day_of_month: number | null;
  week_of_month: number | null;
  weekday_of_month: string | null;
  start_date: string;
  end_date: string | null;
  due_after_days: number;
  active: boolean;
}

export default function CreateRecurringTaskModal({
  open,
  onOpenChange,
  editData,
  defaultPropertyId,
}: CreateRecurringTaskModalProps) {
  const { userId } = useAuth();
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [collaborators, setCollaborators] = useState<MultiSelectOption[]>([]);
  const [property, setProperty] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<SimpleProperty[]>([]);
  const [units, setUnits] = useState<SimpleUnit[]>([]);
  const [availableAssignees, setAvailableAssignees] = useState<Assignee[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  const splitDueAfterDays = (days: number) => {
    if (!days || days <= 0) {
      return { value: "", unit: "days" };
    }
    if (days % 30 === 0) {
      return { value: String(days / 30), unit: "months" };
    }
    if (days % 7 === 0) {
      return { value: String(days / 7), unit: "weeks" };
    }
    return { value: String(days), unit: "days" };
  };

  const resolveRepeatValue = (frequency: string, interval: number) => {
    if (frequency === "daily") {
      return "daily";
    }
    if (frequency === "weekly") {
      return interval === 2 ? "biweekly" : "weekly";
    }
    if (frequency === "monthly") {
      if (interval === 2) return "bimonthly";
      if (interval === 3) return "quarterly";
      if (interval === 6) return "semiannual";
      return "monthly";
    }
    if (frequency === "yearly") {
      return "yearly";
    }
    return "monthly";
  };

  useEffect(() => {
    if (!open) {
      setTaskName("");
      setDescription("");
      setCollaborators([]);
      setProperty("");
      setSelectedLocationId(null);
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
      setIsSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && !editData && defaultPropertyId != null) {
      setProperty(String(defaultPropertyId));
    }
  }, [open, editData, defaultPropertyId]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadOptions() {
      try {
        const [propsRes, assigneesRes] = await Promise.all([
          fetchJSON("/properties").catch(() => []),
          fetchJSON("/users/property-managers").catch(() => []),
        ]);

        if (cancelled) return;

        setProperties(propsRes || []);
        setAvailableAssignees(
          (assigneesRes || []).map((u: any) => ({
            id: Number(u.id),
            name: u.name || u.email,
            email: u.email,
          }))
        );
      } catch (err) {
        console.error("Failed to load options:", err);
      }
    }

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !property) {
      setUnits([]);
      setUnit(""); // Reset unit when property changes
      return;
    }

    let cancelled = false;

    async function loadUnits() {
      try {
        setUnitsLoading(true);
        const propertyId = Number(property);
        const data = await fetchJSON(`/properties/${propertyId}/units`).catch(() => []);

        if (!cancelled) {
          setUnits(data || []);
        }
      } catch (err) {
        console.error("Failed to load units:", err);
      } finally {
        if (!cancelled) {
          setUnitsLoading(false);
        }
      }
    }

    loadUnits();
    return () => {
      cancelled = true;
    };
  }, [open, property]);

  useEffect(() => {
    if (editData && availableAssignees.length > 0) {
      const series = editData.series;
      setTaskName(editData.task || "Recurring Task");
      setDescription("");
      setProperty(String(series.property_id));
      setUnit(series.unit_id ? String(series.unit_id) : "");

      const dueAfter = splitDueAfterDays(series.due_after_days);
      setDueAfterValue(dueAfter.value);
      setDueAfterUnit(dueAfter.unit);

      setRepeat(resolveRepeatValue(series.frequency, series.interval));
      setStartDate(series.start_date ? new Date(series.start_date) : null);

      if (series.end_date) {
        setEndCondition("onDate");
        setEndDate(new Date(series.end_date));
        setEndAfterTimes("");
      } else {
        setEndCondition("never");
        setEndDate(null);
        setEndAfterTimes("");
      }

      // Match assignees from editData with availableAssignees by ID
      const assigneeOptions: MultiSelectOption[] = (series.assignees || [])
        .map((a) => {
          const available = availableAssignees.find((av) => av.id === a.id);
          if (available) {
            return {
              id: String(available.id),
              label: available.name,
              initials: available.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2),
            };
          }
          // Fallback to API data if not found in availableAssignees
          return {
            id: String(a.id),
            label: a.name,
            initials: a.initials,
          };
        })
        .filter((opt) => opt !== null) as MultiSelectOption[];
      setSelectedAssignees(assigneeOptions);

      // Match collaborators from editData with availableAssignees by ID
      const collaboratorOptions: MultiSelectOption[] = (series.collaborators || [])
        .map((c) => {
          const available = availableAssignees.find((av) => av.id === c.id);
          if (available) {
            return {
              id: String(available.id),
              label: available.name,
              initials: available.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2),
            };
          }
          // Fallback to API data if not found in availableAssignees
          return {
            id: String(c.id),
            label: c.name,
            initials: c.initials,
          };
        })
        .filter((opt) => opt !== null) as MultiSelectOption[];
      setCollaborators(collaboratorOptions);

      // Map backend priority to frontend priority (medium -> normal)
      const backendPriority = series.priority?.toLowerCase() ?? "medium";
      const reversePriorityMap: Record<"low" | "medium" | "high" | "urgent", "normal" | "low" | "high" | "urgent"> = {
        low: "low",
        medium: "normal",
        high: "high",
        urgent: "urgent",
      };
      setPriority(reversePriorityMap[backendPriority as keyof typeof reversePriorityMap] || "normal");
      setCategory(series.category || "");
    }
  }, [editData, availableAssignees]);

  // Auto-set end condition for "once" repeat
  useEffect(() => {
    if (repeat === "once") {
      setEndCondition("after");
      setEndAfterTimes("1");
    }
  }, [repeat]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!taskName.trim()) {
      newErrors.taskName = "Task Name is required";
    }
    if (!property) {
      newErrors.property = "Property is required";
    }
    if (!startDate) {
      newErrors.startDate = "Start Date is required";
    }
    if (endCondition === "after" && (!endAfterTimes || Number(endAfterTimes) < 1)) {
      newErrors.endAfterTimes = "Number of occurrences must be at least 1";
    }
    if (endCondition === "onDate" && !endDate) {
      newErrors.endDate = "End date is required";
    }
    if (endCondition === "onDate" && endDate && startDate && endDate <= startDate) {
      newErrors.endDate = "End date must be after start date";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper to map repeat value to frequency, interval, and optional fields
  const parseRepeatValue = (repeatValue: string) => {
    switch (repeatValue) {
      case "daily":
        return { frequency: "daily", interval: 1, byDay: [], dayOfMonth: null, weekOfMonth: null, weekdayOfMonth: null };
      case "weekly":
        return { frequency: "weekly", interval: 1, byDay: [], dayOfMonth: null, weekOfMonth: null, weekdayOfMonth: null };
      case "biweekly":
        return { frequency: "weekly", interval: 2, byDay: [], dayOfMonth: null, weekOfMonth: null, weekdayOfMonth: null };
      case "monthly":
        return { frequency: "monthly", interval: 1, byDay: [], dayOfMonth: null, weekOfMonth: null, weekdayOfMonth: null };
      case "bimonthly":
        return { frequency: "monthly", interval: 2, byDay: [], dayOfMonth: null, weekOfMonth: null, weekdayOfMonth: null };
      case "quarterly":
        return { frequency: "monthly", interval: 3, byDay: [], dayOfMonth: null, weekOfMonth: null, weekdayOfMonth: null };
      case "semiannual":
        return { frequency: "monthly", interval: 6, byDay: [], dayOfMonth: null, weekOfMonth: null, weekdayOfMonth: null };
      case "yearly":
        return { frequency: "yearly", interval: 1, byDay: [], dayOfMonth: null, weekOfMonth: null, weekdayOfMonth: null };
      case "once":
        return { frequency: "daily", interval: 1, byDay: [], dayOfMonth: null, weekOfMonth: null, weekdayOfMonth: null };
      default:
        return { frequency: "monthly", interval: 1, byDay: [], dayOfMonth: null, weekOfMonth: null, weekdayOfMonth: null };
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const propertyId = Number(property);
      const unitId = unit ? Number(unit) : null;
      const repeatConfig = parseRepeatValue(repeat);

      // For monthly, we need to set day_of_month from start_date if not already set
      let dayOfMonth = repeatConfig.dayOfMonth;
      if (repeatConfig.frequency === "monthly" && !dayOfMonth && startDate) {
        dayOfMonth = startDate.getDate();
      }

      // For weekly, we need to set by_day from start_date if not already set
      let byDay = repeatConfig.byDay;
      if (repeatConfig.frequency === "weekly" && byDay.length === 0 && startDate) {
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        byDay = [dayNames[startDate.getDay()]];
      }

      // Map end condition to end_mode
      let endMode = "never";
      if (endCondition === "after") {
        endMode = "after_n_times";
      } else if (endCondition === "onDate") {
        endMode = "on_date";
      } else if (repeat === "once") {
        endMode = "after_n_times";
      }

      // Build due_after object if value is provided
      const dueAfter = dueAfterValue && Number(dueAfterValue) > 0
        ? {
            count: Number(dueAfterValue),
            period: dueAfterUnit,
          }
        : null;

      // Map frontend priority to backend priority (normal -> medium)
      const priorityMap: Record<"normal" | "low" | "high" | "urgent", "low" | "medium" | "high" | "urgent"> = {
        low: "low",
        normal: "medium",
        high: "high",
        urgent: "urgent",
      };
      const backendPriority = priorityMap[priority as keyof typeof priorityMap] || "medium";
      const assigneeIds = selectedAssignees
        .map((a) => Number(a.id))
        .filter((id) => !Number.isNaN(id));
      const collaboratorIds = collaborators
        .map((c) => Number(c.id))
        .filter((id) => !Number.isNaN(id));

      // Build request payload
      const payload: any = {
        property_id: propertyId,
        name: taskName.trim(),
        description: description.trim() || "",
        category: category || "",
        priority: backendPriority,
        assignees: assigneeIds,
        collaborators: collaboratorIds,
        tags: [],
        frequency: repeatConfig.frequency,
        interval: repeatConfig.interval,
        by_day: byDay,
        day_of_month: dayOfMonth,
        week_of_month: repeatConfig.weekOfMonth,
        weekday_of_month: repeatConfig.weekdayOfMonth,
        start_date: startDate!.toISOString(),
        end_mode: endMode,
        requested_by: userId || 1, // Fallback to 1 if userId not available
      };

      if (unitId) {
        payload.unit_id = unitId;
      }

      if (selectedLocationId !== null) {
        payload.location_id = selectedLocationId;
      }

      if (dueAfter) {
        payload.due_after = dueAfter;
      }

      if (endMode === "on_date" && endDate) {
        payload.end_date = endDate.toISOString();
      } else if (endMode === "after_n_times") {
        const occurrences = repeat === "once" ? 1 : (endAfterTimes ? Number(endAfterTimes) : null);
        if (occurrences && occurrences > 0) {
          payload.end_after_occurrences = occurrences;
        }
      }

      await fetchJSON("/maintenance/recurring", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const refreshPropertyId = property ? Number(property) : defaultPropertyId;
      window.dispatchEvent(
        new CustomEvent("refreshRecurringTasks", {
          detail: refreshPropertyId ? { propertyId: refreshPropertyId } : {},
        })
      );
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to create recurring task:", error);
      setErrors({
        submit: error.message || "Failed to create recurring task. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
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
          onCancel={() => !isSubmitting && onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={
            isSubmitting
              ? "Creating..."
              : editData
              ? "Update Recurring Task"
              : "Create Recurring Task"
          }
          confirmDisabled={isSubmitting}
        />
      }
    >
      <FormLayout>
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {errors.submit}
          </div>
        )}
        <FormSection showDivider={false}>
          <TextField
            label="Task Name"
            required
            value={taskName ?? ""}
            onChange={(e) => setTaskName(e.target.value)}
            error={errors.taskName}
            placeholder="Type Task Name"
          />
          <TextAreaField
            label="Description"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Insert Description Here"
            rows={4}
          />
        </FormSection>

        <FormSection title="Property & Scheduling">
          {/* Property and Unit in same row */}
          <div className="grid grid-cols-2 gap-4">
            <PropertyLocationCombobox
              label="Property"
              required
              properties={properties}
              propertyId={property ? Number(property) : null}
              locationId={selectedLocationId}
              onChange={({ propertyId, locationId }) => {
                setProperty(propertyId ? String(propertyId) : "");
                setSelectedLocationId(locationId);
                setUnit("");
              }}
              error={errors.property}
              placeholder="Select Property"
            />
            <SelectField
              label="Unit"
              value={unit ?? ""}
              onChange={(value) => setUnit(Array.isArray(value) ? value[0] : value)}
              placeholder={unitsLoading ? "Loading..." : "Select Unit"}
              disabled={!property || unitsLoading}
              options={units.map((u) => ({
                value: String(u.id),
                label: u.unit_name,
              }))}
            />
          </div>

          {/* Due After with days/weeks/months selector */}
          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Due After"
              value={dueAfterValue ?? ""}
              onChange={(e) => setDueAfterValue(e.target.value)}
              placeholder="Enter number"
            />
            <SelectField
              label="Period"
              value={dueAfterUnit ?? "days"}
              onChange={(value) => setDueAfterUnit(Array.isArray(value) ? value[0] : value)}
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
            value={repeat ?? "monthly"}
            onChange={(value) => setRepeat(Array.isArray(value) ? value[0] : value)}
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "biweekly", label: "Every two weeks" },
              { value: "monthly", label: "Monthly" },
              { value: "bimonthly", label: "Every two months" },
              { value: "quarterly", label: "Quarterly" },
              { value: "semiannual", label: "Every six months" },
              { value: "yearly", label: "Yearly" },
              { value: "once", label: "One time" },
            ]}
          />

          {/* Start Date and End Condition in same row */}
          <div className="grid grid-cols-2 gap-4">
            <DateField
              label="Start Date"
              required
              value={startDate}
              onChange={(date) => setStartDate(date instanceof Date ? date : date ? new Date(date) : null)}
              error={errors.startDate}
              placeholder="mm/dd/yyyy"
            />
            <SelectField
              label="End"
              value={endCondition ?? "never"}
              onChange={(value) => setEndCondition(Array.isArray(value) ? value[0] : value)}
              disabled={repeat === "once"}
              options={[
                { value: "never", label: "Never" },
                { value: "after", label: "After" },
                { value: "onDate", label: "On date" },
              ]}
            />
          </div>

          {/* Conditional End Date or After Times fields */}
          {endCondition === "after" && (
            <NumberField
              label="After"
              value={endAfterTimes ?? ""}
              onChange={(e) => setEndAfterTimes(e.target.value)}
              placeholder="Enter number"
              description="time(s)"
              error={errors.endAfterTimes}
            />
          )}

          {endCondition === "onDate" && (
            <DateField
              label="End Date"
              value={endDate}
              onChange={(date) => setEndDate(date instanceof Date ? date : date ? new Date(date) : null)}
              placeholder="mm/dd/yyyy"
              error={errors.endDate}
            />
          )}
        </FormSection>

        <FormSection title="Assignment & Priority">
          {/* Assignees and Collaborators in same row */}
          <div className="grid grid-cols-2 gap-4">
            <MultiSelectField
              label="Assignees"
              value={selectedAssignees}
              onChange={setSelectedAssignees}
              error={errors.selectedAssignees}
              placeholder="Select assignees"
              options={availableAssignees.map((a) => ({
                id: String(a.id),
                label: a.name,
                initials: a.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2),
              }))}
            />
            <MultiSelectField
              label="Collaborators"
              value={collaborators}
              onChange={setCollaborators}
              placeholder="Select collaborators"
              options={availableAssignees.map((a) => ({
                id: String(a.id),
                label: a.name,
                initials: a.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2),
              }))}
            />
          </div>

          {/* Priority and Category in same row */}
          <div className="grid grid-cols-2 gap-4">
            <PrioritySelectField
              label="Priority"
              value={(priority ?? "normal") as "normal" | "low" | "high" | "urgent"}
              onChange={(value) => setPriority(value)}
            />
            <SelectField
              label="Category"
              value={category ?? ""}
              onChange={(value) => setCategory(Array.isArray(value) ? value[0] : value)}
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
