import React, { useState, useEffect } from "react";
import { FormDialog } from "@/components/FormDialog";
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
    <FormDialog
      open={open}
      onOpenChange={(openState) => {
        if (!openState) {
          setNoteDraft("");
        }
        onOpenChange(openState);
      }}
      title={title || (isEditMode ? "Edit Note" : "Add Note")}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitLabel={submitLabel}
      isValid={noteDraft.trim().length > 0}
      size="sm"
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
    </FormDialog>
  );
};

export default AddVendorNoteModal;
