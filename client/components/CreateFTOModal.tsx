import { useState, useEffect } from "react";
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
} from "@/components/forms";

import type { MultiSelectOption } from "@/components/forms";
import { fetchJSON } from "@/api/fetchJSON";

// Mock data types (shaped like real API data)
interface SimpleProperty {
  id: number;
  name: string;
  address_line1: string;
  city: string;
  state: string;
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
  property_id: number;
  task_id?: number;
  field_team_member_ids: number[];
  pm_assignee_ids: number[];
}

interface CreateFTOModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFTO?: EditingFTO | null;
}



export default function CreateFTOModal({
  open,
  onOpenChange,
  editingFTO,
}: CreateFTOModalProps) {
  // Form state - using IDs instead of objects
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
    null
  );
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [ftoName, setFtoName] = useState("");
  const [priority, setPriority] = useState("normal");
  const [status, setStatus] = useState("new");
  const [dueDate, setDueDate] = useState<Date | null>(null);
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

  useEffect(() => {
    if (!open) return;
  
    let cancelled = false;
  
    async function loadOptions() {
      try {
        setOptionsLoading(true);
        setOptionsError(null);
  
        const [propsRes, tasksRes] = await Promise.all([
          fetchJSON("/properties").catch(() => []),
          fetchJSON("/maintenance/tasks?limit=200").catch(() => []),
        ]);
  
        if (cancelled) return;
  
        setProperties(propsRes || []);
        setTasks(tasksRes || []);
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
    if (!open) {
      setSelectedPropertyId(null);
      setSelectedTaskId(null);
      setFtoName("");
      setPriority("normal");
      setStatus("new");
      setDueDate(null);
      setPmAssigneeIds([]);
      setFieldTeamMemberIds([]);
      setDescription("");
      setErrors({});
    }
  }, [open]);

  // Hydrate form from editingFTO when provided
  useEffect(() => {
    if (editingFTO && open) {
      setFtoName(editingFTO.name);
      setDescription(editingFTO.description);
      setPriority(editingFTO.priority);
      setStatus(editingFTO.status);
      setSelectedTaskId(editingFTO.task_id || null);
      setPmAssigneeIds(editingFTO.pm_assignee_ids);
      setFieldTeamMemberIds(editingFTO.field_team_member_ids);

      // Parse ISO date string
      if (editingFTO.due_date) {
        setDueDate(new Date(editingFTO.due_date));
      }
    }
  }, [editingFTO, open]);

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
  
    fetchJSON("/users/field-team")
      .then((data) =>
        setAvailableAssignees(
          data.map((u: any) => ({
            id: Number(u.id),
            name: u.name || u.email,
          }))
        )
      )
      .catch(() => {});
  }, [open]);
  
  useEffect(() => {
    if (!open) return;
  
    fetchJSON("/users/property-managers")
      .then((data) =>
        setPmAssignees(
          data.map((u: any) => ({
            id: Number(u.id),
            name: u.name || u.email,
          }))
        )
      )
      .catch(() => {});
  }, [open]);

  const propertyOptions = properties.map((p) => ({
    value: String(p.id),
    label:
      p.name ||
      [p.address_line1, p.city, p.state].filter(Boolean).join(", ") ||
      `Property #${p.id}`,
  }));
  
  const assigneeOptions: MultiSelectOption[] = availableAssignees.map((u) => ({
    id: String(u.id),
    label: u.name,
  }));
  
  const pmAssigneeOptions: MultiSelectOption[] = pmAssignees.map((u) => ({
    id: String(u.id),
    label: u.name,
  }));


  // Get selected assignees as MultiSelectOption
  const selectedPmAssignees = assigneeOptions.filter((opt) =>
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
  
    const payload = {
      name: ftoName.trim(),
      description: description.trim(),
      priority,
      status,
      due_date: dueDate!.toISOString(),
      property_id: selectedPropertyId!,
      task_id: selectedTaskId || undefined,
      field_team_member_ids: fieldTeamMemberIds,
      pm_assignee_ids: pmAssigneeIds,
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
  
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save FTO:", err);
      alert("Failed to save field team order.");
    }
  };
  

  // Determine if in edit mode
  const isEditing = !!editingFTO;

  
  const propertyLabel = isEditing
  ? (editingFTO as any)?.property || ""
  : (() => {
      const p = properties.find((p) => p.id === selectedPropertyId);
      if (!p) return "";
      return [p.address_line1, p.city, p.state].filter(Boolean).join(", ");
    })();

  
  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Field Team Order" : "Create Field Team Order"}
      size="md"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={
            isEditing ? "Update Field Team Order" : "Create Field Team Order"
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Row 1: Property | Task */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "12px",
            width: "100%",
          }}
        >
          <div>
            {isEditing ? (
              <TextField
                label="Property"
                required
                value={propertyLabel}
                disabled
              />
            ) : (
              <SelectField
                label="Property"
                required
                value={String(selectedPropertyId || "")}
                onChange={(value) => {
                  const id = value ? Number(value) : null;
                  setSelectedPropertyId(id);
                  setSelectedTaskId(null);
                }}
                error={errors.property}
                placeholder="Select Property"
                options={propertyOptions}
              />
            )}
          </div>
          {/* <div>
            <SelectField
              label="Task"
              value={String(selectedTaskId || "")}
              onChange={(value) => {
                setSelectedTaskId(value ? Number(value) : null);
              }}
              placeholder="Task"
              options={taskOptions}
              disabled={isEditing || !selectedPropertyId}
            />
          </div> */}
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
              onChange={setDueDate}
              error={errors.dueDate}
              placeholder="mm/dd/yyyy"
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
              options={assigneeOptions}
              required={false}
            />
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
        />
      </div>
    </ModalTemplate>
  );
}
