import { useState, useEffect } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import {
  TextField,
  SelectField,
  TextAreaField,
  DateField,
  MultiSelectField,
} from "@/components/forms";
import { AVAILABLE_ASSIGNEES } from "@/data/fto";

interface CreateFTOModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    dueDate: string;
    priority: string;
    ftoStatus?: string;
  };
  viewData?: {
    name: string;
    description: string;
    dueDate?: string;
    dateOfWork?: string;
    priority?: string;
    status?: string;
    property?: string;
    unit?: string;
  };
  isSimple?: boolean;
  isViewOnly?: boolean;
  onFTOCreated?: (ftoData: {
    property: string;
    unit: string;
    description: string;
    dueDate: Date | null;
    priority: string;
  }) => void;
}

export default function CreateFTOModal({
  open,
  onOpenChange,
  editData,
  viewData,
  isSimple = false,
  isViewOnly = false,
  onFTOCreated,
}: CreateFTOModalProps) {
  const [property, setProperty] = useState("");
  const [unit, setUnit] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [ftoName, setFtoName] = useState("");
  const [priority, setPriority] = useState("normal");
  const [ftoStatus, setFtoStatus] = useState("pending-approval");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<
    MultiSelectOption[]
  >([]);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setProperty("");
      setUnit("");
      setSelectedTask("");
      setFtoName("");
      setPriority("normal");
      setFtoStatus("pending-approval");
      setDueDate(null);
      setSelectedAssignees([]);
      setDescription("");
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (isViewOnly && viewData) {
      setFtoName(viewData.name || "");
      setDescription(viewData.description || "");
      setPriority(viewData.priority?.toLowerCase() || "normal");
      setProperty(viewData.property || "");
      setUnit(viewData.unit || "");

      const dateStr = viewData.dueDate || viewData.dateOfWork;
      if (dateStr) {
        const date = new Date(dateStr);
        setDueDate(isNaN(date.getTime()) ? null : date);
      }

      if ("status" in viewData) {
        setFtoStatus(viewData.status || "pending-approval");
      }
    } else if (editData) {
      setPriority(editData.priority.toLowerCase());
      setFtoStatus(editData.ftoStatus || "pending-approval");
      if (editData.dueDate) {
        const date = new Date(editData.dueDate);
        setDueDate(date);
      }
    }
  }, [editData, viewData, isViewOnly, open]);

  // Auto-update FTO Status when assignees are added/removed
  useEffect(() => {
    if (isViewOnly) return;

    if (selectedAssignees.length > 0 && ftoStatus === "pending-approval") {
      setFtoStatus("dispatched");
    } else if (selectedAssignees.length === 0 && ftoStatus === "dispatched") {
      setFtoStatus("pending-approval");
    }
  }, [selectedAssignees, isViewOnly, ftoStatus]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!property.trim()) {
      newErrors.property = "Property is required";
    }
    if (!ftoName.trim()) {
      newErrors.ftoName = "FTO Name is required";
    }
    if (!priority.trim()) {
      newErrors.priority = "Priority is required";
    }
    if (!dueDate) {
      newErrors.dueDate = "Due Date is required";
    }
    if (!ftoStatus.trim()) {
      newErrors.ftoStatus = "FTO Status is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log("Form submitted", {
        property,
        unit,
        selectedTask,
        ftoName,
        priority,
        ftoStatus,
        dueDate,
        selectedAssignees,
        description,
      });
      onOpenChange(false);
    }
  };

  if (isSimple) {
    return (
      <ModalTemplate
        open={open}
        onOpenChange={onOpenChange}
        title="Create Task"
        size="lg"
        footer={
          <ModalButtons
            onCancel={() => onOpenChange(false)}
            onConfirm={handleSubmit}
            cancelLabel="Cancel"
            confirmLabel="Create Task"
          />
        }
      >
        <FormLayout>
          <FormSection showDivider={false}>
            <TextField
              label="Task"
              required
              value={ftoName}
              onChange={setFtoName}
              error={errors.ftoName}
              placeholder="Type Task Name"
            />
            <TextAreaField
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Insert Description Here"
              rows={6}
            />
          </FormSection>
        </FormLayout>
      </ModalTemplate>
    );
  }

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={isViewOnly ? "View Task" : editData ? "Edit FTO" : "Create FTO"}
      size="lg"
      footer={
        isViewOnly ? (
          <button
            onClick={() => onOpenChange(false)}
            style={{
              borderRadius: "8px",
              backgroundColor: "rgba(251, 251, 251, 1)",
              boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.03)",
              borderColor: "rgba(218, 218, 218, 1)",
              borderStyle: "solid",
              borderWidth: "1px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingLeft: "12px",
              paddingRight: "12px",
              paddingTop: "8px",
              paddingBottom: "8px",
              minHeight: "36px",
              color: "rgba(48, 48, 48, 1)",
              fontWeight: 400,
              letterSpacing: "-0.32px",
              lineHeight: 1.4,
              justifyContent: "center",
              cursor: "pointer",
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              fontSize: "16px",
              whiteSpace: "nowrap",
            }}
          >
            Close
          </button>
        ) : (
          <ModalButtons
            onCancel={() => onOpenChange(false)}
            onConfirm={handleSubmit}
            cancelLabel="Cancel"
            confirmLabel={editData ? "Update FTO" : "Create FTO"}
          />
        )
      }
    >
      <FormLayout>
        <FormSection showDivider={false}>
          {isViewOnly ? (
            <>
              <TextField
                label="Property"
                value={property}
                onChange={() => {}}
                disabled={true}
              />
              <TextField
                label="Unit"
                value={unit}
                onChange={() => {}}
                disabled={true}
              />
            </>
          ) : (
            <>
              <SelectField
                label="Property"
                required
                value={property}
                onChange={setProperty}
                error={errors.property}
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
                options={[
                  { value: "unit1", label: "Unit 1" },
                  { value: "unit2", label: "Unit 2" },
                ]}
              />
            </>
          )}
        </FormSection>

        <FormSection title="FTO Details">
          <TextField
            label="FTO Name"
            required
            value={ftoName}
            onChange={setFtoName}
            error={errors.ftoName}
            placeholder="Type FTO Name"
            disabled={isViewOnly}
          />
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
            disabled={isViewOnly}
          />
          <DateField
            label="Due Date"
            required
            value={dueDate}
            onChange={setDueDate}
            error={errors.dueDate}
            placeholder="mm/dd/yyyy"
            disabled={isViewOnly}
          />
          <MultiSelectField
            label="Assignees"
            value={selectedAssignees}
            onChange={setSelectedAssignees}
            error={errors.selectedAssignees}
            placeholder="Select Assignees"
            options={AVAILABLE_ASSIGNEES}
            disabled={isViewOnly}
          />
        </FormSection>

        <FormSection title="Status & Details">
          <SelectField
            label="FTO Status"
            required
            value={ftoStatus}
            onChange={setFtoStatus}
            error={errors.ftoStatus}
            options={[
              { value: "pending-approval", label: "New" },
              { value: "dispatched", label: "Dispatched" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            disabled={isViewOnly}
          />
          <TextAreaField
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Insert Description Here"
            rows={6}
            disabled={isViewOnly}
          />
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
}
