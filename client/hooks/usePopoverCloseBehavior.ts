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
  const isHoveringRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const triggerPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

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

  // Handle hover close
  useEffect(() => {
    if (!open) return;

    const handleMouseEnter = () => {
      isHoveringRef.current = true;
    };

    const handleMouseLeave = () => {
      isHoveringRef.current = false;
      // Close on hover removal
      onOpenChange(false);
    };

    const trigger = triggerRef.current;
    const content = contentRef.current;

    if (trigger) {
      trigger.addEventListener("mouseenter", handleMouseEnter);
      trigger.addEventListener("mouseleave", handleMouseLeave);
    }

    if (content) {
      content.addEventListener("mouseenter", handleMouseEnter);
      content.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (trigger) {
        trigger.removeEventListener("mouseenter", handleMouseEnter);
        trigger.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (content) {
        content.removeEventListener("mouseenter", handleMouseEnter);
        content.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [open, onOpenChange, triggerRef, contentRef]);

  // Handle distance-based close
  useEffect(() => {
    if (!open || !triggerRef.current) return;

    // Get trigger position on open
    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    triggerPosRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
    };

    const handleMouseMove = (e: MouseEvent) => {
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      const triggerPos = triggerPosRef.current;
      const distance = Math.sqrt(
        Math.pow(e.clientX - triggerPos.x, 2) +
          Math.pow(e.clientY - triggerPos.y, 2)
      );

      // If mouse is more than threshold away, close
      if (distance > threshold) {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [open, onOpenChange, triggerRef, threshold]);
}
