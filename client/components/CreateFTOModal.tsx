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
import { AVAILABLE_ASSIGNEES } from "@/data/fto";

export interface MultiSelectOption {
  id: string;
  label: string;
  initials?: string;
}

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
    ftoName: string;
    description: string;
    dueDate: Date | null;
    priority: string;
    selectedAssignees: any[];
    selectedFieldTeamMembers: MultiSelectOption[];
    ftoStatus: string;
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
  const [ftoName, setFtoName] = useState("");
  const [priority, setPriority] = useState("normal");
  const [ftoStatus, setFtoStatus] = useState("Dispatched");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [selectedPMAssignees, setSelectedPMAssignees] = useState<
    MultiSelectOption[]
  >([]);
  const [selectedFieldTeamMembers, setSelectedFieldTeamMembers] = useState<
    MultiSelectOption[]
  >([]);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setProperty("");
      setUnit("");
      setFtoName("");
      setPriority("normal");
      setFtoStatus("Dispatched");
      setDueDate(null);
      setSelectedPMAssignees([]);
      setSelectedFieldTeamMembers([]);
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
        let date: Date | null = null;

        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate;
        } else if (typeof dateStr === "string") {
          try {
            const parts = dateStr.split(" ");
            if (parts.length >= 2) {
              const monthStr = parts[0];
              const dayStr = parts[1].replace(",", "");
              const yearStr = parts[2];
              const parsedFromFormat = new Date(
                `${monthStr} ${dayStr}, ${yearStr}`,
              );
              if (!isNaN(parsedFromFormat.getTime())) {
                date = parsedFromFormat;
              }
            }
          } catch (e) {
            // Fallback: date remains null
          }
        }

        setDueDate(date);
      }

      if ("status" in viewData) {
        setFtoStatus(viewData.status || "Dispatched");
      }
    } else if (editData) {
      setPriority(editData.priority.toLowerCase());
      setFtoStatus(editData.ftoStatus || "Dispatched");
      if (editData.dueDate) {
        const date = new Date(editData.dueDate);
        setDueDate(date);
      }
    }
  }, [editData, viewData, isViewOnly, open]);

  useEffect(() => {
    if (isViewOnly) return;

    if (selectedFieldTeamMembers.length > 0 && ftoStatus === "New") {
      setFtoStatus("Dispatched");
    } else if (
      selectedFieldTeamMembers.length === 0 &&
      ftoStatus === "Dispatched"
    ) {
      setFtoStatus("New");
    }
  }, [selectedFieldTeamMembers, isViewOnly, ftoStatus]);

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
    if (!description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!ftoStatus.trim()) {
      newErrors.ftoStatus = "Status is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onFTOCreated?.({
        property,
        unit,
        ftoName,
        description,
        dueDate,
        priority,
        selectedAssignees: selectedPMAssignees,
        selectedFieldTeamMembers,
        ftoStatus,
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
        size="md"
        footer={
          <ModalButtons
            onCancel={() => onOpenChange(false)}
            onConfirm={handleSubmit}
            cancelLabel="Cancel"
            confirmLabel="Create Task"
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <TextField
            label="Task"
            required
            value={ftoName}
            onChange={(e) => setFtoName(e.target.value)}
            error={errors.ftoName}
            placeholder="Type Task Name"
          />
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

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={
        isViewOnly
          ? "View Field Team Order"
          : editData
            ? "Edit Field Team Order"
            : "Create Field Team Order"
      }
      size="md"
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
            confirmLabel={
              editData ? "Update Field Team Order" : "Create Field Team Order"
            }
          />
        )
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Row 1: Property | Unit */}
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
              value={property}
              onChange={setProperty}
              error={errors.property}
              placeholder="Select Property"
              options={[
                {
                  value: "property1",
                  label:
                    "(C) 1 Mayflower Parkway Westport, CT 06880 - Comprehensive Commercial Property Management and Development Services",
                },
                { value: "property2", label: "22 Indian Chase Dr" },
                { value: "property3", label: "Property 3" },
              ]}
              disabled={isViewOnly}
            />
          </div>
          <div>
            <SelectField
              label="Unit"
              value={unit}
              onChange={setUnit}
              placeholder="Unit"
              options={[
                {
                  value: "unit1",
                  label:
                    "Unit 1 - Primary Commercial Space with Complete Office Infrastructure and Conference Facilities",
                },
                { value: "unit2", label: "Unit 2" },
              ]}
              disabled={isViewOnly || !property}
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
              disabled={isViewOnly}
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
              disabled={isViewOnly}
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
              disabled={isViewOnly}
            />
          </FieldRowItem>
          <FieldRowItem>
            <MultiSelectField
              label="PM Assignees"
              value={selectedPMAssignees}
              onChange={setSelectedPMAssignees}
              placeholder="Select PMs"
              options={AVAILABLE_ASSIGNEES}
              disabled={isViewOnly}
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
              onChange={setSelectedFieldTeamMembers}
              placeholder="Select"
              options={AVAILABLE_ASSIGNEES}
              disabled={isViewOnly}
              required={false}
            />
          </FieldRowItem>
          <FieldRowItem>
            <SelectField
              label="Status"
              required
              value={ftoStatus}
              onChange={setFtoStatus}
              error={errors.ftoStatus}
              options={[
                { value: "New", label: "New" },
                { value: "Dispatched", label: "Dispatched" },
                { value: "Completed", label: "Completed" },
                { value: "Cancelled", label: "Cancelled" },
              ]}
              disabled={isViewOnly}
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
          disabled={isViewOnly}
        />
      </div>
    </ModalTemplate>
  );
}
