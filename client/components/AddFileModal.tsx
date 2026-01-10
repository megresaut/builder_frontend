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
import PdfViewerModal from "@/components/PdfViewerModal";

interface AddFileModalProps {
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

export const AddFileModal: React.FC<AddFileModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isEditMode = false,
  initialFiles = [],
  initialCategory = "",
  initialDescription = "",
  title,
  submitLabel,
  acceptedFormats = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv",
  maxSize = 10 * 1024 * 1024,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles);
  const [fileCategory, setFileCategory] = useState(initialCategory);
  const [fileDescription, setFileDescription] = useState(initialDescription);
  const [validateFileForm, setValidateFileForm] = useState(false);
  const [viewingFile, setViewingFile] = useState<UploadedFile | null>(null);

  useEffect(() => {
    if (open) {
      setUploadedFiles(Array.isArray(initialFiles) ? initialFiles : []);
      setFileCategory(initialCategory || "");
      setFileDescription(initialDescription || "");
      setValidateFileForm(false);
    } else {
      setUploadedFiles([]);
      setFileCategory("");
      setFileDescription("");
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
              onViewFile={(file) => {
                setViewingFile(file);
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
              disableRemove={isEditMode}
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
            onChange={(e) => setFileDescription(e.target.value)}
            placeholder="Enter file description (optional)"
            rows={3}
          />
        </FormSection>
      </FormLayout>

      {/* File Preview Modal */}
      <PdfViewerModal
        open={viewingFile !== null}
        onOpenChange={(open) => {
          if (!open) setViewingFile(null);
        }}
        title={viewingFile?.name || "File Preview"}
        url={viewingFile?.file ? URL.createObjectURL(viewingFile.file) : viewingFile?.url}
      />
    </ModalTemplate>
  );
};

export default AddFileModal;
