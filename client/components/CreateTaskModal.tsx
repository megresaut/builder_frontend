import { useState, useEffect } from "react";
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
  type MultiSelectOption,
} from "@/components/forms";

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    title: string;
    due: string;
    priority: string;
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
  editData,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [property, setProperty] = useState("");
  const [unit, setUnit] = useState("");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("in_progress");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<
    MultiSelectOption[]
  >([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState<
    MultiSelectOption[]
  >([]);
  const [errors, setErrors] = useState<{
    title?: boolean;
  }>({});
  const [errorMessages, setErrorMessages] = useState<{
    title?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: {
      title?: boolean;
    } = {};
    const newErrorMessages: {
      title?: string;
    } = {};

    if (!title.trim()) {
      newErrors.title = true;
      newErrorMessages.title = "Task name is required";
    }
    if (title.trim().length > 125) {
      newErrors.title = true;
      newErrorMessages.title = "Task name must be 125 characters or less";
    }

    setErrors(newErrors);
    setErrorMessages(newErrorMessages);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log("Form submitted", {
        title,
        description,
        property,
        unit,
        priority,
        dueDate,
        status,
        attachments,
        selectedAssignees,
        selectedCollaborators,
      });
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleAttachmentsChange = (files: FileList | null) => {
    if (files) {
      setAttachments(Array.from(files));
    }
  };

  useEffect(() => {
    if (open) {
      // When modal opens with editData, populate it
      if (editData) {
        setTitle(editData.title);
        setPriority(editData.priority.toLowerCase());
      }
    } else {
      // When modal closes, clear all form state and errors
      setTitle("");
      setDescription("");
      setProperty("");
      setUnit("");
      setPriority("normal");
      setDueDate("");
      setStatus("in_progress");
      setAttachments([]);
      setSelectedAssignees([]);
      setSelectedCollaborators([]);
      setErrors({});
      setErrorMessages({});
    }
  }, [open, editData]);

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      onClose={handleCancel}
      title={editData ? "Edit Task" : "Create Task"}
      size="lg"
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={editData ? "Update Task" : "Create Task"}
        />
      }
    >
      <FormLayout>
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
            <SelectField
              label="Due Date"
              value={dueDate}
              onChange={setDueDate}
              placeholder="mm/dd/yyyy"
              options={[
                { value: "today", label: "Today" },
                { value: "tomorrow", label: "Tomorrow" },
              ]}
            />
            <SelectField
              label="Status"
              value={status}
              onChange={setStatus}
              placeholder="Select Status"
              options={[
                { value: "in_progress", label: "In Progress" },
                { value: "completed", label: "Completed" },
              ]}
            />
          </FormFieldRow>

          {/* Attachments - Full Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => handleAttachmentsChange(e.target.files)}
              className="block w-full"
            />
            {attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  {attachments.length} file(s) selected
                </p>
              </div>
            )}
          </div>
        </FormSection>

        <FormSection title="Assignment" showDivider={false}>
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
      </FormLayout>
    </ModalTemplate>
  );
}
