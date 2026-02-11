import { useState, useEffect, useRef } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import {
  TextField,
  TextAreaField,
  SelectField,
  MultiSelectField,
  type MultiSelectOption,
} from "@/components/forms";

export type SubtaskStatus = "pending" | "in_progress" | "done";

export interface SubtaskFormAssignee {
  id: number;
  name: string;
  initials: string;
}

export interface SubtaskFormValues {
  name: string;
  description: string;
  status: SubtaskStatus;
  assignees: MultiSelectOption[];
}

const STATUS_OPTIONS: { value: SubtaskStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

interface AddEditSubtaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SubtaskFormValues) => Promise<void>;
  editingSubtask?: {
    id: number;
    name: string;
    description: string;
    status: SubtaskStatus;
    assignees: SubtaskFormAssignee[];
  } | null;
  availableAssignees: MultiSelectOption[];
}

export function AddEditSubtaskModal({
  open,
  onOpenChange,
  onSubmit,
  editingSubtask,
  availableAssignees,
}: AddEditSubtaskModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<SubtaskStatus>("pending");
  const [assignees, setAssignees] = useState<MultiSelectOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSyncedForOpenRef = useRef(false);

  // Only sync form state when the modal opens, not on every parent re-render (so typing isn't reset)
  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setStatus("pending");
      setAssignees([]);
      setError(null);
      hasSyncedForOpenRef.current = false;
      return;
    }
    if (!hasSyncedForOpenRef.current) {
      hasSyncedForOpenRef.current = true;
      if (editingSubtask) {
        setName(editingSubtask.name || "");
        setDescription(editingSubtask.description || "");
        setStatus(editingSubtask.status || "pending");
        setAssignees(
          (editingSubtask.assignees || []).map((a) => ({
            id: String(a.id),
            label: a.name,
            initials: a.initials,
          }))
        );
      } else {
        setName("");
        setDescription("");
        setStatus("pending");
        setAssignees([]);
      }
    }
  }, [open, editingSubtask]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        name: trimmedName,
        description: description.trim(),
        status,
        assignees,
      });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save subtask");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={editingSubtask ? "Edit subtask" : "Add subtask"}
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={editingSubtask ? "Update" : "Add"}
          confirmDisabled={saving || !name.trim()}
        />
      }
    >
      <FormLayout>
        <FormSection showDivider={false}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Patch and sand walls"
            required
            error={error && !name.trim() ? error : undefined}
          />
          <TextAreaField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details..."
            rows={3}
          />
          <SelectField
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as SubtaskStatus)}
            options={STATUS_OPTIONS}
          />
          <MultiSelectField
            label="Assignees"
            value={assignees}
            onChange={setAssignees}
            options={availableAssignees}
            placeholder="Select assignees"
          />
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
}

export default AddEditSubtaskModal;
