import { useEffect, useRef } from "react";

interface UsePopoverCloseBehaviorOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLElement>;
  threshold?: number; // Distance threshold in pixels, default 300
}

export function usePopoverCloseBehavior({
  open,
  onOpenChange,
  triggerRef,
  contentRef,
  threshold = 300,
}: UsePopoverCloseBehaviorOptions) {
  const lastMousePosRef = useRef({ x: 0, y: 0 });

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

  // Handle distance-based close (measure from popover content edges)
  useEffect(() => {
    if (!open || !contentRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      const content = contentRef.current;
      if (!content) return;

      const rect = content.getBoundingClientRect();

      // Calculate minimum distance from mouse to popover edges
      const distX = Math.max(0, Math.max(rect.left - e.clientX, e.clientX - rect.right));
      const distY = Math.max(0, Math.max(rect.top - e.clientY, e.clientY - rect.bottom));
      const distance = Math.sqrt(distX * distX + distY * distY);

      // If mouse is more than threshold away from popover, close
      if (distance > threshold) {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [open, onOpenChange, contentRef, threshold]);
}
