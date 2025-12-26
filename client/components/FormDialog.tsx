import React from "react";
import { ModalTemplate, ModalButtons, type ModalSize } from "@/components/ui/ModalTemplate";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  isValid?: boolean;
  size?: ModalSize;
}

export const FormDialog: React.FC<FormDialogProps> = ({
  open,
  onOpenChange,
  title,
  children,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isLoading = false,
  isValid = true,
  size = "sm",
}) => {
  const handleSubmit = async () => {
    try {
      await onSubmit();
    } catch (error) {
      console.error("Form dialog error:", error);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size={size}
      footer={
        <ModalButtons
          onCancel={() => {
            onCancel?.();
            onOpenChange(false);
          }}
          onConfirm={handleSubmit}
          cancelLabel={cancelLabel}
          confirmLabel={isLoading ? "Loading..." : submitLabel}
          cancelDisabled={isLoading}
        />
      }
    >
      {children}
    </ModalTemplate>
  );
};

FormDialog.displayName = "FormDialog";
