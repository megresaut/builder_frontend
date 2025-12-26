import { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { TextAreaField } from "@/components/forms";

interface AddPropertyNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNote?: (noteText: string) => void;
}

export default function AddPropertyNoteModal({
  open,
  onOpenChange,
  onAddNote,
}: AddPropertyNoteModalProps) {
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    if (!open) {
      setNoteDraft("");
    }
  }, [open]);

  const handleSave = () => {
    const text = noteDraft.trim();
    if (!text) return;

    onAddNote?.(text);
    setNoteDraft("");
    onOpenChange(false);
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Add Note"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSave}
          cancelLabel="Cancel"
          confirmLabel="Add"
          confirmDisabled={!noteDraft.trim()}
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
}
