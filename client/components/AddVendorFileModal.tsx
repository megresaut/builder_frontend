import React, { useState, useEffect } from "react";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import {
  ModalTemplate,
  ModalButtons,
  ModalField,
} from "@/components/ui/ModalTemplate";
import {
  FileUploadField,
  SelectField,
  TextAreaField,
} from "@/components/forms";
import { FormLayout, FormSection } from "@/components/ui/form-layout";

interface AddVendorFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (files: UploadedFile[], category: string, description: string) => Promise<void> | void;
  isEditMode?: boolean;
  initialFiles?: UploadedFile[];
  initialCategory?: string;
  initialDescription?: string;
  title?: string;
  submitLabel?: string;
  acceptedFormats?: string;
  maxSize?: number;
}

const CATEGORY_OPTIONS = [
  { label: "Invoice", value: "Invoice" },
  { label: "Contract", value: "Contract" },
  { label: "License", value: "License" },
  { label: "Insurance", value: "Insurance" },
  { label: "Certificate", value: "Certificate" },
  { label: "Agreement", value: "Agreement" },
  { label: "Other", value: "Other" },
];

export const AddVendorFileModal: React.FC<AddVendorFileModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isEditMode = false,
  initialFiles = [],
  initialCategory = "",
  initialDescription = "",
  title,
  submitLabel,
  acceptedFormats = ".pdf",
  maxSize = 10 * 1024 * 1024,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles);
  const [fileCategory, setFileCategory] = useState(initialCategory);
  const [fileDescription, setFileDescription] = useState(initialDescription);
  const [validateFileForm, setValidateFileForm] = useState(false);

  useEffect(() => {
    if (open) {
      setUploadedFiles(initialFiles);
      setFileCategory(initialCategory);
      setFileDescription(initialDescription);
      setValidateFileForm(false);
    }
  }, [open, initialFiles, initialCategory, initialDescription]);

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      setValidateFileForm(true);
      return;
    }
    await onSubmit(uploadedFiles, fileCategory, fileDescription);
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setUploadedFiles([]);
    setFileCategory("");
    setFileDescription("");
    setValidateFileForm(false);
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={(openState) => {
        if (!openState) {
          resetForm();
        }
        onOpenChange(openState);
      }}
      title={title || (isEditMode ? "Edit File" : "Add File")}
      size="sm"
      onClose={resetForm}
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitLabel || (isEditMode ? "Update" : "Add")}
          confirmDisabled={isEditMode ? false : uploadedFiles.length === 0}
        />
      }
    >
      <FormLayout>
        <FormSection showDivider={false}>
          <ModalField spacing="tight">
            <FileUploadField
              label="File"
              required={true}
              description=""
              validate={validateFileForm}
              files={uploadedFiles}
              onFilesAdded={(newFiles) => {
                if (newFiles.length > 0) {
                  setUploadedFiles([newFiles[0]]);
                  setValidateFileForm(false);
                }
              }}
              onFileRemoved={(fileId) => {
                setUploadedFiles(
                  uploadedFiles.filter((f) => f.id !== fileId),
                );
              }}
              onFileRenamed={(fileId, newName) => {
                setUploadedFiles(
                  uploadedFiles.map((f) =>
                    f.id === fileId ? { ...f, name: newName } : f,
                  ),
                );
              }}
              accept={acceptedFormats}
              maxFiles={1}
              maxSize={maxSize}
              variant="single"
            />
          </ModalField>

          <SelectField
            label="Category"
            value={fileCategory}
            onChange={(value) => setFileCategory(value as string)}
            options={CATEGORY_OPTIONS}
            placeholder="Select a category"
          />

          <TextAreaField
            label="Description"
            value={fileDescription}
            onChange={setFileDescription}
            placeholder="Enter file description (optional)"
            rows={3}
          />
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
};

export default AddVendorFileModal;
