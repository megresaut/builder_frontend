import React, { useState } from "react";
import {
  ModalTemplate,
  ModalButtons,
  ModalField,
} from "@/components/ui/ModalTemplate";
import {
  FormLayout,
  FormSection,
} from "@/components/ui/form-layout";
import { SelectField, TextAreaField } from "@/components/forms";
import { AttachmentUploader, type UploadedFile } from "@/components/ui/attachment-uploader";

const FILE_CATEGORIES = [
  "Invoice",
  "Contract",
  "License",
  "Insurance",
  "Certificate",
  "Agreement",
  "Other",
];

interface AddFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFile?: (file: UploadedFile, category: string, description: string) => void;
  vendorId?: number;
}

export default function AddFileModal({
  open,
  onOpenChange,
  onAddFile,
  vendorId,
}: AddFileModalProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleAddFiles = (newFiles: UploadedFile[]) => {
    // Only allow one file at a time
    if (newFiles.length > 0) {
      setFiles([newFiles[0]]);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles(files.filter((f) => f.id !== fileId));
  };

  const handleCancel = () => {
    setFiles([]);
    setCategory("");
    setDescription("");
    onOpenChange(false);
  };

  const handleUpload = () => {
    if (files.length === 0 || !category.trim()) {
      return;
    }

    const file = files[0];
    if (onAddFile) {
      onAddFile(file, category, description);
    }

    setFiles([]);
    setCategory("");
    setDescription("");
    onOpenChange(false);
  };

  const isValid = files.length > 0 && category.trim().length > 0;

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Add File"
      size="lg"
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleUpload}
          cancelLabel="Cancel"
          confirmLabel="Upload"
          confirmDisabled={!isValid}
        />
      }
    >
      <FormLayout>
        <FormSection showDivider={false}>
          <ModalField label="File" required spacing="tight">
            <AttachmentUploader
              files={files}
              onFilesAdded={handleAddFiles}
              onFileRemoved={handleRemoveFile}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              placeholder="Drag and drop a file here, or click to browse"
            />
          </ModalField>

          <SelectField
            label="Category"
            required
            value={category}
            onChange={(value) => setCategory(value as string)}
            options={FILE_CATEGORIES.map((cat) => ({
              label: cat,
              value: cat,
            }))}
            placeholder="Select a category"
          />

          <TextAreaField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter file description (optional)"
            rows={4}
          />
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
}
