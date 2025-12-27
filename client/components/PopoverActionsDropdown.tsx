import { useState, ReactNode, useRef, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ActionItem {
  label: string | ((row: any) => string);
  icon: ReactNode | ((row: any) => ReactNode);
  onClick: (row: any) => void;
  className?: string;
}

interface PopoverActionsDropdownProps {
  row: any;
  rowKey: string;
  actions: ActionItem[];
  additionalActions?: ActionItem[];
}

export default function PopoverActionsDropdown({
  row,
  rowKey,
  actions,
  additionalActions = [],
}: PopoverActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const allActions = [...actions, ...additionalActions];

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

      setOpen(false);
    };

    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [open]);

  // Handle distance-based close (measure from popover content edges)
  useEffect(() => {
    if (!open || !contentRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const content = contentRef.current;
      if (!content) return;

      const rect = content.getBoundingClientRect();

      // Calculate minimum distance from mouse to popover edges
      const distX = Math.max(0, Math.max(rect.left - e.clientX, e.clientX - rect.right));
      const distY = Math.max(0, Math.max(rect.top - e.clientY, e.clientY - rect.bottom));
      const distance = Math.sqrt(distX * distX + distY * distY);

      // If mouse is more than 400px away from popover, close
      if (distance > 400) {
        setOpen(false);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label="Actions"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="ra-actions-dropdown p-0 w-auto"
        style={{
          width: "145px",
        }}
      >
        <div ref={contentRef} className="flex flex-col justify-start items-start">
          {allActions.map((action, idx) => {
            const resolvedLabel =
              typeof action.label === "function" ? action.label(row) : action.label;
            const resolvedIcon =
              typeof action.icon === "function" ? action.icon(row) : action.icon;

            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  action.onClick(row);
                }}
                className={cn(
                  "ra-action-item flex justify-between items-center w-full gap-3 px-4 py-2 hover:bg-gray-50 transition-colors first:rounded-t-md last:rounded-b-md text-left",
                  action.className
                )}
              >
                <span
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize flex-1"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  {resolvedLabel}
                </span>
                {resolvedIcon && (
                  <div className="flex-shrink-0">
                    {resolvedIcon}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
