import React, { useState, useEffect, useCallback } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import {
  FormLayout,
  FormSection,
  FormFieldRow,
} from "@/components/ui/form-layout";
import {
  TextField,
  TextAreaField,
  SelectField,
  MultiSelectField,
  DateField,
  FileUploadField,
  type MultiSelectOption,
} from "@/components/forms";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import PdfViewerModal from "@/components/PdfViewerModal";
import { useFileUpload } from "@/hooks/useFileUpload";
import { TASK_CATEGORIES } from "@/constants/taskCategories";

type ModalVariant = "compact" | "withMessageAndAttachments";

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: ModalVariant;
  onTaskCreated?: (taskData: {
    title: string;
    description: string;
    property: string;
    unit: string;
    priority: string;
    dueDate: Date | null;
    status: string;
    assignees: MultiSelectOption[];
    collaborators: MultiSelectOption[];
    message?: string;
  }) => void;
  editData?: {
    id: number;
    title: string;
    description?: string;
    property?: string;
    unit?: string;
    priority: string;
    due?: string;
    status?: string;
    dueDate?: Date | null;
    assignees?: Array<{ id: number; name: string; initials: string }>;
  };
}

const AVAILABLE_ASSIGNEES: MultiSelectOption[] = [
  { id: "1", label: "David Harris", initials: "DH" },
  { id: "2", label: "Sarah Johnson", initials: "SJ" },
  { id: "3", label: "Michael Chen", initials: "MC" },
  { id: "4", label: "Emily Rodriguez", initials: "ER" },
  { id: "5", label: "James Wilson", initials: "JW" },
];

const AVAILABLE_COLLABORATORS: MultiSelectOption[] = [
  { id: "1", label: "David Harris", initials: "DH" },
  { id: "2", label: "Sarah Johnson", initials: "SJ" },
  { id: "3", label: "Michael Chen", initials: "MC" },
  { id: "4", label: "Emily Rodriguez", initials: "ER" },
  { id: "5", label: "James Wilson", initials: "JW" },
];

