import React from "react";
import { ModalTemplate, ModalText, ModalButtons } from "@/components/ui/ModalTemplate";
import type { ModalSize } from "@/components/ui/Modal";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isDangerous?: boolean;
  isLoading?: boolean;
  size?: ModalSize;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isDangerous = false,
  isLoading = false,
  size = "sm",
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error("Confirm dialog error:", error);
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
          onConfirm={handleConfirm}
          cancelLabel={cancelLabel}
          confirmLabel={isLoading ? "Loading..." : confirmLabel}
        />
      }
    >
      <ModalText>{message}</ModalText>
    </ModalTemplate>
  );
};

ConfirmDialog.displayName = "ConfirmDialog";
