import * as React from "react";
import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ModalSize = "xs" | "sm" | "md" | "lg" | "xl";

interface ModalProps extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  /** Modal size: sm (442px), md (600px), lg (800px), xl (1000px) */
  size?: ModalSize;
  /** Hide the default close button */
  hideCloseButton?: boolean;
}

/**
 * Modal Component
 *
 * A styled wrapper around DialogContent that provides consistent modal styling
 * with multiple size options.
 *
 * Size variants:
 * - sm: 442px (small modals like add vendor, create task)
 * - md: 600px (medium modals)
 * - lg: 800px (large modals)
 * - xl: 1000px (extra large modals)
 *
 * @example
 * const [open, setOpen] = useState(false);
 * return (
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <Modal size="md">
 *       <DialogTitle>My Modal</DialogTitle>
 *       Modal content goes here
 *     </Modal>
 *   </Dialog>
 * );
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
        className={cn(
          "ra-modal",
          sizeClass,
          "gap-0 border-none",
          className,
          {
            "[&>button]:hidden": hideCloseButton,
          }
        )}
        {...props}
      >
        {children}
      </DialogContent>
    );
  },
);

Modal.displayName = "Modal";

export type { ModalSize };
