import * as React from "react";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl";

interface ModalProps extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  /** Modal size: sm (442px), md (600px), lg (800px), xl (1000px) */
  size?: ModalSize;
  /** Hide the default close button */
  hideCloseButton?: boolean;
}

/**
 * Modal Component
 *
 * A styled wrapper around DialogContent that provides:
 * - Size variants (sm, md, lg, xl)
 * - Consistent padding and border-radius
 * - Automatic close button handling
 *
 * Usage:
 * ```tsx
 * <Dialog open={open} onOpenChange={onOpenChange}>
 *   <Modal size="md">
 *     <DialogTitle>My Modal</DialogTitle>
 *     {/* Modal content */}
 *   </Modal>
 * </Dialog>
 * ```
 */
export const Modal = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  ModalProps
>(
  (
    { size = "sm", hideCloseButton = false, className, children, ...props },
    ref,
  ) => {
    const sizeClass = `ra-modal--${size}`;

    return (
      <DialogContent
        ref={ref}
        className={cn("ra-modal", sizeClass, "p-0 gap-0", className, {
          "[&>button]:hidden": hideCloseButton,
        })}
        {...props}
      >
        {children}
      </DialogContent>
    );
  },
);

Modal.displayName = "Modal";

export type { ModalSize };