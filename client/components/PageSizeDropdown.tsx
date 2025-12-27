import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useGlobalActionsScrollLock } from "@/hooks/useGlobalActionsScrollLock";

interface PageSizeDropdownProps {
  itemsPerPage: number;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  onPageChange: (page: number) => void;
  totalRows: number;
}

const PAGE_SIZES = [10, 25, 50];

export const PageSizeDropdown = ({
  itemsPerPage,
  onItemsPerPageChange,
  onPageChange,
  totalRows,
}: PageSizeDropdownProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isOverPopoverRef = useRef(false);

  useGlobalActionsScrollLock(open, {
    allowRefs: [triggerRef, contentRef],
  });

  // Distance-based closing (150px threshold)
  useEffect(() => {
    if (!open) return;

    const handleMouseMove = (e: MouseEvent) => {
      const trigger = triggerRef.current;
      const content = contentRef.current;

      if (!trigger || !content) return;

      const triggerRect = trigger.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

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

      if (isOverPopoverRef.current) return;

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

      if (distance > 150) {
        setOpen(false);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [open]);

  const handleSelect = (size: number) => {
    onItemsPerPageChange(size);
    onPageChange(1);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
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
      </PopoverTrigger>

      <PopoverContent
        ref={contentRef}
        align="start"
        sideOffset={8}
        className="ra-table-page-size-menu p-0 w-14 rounded-lg"
        style={{
          borderColor: "var(--color-border-default)",
          borderWidth: "0.5px",
          borderStyle: "solid",
          minWidth: "56px",
          width: "56px",
        }}
      >
        <div className="flex flex-col">
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
        </div>
      </PopoverContent>
    </Popover>
  );
};

PageSizeDropdown.displayName = "PageSizeDropdown";
