import React, { useState, useEffect } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { SelectField } from "@/components/forms/SelectField";
import { ComboboxField } from "@/components/forms";
import { TASK_CATEGORIES } from "@/constants/taskCategories";
import { fetchJSON } from "@/api/fetchJSON";

interface SimpleProperty {
  id: number;
  name?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
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

  // Initialize form data when modal opens
  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setCategory(initialData.category || "");

      // Handle property selection: prioritize property_id, fallback to name matching
      if (initialData.property_id) {
        // If we have property_id, use it directly (even if properties haven't loaded yet)
        setSelectedPropertyId(initialData.property_id);
      } else if (initialData.property && properties.length > 0) {
        // Try to find property by matching the property string
        const foundProperty = properties.find(
          (p) => renderPropertyLabel(p) === initialData.property
        );
        if (foundProperty) {
          setSelectedPropertyId(foundProperty.id);
        } else {
          setSelectedPropertyId(null);
        }
      } else {
        setSelectedPropertyId(null);
      }

      // Handle unit selection: use unit_id if available
      // Note: unit_id will be set, but units won't load until property is selected
      // This is fine - when property loads and units load, the unit_id will match
      if (initialData.unit_id) {
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
  }, [open, initialData, properties]); // Include properties in deps to handle async loading

  const propertyOptions = properties.map((p) => ({
    value: String(p.id),
    label: renderPropertyLabel(p),
  }));

  const unitOptions = units.map((u) => ({
    value: String(u.id),
    label: u.unit_name || `Unit #${u.id}`,
  }));

  // Get property and unit display names for submission
  const getPropertyDisplayName = (): string => {
    if (!selectedPropertyId) return "";
    const prop = properties.find((p) => p.id === selectedPropertyId);
    return prop ? renderPropertyLabel(prop) : "";
  };

  const getUnitDisplayName = (): string => {
    if (!selectedUnitId) return "";
    const unit = units.find((u) => u.id === selectedUnitId);
    return unit ? unit.unit_name : "";
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
              value={String(selectedUnitId || "")}
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
              onChange={setCategory}
              placeholder="Select Category"
              options={TASK_CATEGORIES}
            />
          </FormSection>
        </FormLayout>
      </div>
    </ModalTemplate>
  );
}
