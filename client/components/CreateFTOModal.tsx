import { useState, useEffect, useRef } from "react";
import {
  ModalTemplate,
  ModalButtons,
  FieldRow,
  FieldRowItem,
} from "@/components/ui/ModalTemplate";
import {
  TextField,
  SelectField,
  TextAreaField,
  DateField,
  MultiSelectField,
  PropertyLocationCombobox,
} from "@/components/forms";

import type { MultiSelectOption } from "@/components/forms";
import { fetchJSON } from "@/api/fetchJSON";
import {
  PROPERTY_LEVEL_LABEL,
  PROPERTY_LEVEL_SHORT_LABEL,
  PROPERTY_LEVEL_UNIT_ID,
  formatUnitLabel,
  formatUnitDisplayForTable,
  UNIT_EMPTY_DISPLAY,
} from "@/utils/unitLabel";

interface SimpleUnit {
  id: number;
  unit_name: string;
  address_1: string | null;
  owners: { name: string }[];
}


// Mock data types (shaped like real API data)
interface SimpleProperty {
  id: number;
  name: string;
  address_line1: string;
  city: string;
  state: string;
  locations_count?: number;
}

interface SimpleTask {
  id: number;
  name: string;
}

interface Assignee {
  id: number;
  name: string;
}

interface EditingFTO {
  id: number;
  name: string;
  description: string;
  priority: "low" | "normal" | "high";
  status: "new" | "dispatched" | "completed" | "cancelled";
  due_date: string;
  event_start_at?: string | null;
  event_end_at?: string | null;
  property_id: number;
  property_name?: string;
  unit_id?: number | null;
  location_id?: number | null;
  task_id?: number;
  field_team_member_ids: number[];
  pm_assignee_ids: number[];
  unit_name?: string;
}

interface CreateFTOModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFTO?: EditingFTO | null;
  readOnly?: boolean; // If true, all fields are read-only (for viewing submissions)
  lockedPropertyId?: number;
  lockedPropertyLabel?: string;
  lockedUnitId?: number | null;
  lockedUnitLabel?: string;
  lockedTaskId?: number;
  lockedTaskLabel?: string;
}



