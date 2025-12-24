import React, { useRef, useEffect, useState, ReactNode } from "react";

interface DropdownPrimitiveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  zIndex?: number;
  portal?: boolean;
  maxHeight?: string;
}

export const DropdownPrimitive = ({
  open,
  onOpenChange,
  trigger,
  children,
  className = "",
  panelClassName = "",
  zIndex = 10,
  portal = false,
  maxHeight = "400px",
}: DropdownPrimitiveProps) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const cursorDistanceRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Update panel position based on trigger position
  const updatePanelPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPanelPos({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  };

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const isClickInTrigger = triggerRef.current?.contains(e.target as Node);
      const isClickInPanel = panelRef.current?.contains(e.target as Node);

      if (!isClickInTrigger && !isClickInPanel) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onOpenChange]);

  // Track mouse position for distance check
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      if (!open || !panelRef.current) return;

      // Calculate distance from panel
      const rect = panelRef.current.getBoundingClientRect();
      const distX = Math.max(
        0,
        Math.max(rect.left - e.clientX, e.clientX - rect.right),
      );
      const distY = Math.max(
        0,
        Math.max(rect.top - e.clientY, e.clientY - rect.bottom),
      );
      const distance = Math.sqrt(distX * distX + distY * distY);

      // If cursor is more than 300px away, close the dropdown
      if (distance > 300) {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [open, onOpenChange]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        e.stopPropagation();
        e.preventDefault();
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  // Update position on scroll (stays fixed)
  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (open) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(updatePanelPosition);
      }
    };

    if (open) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      cancelAnimationFrame(animationFrameId);
    };
  }, [open]);

  // Initial position calculation
  useEffect(() => {
    if (open) {
      updatePanelPosition();
    }
  }, [open]);

  const panel = (
    <div
      ref={panelRef}
      className={`ra-dropdown-panel ${panelClassName}`}
      style={{
        position: "fixed",
        top: `${panelPos.top}px`,
        left: `${panelPos.left}px`,
        zIndex,
        maxHeight,
        overflow: "auto",
        pointerEvents: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );

  return (
    <div className={`ra-dropdown ${className}`}>
      <div
        ref={triggerRef}
        className="ra-dropdown-trigger"
        onClick={() => onOpenChange(!open)}
      >
        {trigger}
      </div>

      {open && panel}
    </div>
  );
};
