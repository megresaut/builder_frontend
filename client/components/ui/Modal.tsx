import * as React from "react";
import * as React from "react";
import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ModalSize = "xs" | "sm" | "md" | "lg" | "xl";

const MODAL_WIDTHS: Record<ModalSize, number> = {
  xs: 360,
  sm: 442,
  md: 600,
  lg: 800,
  xl: 1000,
};

interface ModalProps extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  /** Modal size: xs (360px), sm (442px), md (600px), lg (800px), xl (1000px) */
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
 * - xs: 360px (extra small, compact modals like actions/confirmations)
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
    {
      size = "sm",
      hideCloseButton = false,
      className,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    const sizeClass = `ra-modal--${size}`;
    const widthValue = MODAL_WIDTHS[size];

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
        style={{
          width: `${widthValue}px`,
          maxWidth: "calc(100vw - 32px)",
          ...style,
        }}
        {...props}
      >
        {children}
      </DialogContent>
    );
  },
);

Modal.displayName = "Modal";

export type { ModalSize };
