import React, { useState, useEffect } from "react";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import {
  ModalTemplate,
  ModalButtons,
  ModalField,
} from "@/components/ui/ModalTemplate";
import {
  FileUploadField,
  TextAreaField,
} from "@/components/forms";
import { FormLayout, FormSection } from "@/components/ui/form-layout";

interface PhotoCommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File, comment: string) => Promise<void> | void;
  title?: string;
  submitLabel?: string;
  initialFile?: File | null;
}

export const PhotoCommentModal: React.FC<PhotoCommentModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  title = "Add Photo",
  submitLabel = "Upload Photo",
  initialFile = null,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [comment, setComment] = useState("");
  const [validateForm, setValidateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // If an initial file is provided, pre-populate the upload field
      if (initialFile) {
        const uploadedFile: UploadedFile = {
          id: `file_${Date.now()}`,
          name: initialFile.name,
          file: initialFile,
          url: URL.createObjectURL(initialFile),
          size: initialFile.size,
          type: initialFile.type,
        };
        setUploadedFiles([uploadedFile]);
      } else {
        setUploadedFiles([]);
      }
      setComment("");
      setValidateForm(false);
    }
  }, [open, initialFile]);

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      setValidateForm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const file = uploadedFiles[0].file;
      if (file) {
        await onSubmit(file, comment);
        resetForm();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setUploadedFiles([]);
    setComment("");
    setValidateForm(false);
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={(openState) => {
        if (!openState) {
          resetForm();
          // Clear the comment when modal closes
          setComment("");
        }
        onOpenChange(openState);
      }}
      title={title}
      size="sm"
      onClose={() => {
        resetForm();
        setComment("");
      }}
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitLabel}
          confirmDisabled={uploadedFiles.length === 0 || isSubmitting}
        />
      }
    >
      <FormLayout>
        <FormSection showDivider={false}>
          <ModalField spacing="tight">
            <FileUploadField
              label="Photo"
              required={true}
              description=""
              validate={validateForm}
              files={uploadedFiles}
              onFilesAdded={(newFiles) => {
                if (newFiles.length > 0) {
                  setUploadedFiles([newFiles[0]]);
                  setValidateForm(false);
                }
              }}
              onFileRemoved={(fileId) => {
                setUploadedFiles(
                  uploadedFiles.filter((f) => f.id !== fileId),
                );
              }}
              accept=".jpg,.jpeg,.png,.gif,.webp"
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              variant="single"
            />
          </ModalField>

          <TextAreaField
            label="Comment (Optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment to this photo..."
            rows={3}
          />
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
};

export default PhotoCommentModal;
