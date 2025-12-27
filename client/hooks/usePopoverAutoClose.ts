import { useEffect, useRef } from "react";

interface UsePopoverAutoCloseOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLElement>;
  distanceThreshold?: number;
}

export function usePopoverAutoClose({
  open,
  onOpenChange,
  triggerRef,
  contentRef,
  distanceThreshold = 400,
}: UsePopoverAutoCloseOptions) {
  const isOverPopoverRef = useRef(false);

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

  // Handle hover and distance-based close
  useEffect(() => {
    if (!open) return;

    const handleMouseMove = (e: MouseEvent) => {
      const trigger = triggerRef.current;
      const content = contentRef.current;

      if (!trigger || !content) return;

      const triggerRect = trigger.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

      // Check if mouse is over trigger or content
      const isOverTrigger =
        e.clientX >= triggerRect.left &&
        e.clientX <= triggerRect.right &&
        e.clientY >= triggerRect.top &&
        e.clientY <= triggerRect.bottom;

      const isOverContent =
        e.clientX >= contentRect.left &&
        e.clientX <= contentRect.right &&
        e.clientY >= contentRect.top &&
        e.clientY <= contentRect.bottom;

      isOverPopoverRef.current = isOverTrigger || isOverContent;

      // Only calculate distance if not hovering
      if (isOverPopoverRef.current) return;

      // Calculate distance from mouse to popover bounds
      const distX = Math.max(
        contentRect.left - e.clientX,
        e.clientX - contentRect.right,
        0
      );
      const distY = Math.max(
        contentRect.top - e.clientY,
        e.clientY - contentRect.bottom,
        0
      );
      const distance = Math.sqrt(distX * distX + distY * distY);

      // If mouse is more than threshold away from popover, close
      if (distance > distanceThreshold) {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [open, onOpenChange, triggerRef, contentRef, distanceThreshold]);
}
