import React, { useState, useEffect, useRef } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { SelectField } from "@/components/forms/SelectField";
import { ComboboxField } from "@/components/forms";
import { TASK_CATEGORIES } from "@/constants/taskCategories";
import { fetchJSON } from "@/api/fetchJSON";
import {
  PROPERTY_LEVEL_LABEL,
  PROPERTY_LEVEL_SHORT_LABEL,
  PROPERTY_LEVEL_UNIT_ID,
  formatUnitLabel,
} from "@/utils/unitLabel";

interface SimpleProperty {
  id: number;
  name?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  property_type?: string | null;
}

interface SimpleUnit {
  id: number;
  unit_name: string;
}

export interface EditTaskDetailsData {
  title: string;
  description: string;
  property: string;
  unit: string;
  category: string;
  property_id?: number;
  unit_id?: number | null;
}

interface EditTaskDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EditTaskDetailsData) => void;
  initialData?: EditTaskDetailsData;
}

const renderPropertyLabel = (p: SimpleProperty) =>
  p.name ||
  [p.address_line1, p.city, p.state].filter(Boolean).join(", ") ||
  `Property #${p.id}`;

export default function EditTaskDetailsModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: EditTaskDetailsModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [properties, setProperties] = useState<SimpleProperty[]>([]);
  const [units, setUnits] = useState<SimpleUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const prevOpenRef = useRef(false);

  // Load properties when modal opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadProperties() {
      try {
        const propsRes = await fetchJSON("/properties").catch(() => []);
        if (cancelled) return;
        setProperties(propsRes || []);
      } catch (err) {
        console.error("Failed to load properties:", err);
      }
    }

    loadProperties();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Load units when property is selected
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
    if (selectedPropertyId == null) return;
    const selected = properties.find((p) => p.id === selectedPropertyId);
    if (selected?.property_type === "C") {
      setSelectedUnitId(PROPERTY_LEVEL_UNIT_ID);
    }
  }, [selectedPropertyId, properties]);

  // Initialize form data when modal opens (only when transitioning from closed to open)
  useEffect(() => {
    // Only initialize when modal first opens (not on every render)
    const isOpening = open && !prevOpenRef.current;
    prevOpenRef.current = open;

    if (!isOpening) return;

    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setCategory(initialData.category || "");

      // Handle property selection: prioritize property_id, fallback to name matching
      if (initialData.property_id) {
        // If we have property_id, use it directly (even if properties haven't loaded yet)
        setSelectedPropertyId(initialData.property_id);
      } else {
        setSelectedPropertyId(null);
      }

      // Handle unit selection: use unit_id if available
      if (initialData.unit_id !== undefined && initialData.unit_id !== null) {
        setSelectedUnitId(initialData.unit_id);
      } else {
        setSelectedUnitId(null);
      }
    } else {
      setTitle("");
      setDescription("");
      setSelectedPropertyId(null);
      setSelectedUnitId(null);
      setCategory("");
    }
  }, [open, initialData]);

  // Handle property matching when properties load (only if we don't have property_id yet)
  useEffect(() => {
    if (!open || !initialData || !properties.length) return;
    
    // Only try to match property if we don't have a property_id but have a property name
    // and haven't already selected a property
    if (!initialData.property_id && initialData.property && !selectedPropertyId) {
      const foundProperty = properties.find(
        (p) => renderPropertyLabel(p) === initialData.property
      );
      if (foundProperty) {
        setSelectedPropertyId(foundProperty.id);
      }
    }
  }, [open, initialData, properties, selectedPropertyId]);

  const propertyOptions = properties.map((p) => ({
    value: String(p.id),
    label: renderPropertyLabel(p),
  }));

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

  // Get property and unit display names for submission
  const getPropertyDisplayName = (): string => {
    if (!selectedPropertyId) return "";
    const prop = properties.find((p) => p.id === selectedPropertyId);
    return prop ? renderPropertyLabel(prop) : "";
  };

  const getUnitDisplayName = (): string => {
    return formatUnitLabel({
      unitId: selectedUnitId,
      unitName: units.find((u) => u.id === selectedUnitId)?.unit_name,
      fallback: "",
    });
  };

  const handleSubmit = () => {
    onSubmit({
      title,
      description,
      property: getPropertyDisplayName(),
      unit: getUnitDisplayName(),
      category,
      property_id: selectedPropertyId || undefined,
      unit_id: selectedUnitId,
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Edit task details"
      size="md"
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel="Save"
        />
      }
    >
      <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
        <FormLayout>
          <FormSection showDivider={false}>
            <TextField
              label="Task Name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Task Name"
            />

            <TextAreaField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
            />

            <ComboboxField
              label="Property"
              value={String(selectedPropertyId || "")}
              onChange={(value) => {
                const id = value ? Number(value) : null;
                setSelectedPropertyId(id);
                setSelectedUnitId(null); // Reset unit when property changes
              }}
              placeholder="Select Property"
              searchPlaceholder="Search properties..."
              options={propertyOptions}
            />

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
                  : "Select Unit If Applicable"
              }
              disabled={!selectedPropertyId || unitsLoading}
              options={unitOptions}
            />

            <SelectField
              label="Category"
              value={category}
              onChange={(value) => setCategory(typeof value === "string" ? value : "")}
              placeholder="Select Category"
              options={TASK_CATEGORIES}
            />
          </FormSection>
        </FormLayout>
      </div>
    </ModalTemplate>
  );
}