export default function CreateFTOModal({
  open,
  onOpenChange,
  editingFTO,
  readOnly = false,
  lockedPropertyId,
  lockedPropertyLabel,
  lockedUnitId,
  lockedUnitLabel,
  lockedTaskId,
  lockedTaskLabel,
}: CreateFTOModalProps) {
  // Form state - using IDs instead of objects
  // console.log( "editingFTO:", editingFTO )

  
  const hasHydratedRef = useRef<number | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
    null
  );
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [ftoName, setFtoName] = useState("");
  const [priority, setPriority] = useState("normal");
  const [status, setStatus] = useState("new");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [eventStartAt, setEventStartAt] = useState<string | null>(null);
  const [eventEndAt, setEventEndAt] = useState<string | null>(null);
  const [pmAssigneeIds, setPmAssigneeIds] = useState<number[]>([]);
  const [fieldTeamMemberIds, setFieldTeamMemberIds] = useState<number[]>([]);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [properties, setProperties] = useState<SimpleProperty[]>([]);
  const [tasks, setTasks] = useState<SimpleTask[]>([]);
  const [availableAssignees, setAvailableAssignees] = useState<Assignee[]>([]);
  const [pmAssignees, setPmAssignees] = useState<Assignee[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [units, setUnits] = useState<SimpleUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [editingUnitLabel, setEditingUnitLabel] = useState<string>("");

  useEffect(() => {
    if (!open) return;
  
    let cancelled = false;
  
    async function loadOptions() {
      try {
        setOptionsLoading(true);
        setOptionsError(null);
  
        const propsRes = await fetchJSON("/properties").catch(() => []);
  
        if (cancelled) return;
  
        setProperties(propsRes || []);
      } catch (err: any) {
        if (!cancelled) {
          setOptionsError(err?.message || "Failed to load options");
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    }
  
    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open && !editingFTO) {
      setSelectedPropertyId(null);
      setSelectedLocationId(null);
      setSelectedTaskId(null);
      setFtoName("");
      setPriority("normal");
      setStatus("new");
      setDueDate(null);
      setEventStartAt(null);
      setEventEndAt(null);
      setPmAssigneeIds([]);
      setFieldTeamMemberIds([]);
      setDescription("");
      setErrors({});
    }
  }, [open, editingFTO]);
  

  // Hydrate form from editingFTO when provided
  useEffect(() => {
    if (!open || !editingFTO) return;
    // Allow re-hydration if editingFTO.id changes (data was refreshed)
    // If the same ID is already hydrated, skip (unless modal was closed and reopened)
    if (hasHydratedRef.current === editingFTO.id) return;
  
    hasHydratedRef.current = editingFTO.id;
  
    setEditingUnitLabel(
      formatUnitLabel({
        unitId: editingFTO.unit_id ?? null,
        unitName: editingFTO.unit_name ?? null,
        fallback: UNIT_EMPTY_DISPLAY,
      }),
    );
    setFtoName(editingFTO.name);
    setDescription(editingFTO.description);
    setPriority(editingFTO.priority);
    setStatus(editingFTO.status);
  
    setSelectedPropertyId(editingFTO.property_id);
    setSelectedUnitId(editingFTO.unit_id ?? null);
    setSelectedLocationId(editingFTO.location_id ?? null);

    setSelectedTaskId(editingFTO.task_id ?? null);
    setPmAssigneeIds(editingFTO.pm_assignee_ids);
    setFieldTeamMemberIds(editingFTO.field_team_member_ids);

    if (editingFTO?.due_date) {
      const [year, month, day] = editingFTO.due_date
        .split("T")[0]
        .split("-")
        .map(Number);
    
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
    
      setDueDate(date); // ✅ Date object only
    }

    if (editingFTO?.event_start_at) {
      const d = new Date(editingFTO.event_start_at);
      setEventStartAt(d.toISOString().slice(0, 16));
    } else {
      setEventStartAt(null);
    }
    if (editingFTO?.event_end_at) {
      const d = new Date(editingFTO.event_end_at);
      setEventEndAt(d.toISOString().slice(0, 16));
    } else {
      setEventEndAt(null);
    }
  }, [open, editingFTO]);
  

  useEffect(() => {
    if (!open) {
      hasHydratedRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open || editingFTO) return;
    if (lockedPropertyId != null) {
      setSelectedPropertyId(lockedPropertyId);
    }
    if (lockedUnitId !== undefined) {
      setSelectedUnitId(lockedUnitId ?? null);
    }
    if (lockedTaskId != null) {
      setSelectedTaskId(lockedTaskId);
    }
  }, [open, editingFTO, lockedPropertyId, lockedUnitId, lockedTaskId]);

  // Status auto-logic: sync with field team members
  useEffect(() => {
    if (fieldTeamMemberIds.length > 0 && status === "new") {
      setStatus("dispatched");
    } else if (fieldTeamMemberIds.length === 0 && status === "dispatched") {
      setStatus("new");
    }
  }, [fieldTeamMemberIds, status]);


  useEffect(() => {
    if (!open) return;

    const toAssignee = (u: { id: number; name?: string; email?: string }) => ({
      id: Number(u.id),
      name: u.name || u.email || "",
    });

    Promise.all([
      fetchJSON("/users/field-team").catch(() => []),
      fetchJSON("/users/property-managers").catch(() => []),
    ]).then(([fieldTeam, propertyManagers]) => {
      setPmAssignees(propertyManagers.map((u: any) => toAssignee(u)));

      const seen = new Set<number>();
      const merged: Assignee[] = [];
      for (const u of [...fieldTeam, ...propertyManagers]) {
        const a = toAssignee(u);
        if (seen.has(a.id)) continue;
        seen.add(a.id);
        merged.push(a);
      }
      setAvailableAssignees(merged);
    });
  }, [open]);

  

  const taskOptions = tasks.map((t) => ({
    value: String(t.id),
    label: t.name || `Task #${t.id}`,
  }));
  
  function extractUnitSortKey(unitName: string): number | string {
    // Try to parse numeric unit names (e.g. "1", "10", "12A" → 12)
    const match = unitName.match(/^(\d+)/);
    if (match) {
      return Number(match[1]);
    }
    return unitName;
  }
  
  const unitOptions = [
    {
      value: String(PROPERTY_LEVEL_UNIT_ID),
      label: PROPERTY_LEVEL_LABEL,
      displayLabel: PROPERTY_LEVEL_SHORT_LABEL,
    },
    ...[...units]
      .sort((a, b) => {
    const aKey = extractUnitSortKey(a.unit_name);
    const bKey = extractUnitSortKey(b.unit_name);

    // numeric vs numeric
    if (typeof aKey === "number" && typeof bKey === "number") {
      return aKey - bKey;
    }

    // numeric always comes before non-numeric
    if (typeof aKey === "number") return -1;
    if (typeof bKey === "number") return 1;

    // fallback string compare
    return String(aKey).localeCompare(String(bKey));
    })
      .map((u) => ({
        value: String(u.id),
        label: u.unit_name
          ? `${u.unit_name}${u.address_1 ? ` — ${u.address_1}` : ""}`
          : `Unit #${u.id}`,
      })),
  ];

  const assigneeOptions: MultiSelectOption[] = availableAssignees.map((u) => ({
    id: String(u.id),
    label: u.name,
  }));
  
  const pmAssigneeOptions: MultiSelectOption[] = pmAssignees.map((u) => ({
    id: String(u.id),
    label: u.name,
  }));


  // Get selected assignees as MultiSelectOption
  const selectedPmAssignees = pmAssigneeOptions.filter((opt) =>
    pmAssigneeIds.includes(Number(opt.id))
  );

  const selectedFieldTeamMembers = assigneeOptions.filter((opt) =>
    fieldTeamMemberIds.includes(Number(opt.id))
  );

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedPropertyId) {
      newErrors.property = "Property is required";
    }
    if (!ftoName.trim()) {
      newErrors.ftoName = "FTO Name is required";
    }
    if (!priority) {
      newErrors.priority = "Priority is required";
    }
    if (!dueDate) {
      newErrors.dueDate = "Due Date is required";
    }
    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Format ISO date string
  const formatISODate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateForm()) return;
  
    // Update: always send task_id (0 = no task). Create: omit when no task.
    const taskIdPayload = editingFTO
      ? (selectedTaskId ?? 0)
      : (selectedTaskId || undefined);

    const payload = {
      name: ftoName.trim(),
      description: description.trim(),
      priority,
      status,
      due_date: dueDate!.toISOString(),
      property_id: selectedPropertyId!,
      ...(taskIdPayload !== undefined && { task_id: taskIdPayload }),
      unit_id: selectedUnitId !== null ? selectedUnitId : undefined,
      location_id: selectedLocationId !== null ? selectedLocationId : undefined,
      field_team_member_ids: fieldTeamMemberIds,
      pm_assignee_ids: pmAssigneeIds,
      ...(eventStartAt && { event_start_at: new Date(eventStartAt).toISOString() }),
      ...(eventEndAt && { event_end_at: new Date(eventEndAt).toISOString() }),
      ...(!editingFTO && { sync_to_outlook: true }),
    };
  
    try {
      if (!editingFTO) {
        await fetchJSON("/maintenance/ftos", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchJSON(`/maintenance/ftos/${editingFTO.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
  
      const refreshPropertyId =
        selectedPropertyId ?? editingFTO?.property_id ?? lockedPropertyId ?? null;
      window.dispatchEvent(
        new CustomEvent("refreshFieldTeamOrders", {
          detail: refreshPropertyId ? { propertyId: refreshPropertyId } : {},
        })
      );
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save FTO:", err);
      alert("Failed to save field team order.");
    }
  };
  

  // Determine if in edit mode
  const isEditing = !!editingFTO;
  const isPropertyLocked = lockedPropertyId != null;
  const isTaskLocked = lockedTaskId != null;


  
  useEffect(() => {
    if (!open || !selectedPropertyId) return;
    let cancelled = false;
  
    async function loadUnits() {
      try {
        setUnitsLoading(true);
  
        const data = await fetchJSON(
          `/properties/${selectedPropertyId}/units`
        );
  
        if (!cancelled) {
          setUnits(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load units:", err);
          setUnits([]);
        }
      } finally {
        if (!cancelled) setUnitsLoading(false);
      }
    }
  
    loadUnits();
    return () => {
      cancelled = true;
    };
  }, [open, selectedPropertyId, isEditing]);

  // Load tasks when property is selected (or when editing with a property)
  useEffect(() => {
    const propertyId = selectedPropertyId || editingFTO?.property_id;
    
    if (!open || !propertyId) {
      setTasks([]);
      return;
    }
    let cancelled = false;
  
    async function loadTasks() {
      try {
        setOptionsLoading(true);
        setOptionsError(null);
  
        const data = await fetchJSON(
          `/maintenance/tasks?property_id=${propertyId}&limit=200`
        );
  
        if (!cancelled) {
          setTasks(data || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load tasks:", err);
          setOptionsError(err?.message || "Failed to load tasks");
          setTasks([]);
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    }
  
    loadTasks();
    return () => {
      cancelled = true;
    };
  }, [open, selectedPropertyId, editingFTO?.property_id]);

  const propertyLabel = isEditing
    ? editingFTO?.property_name || ""
    : lockedPropertyLabel ||
      (() => {
        const p = properties.find((p) => p.id === selectedPropertyId);
        if (!p) {
          return lockedPropertyId != null ? `Property #${lockedPropertyId}` : "";
        }
        return [p.address_line1, p.city, p.state].filter(Boolean).join(", ");
      })();

  const unitDisplayLabel = isEditing
    ? (editingUnitLabel || UNIT_EMPTY_DISPLAY)
    : formatUnitLabel({
        unitId: lockedUnitId ?? null,
        unitName: lockedUnitLabel ?? null,
        fallback: UNIT_EMPTY_DISPLAY,
      });
  const unitDisplayForField = formatUnitDisplayForTable(unitDisplayLabel);

  const taskDisplayLabel =
    lockedTaskLabel || (lockedTaskId != null ? `Task #${lockedTaskId}` : "");
  
  // useEffect(() => {
  //   if (!open || !editingFTO?.property_id) return;

  //   let cancelled = false;

  //   async function loadUnitsForEdit() {
  //     try {
  //       setUnitsLoading(true);
  //       const data = await fetchJSON(
  //         `/properties/${editingFTO.property_id}/units`
  //       );

  //       if (!cancelled) {
  //         setUnits(data || []);
  //       }
  //     } finally {
  //       if (!cancelled) setUnitsLoading(false);
  //     }
  //   }

  //   loadUnitsForEdit();

  //   return () => {
  //     cancelled = true;
  //   };
  // }, [open, editingFTO]);


  
  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={readOnly ? "View Field Team Order" : isEditing ? "Edit Field Team Order" : "Create Field Team Order"}
      size="md"
      footer={
        readOnly ? (
          <ModalButtons
            onCancel={() => onOpenChange(false)}
            onConfirm={() => onOpenChange(false)}
            cancelLabel="Close"
            confirmLabel={undefined}
          />
        ) : (
          <ModalButtons
            onCancel={() => onOpenChange(false)}
            onConfirm={handleSubmit}
            cancelLabel="Cancel"
            confirmLabel={
              isEditing ? "Update Field Team Order" : "Create Field Team Order"
            }
          />
        )
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Row 1: Property | Unit | Task */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: "12px",
            width: "100%",
          }}
        >
          <div>
            {isEditing || isPropertyLocked ? (
              <TextField
                label="Property"
                required
                value={propertyLabel}
                disabled
              />
            ) : (
              <PropertyLocationCombobox
                label="Property"
                required
                properties={properties}
                propertyId={selectedPropertyId}
                locationId={selectedLocationId}
                onChange={({ propertyId, locationId }) => {
                  setSelectedPropertyId(propertyId);
                  setSelectedLocationId(locationId);
                  setSelectedTaskId(null);
                  setSelectedUnitId(null);
                }}
                error={errors.property}
                placeholder="Select Property"
                searchPlaceholder="Search properties..."
                disabled={readOnly}
              />
            )}
          </div>
          <div>
            {isEditing || isPropertyLocked ? (
              <TextField label="Unit" value={unitDisplayForField} disabled />
            ) : (
              <SelectField
                label="Unit"
                value={selectedUnitId === null ? "" : String(selectedUnitId)}
                onChange={(value) => {
                  setSelectedUnitId(value ? Number(value) : null);
                }}
                placeholder={
                  !selectedPropertyId
                    ? "Select property first"
                    : unitsLoading
                    ? "Loading units…"
                    : "Select Unit"
                }
                options={unitOptions}
                disabled={!selectedPropertyId || unitsLoading || readOnly}
              />
            )}
          </div>
          <div>
            {isTaskLocked ? (
              <TextField label="Task" value={taskDisplayLabel} disabled />
            ) : (
              <SelectField
                label="Task"
                value={String(selectedTaskId || "")}
                onChange={(value) => {
                  setSelectedTaskId(value ? Number(value) : null);
                }}
                placeholder={
                  !selectedPropertyId && !editingFTO?.property_id
                    ? "Select property first"
                    : optionsLoading
                    ? "Loading tasks…"
                    : "Select Task"
                }
                options={taskOptions}
                disabled={(!selectedPropertyId && !editingFTO?.property_id) || readOnly || optionsLoading}
              />
            )}
          </div>
        </div>

        {/* Row 2: FTO Name | Priority */}
        <FieldRow columns={2}>
          <FieldRowItem>
            <TextField
              label="FTO Name"
              required
              value={ftoName}
              onChange={(e) => setFtoName(e.target.value)}
              error={errors.ftoName}
              placeholder="Type FTO Name"
              disabled={readOnly}
            />
          </FieldRowItem>
          <FieldRowItem>
            <SelectField
              label="Priority"
              required
              value={priority}
              onChange={setPriority}
              error={errors.priority}
              options={[
                { value: "low", label: "Low" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "High" },
              ]}
              disabled={readOnly}
            />
          </FieldRowItem>
        </FieldRow>

        {/* Row 3: Due Date | PM Assignees */}
        <FieldRow columns={2}>
          <FieldRowItem>
            <DateField
              label="Due Date"
              required
              value={dueDate}
              onChange={(date) => setDueDate(date as Date)}
              error={errors.dueDate}
              placeholder="mm/dd/yyyy"
              disabled={readOnly}
            />
          </FieldRowItem>
          <FieldRowItem>
            <MultiSelectField
              label="PM Assignees"
              value={selectedPmAssignees}
              onChange={(options) => {
                setPmAssigneeIds(options.map((opt) => Number(opt.id)));
              }}
              placeholder="Select PMs"
              options={pmAssigneeOptions}
              required={false}
              disabled={readOnly}
            />
          </FieldRowItem>
        </FieldRow>

        {/* Row 3b: Event time slot (optional, for Outlook calendar) */}
        <FieldRow columns={2}>
          <FieldRowItem>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event start (time slot)
            </label>
            <input
              type="datetime-local"
              value={eventStartAt ?? ""}
              onChange={(e) => setEventStartAt(e.target.value || null)}
              disabled={readOnly}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-0.5">Optional. Used for Outlook calendar.</p>
          </FieldRowItem>
          <FieldRowItem>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event end (time slot)
            </label>
            <input
              type="datetime-local"
              value={eventEndAt ?? ""}
              onChange={(e) => setEventEndAt(e.target.value || null)}
              disabled={readOnly}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-0.5">Optional. Used for Outlook calendar.</p>
          </FieldRowItem>
        </FieldRow>

        {/* Row 4: Field Team Members | Status */}
        <FieldRow columns={2}>
          <FieldRowItem>
            <MultiSelectField
              label="Field Team Members"
              value={selectedFieldTeamMembers}
              onChange={(options) => {
                setFieldTeamMemberIds(options.map((opt) => Number(opt.id)));
              }}
              placeholder="Select"
              options={assigneeOptions}
              required={false}
              disabled={readOnly}
            />
          </FieldRowItem>
          <FieldRowItem>
            <SelectField
              label="Status"
              required
              value={status}
              onChange={setStatus}
              error={errors.status}
              options={[
                { value: "new", label: "New" },
                { value: "dispatched", label: "Dispatched" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              disabled={readOnly}
            />
          </FieldRowItem>
        </FieldRow>

        {/* Row 5: Description (full width) */}
        <TextAreaField
          label="Description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          placeholder="Insert Description Here"
          rows={6}
          disabled={readOnly}
        />
      </div>
    </ModalTemplate>
  );
}
