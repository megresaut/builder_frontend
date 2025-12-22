import * as React from "react";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Modal, type ModalSize } from "@/components/ui/Modal";

interface ModalTemplateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subheader?: string;
  size?: ModalSize;
  hideCloseButton?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showDivider?: boolean;
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
      subheader,
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
                  marginTop: "12px",
                  marginBottom: "12px",
                }}
              />
            )}
          </div>

          {/* Subheader */}
          {subheader && (
            <div style={{ marginTop: "28px" }}>
              <div
                style={{
                  fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  fontSize: "20px",
                  color: "rgba(48, 48, 48, 1)",
                  fontWeight: 600,
                  lineHeight: 1.3,
                }}
              >
                {subheader}
              </div>
              <div
                style={{
                  width: "100%",
                  height: "1px",
                  backgroundColor: "#e5e5e5",
                  marginTop: "12px",
                  marginBottom: "12px",
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex flex-col gap-4 flex-1" ref={ref}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex mt-7 w-full items-center gap-2.5 justify-end text-base whitespace-nowrap">
              {footer}
            </div>
          )}
        </Modal>
      </Dialog>
    );
  },
);

ModalTemplate.displayName = "ModalTemplate";
