import { useState, ReactNode, useRef } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { usePopoverCloseBehavior } from "@/hooks/usePopoverCloseBehavior";
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

  usePopoverCloseBehavior({
    open,
    onOpenChange: setOpen,
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    contentRef: contentRef as React.RefObject<HTMLElement>,
    threshold: 300,
  });

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
        <div className="flex flex-col justify-start items-start">
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
