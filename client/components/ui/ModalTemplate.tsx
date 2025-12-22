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
              <img
                loading="lazy"
                src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/249a395a76423ecabf7f10a2086df5d9cd674ac7?placeholderIfAbsent=true"
                style={{
                  width: "100%",
                  aspectRatio: "333.33",
                  objectFit: "contain",
                  objectPosition: "center",
                  marginTop: "16px",
                }}
                alt=""
              />
            )}
          </div>

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