export default function CreateTaskModal({
  open,
  onOpenChange,
  onTaskCreated,
  editData,
  variant = "compact",
  onModalClose,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [property, setProperty] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [status, setStatus] = useState("not_started");
  const [selectedAssignees, setSelectedAssignees] = useState<
    MultiSelectOption[]
  >([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState<
    MultiSelectOption[]
  >([]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    title?: boolean;
  }>({});
  const [errorMessages, setErrorMessages] = useState<{
    title?: string;
  }>({});

  // Track initial state for detecting changes
  const [initialState, setInitialState] = useState<{
    status: string;
    priority: string;
    dueDate: Date | null;
    assignees: MultiSelectOption[];
    collaborators: MultiSelectOption[];
    message: string;
    property: string;
    unit: string;
    category: string;
  } | null>(null);

  // File upload management
  const fileUpload = useFileUpload();

  // Check if anything has changed in the update variant
  const hasChanges = (): boolean => {
    if (variant !== "withMessageAndAttachments" || !initialState) {
      return true;
    }
    return (
      status !== initialState.status ||
      priority !== initialState.priority ||
      (dueDate?.toString() !== initialState.dueDate?.toString()) ||
      selectedAssignees.length !== initialState.assignees.length ||
      !selectedAssignees.every((a) =>
        initialState.assignees.some((ia) => ia.id === a.id)
      ) ||
      selectedCollaborators.length !== initialState.collaborators.length ||
      !selectedCollaborators.every((c) =>
        initialState.collaborators.some((ic) => ic.id === c.id)
      ) ||
      message !== initialState.message ||
      property !== initialState.property ||
      unit !== initialState.unit ||
      category !== initialState.category ||
      fileUpload.files.length > 0
    );
  };

  // Generate update message based on changes
  const generateUpdateMessage = (): string => {
    const changes: string[] = [];

    if (initialState) {
      if (status !== initialState.status) {
        const statusLabels: { [key: string]: string } = {
          not_started: "Not Started",
          in_progress: "In Progress",
          completed: "Completed",
        };
        changes.push(
          `updated status to ${statusLabels[status] || status}`
        );
      }

      if (priority !== initialState.priority) {
        const priorityLabel =
          priority.charAt(0).toUpperCase() + priority.slice(1);
        changes.push(`updated priority to ${priorityLabel}`);
      }

      if (dueDate?.toString() !== initialState.dueDate?.toString()) {
        const dateStr = dueDate
          ? dueDate.toLocaleDateString()
          : "no due date";
        changes.push(`updated due date to ${dateStr}`);
      }
    }

    if (message) {
      changes.push("added a message");
    }

    if (fileUpload.files.length > 0) {
      changes.push(
        `added ${fileUpload.files.length} attachment${
          fileUpload.files.length !== 1 ? "s" : ""
        }`
      );
    }

    if (changes.length === 0) {
      return "updated the task";
    }

    return changes.join(", ");
  };

  const validateForm = (): boolean => {
    const newErrors: {
      title?: boolean;
    } = {};
    const newErrorMessages: {
      title?: string;
    } = {};

    // Only validate title in compact mode; withMessageAndAttachments doesn't show it
    if (variant === "compact") {
      if (!title.trim()) {
        newErrors.title = true;
        newErrorMessages.title = "Task name is required";
      }
      if (title.trim().length > 125) {
        newErrors.title = true;
        newErrorMessages.title = "Task name must be 125 characters or less";
      }
    }

    setErrors(newErrors);
    setErrorMessages(newErrorMessages);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const taskData = {
        title,
        description,
        property,
        unit,
        category,
        priority,
        dueDate,
        status,
        assignees: selectedAssignees,
        collaborators: selectedCollaborators,
        ...(variant === "withMessageAndAttachments" && {
          message: generateUpdateMessage(),
          messageBody: message,
          files: fileUpload.files,
        }),
      };
      onTaskCreated?.(taskData);
      // Reset form state
      setTitle("");
      setDescription("");
      setProperty("");
      setUnit("");
      setCategory("");
      setPriority("normal");
      setDueDate(null);
      setStatus("not_started");
      setSelectedAssignees([]);
      setSelectedCollaborators([]);
      setMessage("");
      setInitialState(null);
      setErrors({});
      setErrorMessages({});
      // Reset files after submit
      fileUpload.reset();
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    // Reset form before closing
    setTitle("");
    setDescription("");
    setProperty("");
    setUnit("");
    setCategory("");
    setPriority("normal");
    setDueDate(null);
    setStatus("not_started");
    setSelectedAssignees([]);
    setSelectedCollaborators([]);
    setMessage("");
    setInitialState(null);
    setErrors({});
    setErrorMessages({});
    fileUpload.reset();
    onOpenChange(false);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      fileUpload.cleanup();
    };
  }, []);

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      if (editData) {
        // Populate fields from editData when opening in edit mode
        setTitle(editData.title);
        setDescription(editData.description || "");
        setProperty(editData.property || "");
        setUnit(editData.unit || "");
        setPriority(editData.priority.toLowerCase());
        setDueDate(editData.dueDate || null);
        const statusMap: { [key: string]: string } = {
          "Not Started": "not_started",
          "In Progress": "in_progress",
          Completed: "completed",
        };
        setStatus(statusMap[editData.status || "Not Started"] || "not_started");
        if (editData.assignees && editData.assignees.length > 0) {
          setSelectedAssignees(
            editData.assignees.map((a) => ({
              id: String(a.id),
              label: a.name,
              initials: a.initials,
            }))
          );
        }
      } else {
        // Clear form when opening in non-edit mode
        setTitle("");
        setDescription("");
        setProperty("");
        setUnit("");
        setCategory("");
        setPriority("normal");
        setDueDate(null);
        setStatus("not_started");
        setSelectedAssignees([]);
        setSelectedCollaborators([]);
        setMessage("");
      }

    }
  }, [open, editData?.id, variant]);

  // Set initial state for change detection in "update" variant
  useEffect(() => {
    if (open && variant === "withMessageAndAttachments" && initialState === null) {
      const timer = setTimeout(() => {
        setInitialState({
          status,
          priority,
          dueDate,
          assignees: selectedAssignees,
          collaborators: selectedCollaborators,
          message,
          property,
          unit,
          category,
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, variant]);


  return (
    <>
      <ModalTemplate
        open={open}
        onOpenChange={onOpenChange}
        onClose={handleCancel}
        title={variant === "withMessageAndAttachments" ? "Update task" : (editData ? "Edit Task" : "Create Task")}
        size={variant === "withMessageAndAttachments" ? "md" : "lg"}
        footer={
          <ModalButtons
            onCancel={handleCancel}
            onConfirm={handleSubmit}
            cancelLabel="Cancel"
            confirmLabel={variant === "withMessageAndAttachments" ? "Save Update" : (editData ? "Update Task" : "Create Task")}
            confirmDisabled={variant === "withMessageAndAttachments" && !hasChanges()}
          />
        }
      >
        <FormLayout>
          {variant === "compact" && (
            <FormSection title="Task Details" showDivider={true}>
              {/* Task Name - Full Width, First Field */}
              <TextField
              label="Task Name"
              required
              value={title}
              onChange={(e) => {
                const newValue = e.target.value.slice(0, 125);
                setTitle(newValue);
                if (errors.title && newValue.trim()) {
                  setErrors((prev) => ({ ...prev, title: false }));
                  setErrorMessages((prev) => ({ ...prev, title: undefined }));
                }
              }}
              error={errorMessages.title}
              placeholder="Type Task Name"
              maxLength={125}
            />

            {/* Description - Full Width */}
            <TextAreaField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Insert Description Here"
            />

            {/* Property + Unit - 2 Columns */}
            <FormFieldRow columns={2}>
              <SelectField
                label="Property"
                value={property}
                onChange={(value) => {
                  setProperty(value);
                  // Clear unit when property changes
                  if (value !== property) {
                    setUnit("");
                  }
                }}
                placeholder="Select Property"
                options={[
                  { value: "property1", label: "22 Indian Chase Dr" },
                  { value: "property2", label: "Property 2" },
                ]}
              />
              <SelectField
                label="Unit"
                value={unit}
                onChange={setUnit}
                placeholder="Select Unit If Applicable"
                disabled={!property}
                options={
                  property
                    ? [
                        { value: "unit1", label: "Unit 1" },
                        { value: "unit2", label: "Unit 2" },
                      ]
                    : []
                }
              />
            </FormFieldRow>

            {/* Category - Full Width */}
            <SelectField
              label="Category"
              value={category}
              onChange={setCategory}
              placeholder="Select Category"
              options={TASK_CATEGORIES}
            />

            {/* Priority + Due Date + Status - 3 Columns */}
            <FormFieldRow columns={3}>
              <SelectField
                label="Priority"
                value={priority}
                onChange={setPriority}
                placeholder="Select Priority"
                options={[
                  { value: "low", label: "Low" },
                  { value: "normal", label: "Normal" },
                  { value: "high", label: "High" },
                ]}
              />
              <DateField
                label="Due Date"
                value={dueDate}
                onChange={setDueDate}
                placeholder="mm/dd/yyyy"
                returnFormat="Date"
              />
              <SelectField
                label="Status"
                value={status}
                onChange={setStatus}
                placeholder="Select Status"
                options={[
                  { value: "not_started", label: "Not Started" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "completed", label: "Completed" },
                ]}
              />
            </FormFieldRow>

            {/* Attachments - Full Width */}
            <FileUploadField
              label="Attachments"
              files={fileUpload.files}
              onFilesAdded={fileUpload.addFiles}
              onFileRemoved={fileUpload.removeFile}
              onViewFile={fileUpload.viewFile}
              onFileRenamed={(fileId, newName) => {
                // Update file name in the list
                // Note: Full rename editing happens in the PDF viewer modal
              }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv"
              maxFiles={10}
              maxSize={10 * 1024 * 1024}
              placeholder="Drag and drop files here, or click to browse"
            />
          </FormSection>
          )}

          {variant === "withMessageAndAttachments" && (
            <FormSection showDivider={false}>
              {/* Priority + Due Date + Status - 3 Columns */}
              <FormFieldRow columns={3}>
                <SelectField
                  label="Status"
                  value={status}
                  onChange={setStatus}
                  placeholder="Select Status"
                  options={[
                    { value: "not_started", label: "Not Started" },
                    { value: "in_progress", label: "In Progress" },
                    { value: "completed", label: "Completed" },
                  ]}
                />
                <SelectField
                  label="Priority"
                  value={priority}
                  onChange={setPriority}
                  placeholder="Select Priority"
                  options={[
                    { value: "low", label: "Low" },
                    { value: "normal", label: "Normal" },
                    { value: "high", label: "High" },
                  ]}
                />
                <DateField
                  label="Due Date"
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="mm/dd/yyyy"
                  returnFormat="Date"
                />
              </FormFieldRow>

              {/* Assignees + Collaborators - 2 Columns */}
              <FormFieldRow columns={2}>
                <MultiSelectField
                  label="Assigned To"
                  value={selectedAssignees}
                  onChange={setSelectedAssignees}
                  placeholder="Select assignees"
                  options={AVAILABLE_ASSIGNEES}
                />
                <MultiSelectField
                  label="Collaborators"
                  value={selectedCollaborators}
                  onChange={setSelectedCollaborators}
                  placeholder="Select collaborators"
                  options={AVAILABLE_COLLABORATORS}
                />
              </FormFieldRow>

              {/* Message - Full Width */}
              <TextAreaField
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message…"
              />

              {/* Attachments - Full Width */}
              <FileUploadField
                label="Attachments"
                files={fileUpload.files}
                onFilesAdded={fileUpload.addFiles}
                onFileRemoved={fileUpload.removeFile}
                onViewFile={fileUpload.viewFile}
                onFileRenamed={(fileId, newName) => {
                  // Update file name in the list
                  // Note: Full rename editing happens in the PDF viewer modal
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv"
                maxFiles={10}
                maxSize={10 * 1024 * 1024}
                placeholder="Drag and drop files here, or click to browse"
              />
            </FormSection>
          )}

          {variant === "compact" && (
            <FormSection title="Assignment" showDivider={true}>
              {/* Assignees + Collaborators - 2 Columns */}
              <FormFieldRow columns={2}>
                <MultiSelectField
                  label="Assignees"
                  value={selectedAssignees}
                  onChange={setSelectedAssignees}
                  placeholder="Select assignees"
                  options={AVAILABLE_ASSIGNEES}
                />
                <MultiSelectField
                  label="Collaborators"
                  value={selectedCollaborators}
                  onChange={setSelectedCollaborators}
                  placeholder="Select collaborators"
                  options={AVAILABLE_COLLABORATORS}
                />
              </FormFieldRow>
            </FormSection>
          )}
        </FormLayout>
      </ModalTemplate>

      <PdfViewerModal
        open={fileUpload.isViewFileOpen}
        onOpenChange={(open) => {
          if (!open) {
            fileUpload.closeViewFile();
          }
        }}
        title={fileUpload.selectedFileForView?.name || "File Preview"}
        url={fileUpload.selectedFileForView?.url}
        onRenameClick={() => fileUpload.startRenaming(fileUpload.selectedFileForView!)}
        isRenaming={fileUpload.isRenamingFile}
        renamingFileName={fileUpload.renamingFileName}
        onRenamingFileNameChange={fileUpload.updateRenamingFileName}
        onSaveFileName={fileUpload.saveFileName}
        onCancelRenaming={fileUpload.cancelRenaming}
      />
    </>
  );
}
