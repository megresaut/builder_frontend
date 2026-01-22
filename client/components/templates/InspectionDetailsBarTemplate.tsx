import React, { useState, useRef, useEffect } from "react";
import { DateField } from "@/components/forms/DateField";
import { FieldShell } from "@/components/forms/FieldShell";
import { ChevronDown, Check } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  usePopoverContext,
} from "@/components/ui/popover";
import { usePopoverAutoClose } from "@/hooks/usePopoverAutoClose";
import { useGlobalActionsScrollLock } from "@/hooks/useGlobalActionsScrollLock";

interface InspectionDetailsBarTemplateProps {
  status: "In Progress" | "Completed";
  dueDate: string | Date | null;
  onStatusChange: (newStatus: "In Progress" | "Completed") => void;
  onDueDateChange: (newDate: string | Date | null) => void;
}

const STATUS_OPTIONS = [
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
];

const getStatusColor = (status: string): string => {
  switch (status) {
    case "In Progress":
      return "#2463eb";
    case "Completed":
      return "#059669";
    default:
      return "#303030";
  }
};

const InspectionStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const color = getStatusColor(status);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        color: "#303030",
        gap: "8px",
        fontSize: "14px",
        fontWeight: "400",
        letterSpacing: "-0.32px",
        lineHeight: "22.4px",
        width: "fit-content",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      {status}
    </div>
  );
};

export const InspectionDetailsBarTemplate: React.FC<InspectionDetailsBarTemplateProps> = ({
  status,
  dueDate,
  onStatusChange,
  onDueDateChange,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  usePopoverAutoClose({
    open,
    onOpenChange: setOpen,
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    contentRef: contentRef as React.RefObject<HTMLElement>,
  });

  useGlobalActionsScrollLock(open, {
    allowRefs: [
      triggerRef as React.RefObject<HTMLElement>,
      contentRef as React.RefObject<HTMLElement>,
    ],
  });

  const handleStatusSelect = (newStatus: "In Progress" | "Completed") => {
    onStatusChange(newStatus);
    setOpen(false);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    switch (e.key) {
      case "Enter":
      case " ":
        if (!open) {
          e.preventDefault();
          setOpen(true);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "ArrowDown":
      case "ArrowUp":
        if (!open) {
          e.preventDefault();
          setOpen(true);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-6 w-full p-4">
      <div className="flex-1 min-w-[180px]">
        <FieldShell label="Status">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              ref={triggerRef}
              aria-haspopup="listbox"
              aria-expanded={open}
              className="w-full rounded-lg bg-white text-sm font-normal transition-colors flex items-center justify-between cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 px-3 py-2 border border-[var(--color-border-light)] hover:border-gray-300"
              style={{
                fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                lineHeight: 1.43,
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderColor: open ? "black" : "var(--color-border-light)",
                borderWidth: open ? "2px" : "1px",
              }}
              onKeyDown={handleTriggerKeyDown}
            >
              <div className="flex items-center gap-2 flex-1">
                <InspectionStatusBadge status={status} />
              </div>
              <ChevronDown
                className="h-4 w-4 shrink-0 flex-none"
                style={{ color: "#303030" }}
              />
            </PopoverTrigger>

            <PopoverContent
              ref={contentRef}
              className="rounded-lg border border-[var(--color-border-light)] bg-white shadow-md"
              align="start"
              syncTriggerWidth={true}
            >
              <div
                role="listbox"
                style={{
                  padding: "4px 0",
                  maxHeight: "300px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  overscrollBehavior: "contain",
                }}
              >
                {STATUS_OPTIONS.map((option) => {
                  const isSelected = status === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleStatusSelect(option.value as "In Progress" | "Completed")}
                      role="option"
                      aria-selected={isSelected}
                      className="w-full text-left text-sm text-[var(--color-text-primary)] flex items-center gap-2 hover:bg-blue-50 transition-colors"
                      type="button"
                      style={{
                        padding: "8px 12px",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {isSelected ? (
                        <Check className="h-4 w-4 text-blue-600" />
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                      <InspectionStatusBadge status={option.value} />
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </FieldShell>
      </div>

      <div className="flex-1 min-w-[180px]">
        <DateField
          label="Inspection Due Date"
          value={dueDate}
          onChange={onDueDateChange}
          returnFormat="Date"
        />
      </div>
    </div>
  );
};

export default InspectionDetailsBarTemplate;
