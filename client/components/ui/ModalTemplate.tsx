import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ModalSize = "xs" | "sm" | "md" | "lg" | "xl";

const MODAL_WIDTHS: Record<ModalSize, number> = {
  xs: 360,
  sm: 442,
  md: 600,
  lg: 800,
  xl: 1000,
};

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
  contentRef?: React.RefObject<HTMLDivElement>;
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

interface FieldRowProps {
  children: React.ReactNode;
  columns?: number;
}

interface FieldRowItemProps {
  children: React.ReactNode;
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
 * Behavior:
 * - The underlying <Dialog> container is capped to 85vh and scrolls vertically
 *   (rather than expanding beyond the viewport).
 * - The primary/confirm button is ALWAYS blue and clickable
 * - Form validation should happen INSIDE the onConfirm handler
 * - If validation fails, set field errors and show error messages
 * - Highlight invalid fields in red (border)
 * - Display error messages below each invalid field
 *
 * State Reset Pattern (REQUIRED):
 * - Every modal component must clear ALL state (form values + validation errors)
 *   when the modal closes and reopens
 * - Use useEffect with `open` dependency to reset state when modal closes
 * - Example:
 *   useEffect(() => {
 *     if (!open) {
 *       setFormField("");
 *       setErrors({});
 *       setErrorMessages({});
 *     }
 *   }, [open]);
 * - This ensures a "fresh" form each time the modal opens, no cached values or errors
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
      contentRef,
    },
    ref,
  ) => {
    const widthValue = MODAL_WIDTHS[size];

    const handleClose = () => {
      if (onClose) onClose();
      onOpenChange(false);
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn("gap-0 border-none", {
            "[&>button]:hidden": hideCloseButton,
          })}
          style={{
            width: `${widthValue}px`,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "85vh",
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            borderRadius: "1rem",
            backgroundColor: "white",
            display: "flex",
            flexDirection: "column",
            padding: "2rem",
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          }}
        >
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
          <div
            ref={contentRef || ref}
            style={{ marginTop: "16px" }}
          >
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
        </DialogContent>
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
    <div className="flex w-full flex-col">
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
export const ModalText: React.FC<ModalTextProps> = ({
  children,
  className = "",
}) => {
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
 * Standard Input Styling for Modal Fields
 *
 * All inputs within modal fields should use this consistent styling:
 * ```
 * style={{
 *   borderRadius: "8px",
 *   backgroundColor: "rgba(255, 255, 255, 1)",
 *   borderColor: "rgba(229, 229, 229, 1)",  // or error color
 *   borderStyle: "solid",
 *   borderWidth: "1px",  // or "2px" for errors
 *   padding: "8px 12px",
 *   fontSize: "16px",
 *   fontWeight: 400,
 *   letterSpacing: "-0.32px",
 *   lineHeight: 1.4,
 *   fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
 *   color: "#303030",  // Text color
 *   width: "100%",
 *   boxSizing: "border-box",
 * }}
 * ```
 *
 * This ensures all inputs (text, email, tel, textarea, button-like inputs) have:
 * - Font family: Geist system fonts
 * - Font size: 16px (1rem)
 * - Letter spacing: -0.32px (tracking)
 * - Line height: 1.4
 * - Font weight: 400 (normal)
 * - Text color: #303030
 *
 * Note: for standard <input> and <textarea> elements inside a modal, both
 * the field text color and placeholder color are enforced to `#303030` via
 * global CSS (see `code/client/global.css`).
 *
 * For placeholder-like text (non-input elements that display placeholder values),
 * match the same font + color (e.g. via `.ra-input-placeholder`).
 */

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
    <div className="flex w-full flex-col" style={{ marginBottom }}>
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
 * Cancel button (outline) on left, Confirm button (primary/blue) on right.
 *
 * IMPORTANT: The primary button is ALWAYS blue and clickable.
 * Form validation should happen INSIDE the onConfirm handler.
 * If validation fails, show error messages and highlight invalid fields in red.
 * Do NOT use confirmDisabled to grey out the button.
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
          paddingTop: "8px",
          paddingBottom: "8px",
          minHeight: "36px",
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
        style={{
          borderRadius: "8px",
          backgroundColor: "var(--color-button-primary)",
          border: "1px solid rgba(255, 255, 255, 1)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          paddingLeft: "12px",
          paddingRight: "12px",
          paddingTop: "8px",
          paddingBottom: "8px",
          minHeight: "36px",
          color: "rgba(255, 255, 255, 1)",
          fontWeight: 500,
          letterSpacing: "-0.32px",
          lineHeight: 1.4,
          justifyContent: "center",
          cursor: "pointer",
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          fontSize: "16px",
          whiteSpace: "nowrap",
          boxShadow: "0px 0px 0px 1px var(--color-button-primary-shadow)",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor =
            "var(--color-button-primary-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor =
            "var(--color-button-primary)")
        }
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
export const ModalSection: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div style={{ marginTop: "28px" }}>{children}</div>;
};

ModalSection.displayName = "ModalSection";

/**
 * FieldRow - Multi-column field layout
 *
 * Arranges multiple fields horizontally on desktop, stacking vertically on mobile.
 * Each child should be a FieldRowItem wrapping a field.
 *
 * @param columns - Number of columns on desktop (default: 2)
 */
export const FieldRow: React.FC<FieldRowProps> = ({
  children,
  columns = 2,
}) => {
  return (
    <div
      className="ra-field-row"
      style={{ "--field-row-columns": columns } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

FieldRow.displayName = "FieldRow";

/**
 * FieldRowItem - Individual field container within a FieldRow
 *
 * Wraps a field to ensure consistent sizing and spacing within a row.
 */
export const FieldRowItem: React.FC<FieldRowItemProps> = ({ children }) => {
  return <div className="ra-field-row-item">{children}</div>;
};

FieldRowItem.displayName = "FieldRowItem";

export type { ModalSize };
