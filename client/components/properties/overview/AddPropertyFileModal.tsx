import { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { FileUploadField, SelectField } from "@/components/forms";

interface UploadedFile {
  name: string;
  file: File;
}

interface AddPropertyFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFile?: (file: File, category: string) => void;
  onSubmit?: (uploadedFiles: UploadedFile[], category: string, description: string) => void;
}

export default function AddPropertyFileModal({
  open,
  onOpenChange,
  onAddFile,
  onSubmit,
}: AddPropertyFileModalProps) {
  const [fileDraft, setFileDraft] = useState<File | null>(null);
  const [fileCategoryDraft, setFileCategoryDraft] = useState("Uncategorized");

  useEffect(() => {
    if (!open) {
      setFileDraft(null);
      setFileCategoryDraft("Uncategorized");
    }
  }, [open]);

  const handleSave = () => {
    if (!fileDraft) return;

    // Support both onSubmit (from PropertyDetails) and onAddFile
    if (onSubmit) {
      const uploadedFiles: UploadedFile[] = [
        { name: fileDraft.name, file: fileDraft },
      ];
      onSubmit(uploadedFiles, fileCategoryDraft, "");
    } else {
      onAddFile?.(fileDraft, fileCategoryDraft);
    }
    setFileDraft(null);
    setFileCategoryDraft("Uncategorized");
    onOpenChange(false);
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Add File"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSave}
          cancelLabel="Cancel"
          confirmLabel="Add"
          confirmDisabled={!fileDraft}
        />
      }
    >
      <FormLayout>
        <FormSection showDivider={false}>
          <FileUploadField
            label="File"
            required
            value={fileDraft ? [fileDraft] : []}
            onChange={(files) => setFileDraft(files[0] || null)}
            placeholder="Upload a file"
          />
          <SelectField
            label="Category"
            value={fileCategoryDraft}
            onChange={setFileCategoryDraft}
            options={[
              { value: "Uncategorized", label: "Uncategorized" },
              { value: "Insurance", label: "Insurance" },
              { value: "Lease", label: "Lease" },
              { value: "Maintenance", label: "Maintenance" },
              { value: "Other", label: "Other" },
            ]}
          />
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
}
