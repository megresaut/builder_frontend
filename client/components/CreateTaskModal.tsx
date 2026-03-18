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
  FileUploadField,
  PrioritySelectField,
  StatusSelectField,
  PropertyLocationCombobox,
} from "@/components/forms";
import type { MultiSelectOption } from "@/components/forms";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import { FormSection } from "@/components/ui/form-section";
import { fetchJSON, authFetch } from "@/api/fetchJSON";
import AIGeneratedBanner from "@/components/AIGeneratedBanner";
import PdfViewerModal from "@/components/PdfViewerModal";
import { useAuth } from "@/auth/useAuth";
import { useConflictCheck } from "@/hooks/useConflictCheck";
import ConflictWarningBanner from "@/components/ConflictWarningBanner";
import {
  PROPERTY_LEVEL_LABEL,
  PROPERTY_LEVEL_SHORT_LABEL,
  PROPERTY_LEVEL_UNIT_ID,
} from "@/utils/unitLabel";

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

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: number;
    name: string;
    description: string;
    priority: string;
    category: string;
    property_id: number;
    unit_id?: number | null;
    location_id?: number | null;
    due_date: string | null;
    assignees: number[];
    collaborators?: number[];
    status?: string;
    attachments?: Array<{
      id: number;
      file_name: string;
      storage_path: string;
      file_type: string;
      file_size: number;
    }>;
  };
  onSubmit?: (form: any) => void;
  onTaskUpdated?: (taskId: number) => void;
  variant?: "compact" | "withMessageAndAttachments";
  /** When opening for create (no editData), preselect this property (e.g. from property page). */
  defaultPropertyId?: number;
  /** Draft review mode — shows Approve/Reject instead of Update/Cancel */
  onApprove?: () => void;
  onReject?: () => void;
}

const renderPropertyLabel = (p: SimpleProperty) =>
  p.name ||
  [p.address_line1, p.city, p.state].filter(Boolean).join(", ") ||
  `Property #${p.id}`;

