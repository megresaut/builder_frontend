import React, { useState, useEffect } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { SelectField } from "@/components/forms/SelectField";
import { TASK_CATEGORIES } from "@/constants/taskCategories";

export interface EditTaskDetailsData {
  title: string;
  description: string;
  property: string;
  unit: string;
  category: string;
}

interface EditTaskDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EditTaskDetailsData) => void;
  initialData?: EditTaskDetailsData;
}

export default function EditTaskDetailsModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: EditTaskDetailsModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [property, setProperty] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (open && initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setProperty(initialData.property || "");
      setUnit(initialData.unit || "");
      setCategory(initialData.category || "");
    } else if (open) {
      setTitle("");
      setDescription("");
      setProperty("");
      setUnit("");
      setCategory("");
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    onSubmit({
      title,
      description,
      property,
      unit,
      category,
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
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
            />

            <TextAreaField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
            />

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
