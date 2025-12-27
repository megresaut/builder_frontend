import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useGlobalActionsScrollLock } from "@/hooks/useGlobalActionsScrollLock";

interface PageSizeDropdownProps {
  itemsPerPage: number;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  onPageChange: (page: number) => void;
  totalRows: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_SIZES = [10, 25, 50];

export const PageSizeDropdown = ({
  itemsPerPage,
  onItemsPerPageChange,
  onPageChange,
  totalRows,
  open,
  onOpenChange,
}: PageSizeDropdownProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useGlobalActionsScrollLock(open, {
    allowRefs: [triggerRef, menuRef],
  });

  useEffect(() => {
    if (!open) return;

    let animationFrameId: number;

    const updateMenuPos = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setMenuPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }

      animationFrameId = requestAnimationFrame(updateMenuPos);
    };

    updateMenuPos();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [open]);

  const handleSelect = (size: number) => {
    onItemsPerPageChange(size);
    onPageChange(1);
    onOpenChange(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => onOpenChange(!open)}
        className="ra-table-page-size-button flex items-center justify-center gap-2 h-10 px-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors font-medium text-sm relative"
        style={{
          borderColor: "var(--color-border-default)",
          borderWidth: "0.909091px",
          color: "var(--color-text-primary)",
          boxShadow:
            "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
        }}
      >
        <div className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>
          {itemsPerPage}
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="ra-table-page-size-menu bg-white overflow-hidden"
            style={{
              borderColor: "var(--color-border-default)",
              borderWidth: "0.5px",
              borderStyle: "solid",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              minWidth: "56px",
              width: "56px",
              position: "fixed",
              top: menuPos.top + "px",
              left: menuPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => onOpenChange(false)}
          >
            {PAGE_SIZES.map((size, index) => (
              <button
                key={size}
                onClick={() => handleSelect(size)}
                className={cn(
                  "ra-table-page-size-option w-full px-4 py-3 text-center text-base transition-colors whitespace-nowrap hover:bg-gray-50",
                  itemsPerPage === size ? "bg-gray-50 font-medium" : "font-normal"
                )}
                style={{
                  color: "var(--color-text-primary)",
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  fontSize: "16px",
                  lineHeight: "140%",
                  letterSpacing: "-0.32px",
                  borderRadius: index === PAGE_SIZES.length - 1 ? "0 0 8px 8px" : "0",
                }}
              >
                {size}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};

PageSizeDropdown.displayName = "PageSizeDropdown";
