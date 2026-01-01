import { useState } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { FileUploadField } from "@/components/forms";

interface UploadPhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload?: (file: File) => void;
}

export default function UploadPhotoModal({
  open,
  onOpenChange,
  onUpload,
}: UploadPhotoModalProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleCancel = () => {
    setUploadedFile(null);
    onOpenChange(false);
  };

  const handleUpload = () => {
    if (uploadedFile) {
      onUpload?.(uploadedFile);
      setUploadedFile(null);
      onOpenChange(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Upload Photo"
      size="sm"
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleUpload}
          cancelLabel="Cancel"
          confirmLabel="Upload"
          confirmDisabled={!uploadedFile}
        />
      }
    >
      <div style={{ paddingBottom: "8px" }}>
        <FileUploadField
          label="Photo"
          value={uploadedFile ? [uploadedFile] : []}
          onChange={(files) => setUploadedFile(files[0] || null)}
          accept="image/*"
          maxSize={50 * 1024 * 1024}
          maxFiles={1}
        />
      </div>
    </ModalTemplate>
  );
}
