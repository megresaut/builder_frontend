import * as React from "react";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Modal, type ModalSize } from "@/components/ui/Modal";

interface ModalTemplateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  size?: ModalSize;
  hideCloseButton?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showDivider?: boolean;
}

interface ModalSubheaderProps {
  children: React.ReactNode;
}

interface ModalTextProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFieldProps {
  label: string;
  children: React.ReactNode;
  spacing?: "default" | "tight";
}

interface ModalButtonsProps {
  onCancel?: () => void;
  onConfirm?: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
}

/**
 * ModalTemplate Component
 *
 * Provides a standardized modal structure with:
 * - Header (title + close button)
 * - Optional divider
 * - Content area
 * - Optional footer with actions
 *
 * This ensures consistency across all modals in the app.
 */
export const ModalTemplate = React.forwardRef<
  HTMLDivElement,
  ModalTemplateProps
>(
  (
    {
      open,
      onOpenChange,
      title,
      size = "sm",
      hideCloseButton = false,
      onClose,
      children,
      footer,
      showDivider = true,
    },
    ref,
  ) => {
    const handleClose = () => {
      if (onClose) onClose();
      onOpenChange(false);
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <Modal size={size} hideCloseButton={true}>
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {/* Header */}
          <div
            className="flex w-full flex-col text-2xl text-[#303030] font-semibold"
            style={{ lineHeight: 1.08 }}
          >
            <div
              className="flex w-full items-start justify-between"
              style={{ gap: "40px 100px" }}
            >
              <div>{title}</div>
              {!hideCloseButton && (
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/2a270b52419cae9104b1782181d0a66d1f416309?placeholderIfAbsent=true"
                  style={{
                    width: "18px",
                    aspectRatio: 1,
                    objectFit: "contain",
                    objectPosition: "center",
                    cursor: "pointer",
                  }}
                  onClick={handleClose}
                  alt="Close"
                />
              )}
            </div>

            {/* Divider */}
            {showDivider && (
              <div
                style={{
                  width: "100%",
                  height: "1px",
                  backgroundColor: "#e5e5e5",
                  marginTop: "16px",
                }}
              />
            )}
          </div>

          {/* Content */}
          <div style={{ marginTop: showDivider ? "16px" : "0" }} ref={ref}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className="flex w-full items-center justify-end gap-2.5 text-base whitespace-nowrap"
              style={{ marginTop: "28px" }}
            >
              {footer}
            </div>
          )}
        </Modal>
      </Dialog>
    );
  },
);

ModalTemplate.displayName = "ModalTemplate";

/**
 * ModalSubheader - Optional subheader section with divider
 * 
 * Use this to add section headers within modal content.
 * Automatically adds proper spacing and divider.
 */
export const ModalSubheader: React.FC<ModalSubheaderProps> = ({ children }) => {
  return (
    <div className="flex w-full flex-col" style={{ marginBottom: "12px" }}>
      <div
        style={{
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          fontSize: "20px",
          color: "rgba(48, 48, 48, 1)",
          fontWeight: 600,
          lineHeight: 1.3,
        }}
      >
        {children}
      </div>
      <div
        style={{
          width: "100%",
          height: "1px",
          backgroundColor: "#e5e5e5",
          marginTop: "12px",
        }}
      />
    </div>
  );
};

ModalSubheader.displayName = "ModalSubheader";

/**
 * ModalText - Plain text content with proper spacing
 * 
 * Use this for text-only content without form fields.
 * Maintains consistent spacing from header/subheader.
 */
export const ModalText: React.FC<ModalTextProps> = ({ children, className = "" }) => {
  return (
    <div
      className={className}
      style={{
        fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
        fontSize: "14px",
        color: "rgba(48, 48, 48, 1)",
        fontWeight: 400,
        lineHeight: 1.43,
      }}
    >
      {children}
    </div>
  );
};

ModalText.displayName = "ModalText";

/**
 * ModalField - Form field with label
 * 
 * Consistent field layout matching the design system.
 * Supports custom spacing between fields.
 * 
 * @param spacing - "default" (20px) or "tight" (12px) spacing after field
 */
export const ModalField: React.FC<ModalFieldProps> = ({
  label,
  children,
  spacing = "default",
}) => {
  const marginBottom = spacing === "tight" ? "12px" : "20px";
  
  return (
    <div
      className="flex w-full flex-col"
      style={{ marginBottom }}
    >
      <label
        style={{
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          fontSize: "14px",
          color: "rgba(48, 48, 48, 1)",
          fontWeight: 500,
          lineHeight: 1.43,
          marginBottom: "8px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
};

ModalField.displayName = "ModalField";

/**
 * ModalButtons - Standard Cancel/Confirm button pair
 * 
 * Provides consistent button styling matching the design system.
 * Cancel button (outline) on left, Confirm button (primary) on right.
 */
export const ModalButtons: React.FC<ModalButtonsProps> = ({
  onCancel,
  onConfirm,
  cancelLabel = "Cancel",
  confirmLabel = "Save",
  confirmDisabled = false,
  cancelDisabled = false,
}) => {
  return (
    <>
      <button
        onClick={onCancel}
        disabled={cancelDisabled}
        style={{
          borderRadius: "8px",
          backgroundColor: "rgba(251, 251, 251, 1)",
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.03)",
          borderColor: "rgba(218, 218, 218, 1)",
          borderStyle: "solid",
          borderWidth: "1px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          paddingLeft: "12px",
          paddingRight: "12px",
          paddingTop: "7px",
          paddingBottom: "7px",
          color: "rgba(48, 48, 48, 1)",
          fontWeight: 400,
          letterSpacing: "-0.32px",
          lineHeight: 1.4,
          justifyContent: "center",
          cursor: cancelDisabled ? "not-allowed" : "pointer",
          opacity: cancelDisabled ? 0.5 : 1,
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          fontSize: "16px",
          whiteSpace: "nowrap",
        }}
      >
        {cancelLabel}
      </button>
      <button
        onClick={onConfirm}
        disabled={confirmDisabled}
        style={{
          borderRadius: "8px",
          backgroundColor: "rgba(1, 55, 100, 1)",
          border: "1px solid rgba(255, 255, 255, 1)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          paddingLeft: "12px",
          paddingRight: "12px",
          paddingTop: "8px",
          paddingBottom: "8px",
          color: "rgba(255, 255, 255, 1)",
          fontWeight: 500,
          letterSpacing: "-0.32px",
          lineHeight: 1.4,
          justifyContent: "center",
          cursor: confirmDisabled ? "not-allowed" : "pointer",
          opacity: confirmDisabled ? 0.5 : 1,
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          fontSize: "16px",
          whiteSpace: "nowrap",
          boxShadow: "0px 0px 0px 1px rgba(0, 45, 90, 1)",
        }}
      >
        {confirmLabel}
      </button>
    </>
  );
};

ModalButtons.displayName = "ModalButtons";

/**
 * ModalSection - Container for grouping related content
 * 
 * Use this to add spacing between major sections in the modal.
 * Default spacing matches the design system (28px top margin).
 */
export const ModalSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ marginTop: "28px" }}>
      {children}
    </div>
  );
};

ModalSection.displayName = "ModalSection";