export default function CreateTaskModal({
  open,
  onOpenChange,
  editData,
  onSubmit,
  onTaskUpdated,
  variant = "withMessageAndAttachments",
  defaultPropertyId,
  onApprove,
  onReject,
}: CreateTaskModalProps) {
  const { userId } = useAuth();
  const hasHydratedRef = useRef(false);
  const hasHydratedUpdateModeRef = useRef(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
    null
  );
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<"normal" | "low" | "high" | "urgent">("normal");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<"not_started" | "in_progress" | "completed">("not_started");
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [collaboratorIds, setCollaboratorIds] = useState<number[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [properties, setProperties] = useState<SimpleProperty[]>([]);
  const [units, setUnits] = useState<SimpleUnit[]>([]);
  const [availableAssignees, setAvailableAssignees] = useState<Assignee[]>([]);
  const [availableCollaborators, setAvailableCollaborators] = useState<Assignee[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [viewingFile, setViewingFile] = useState<UploadedFile | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);

  const initialStateRef = useRef<{
    title: string;
    description: string;
    propertyId: number | null;
    unitId: number | null;
    locationId: number | null;
    category: string;
    priority: "normal" | "low" | "high" | "urgent";
    dueDate: Date | null;
    status: "not_started" | "in_progress" | "completed";
    assigneeIds: number[];
    collaboratorIds: number[];
    files: UploadedFile[];
  } | null>(null);

  const updateModeInitialStateRef = useRef<{
    priority: "normal" | "low" | "high" | "urgent";
    dueDate: Date | null;
    status: "not_started" | "in_progress" | "completed";
    assigneeIds: number[];
    collaboratorIds: number[];
    attachmentIds: number[];
  } | null>(null);

  const isEditing = !!editData;
  const isUpdateMode = Boolean(editData?.id) && variant === "withMessageAndAttachments";

  // Conflict check for assignees/collaborators based on due date
  const allAssigneeIds = [...new Set([...assigneeIds, ...collaboratorIds])];
  const conflictStart = dueDate ? new Date(dueDate).toISOString() : undefined;
  const conflictEnd = dueDate
    ? new Date(new Date(dueDate).getTime() + 24 * 60 * 60 * 1000).toISOString()
    : undefined;
  const { conflicts: taskConflicts } = useConflictCheck(allAssigneeIds, conflictStart, conflictEnd);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const toAssignee = (u: any) => ({
      id: Number(u.id),
      name: u.name || u.email,
      email: u.email,
    });

    async function loadOptions() {
      try {
        const [propsRes, fieldTeamRes, propertyManagersRes] = await Promise.all([
          fetchJSON("/properties").catch(() => []),
          fetchJSON("/users/field-team").catch(() => []),
          fetchJSON("/users/property-managers").catch(() => []),
        ]);

        if (cancelled) return;

        setProperties(propsRes || []);

        const seen = new Set<number>();
        const merged: Assignee[] = [];
        for (const u of [...(fieldTeamRes || []), ...(propertyManagersRes || [])]) {
          const a = toAssignee(u);
          if (seen.has(a.id)) continue;
          seen.add(a.id);
          merged.push(a);
        }
        setAvailableAssignees(merged);
        setAvailableCollaborators(merged);
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
    if (!open || !selectedPropertyId) {
      setUnits([]);
      return;
    }

    let cancelled = false;

    async function loadUnits() {
      try {
        setUnitsLoading(true);
        const data = await fetchJSON(`/properties/${selectedPropertyId}/units`).catch(() => []);

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
  }, [open, selectedPropertyId]);

  useEffect(() => {
    if (!open || !editData) {
      hasHydratedRef.current = false;
      hasHydratedUpdateModeRef.current = false;
      updateModeInitialStateRef.current = null;
      return;
    }

    if (isUpdateMode) {
      if (hasHydratedUpdateModeRef.current) return;
      hasHydratedUpdateModeRef.current = true;

      setDescription(editData.description || "");
      setUpdateMessage("");
      setAssigneeIds(editData.assignees || []);
      setCollaboratorIds(editData.collaborators || []);

      const priorityMap: Record<string, "normal" | "low" | "high" | "urgent"> = {
        low: "low",
        medium: "normal",
        normal: "normal",
        high: "high",
        urgent: "urgent",
      };
      const initialPriority = priorityMap[editData.priority] || "normal";
      setPriority(initialPriority);

      const statusMap: Record<string, "not_started" | "in_progress" | "completed"> = {
        open: "not_started",
        not_started: "not_started",
        in_progress: "in_progress",
        completed: "completed",
        closed: "completed",
      };
      const initialStatus = statusMap[editData.status || "open"] || "not_started";
      setStatus(initialStatus);

      let initialDueDate: Date | null = null;
      if (editData.due_date) {
        const parsed = new Date(editData.due_date);
        if (!isNaN(parsed.getTime())) {
          initialDueDate = parsed;
          setDueDate(parsed);
        }
      }

      if (editData.attachments) {
        const initialFiles = editData.attachments.map((att) => ({
          id: String(att.id),
          name: att.file_name,
          size: att.file_size,
          type: att.file_type,
          storage_path: att.storage_path,
        }));
        setFiles(initialFiles);
      }
    } else {
      if (hasHydratedRef.current) return;
      hasHydratedRef.current = true;

      setTitle(editData.name);
      setDescription(editData.description || "");
      setCategory(editData.category || "");
      setSelectedPropertyId(editData.property_id);
      setSelectedUnitId(editData.unit_id ?? null);
      setSelectedLocationId(editData.location_id ?? null);
      setAssigneeIds(editData.assignees || []);
      setCollaboratorIds(editData.collaborators || []);

      const priorityMap: Record<string, "normal" | "low" | "high" | "urgent"> = {
        low: "low",
        medium: "normal",
        normal: "normal",
        high: "high",
        urgent: "urgent",
      };
      setPriority(priorityMap[editData.priority] || "normal");

      const statusMap: Record<string, "not_started" | "in_progress" | "completed"> = {
        open: "not_started",
        not_started: "not_started",
        in_progress: "in_progress",
        completed: "completed",
        closed: "completed",
      };
      setStatus(statusMap[editData.status || "open"] || "not_started");

      if (editData.due_date) {
        const parsed = new Date(editData.due_date);
        if (!isNaN(parsed.getTime())) {
          setDueDate(parsed);
        }
      }

      if (editData.attachments) {
        const uploadedFiles: UploadedFile[] = editData.attachments.map((att) => ({
          id: String(att.id),
          name: att.file_name,
          size: att.file_size,
          type: att.file_type,
          storage_path: att.storage_path,
        }));
        setFiles(uploadedFiles);
      }
    }
  }, [open, editData, isUpdateMode]);

  useEffect(() => {
    if (!open) {
      hasHydratedRef.current = false;
      hasHydratedUpdateModeRef.current = false;
      updateModeInitialStateRef.current = null;
    }
  }, [open]);

  // Snapshot initial update-mode state after all state has stabilized
  useEffect(() => {
    if (!isUpdateMode || !open || updateModeInitialStateRef.current !== null || !hasHydratedUpdateModeRef.current) {
      return;
    }

    // Use a small timeout to ensure all state updates have been applied
    const timeoutId = setTimeout(() => {
      // Snapshot current state values after React has settled
      // Assignees: sort IDs for stable comparison
      const snapshotAssigneeIds = [...assigneeIds].sort((a, b) => a - b);
      // Collaborators: treated identically to assignees - sort IDs for stable comparison
      const snapshotCollaboratorIds = [...collaboratorIds].sort((a, b) => a - b);
      const snapshotAttachmentIds = files
        .filter((f) => f.id)
        .map((f) => Number(f.id))
        .sort((a, b) => a - b);

      updateModeInitialStateRef.current = {
        priority,
        dueDate,
        status,
        assigneeIds: snapshotAssigneeIds,
        collaboratorIds: snapshotCollaboratorIds, // Stored identically to assignees
        attachmentIds: snapshotAttachmentIds,
      };
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isUpdateMode, open, priority, status, dueDate, assigneeIds, collaboratorIds, files]);

  useEffect(() => {
    if (!open && !editData) {
      setTitle("");
      setDescription("");
      setUpdateMessage("");
      setSelectedPropertyId(null);
      setSelectedUnitId(null);
      setSelectedLocationId(null);
      setCategory("");
      setPriority("normal");
      setDueDate(null);
      setStatus("not_started");
      setAssigneeIds([]);
      setCollaboratorIds([]);
      setFiles([]);
      setErrors({});
      initialStateRef.current = null;
      updateModeInitialStateRef.current = null;
    }
  }, [open, editData]);

  useEffect(() => {
    if (open && !editData && defaultPropertyId != null) {
      setSelectedPropertyId(defaultPropertyId);
    }
  }, [open, editData, defaultPropertyId]);

  const hasChanges = (): boolean => {
    if (!isEditing) return true;

    if (isUpdateMode) {
      if (!updateModeInitialStateRef.current) return false;
      const initial = updateModeInitialStateRef.current;
      
      if (initial.priority !== priority) return true;
      if (initial.status !== status) return true;
      if (initial.dueDate?.getTime() !== dueDate?.getTime()) return true;
      
      // Check updateMessage without relying on initial snapshot
      if (updateMessage.trim()) return true;
      
      // Sort current IDs for comparison (same logic for both assignees and collaborators)
      const currentAssigneeIds = [...assigneeIds].sort((a, b) => a - b);
      const currentCollaboratorIds = [...collaboratorIds].sort((a, b) => a - b);
      const currentAttachmentIds = files
        .filter((f) => f.id)
        .map((f) => Number(f.id))
        .sort((a, b) => a - b);
      
      // Check if any new files were added (files without IDs)
      const hasNewFiles = files.some((f) => !f.id);
      
      // Assignees change detection - collaborators use identical logic below
      if (JSON.stringify(initial.assigneeIds) !== JSON.stringify(currentAssigneeIds)) return true;
      // Collaborators change detection - treated identically to assignees
      if (JSON.stringify(initial.collaboratorIds) !== JSON.stringify(currentCollaboratorIds)) return true;
      if (JSON.stringify(initial.attachmentIds) !== JSON.stringify(currentAttachmentIds)) return true;
      if (hasNewFiles) return true;
      
      return false;
    } else {
      if (!initialStateRef.current) return true;
      const initial = initialStateRef.current;
      if (
        initial.title !== title ||
        initial.description !== description ||
        initial.propertyId !== selectedPropertyId ||
        initial.unitId !== selectedUnitId ||
        initial.locationId !== selectedLocationId ||
        initial.category !== category ||
        initial.priority !== priority ||
        initial.status !== status ||
        (initial.dueDate?.getTime() !== dueDate?.getTime()) ||
        JSON.stringify(initial.assigneeIds.sort()) !== JSON.stringify(assigneeIds.sort()) ||
        JSON.stringify(initial.collaboratorIds.sort()) !== JSON.stringify(collaboratorIds.sort()) ||
        initial.files.length !== files.length ||
        JSON.stringify(initial.files.map(f => f.id).sort()) !== JSON.stringify(files.map(f => f.id).sort())
      ) {
        return true;
      }
      return false;
    }
  };

  const generateUpdateMessage = (): string => {
    if (!isEditing || isUpdateMode) return "";
    
    if (!initialStateRef.current) return "";
    const initial = initialStateRef.current;
    const changes: string[] = [];

    if (initial.title !== title) {
      changes.push(`Task name changed from "${initial.title}" to "${title}"`);
    }
    if (initial.description !== description) {
      changes.push("Description updated");
    }
    if (initial.priority !== priority) {
      changes.push(`Priority changed from ${initial.priority} to ${priority}`);
    }
    if (initial.status !== status) {
      changes.push(`Status changed from ${initial.status} to ${status}`);
    }
    if (initial.category !== category) {
      changes.push(`Category changed from "${initial.category}" to "${category}"`);
    }
    if (initial.dueDate?.getTime() !== dueDate?.getTime()) {
      changes.push("Due date updated");
    }
    if (JSON.stringify(initial.assigneeIds.sort()) !== JSON.stringify(assigneeIds.sort())) {
      changes.push("Assignees updated");
    }
    if (JSON.stringify(initial.collaboratorIds.sort()) !== JSON.stringify(collaboratorIds.sort())) {
      changes.push("Collaborators updated");
    }
    if (initial.files.length !== files.length) {
      changes.push("Attachments updated");
    }

    return changes.join(", ");
  };

  const unitOptions = [
    {
      value: String(PROPERTY_LEVEL_UNIT_ID),
      label: PROPERTY_LEVEL_LABEL,
      displayLabel: PROPERTY_LEVEL_SHORT_LABEL,
    },
    ...units.map((u) => ({
      value: String(u.id),
      label: u.unit_name || `Unit #${u.id}`,
    })),
  ];

  const assigneeOptions: MultiSelectOption[] = availableAssignees.map((u) => ({
    id: String(u.id),
    label: u.name,
    initials: u.name.slice(0, 2).toUpperCase(),
  }));

  const collaboratorOptions: MultiSelectOption[] = availableCollaborators.map((u) => ({
    id: String(u.id),
    label: u.name,
    initials: u.name.slice(0, 2).toUpperCase(),
  }));

  const selectedAssignees = assigneeOptions.filter((opt) =>
    assigneeIds.includes(Number(opt.id))
  );

  const selectedCollaborators = collaboratorOptions.filter((opt) =>
    collaboratorIds.includes(Number(opt.id))
  );


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isUpdateMode) {
      if (!priority) {
        newErrors.priority = "Priority is required";
      }
      if (!dueDate) {
        newErrors.dueDate = "Due date is required";
      }
      if (assigneeIds.length === 0) {
        newErrors.assignees = "At least one assignee is required";
      }
    } else {
      if (!selectedPropertyId) {
        newErrors.property = "Property is required";
      }
      if (!title.trim()) {
        newErrors.title = "Task name is required";
      }
      if (!priority) {
        newErrors.priority = "Priority is required";
      }
      if (!dueDate) {
        newErrors.dueDate = "Due date is required";
      }
      if (assigneeIds.length === 0) {
        newErrors.assignees = "At least one assignee is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const dispatchTasksRefresh = (propertyId?: number | null) => {
    const detail = propertyId ? { propertyId } : {};
    window.dispatchEvent(new CustomEvent("refreshAllTasks", { detail }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (isEditing && !hasChanges()) {
      setErrors({ submit: "No changes to save" });
      return;
    }

    let payload: any;

    if (isUpdateMode) {
      if (!updateModeInitialStateRef.current) {
        setErrors({ submit: "Cannot determine initial state" });
        return;
      }

      if (!userId) {
        setErrors({ submit: "User ID is required" });
        return;
      }

      const initial = updateModeInitialStateRef.current;
      payload = {};

      // Always compute all field diffs - message is additive only and does not gate other fields
      
      // Status diff
      if (initial.status !== status) {
        const statusMap: Record<"not_started" | "in_progress" | "completed", "open" | "in_progress" | "completed"> = {
          not_started: "open",
          in_progress: "in_progress",
          completed: "completed",
        };
        payload.status = statusMap[status] || status;
      }

      // Priority diff
      if (initial.priority !== priority) {
        const priorityMap: Record<"normal" | "low" | "high" | "urgent", "low" | "medium" | "high" | "urgent"> = {
          low: "low",
          normal: "medium",
          high: "high",
          urgent: "urgent",
        };
        payload.priority = priorityMap[priority] || priority;
      }

      // Due date diff
      if (initial.dueDate?.getTime() !== dueDate?.getTime()) {
        payload.due_date = dueDate ? dueDate.toISOString() : null;
      }

      // Assignees diff - compute sorted arrays for comparison
      const currentAssigneeIds = [...assigneeIds].sort((a, b) => a - b);
      if (JSON.stringify(initial.assigneeIds) !== JSON.stringify(currentAssigneeIds)) {
        payload.assignees = assigneeIds;
      }

      // Collaborators diff - treated identically to assignees
      // Compute sorted arrays for comparison (same logic as assignees)
      const currentCollaboratorIds = [...collaboratorIds].sort((a, b) => a - b);
      // Include in payload ONLY when changed (same comparison logic as assignees)
      if (JSON.stringify(initial.collaboratorIds) !== JSON.stringify(currentCollaboratorIds)) {
        payload.collaborators = collaboratorIds;
      }

      // Attachment IDs diff
      const currentAttachmentIds = files
        .filter((f) => f.id)
        .map((f) => Number(f.id))
        .sort((a, b) => a - b);

      if (JSON.stringify(initial.attachmentIds) !== JSON.stringify(currentAttachmentIds)) {
        payload.attachment_ids = currentAttachmentIds;
      }

      // New attachments (additive)
      const newAttachments = files
        .filter((f) => !f.id && f.storage_path)
        .map((f) => ({
          file_name: f.name,
          storage_path: f.storage_path!,
          file_type: f.type,
          file_size: f.size,
        }));

      if (newAttachments.length > 0) {
        payload.new_attachments = newAttachments;
      }

      // Actor ID is always included
      payload.actor_id = userId;

      // Message is additive only - if it exists, include it, but it doesn't gate other fields
      if (updateMessage.trim()) {
        payload.message = updateMessage.trim();
      }
    } else {
      const priorityMap: Record<"normal" | "low" | "high" | "urgent", "low" | "medium" | "high" | "urgent"> = {
        low: "low",
        normal: "medium",
        high: "high",
        urgent: "urgent",
      };

      const statusMap: Record<"not_started" | "in_progress" | "completed", "open" | "in_progress" | "completed"> = {
        not_started: "open",
        in_progress: "in_progress",
        completed: "completed",
      };

      payload = {
        property_id: selectedPropertyId!,
        name: title.trim(),
        priority: priorityMap[priority],
        tags: [],
      };

      if (userId) {
        payload.requested_by = userId;
      }

      if (selectedUnitId !== null) {
        payload.unit_id = selectedUnitId;
      }

      if (selectedLocationId !== null) {
        payload.location_id = selectedLocationId;
      }

      if (description.trim()) {
        payload.description = description.trim();
      }

      if (status) {
        payload.status = statusMap[status];
      }

      if (category.trim()) {
        payload.category = category.trim();
      }

      if (dueDate) {
        payload.due_date = dueDate.toISOString();
      }

      if (assigneeIds.length > 0) {
        payload.assignees = assigneeIds;
      }

      if (collaboratorIds.length > 0) {
        payload.collaborators = collaboratorIds;
      }

      const filesWithTempKey = files.filter((f) => {
        if (f.error) return false;
        const tempKey = (f as any).temp_object_key;
        return tempKey && typeof tempKey === "string" && tempKey.trim() !== "" && f.name && f.type && typeof f.size === "number";
      });
      if (filesWithTempKey.length > 0) {
        payload.attachments = filesWithTempKey.map((f) => ({
          temp_object_key: (f as any).temp_object_key,
          file_name: f.name,
          file_type: f.type,
          file_size: f.size,
        }));
      }
    }

    if (isEditing) {
      if (isUpdateMode) {
        await fetchJSON(`/maintenance/tasks/${editData.id}/update`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        dispatchTasksRefresh(editData.property_id);
        // Call onTaskUpdated callback if provided
        if (onTaskUpdated) {
          onTaskUpdated(editData.id);
        }
      } else {
        await fetchJSON(`/maintenance/tasks/${editData.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        dispatchTasksRefresh(editData.property_id);
        // Call onTaskUpdated callback if provided
        if (onTaskUpdated) {
          onTaskUpdated(editData.id);
        }
      }
    } else {
      try {
        await fetchJSON("/maintenance/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        dispatchTasksRefresh(selectedPropertyId);
      } catch (error) {
        console.error("Failed to create task:", error);
        setErrors({ submit: "Failed to create task" });
        return;
      }
    }

    onOpenChange(false);
  };

  const handleFilesAdded = async (newFiles: UploadedFile[]) => {
    if (isEditing) {
      const filesToAdd: UploadedFile[] = [];

      for (const file of newFiles) {
        if (file.file) {
          const formData = new FormData();
          formData.append("file", file.file);

          try {
            const response = await authFetch("/maintenance/uploads", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              throw new Error("Upload failed");
            }

            const uploaded = await response.json();
            filesToAdd.push({
              ...file,
              id: undefined,
              storage_path: uploaded.storage_path,
              uploading: false,
            });
          } catch (err) {
            filesToAdd.push({
              ...file,
              uploading: false,
              error: "Upload failed",
            });
          }
        } else {
          filesToAdd.push(file);
        }
      }

      setFiles([...files, ...filesToAdd]);
    } else {
      const filesToAdd: UploadedFile[] = [];

      for (const file of newFiles) {
        if (file.file) {
          const formData = new FormData();
          formData.append("file", file.file);

          try {
            const response = await authFetch("/maintenance/tasks/attachments/upload", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              throw new Error("Upload failed");
            }

            const uploaded = await response.json();
            if (!uploaded.temp_object_key || typeof uploaded.temp_object_key !== "string") {
              throw new Error("Invalid upload response: missing temp_object_key");
            }
            filesToAdd.push({
              ...file,
              name: uploaded.original_name || file.name,
              type: uploaded.file_type || file.type,
              size: uploaded.file_size || file.size,
              temp_object_key: uploaded.temp_object_key,
              uploading: false,
            } as UploadedFile & { temp_object_key: string });
          } catch (err) {
            filesToAdd.push({
              ...file,
              uploading: false,
              error: "Upload failed",
            });
          }
        } else {
          filesToAdd.push(file);
        }
      }

      setFiles([...files, ...filesToAdd]);
    }
  };

  const handleFileRemoved = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (isEditing && file?.storage_path) {
      const filename = file.storage_path.split("/").pop();
      if (filename) {
        try {
          await fetchJSON(`/maintenance/uploads/${filename}`, {
            method: "DELETE",
          });
        } catch (err) {
          console.error("Failed to delete file:", err);
        }
      }
    }
    setFiles(files.filter((f) => f.id !== fileId));
  };

  const handleViewFile = (file: UploadedFile) => {
    if (file.storage_path) {
      const url = `/api/files/${file.storage_path}`;
      setViewingFile({ ...file, storage_path: url } as UploadedFile);
      setPdfViewerOpen(true);
    }
  };

  const showAttachments = variant === "withMessageAndAttachments";

  return (
    <>
      <ModalTemplate
        open={open}
        onOpenChange={onOpenChange}
        title={isUpdateMode ? "Update task" : isEditing ? "Edit Task" : "Create Task"}
        size={isUpdateMode ? "md" : "lg"}
        footer={
          onApprove ? (
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={onReject}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={onApprove}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Approve
              </button>
            </div>
          ) : (
            <ModalButtons
              onCancel={() => onOpenChange(false)}
              onConfirm={handleSubmit}
              cancelLabel="Cancel"
              confirmLabel={isUpdateMode ? "Save Update" : isEditing ? "Update Task" : "Create Task"}
              confirmDisabled={isUpdateMode && !hasChanges()}
            />
          )
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: isUpdateMode ? "8px" : "-20px" }}>
          {editData && <AIGeneratedBanner entityType="task" entityId={editData.id} />}
          {isUpdateMode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <StatusSelectField
                  label="Status"
                  required
                  value={status}
                  onChange={(value) => setStatus(value)}
                  error={errors.status}
                />
                <PrioritySelectField
                  label="Priority"
                  required
                  value={priority}
                  onChange={(value) => setPriority(value)}
                  error={errors.priority}
                />
                <DateField
                  label="Due Date"
                  required
                  value={dueDate}
                  onChange={(date) => setDueDate(date as Date)}
                  error={errors.dueDate}
                  placeholder="mm/dd/yyyy"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <MultiSelectField
                  label="Assigned To"
                  required
                  value={selectedAssignees}
                  onChange={(options) => {
                    setAssigneeIds(options.map((opt) => Number(opt.id)));
                  }}
                  placeholder="Select assignees"
                  options={assigneeOptions}
                  error={errors.assignees}
                />
                <MultiSelectField
                  label="Collaborators"
                  value={selectedCollaborators}
                  onChange={(options) => {
                    setCollaboratorIds(options.map((opt) => Number(opt.id)));
                  }}
                  placeholder="Select collaborators"
                  options={collaboratorOptions}
                />
              </div>

              <ConflictWarningBanner conflicts={taskConflicts} />

              <TextAreaField
                label="Message"
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                error={errors.updateMessage}
                placeholder="Add a message..."
                rows={4}
              />

              {/* Attachments section commented out for now
              <FileUploadField
                label="Attachments"
                files={files}
                onFilesAdded={handleFilesAdded}
                onFileRemoved={handleFileRemoved}
                onViewFile={handleViewFile}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                maxFiles={10}
                maxSize={10 * 1024 * 1024}
              />
              */}
            </div>
          ) : (
            <>
              <FormSection title="Task Details">
                <TextField
                  label="Task Name"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={errors.title}
                  placeholder="Type Task Name"
                />

                {showAttachments && (
                  <TextAreaField
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    error={errors.description}
                    placeholder="Insert Description Here"
                    rows={6}
                  />
                )}

                <FieldRow columns={2}>
                  <FieldRowItem>
                    <PropertyLocationCombobox
                      label="Property"
                      required
                      properties={properties}
                      propertyId={selectedPropertyId}
                      locationId={selectedLocationId}
                      onChange={({ propertyId, locationId }) => {
                        setSelectedPropertyId(propertyId);
                        setSelectedLocationId(locationId);
                        setSelectedUnitId(null);
                      }}
                      error={errors.property}
                      placeholder="Select Property"
                      searchPlaceholder="Search properties..."
                    />
                  </FieldRowItem>
                  <FieldRowItem>
                    <SelectField
                      label="Unit"
                      value={
                        selectedUnitId === null ? "" : String(selectedUnitId)
                      }
                      onChange={(value) => {
                        setSelectedUnitId(value ? Number(value) : null);
                      }}
                      placeholder={
                        !selectedPropertyId
                          ? "Select property first"
                          : unitsLoading
                          ? "Loading units…"
                          : "Select Unit If Applicable"
                      }
                      options={unitOptions}
                      disabled={!selectedPropertyId || unitsLoading}
                    />
                  </FieldRowItem>
                </FieldRow>

                <SelectField
                  label="Category"
                  value={category}
                  onChange={(value) => setCategory(typeof value === "string" ? value : value[0] || "")}
                  placeholder="Select Category"
                  options={[
                    { value: "Maintenance", label: "Maintenance" },
                    { value: "Repair", label: "Repair" },
                    { value: "Other", label: "Other" },
                  ]}
                />

                <FieldRow columns={3}>
                  <FieldRowItem>
                    <PrioritySelectField
                      label="Priority"
                      required
                      value={priority}
                      onChange={(value) => setPriority(value)}
                      error={errors.priority}
                    />
                  </FieldRowItem>
                  <FieldRowItem>
                    <DateField
                      label="Due Date"
                      required
                      value={dueDate}
                      onChange={(date) => setDueDate(date as Date)}
                      error={errors.dueDate}
                      placeholder="mm/dd/yyyy"
                    />
                  </FieldRowItem>
                  <FieldRowItem>
                    <StatusSelectField
                      label="Status"
                      required
                      value={status}
                      onChange={(value) => setStatus(value)}
                      error={errors.status}
                    />
                  </FieldRowItem>
                </FieldRow>

                <FileUploadField
                  label="Attachments"
                  files={files}
                  onFilesAdded={handleFilesAdded}
                  onFileRemoved={handleFileRemoved}
                  onViewFile={handleViewFile}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                  maxFiles={10}
                  maxSize={10 * 1024 * 1024}
                />
              </FormSection>

              <FormSection title="Assignment">
                <FieldRow columns={2}>
                  <FieldRowItem>
                    <MultiSelectField
                      label="Assignees"
                      required
                      value={selectedAssignees}
                      onChange={(options) => {
                        setAssigneeIds(options.map((opt) => Number(opt.id)));
                      }}
                      placeholder="Select assignees"
                      options={assigneeOptions}
                      error={errors.assignees}
                    />
                  </FieldRowItem>
                  <FieldRowItem>
                    <MultiSelectField
                      label="Collaborators"
                      value={selectedCollaborators}
                      onChange={(options) => {
                        setCollaboratorIds(options.map((opt) => Number(opt.id)));
                      }}
                      placeholder="Select collaborators"
                      options={collaboratorOptions}
                    />
                  </FieldRowItem>
                </FieldRow>
                <ConflictWarningBanner conflicts={taskConflicts} />
              </FormSection>
            </>
          )}
        </div>
      </ModalTemplate>

      {pdfViewerOpen && viewingFile && (
        <PdfViewerModal
          open={pdfViewerOpen}
          onOpenChange={setPdfViewerOpen}
          title={viewingFile.name}
          url={viewingFile.storage_path}
        />
      )}
    </>
  );
}
