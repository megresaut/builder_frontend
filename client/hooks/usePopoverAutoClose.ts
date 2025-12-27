import { useEffect } from "react";
import { useGlobalActionsScrollLock } from "./useGlobalActionsScrollLock";

interface UsePopoverAutoCloseOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLElement>;
}

export function usePopoverAutoClose({
  open,
  onOpenChange,
  triggerRef,
  contentRef,
}: UsePopoverAutoCloseOptions) {
  // Enable scroll lock when popover is open (150px auto-close is handled in Popover component)
  useGlobalActionsScrollLock(open, {
    allowRefs: [triggerRef, contentRef],
  });

  // Handle clicks outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return;
      }

      onOpenChange(false);
    };

    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [open, onOpenChange, triggerRef, contentRef]);
}
