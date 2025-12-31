import React, { useState, useEffect } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { TextAreaField } from "@/components/forms";
import { FormLayout, FormSection } from "@/components/ui/form-layout";

interface AddVendorNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (text: string) => Promise<void> | void;
  initialText?: string;
  isEditMode?: boolean;
  title?: string;
  submitLabel?: string;
}

export const AddVendorNoteModal: React.FC<AddVendorNoteModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialText = "",
  isEditMode = false,
  title,
  submitLabel = "Save Note",
}) => {
  const [noteDraft, setNoteDraft] = useState(initialText);

  useEffect(() => {
    if (open) {
      setNoteDraft(initialText);
    }
  }, [open, initialText]);

  const handleSubmit = async () => {
    if (noteDraft.trim().length === 0) return;
    await onSubmit(noteDraft);
    setNoteDraft("");
  };

  const handleCancel = () => {
    setNoteDraft("");
    onOpenChange(false);
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={(openState) => {
        if (!openState) {
          setNoteDraft("");
        }
        onOpenChange(openState);
      }}
      title={title || (isEditMode ? "Edit Note" : "Add Note")}
      size="sm"
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitLabel}
          confirmDisabled={noteDraft.trim().length === 0}
        />
      }
    >
      <FormLayout>
        <FormSection showDivider={false}>
          <TextAreaField
            label="Note"
            value={noteDraft}
            onChange={setNoteDraft}
            placeholder="Enter your note here..."
            rows={4}
          />
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
};

export default AddVendorNoteModal;
