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

// Mock data types (shaped like real API data)
interface SimpleProperty {
  id: number;
  name: string;
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

// Mock Data
const MOCK_PROPERTIES: MockProperty[] = [
  { id: 1, name: "(C) 1 Mayflower Parkway" },
  { id: 2, name: "22 Indian Chase Dr" },
  { id: 3, name: "Property 3" },
];

const MOCK_TASKS_BY_PROPERTY: Record<number, MockTask[]> = {
  1: [{ id: 10, name: "HVAC Repair" }],
  2: [{ id: 20, name: "Electrical Inspection" }],
  3: [],
};

const MOCK_USERS: MockUser[] = [
  { id: 1, name: "Alex Morgan" },
  { id: 2, name: "Jamie Chen" },
];

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
      setSelectedPropertyId(editingFTO.property_id);
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

  // Get available tasks for selected property
  const availableTasks = selectedPropertyId
    ? MOCK_TASKS_BY_PROPERTY[selectedPropertyId] || []
    : [];

  // Build property options
  const propertyOptions = MOCK_PROPERTIES.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

  // Build task options
  const taskOptions = availableTasks.map((t) => ({
    value: String(t.id),
    label: t.name,
  }));

  // Build assignee options
  const assigneeOptions: MultiSelectOption[] = MOCK_USERS.map((u) => ({
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
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      name: ftoName,
      description,
      priority,
      status,
      due_date: formatISODate(dueDate!),
      property_id: selectedPropertyId,
      task_id: selectedTaskId || undefined,
      field_team_member_ids: fieldTeamMemberIds,
      pm_assignee_ids: pmAssigneeIds,
    };

    console.log("[API] POST /field-team-orders", payload);

    onOpenChange(false);
  };

  // Determine if in edit mode
  const isEditing = !!editingFTO;

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
              disabled={isEditing}
            />
          </div>
          <div>
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
              placeholder="Type Task Name"
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
