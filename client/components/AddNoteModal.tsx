import { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { TextAreaField } from "@/components/forms";

interface AddNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (text: string) => void;
  initialText?: string;
  isEditMode?: boolean;
  title?: string;
  submitLabel?: string;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialText = "",
  isEditMode = false,
  title,
  submitLabel,
}) => {
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    if (open) {
      setNoteDraft(initialText || "");
    } else {
      setNoteDraft("");
    }
  }, [open]);

  const handleSave = () => {
    const text = noteDraft.trim();
    if (!text) return;
    onSubmit(text);
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
      onClose={() => setNoteDraft("")}
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleSave}
          cancelLabel="Cancel"
          confirmLabel={submitLabel || (isEditMode ? "Update" : "Add")}
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
            rows={6}
          />
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
};

export default AddNoteModal;
